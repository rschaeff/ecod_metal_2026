# Spec: Cysteine Classification Browser — Next.js Page

## Project Context

This is a collaboration between the Schaeffer and Cong labs to classify cysteine residues across the ECOD protein domain universe. We ran four computational tools plus PDB annotation extraction across ~889K F70 representative domains from ECOD clustering to determine whether each cysteine participates in a **disulfide bond** or **metal coordination**. Cysteines that don't match either category remain **unclassified** (we deliberately avoid calling them "free" or "reactive" — that's out of scope).

The classification pipeline:
- **mebipred** — sequence-based, protein-level metal-binding probability (10 metals)
- **LMetalSite** — sequence-based, per-residue metal-binding prediction using ProtT5 embeddings (ZN, CA, MG, MN)
- **ZincSight** — structure-based zinc-binding site prediction via template matching
- **Geometric disulfide detection** — Sγ-Sγ distance < 2.5 Å in predicted/experimental structures
- **PDB annotations** — SSBOND and LINK/SITE records parsed from source PDB files (ground truth for the ~69K PDB-sourced domains)

Priority rules for the final classification:
1. Structural disulfide (geometric or PDB SSBOND) → DISULFIDE
2. ZincSight hit → METAL_BINDING
3. LMetalSite hit → METAL_BINDING (supporting)
4. mebipred provides protein-level supporting evidence only

## Goal

Build a Next.js page (or set of pages) that lets a researcher browse and explore these cysteine classifications. This will be integrated into the existing ECOD website (Next.js app, already deployed). The page should support:

1. **Family-level overview** — for a given ECOD F-group, show the distribution of cysteine fates across member domains
2. **Domain detail view** — for a single domain, show its sequence with cysteines highlighted/colored by classification, plus the raw evidence from each tool
3. **Summary dashboard** — high-level stats across the full dataset

## Database

PostgreSQL on `dione:45000`, database `ecod_protein`, user `ecod`. The
password is **not** committed to this repo — it's set out-of-band via
`PGPASSWORD` or `.env.local` (gitignored). An earlier revision of this
paragraph included the literal password and was pushed to a public
remote in commit `1947dfd`; treat that credential as compromised and
rotate.

Two schemas are relevant:

### `ecod_commons` (existing ECOD data)

Key tables for joining:
- `domains` — `id` (PK), `domain_id` (string like "e3h35A1"), `ecod_uid`, `protein_id`, `range_definition`, `sequence_length`
- `domain_sequences` — `domain_id` (FK to domains.id), `sequence`
- `f_group_assignments` — `domain_id` (FK), `f_group_id`, `t_group_id`, `h_group_id`, `x_group_id`
- `proteins` — `id`, `pdb_id`, `chain_id`, `source_type` ("pdb", "afdb", "prodigal", "uniparc")
- `domain_clusters` — `domain_id`, `clustering_run_id`, `cluster_id`, `is_representative`
- `clustering_runs` — `id`, `parameter_set_id` (2 = F70), `f_group_id`

### `cys_classification` (our results)

All tables FK to `ecod_commons.domains(id)` via `domain_id`.

