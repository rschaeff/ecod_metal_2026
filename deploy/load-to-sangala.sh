#!/usr/bin/env bash
# Load the three dione dumps + sidecars into the destination database
# in the order required by inter-schema FKs. The dump-from-dione.sh
# script splits production state into:
#   prereq-types.sql        public schema types referenced by ecod_rep
#   tricyp-ecod_rep.sql.gz  ecod_rep schema (cluster + custom types)
#   prereq-functions.sql    ecod_commons trigger functions
#   tricyp-ecod_commons.sql.gz  cherry-picked ecod_commons tables
#   tricyp-cys_classification.sql.gz  cys_classification schema +
#                                     hgroup_summary[_struct] MVs
# Order: types → ecod_rep → trigger funcs → ecod_commons →
# cys_classification (because cys_classification FKs into
# ecod_commons.domains and the MVs reference ecod_rep.cluster).
#
# DANGEROUS: --clean (in each dump) will DROP existing TriCyp objects
# in the destination DB. Confirm you're loading into a fresh schema
# or one you intend to overwrite before running.
#
# Usage:
#     DST_PASSWORD='…' [DST_DB=tricyp] deploy/load-to-sangala.sh

set -euo pipefail

DUMP_DIR="$(cd "$(dirname "$0")" && pwd)/dump"

DST_HOST="${DST_HOST:-sangala}"
DST_PORT="${DST_PORT:-45000}"
DST_USER="${DST_USER:-ecod}"
DST_DB="${DST_DB:-tricyp}"

if [[ -z "${DST_PASSWORD:-}" ]]; then
  echo "DST_PASSWORD must be set (sangala pw for $DST_USER)." >&2
  exit 2
fi

# Verify all expected artefacts are present before we touch anything.
for f in prereq-types.sql prereq-functions.sql \
         tricyp-ecod_commons.sql.gz tricyp-ecod_rep.sql.gz \
         tricyp-cys_classification.sql.gz; do
  if [[ ! -f "$DUMP_DIR/$f" ]]; then
    echo "Missing $DUMP_DIR/$f — re-run deploy/dump-from-dione.sh first." >&2
    exit 2
  fi
done

total_size=$(du -ch "$DUMP_DIR"/*.sql.gz | tail -1 | cut -f1)
echo "About to load $total_size into $DST_HOST:$DST_PORT/$DST_DB"
echo "(--clean is on in every dump — existing TriCyp objects will be DROPPED)"
read -p "Continue? [y/N] " ans
[[ "$ans" =~ ^[Yy] ]] || { echo "Aborted."; exit 1; }

# Ensure the destination DB exists and the three schemas are created.
PGPASSWORD="$DST_PASSWORD" psql \
  --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
  --dbname=postgres \
  -tc "SELECT 1 FROM pg_database WHERE datname='$DST_DB'" \
  | grep -q 1 || PGPASSWORD="$DST_PASSWORD" psql \
      --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
      --dbname=postgres -c "CREATE DATABASE $DST_DB"

PGPASSWORD="$DST_PASSWORD" psql \
  --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
  --dbname="$DST_DB" -c \
  "CREATE SCHEMA IF NOT EXISTS ecod_commons;
   CREATE SCHEMA IF NOT EXISTS ecod_rep;
   CREATE SCHEMA IF NOT EXISTS cys_classification;"

# Pre-clean: drop the schemas dependent on ecod_commons (in FK order)
# before any --clean dumps run. pg_dump's per-schema dumps don't topo-sort
# cross-schema drops, so step [4/5]'s 'DROP CONSTRAINT domains_pkey' fails
# when cys_classification FKs still reference it. Dropping cys_classification
# (and ecod_rep, which depends on public types we recreate in step [1/5])
# up front lets the per-schema --clean steps run on a tabula rasa. Each
# step's dump then recreates everything it owns.
echo "Pre-clean: dropping cys_classification + ecod_rep (CASCADE) so per-schema --clean works"
PGPASSWORD="$DST_PASSWORD" psql \
  --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
  --dbname="$DST_DB" --quiet --no-psqlrc -c \
  "DROP SCHEMA IF EXISTS cys_classification CASCADE;
   DROP SCHEMA IF EXISTS ecod_rep           CASCADE;
   CREATE SCHEMA cys_classification;
   CREATE SCHEMA ecod_rep;"

run_psql() {
  PGPASSWORD="$DST_PASSWORD" psql \
    --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
    --dbname="$DST_DB" --quiet --no-psqlrc --set=ON_ERROR_STOP=1 "$@"
}

echo "[1/5] prereq-types.sql"
run_psql -f "$DUMP_DIR/prereq-types.sql"

echo "[2/5] ecod_rep schema"
gunzip -c "$DUMP_DIR/tricyp-ecod_rep.sql.gz" \
  | run_psql 2> "$DUMP_DIR/psql_load_ecod_rep.log"

echo "[3/5] prereq-functions.sql"
run_psql -f "$DUMP_DIR/prereq-functions.sql"

echo "[4/5] ecod_commons cherry-picked tables"
gunzip -c "$DUMP_DIR/tricyp-ecod_commons.sql.gz" \
  | run_psql 2> "$DUMP_DIR/psql_load_ecod_commons.log"

echo "[5/5] cys_classification schema (+ MVs)"
gunzip -c "$DUMP_DIR/tricyp-cys_classification.sql.gz" \
  | run_psql 2> "$DUMP_DIR/psql_load_cys.log"

echo
echo "Loaded. Refreshing materialized views..."
run_psql -c "REFRESH MATERIALIZED VIEW cys_classification.hgroup_summary;
             REFRESH MATERIALIZED VIEW cys_classification.hgroup_summary_struct;"

echo
echo "Smoke counts on $DST_HOST/$DST_DB:"
run_psql -c \
  "SELECT
     (SELECT count(*) FROM ecod_commons.domains)                              AS domains,
     (SELECT count(*) FROM ecod_commons.proteins)                             AS proteins,
     (SELECT count(*) FROM ecod_rep.cluster)                                  AS rep_clusters,
     (SELECT count(*) FROM cys_classification.cysteine_classifications)       AS classifications,
     (SELECT count(*) FROM cys_classification.esm2_run_domains WHERE run_id=1) AS paper_v1,
     (SELECT count(*) FROM cys_classification.uniprot_subcellular)            AS subcellular,
     (SELECT count(*) FROM cys_classification.hgroup_summary)                 AS hgroup_summary,
     (SELECT count(*) FROM cys_classification.hgroup_summary_struct)          AS hgroup_summary_struct;"
