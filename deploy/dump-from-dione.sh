#!/usr/bin/env bash
# Dump the TriCyp backend from dione:45000/ecod_protein into a single
# sql.gz suitable for `psql -f` against a fresh sangala instance.
#
# Schema scope (per DB_CONTRACT.md):
#   ecod_commons:        domains, proteins, organism_taxonomy,
#                        f_group_assignments, domain_clusters,
#                        clustering_runs, clustering_parameters,
#                        clustering_algorithms, domain_sequences,
#                        versions, protein_taxonomy (view)
#   ecod_rep:            cluster (+ custom dom_cid / ctype types)
#   cys_classification:  cysteine_classifications, domain_summary,
#                        geometric_disulfides, pdb_ssbonds,
#                        pdb_metal_links, esm2_runs, esm2_run_domains,
#                        uniprot_subcellular, hgroup_summary (MV),
#                        hgroup_summary_struct (MV)
#
# Usage:
#     SRC_PASSWORD='…' deploy/dump-from-dione.sh

set -euo pipefail

OUT_DIR="$(cd "$(dirname "$0")" && pwd)/dump"
mkdir -p "$OUT_DIR"

SRC_HOST="${SRC_HOST:-dione}"
SRC_PORT="${SRC_PORT:-45000}"
SRC_USER="${SRC_USER:-ecod}"
SRC_DB="${SRC_DB:-ecod_protein}"

if [[ -z "${SRC_PASSWORD:-}" ]]; then
  echo "SRC_PASSWORD must be set (dione superuser pw)." >&2
  exit 2
fi

OUT="$OUT_DIR/tricyp-prod.sql.gz"

# Cherry-picked tables from ecod_commons. Order matters: schema-only
# objects (sequences, types) must come before tables that depend on
# them. pg_dump handles this internally as long as the right tables
# are listed.
ECOD_COMMONS_TABLES=(
  ecod_commons.versions
  ecod_commons.organism_taxonomy
  ecod_commons.proteins
  ecod_commons.domains
  ecod_commons.domain_sequences
  ecod_commons.f_group_assignments
  ecod_commons.clustering_algorithms
  ecod_commons.clustering_parameters
  ecod_commons.clustering_runs
  ecod_commons.domain_clusters
  ecod_commons.protein_taxonomy
)

PG_DUMP_ARGS=(
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER"
  --dbname="$SRC_DB"
  # Whole cys_classification + ecod_rep schemas (small, self-contained).
  --schema=cys_classification
  --schema=ecod_rep
  # Cherry-picked ecod_commons tables.
)
for t in "${ECOD_COMMONS_TABLES[@]}"; do
  PG_DUMP_ARGS+=(--table="$t")
done

# --no-owner / --no-privileges so the dump loads cleanly under any
# role on the destination. --if-exists lets re-runs survive.
PG_DUMP_ARGS+=(
  --no-owner
  --no-privileges
  --clean
  --if-exists
  --verbose
)

echo "Dumping from $SRC_HOST:$SRC_PORT/$SRC_DB → $OUT"
PGPASSWORD="$SRC_PASSWORD" pg_dump "${PG_DUMP_ARGS[@]}" 2> "$OUT_DIR/pg_dump.log" \
  | gzip -c > "$OUT"

# Trigger functions live as ecod_commons schema-level objects that
# --table won't pick up. Pull the two referenced from our table
# triggers into a sidecar SQL file the load script applies before
# the main load. Re-pull on every dump so renames upstream stay in
# sync.
PREREQ="$OUT_DIR/prereq-functions.sql"
echo "Pulling prereq functions → $PREREQ"
PGPASSWORD="$SRC_PASSWORD" psql \
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER" \
  --dbname="$SRC_DB" -t -A -c "
SELECT pg_get_functiondef(p.oid) || ';'
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
 WHERE n.nspname = 'ecod_commons'
   AND p.proname IN ('update_timestamp', 'update_version_stats')" \
  > "$PREREQ"

echo
echo "Size:"
ls -lh "$OUT"
echo
echo "MD5:"
md5sum "$OUT"
echo
echo "Log tail:"
tail -10 "$OUT_DIR/pg_dump.log"
