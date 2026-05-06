#!/usr/bin/env python3
"""ETL: parse UniProt XML files, extract subcellular locations, map to the
8-compartment paper vocabulary (FIG_3D in src/lib/paperData.ts), and bulk-load
into cys_classification.uniprot_subcellular.

Usage:
    scripts/etl/load_uniprot_subcellular.py [--workers N] [--limit N]
                                            [--out TSV] [--skip-load]

Source: file paths are read from uniprot_files.xml_file_index (is_downloaded).
Output: TSV at $OUT_TSV (default /tmp/uniprot_subcellular.tsv) and, unless
--skip-load is given, a COPY into cys_classification.uniprot_subcellular
(replacing existing rows in a single transaction).

Vocabulary mapping is conservative: bacterial-only locations (cell wall,
periplasm, inner/outer membrane), thylakoid, plastid, host-* and ambiguous
"Membrane" alone are dropped. The downstream FIG_3D query joins on
ecod_commons.protein_taxonomy to filter to eukaryotes anyway, but dropping
clearly non-eukaryote terms keeps the table semantically clean.
"""
from __future__ import annotations

import argparse
import multiprocessing as mp
import os
import re
import sys
import time
from typing import Iterable

# Compartment mapping — order matters: more specific patterns must come first
# (e.g. "Endoplasmic reticulum" must precede the broad "membrane" rules).
# Each entry is (substring-match, compartment). Match is case-insensitive on
# the *raw* UniProt location string (which can be hierarchical, e.g.
# "Mitochondrion inner membrane").
COMPARTMENT_RULES: list[tuple[str, str]] = [
    # --- organelles ---
    ('endoplasmic reticulum', 'Endoplasmic ret.'),
    ('sarcoplasmic reticulum', 'Endoplasmic ret.'),
    ('golgi',                 'Golgi'),
    ('lysosom',               'Lysosome'),
    ('mitochondri',           'Mitochondrion'),
    # --- nucleus and nuclear sub-compartments ---
    ('nucleus',     'Nucleus'),
    ('nucleolus',   'Nucleus'),
    ('nucleoplasm', 'Nucleus'),
    ('chromosome',  'Nucleus'),
    ('chromatin',   'Nucleus'),
    ('centromere',  'Nucleus'),
    ('kinetochore', 'Nucleus'),
    # --- secreted / extracellular ---
    ('secreted',          'Extracellular'),
    ('extracellular',     'Extracellular'),
    # --- plasma membrane: take "Cell membrane" / "Plasma membrane" only.
    # "Cell inner membrane" / "Cell outer membrane" are bacterial — caught
    # below and dropped.
    ('plasma membrane', 'Plasma membrane'),
    ('cell membrane',   'Plasma membrane'),
    # --- cytoplasm and cytoplasmic / cytoskeletal sub-compartments ---
    ('cytoplasm',                    'Cytoplasm'),
    ('cytosol',                      'Cytoplasm'),
    ('cytoskeleton',                 'Cytoplasm'),
    ('centrosome',                   'Cytoplasm'),
    ('centriole',                    'Cytoplasm'),
    ('microtubule organizing center','Cytoplasm'),
    ('spindle',                      'Cytoplasm'),
    ('myofibril',                    'Cytoplasm'),
    ('sarcomere',                    'Cytoplasm'),
    ('perinuclear region',           'Cytoplasm'),
]

# Locations that explicitly should NOT be mapped (return None). Listed for
# documentation; the rules above already skip them by virtue of not matching.
EXPLICIT_DROP = (
    'cell inner membrane', 'cell outer membrane', 'periplasm', 'cell wall',
    'thylakoid', 'plastid', 'chloroplast', 'host ', 'virion',
)

LOC_RE = re.compile(r'<location\b[^>]*>([^<]+)</location>')
COMMENT_RE = re.compile(
    r'<comment\s+type="subcellular location">(.*?)</comment>', re.DOTALL
)
ACC_RE = re.compile(r'<accession>([^<]+)</accession>')


def map_compartment(raw: str) -> str | None:
    s = raw.strip().lower()
    if not s:
        return None
    for tok in EXPLICIT_DROP:
        if s.startswith(tok) or s == tok.rstrip():
            return None
    for needle, compartment in COMPARTMENT_RULES:
        if needle in s:
            return compartment
    return None


