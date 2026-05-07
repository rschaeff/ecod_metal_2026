#!/usr/bin/env bash
# Dump the TriCyp backend from dione:45000/ecod_protein into three
# sql.gz files (one per schema) plus prereq sidecars. Splitting per
# schema is required because pg_dump 17 silently ignores --schema
# when --table is also given on the same invocation, so we can't
# pick `--schema=cys_classification --schema=ecod_rep --table=ecod_commons.x`
# in a single call (the result is "tables only, no schemas").
#
# Schema scope (per DB_CONTRACT.md):
#   ecod_commons:        domains, proteins, organism_taxonomy,
#                        f_group_assignments, domain_clusters,
#                        clustering_runs, clustering_parameters,
#                        clustering_algorithms, domain_sequences,
#                        versions, protein_taxonomy (view)
#   ecod_rep:            full schema (depends on public types
#                        dom_cid, ctype, dom_pdb, dom_pdb_chain,
#                        domain_type — see prereq-types.sql)
#   cys_classification:  full schema (the TriCyp-specific schema,
#                        including hgroup_summary + hgroup_summary_struct
#                        materialized views)
#
# Sidecars:
#   prereq-types.sql      public schema custom types referenced from
#                         ecod_rep — not in --schema=ecod_rep dump.
#   prereq-functions.sql  ecod_commons trigger functions — not in
#                         the cherry-picked --table dump.
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

# ---------- ecod_commons (cherry-picked tables) ----------
EC_DUMP="$OUT_DIR/tricyp-ecod_commons.sql.gz"
EC_ARGS=(
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER"
  --dbname="$SRC_DB"
  --no-owner --no-privileges --clean --if-exists --verbose
)
for t in "${ECOD_COMMONS_TABLES[@]}"; do EC_ARGS+=(--table="$t"); done
echo "[1/3] Dumping ecod_commons (table-cherry-pick) → $EC_DUMP"
PGPASSWORD="$SRC_PASSWORD" pg_dump "${EC_ARGS[@]}" \
  2> "$OUT_DIR/pg_dump_ecod_commons.log" | gzip -c > "$EC_DUMP"

# ---------- ecod_rep (full schema) ----------
ER_DUMP="$OUT_DIR/tricyp-ecod_rep.sql.gz"
echo "[2/3] Dumping ecod_rep (full schema) → $ER_DUMP"
PGPASSWORD="$SRC_PASSWORD" pg_dump \
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER" \
  --dbname="$SRC_DB" \
  --schema=ecod_rep \
  --no-owner --no-privileges --clean --if-exists --verbose \
  2> "$OUT_DIR/pg_dump_ecod_rep.log" | gzip -c > "$ER_DUMP"

# ---------- cys_classification (full schema) ----------
CC_DUMP="$OUT_DIR/tricyp-cys_classification.sql.gz"
echo "[3/3] Dumping cys_classification (full schema) → $CC_DUMP"
PGPASSWORD="$SRC_PASSWORD" pg_dump \
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER" \
  --dbname="$SRC_DB" \
  --schema=cys_classification \
  --no-owner --no-privileges --clean --if-exists --verbose \
  2> "$OUT_DIR/pg_dump_cys_classification.log" | gzip -c > "$CC_DUMP"

# ---------- prereq sidecars ----------
TYPES="$OUT_DIR/prereq-types.sql"
echo "Pulling prereq public-schema types → $TYPES"
{
  echo "-- Custom public-schema types referenced by ecod_rep tables."
  echo "-- Idempotent: drop-with-cascade then recreate so re-runs are clean."
  echo "DROP TYPE IF EXISTS public.ctype CASCADE;"
  echo "DROP DOMAIN IF EXISTS public.dom_cid CASCADE;"
  echo "DROP DOMAIN IF EXISTS public.dom_pdb CASCADE;"
  echo "DROP DOMAIN IF EXISTS public.dom_pdb_chain CASCADE;"
  echo "DROP TYPE IF EXISTS public.domain_type CASCADE;"
  echo
  PGPASSWORD="$SRC_PASSWORD" psql \
    --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER" \
    --dbname="$SRC_DB" -t -A -c "
SELECT
  CASE t.typtype
    WHEN 'e' THEN
      'CREATE TYPE public.' || t.typname || ' AS ENUM (' ||
      (SELECT string_agg(quote_literal(enumlabel), ', ' ORDER BY enumsortorder)
         FROM pg_enum WHERE enumtypid = t.oid) || ');'
    WHEN 'd' THEN
      'CREATE DOMAIN public.' || t.typname ||
      ' AS ' || pg_catalog.format_type(t.typbasetype, t.typtypmod) ||
      COALESCE((SELECT ' ' || string_agg(pg_get_constraintdef(c.oid), ' ')
                  FROM pg_constraint c WHERE c.contypid = t.oid), '') ||
      ';'
  END
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' AND t.typtype IN ('e', 'd')
ORDER BY t.typname"
} > "$TYPES"

FUNCS="$OUT_DIR/prereq-functions.sql"
echo "Pulling prereq trigger functions → $FUNCS"
PGPASSWORD="$SRC_PASSWORD" psql \
  --host="$SRC_HOST" --port="$SRC_PORT" --username="$SRC_USER" \
  --dbname="$SRC_DB" -t -A -c "
SELECT pg_get_functiondef(p.oid) || ';'
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
 WHERE n.nspname = 'ecod_commons'
   AND p.proname IN ('update_timestamp', 'update_version_stats')" \
  > "$FUNCS"

echo
echo "Sizes:"
ls -lh "$OUT_DIR"/*.sql.gz "$OUT_DIR"/*.sql 2>/dev/null
echo
echo "MD5:"
md5sum "$OUT_DIR"/*.sql.gz