```sql
-- Protein-level metal-binding predictions (1 row per domain, 889K rows)
mebipred_predictions (
    domain_id       INTEGER PRIMARY KEY,
    metal_binding   REAL,     -- overall metal-binding probability
    ca, co, cu, fe, k, mg, mn, na, ni, zn   REAL  -- per-ion probabilities
)

-- Per-residue metal-binding hits (only positive predictions stored)
lmetalsite_hits (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    position        INTEGER,  -- 1-indexed
    residue         CHAR(1),  -- amino acid at this position
    metal           VARCHAR(2),  -- ZN, CA, MG, MN
    probability     REAL
)

-- Structure-based zinc site predictions
zinc_sites (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    probability     REAL,
    n_coordinating  INTEGER
)
zinc_site_residues (
    id              SERIAL PRIMARY KEY,
    zinc_site_id    INTEGER,  -- FK to zinc_sites
    chain           VARCHAR(4),
    resname         VARCHAR(3),  -- CYS, HIS, ASP, GLU, etc.
    resnum          INTEGER
)

-- Geometric disulfide bonds (Sγ-Sγ < 2.5 Å)
geometric_disulfides (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    chain1          VARCHAR(4),
    resnum1         INTEGER,
    chain2          VARCHAR(4),
    resnum2         INTEGER,
    sg_sg_distance  REAL
)

-- PDB experimental annotations (69K PDB-sourced domains only)
pdb_ssbonds (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    pdb_id          VARCHAR(4),
    chain1          VARCHAR(4),
    resnum1         INTEGER,
    chain2          VARCHAR(4),
    resnum2         INTEGER,
    both_in_domain  BOOLEAN
)
pdb_metal_links (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    pdb_id          VARCHAR(4),
    metal           VARCHAR(4),   -- ZN, FE, MG, etc.
    metal_chain     VARCHAR(4),
    metal_resnum    INTEGER,
    coord_resname   VARCHAR(3),   -- coordinating residue type
    coord_chain     VARCHAR(4),
    coord_resnum    INTEGER,
    coord_atom      VARCHAR(4)    -- SG, NE2, OD1, etc.
)
pdb_metal_sites (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    pdb_id          VARCHAR(4),
    site_name       VARCHAR(10)
)
pdb_metal_site_residues (
    id              SERIAL PRIMARY KEY,
    metal_site_id   INTEGER,  -- FK to pdb_metal_sites
    chain           VARCHAR(4),
    resname         VARCHAR(3),
    resnum          INTEGER,
    is_metal        BOOLEAN
)

-- Final integrated classification (1 row per cysteine)
cysteine_classifications (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER,
    cys_position    INTEGER,      -- 1-indexed
    classification  VARCHAR(20),  -- DISULFIDE, METAL_BINDING, UNCLASSIFIED
    confidence      REAL,
    evidence        TEXT          -- semicolon-separated, e.g. "disulfide_geometry" or "zincsight:0.85;mebipred_Zn:0.72"
)

-- Per-domain rollup
domain_summary (
    domain_id       INTEGER PRIMARY KEY,
    total_cys       INTEGER,
    n_disulfide     INTEGER,
    n_metal_binding INTEGER,
    n_unclassified  INTEGER
)
```

## Page Structure

### 1. Dashboard (`/cysteine-classification`)

Summary statistics for the full F70 dataset:
- Total domains, total cysteines classified
- Breakdown: N disulfide / N metal-binding / N unclassified (with percentages)
- Bar chart or pie chart of classification distribution
- Table of top ECOD X-groups or T-groups by fraction of metal-binding cysteines
- Counts by data source (PDB vs AlphaFold)
- Link to family browser and search

Useful queries:
```sql
-- Overall counts
SELECT classification, count(*) FROM cys_classification.cysteine_classifications GROUP BY classification;

-- Per X-group summary
SELECT fa.x_group_id,
       count(*) FILTER (WHERE cc.classification = 'DISULFIDE') as n_disulfide,
       count(*) FILTER (WHERE cc.classification = 'METAL_BINDING') as n_metal,
       count(*) FILTER (WHERE cc.classification = 'UNCLASSIFIED') as n_unclassified
FROM cys_classification.cysteine_classifications cc
JOIN ecod_commons.f_group_assignments fa ON cc.domain_id = fa.domain_id
GROUP BY fa.x_group_id
ORDER BY n_metal DESC;
```

### 2. Family Browser (`/cysteine-classification/family/[f_group_id]`)

For a given ECOD F-group:
- Family name/ID, number of F70 rep domains
- Distribution of cysteine fates across domains in this family
- Stacked bar chart: each domain is a bar showing its Cys composition (disulfide/metal/unclassified)
- Table of domains with columns: domain_id, source (PDB/AFDB), total_cys, n_disulfide, n_metal_binding, n_unclassified
- Click a domain row to go to domain detail

Useful queries:
```sql
-- Domains in a family with their summaries
SELECT d.domain_id, d.id, p.source_type, ds.total_cys, ds.n_disulfide, ds.n_metal_binding, ds.n_unclassified
FROM ecod_commons.f_group_assignments fa
JOIN ecod_commons.domains d ON fa.domain_id = d.id
JOIN ecod_commons.proteins p ON d.protein_id = p.id
LEFT JOIN cys_classification.domain_summary ds ON d.id = ds.domain_id
WHERE fa.f_group_id = $1
  AND d.id IN (SELECT dc.domain_id FROM ecod_commons.domain_clusters dc
               JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
               WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE);
```

### 3. Domain Detail (`/cysteine-classification/domain/[domain_id]`)