def parse_one(path: str) -> list[tuple[str, str]]:
    """Return [(acc, compartment), …] from one XML file."""
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            txt = f.read()
    except OSError:
        return []
    acc_match = ACC_RE.search(txt)
    if not acc_match:
        return []
    acc = acc_match.group(1).strip()
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for blk in COMMENT_RE.finditer(txt):
        for loc_m in LOC_RE.finditer(blk.group(1)):
            comp = map_compartment(loc_m.group(1))
            if comp and comp not in seen:
                seen.add(comp)
                out.append((acc, comp))
    return out


def _worker(paths: list[str]) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    for p in paths:
        out.extend(parse_one(p))
    return out


def chunked(iterable: list[str], chunk: int) -> Iterable[list[str]]:
    for i in range(0, len(iterable), chunk):
        yield iterable[i : i + chunk]


def get_paths(limit: int | None) -> list[str]:
    import psycopg2
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'dione'),
        port=int(os.environ.get('DB_PORT', '45000')),
        user=os.environ.get('DB_USER', 'ecod'),
        password=os.environ['DB_PASSWORD'],
        dbname=os.environ.get('DB_NAME', 'ecod_protein'),
    )
    sql = (
        "SELECT file_path FROM uniprot_files.xml_file_index "
        "WHERE is_downloaded = TRUE"
    )
    if limit:
        sql += f" LIMIT {limit}"
    with conn.cursor() as cur:
        cur.execute(sql)
        rows = [r[0] for r in cur.fetchall()]
    conn.close()
    return rows


def load_tsv(tsv_path: str) -> int:
    import psycopg2
    conn = psycopg2.connect(
        host=os.environ.get('DB_HOST', 'dione'),
        port=int(os.environ.get('DB_PORT', '45000')),
        user=os.environ.get('DB_USER', 'ecod'),
        password=os.environ['DB_PASSWORD'],
        dbname=os.environ.get('DB_NAME', 'ecod_protein'),
    )
    with conn:
        with conn.cursor() as cur:
            cur.execute('TRUNCATE cys_classification.uniprot_subcellular')
            with open(tsv_path, 'r') as f:
                cur.copy_expert(
                    "COPY cys_classification.uniprot_subcellular "
                    "(uniprot_acc, compartment) FROM STDIN WITH "
                    "(FORMAT csv, DELIMITER E'\\t')",
                    f,
                )
            cur.execute('SELECT count(*) FROM cys_classification.uniprot_subcellular')
            n = cur.fetchone()[0]
    conn.close()
    return n


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=max(1, mp.cpu_count() - 2))
    ap.add_argument('--limit', type=int, default=None,
                    help='only process this many XML files (smoke test)')
    ap.add_argument('--out', default='/tmp/uniprot_subcellular.tsv')
    ap.add_argument('--skip-load', action='store_true',
                    help='write the TSV but do not COPY into the DB')
    args = ap.parse_args()

    if 'DB_PASSWORD' not in os.environ:
        print('DB_PASSWORD must be set in env (source .env.local)', file=sys.stderr)
        return 2

    t0 = time.time()
    print(f'querying xml_file_index…', file=sys.stderr)
    paths = get_paths(args.limit)
    print(f'  {len(paths):,} XML files to parse', file=sys.stderr)

    chunk_size = max(64, len(paths) // (args.workers * 8) or 1)
    chunks = list(chunked(paths, chunk_size))

    seen_pairs: set[tuple[str, str]] = set()
    n_files = 0
    with mp.Pool(args.workers) as pool:
        for batch in pool.imap_unordered(_worker, chunks, chunksize=1):
            n_files += chunk_size  # approximate
            for pair in batch:
                seen_pairs.add(pair)
            if n_files % (chunk_size * args.workers * 4) < chunk_size:
                el = time.time() - t0
                print(f'  ~{min(n_files, len(paths)):,}/{len(paths):,} '
                      f'parsed, {len(seen_pairs):,} (acc,compartment) pairs, '
                      f'{el:.1f}s', file=sys.stderr)

    elapsed = time.time() - t0
    print(f'parse done: {len(seen_pairs):,} unique pairs in {elapsed:.1f}s',
          file=sys.stderr)

    print(f'writing {args.out}…', file=sys.stderr)
    with open(args.out, 'w') as fh:
        for acc, comp in sorted(seen_pairs):
            fh.write(f'{acc}\t{comp}\n')

    if args.skip_load:
        print('skip-load: not loading into DB', file=sys.stderr)
        return 0

    print('COPY into cys_classification.uniprot_subcellular…', file=sys.stderr)
    loaded = load_tsv(args.out)
    print(f'loaded {loaded:,} rows', file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