For a single domain:
- Header: domain ID, ECOD classification (X/H/T/F), source (PDB/AFDB), PDB ID if applicable
- **Sequence view**: full amino acid sequence displayed in a monospace font, with each Cys colored by classification:
  - Gold/yellow = DISULFIDE
  - Blue/teal = METAL_BINDING
  - Gray = UNCLASSIFIED
  - Non-Cys residues in default color
  - Hovering a Cys shows a tooltip with: position, classification, confidence, evidence string
- **Evidence panel** below the sequence, with expandable sections:
  - **Disulfide bonds**: table of geometric disulfide pairs (resnum1, resnum2, distance) and/or PDB SSBOND records
  - **ZincSight sites**: table of predicted zinc sites with coordinating residues and probability
  - **LMetalSite hits**: table of predicted metal-binding residues (position, residue, metal, probability)
  - **mebipred**: protein-level scores displayed as a compact horizontal bar chart (one bar per metal)
  - **PDB metal coordination**: table of LINK records (metal, coordinating residue, atom) — only for PDB-sourced domains

Useful queries:
```sql
-- Domain info
SELECT d.id, d.domain_id, d.range_definition, p.source_type, p.pdb_id, p.chain_id,
       fa.x_group_id, fa.h_group_id, fa.t_group_id, fa.f_group_id,
       seq.sequence
FROM ecod_commons.domains d
JOIN ecod_commons.proteins p ON d.protein_id = p.id
JOIN ecod_commons.f_group_assignments fa ON fa.domain_id = d.id
JOIN ecod_commons.domain_sequences seq ON seq.domain_id = d.id
WHERE d.id = $1;

-- All cysteine classifications for this domain
SELECT * FROM cys_classification.cysteine_classifications WHERE domain_id = $1 ORDER BY cys_position;

-- All evidence tables
SELECT * FROM cys_classification.mebipred_predictions WHERE domain_id = $1;
SELECT * FROM cys_classification.lmetalsite_hits WHERE domain_id = $1 ORDER BY position;
SELECT zs.*, zsr.chain, zsr.resname, zsr.resnum
FROM cys_classification.zinc_sites zs
JOIN cys_classification.zinc_site_residues zsr ON zs.id = zsr.zinc_site_id
WHERE zs.domain_id = $1;
SELECT * FROM cys_classification.geometric_disulfides WHERE domain_id = $1;
SELECT * FROM cys_classification.pdb_ssbonds WHERE domain_id = $1;
SELECT * FROM cys_classification.pdb_metal_links WHERE domain_id = $1;
```

### 4. Search

Simple search box (on dashboard or as a component):
- Search by domain ID (e.g., "e3h35A1"), PDB ID (e.g., "3h35"), UniProt accession, or F-group ID
- Redirects to domain detail or family browser as appropriate

## API Routes

Use Next.js API routes (`/api/cysteine-classification/...`) connecting to PostgreSQL via `pg` (node-postgres). The database connection should use a connection pool.

Suggested routes:
- `GET /api/cysteine-classification/summary` — dashboard stats
- `GET /api/cysteine-classification/family/[f_group_id]` — family data
- `GET /api/cysteine-classification/domain/[domain_id]` — full domain detail with all evidence
- `GET /api/cysteine-classification/search?q=...` — search endpoint

## Tech Notes

- The existing ECOD site is Next.js (App Router). This page should follow the same patterns.
- Use server components where possible; client components only for interactive elements (tooltips, expandable sections, charts).
- For charts, use a lightweight library (recharts or similar) — nothing heavy.
- The sequence view is the most important visual element. It needs to handle sequences up to ~1000 residues. Use a wrapping monospace layout (not a single scrolling line).
- Color scheme should be accessible (colorblind-safe). Suggested: disulfide = amber (#F59E0B), metal-binding = teal (#0D9488), unclassified = gray (#9CA3AF).
- Tables should be sortable and paginated where row counts could be large (family browser).

## Data Scale

- 889K domains total
- ~691K domains with at least one Cys
- ~69K PDB-sourced domains (with experimental annotations)
- The rest are AlphaFold-derived
- Most queries are single-domain or single-family lookups, so performance should be fine with the existing indexes

## Files Reference

- Schema DDL: `scripts/create_schema.sql`
- DB loader: `scripts/load_results_to_db.py`
- Integration logic: `scripts/integrate_results.py`
- Pipeline orchestrator: `scripts/launch_pipeline.sh`
