#!/usr/bin/env bash
# Load the dione dump into a fresh sangala:45000 database.
#
# DANGEROUS: --clean (in the dump) will DROP existing TriCyp objects
# in the destination DB. Confirm you're loading into a fresh schema
# or one you intend to overwrite before running.
#
# Usage:
#     DST_PASSWORD='…' [DST_DB=tricyp] deploy/load-to-sangala.sh

set -euo pipefail

DUMP="$(cd "$(dirname "$0")" && pwd)/dump/tricyp-prod.sql.gz"
[[ -f "$DUMP" ]] || { echo "Missing $DUMP — run deploy/dump-from-dione.sh first." >&2; exit 2; }

DST_HOST="${DST_HOST:-sangala}"
DST_PORT="${DST_PORT:-45000}"
DST_USER="${DST_USER:-ecod}"
DST_DB="${DST_DB:-tricyp}"

if [[ -z "${DST_PASSWORD:-}" ]]; then
  echo "DST_PASSWORD must be set (sangala pw for $DST_USER)." >&2
  exit 2
fi

echo "About to load $(du -h "$DUMP" | cut -f1) into $DST_HOST:$DST_PORT/$DST_DB"
echo "(--clean is on — existing TriCyp objects will be DROPPED)"
read -p "Continue? [y/N] " ans
[[ "$ans" =~ ^[Yy] ]] || { echo "Aborted."; exit 1; }

# Ensure the destination DB exists and the three schemas are created
# (the dump's --clean drops objects but doesn't create the schemas).
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

# pg_dump --table dumps the table-level DDL (incl. trigger CREATEs)
# but not the trigger functions those CREATEs reference, since the
# functions live in ecod_commons schema-level objects we did not
# select. Pre-create them on the destination so the dump's CREATE
# TRIGGER statements resolve. Idempotent (CREATE OR REPLACE).
PREREQ="$(dirname "$DUMP")/prereq-functions.sql"
if [[ -f "$PREREQ" ]]; then
  echo "Applying prereq functions ($PREREQ)..."
  PGPASSWORD="$DST_PASSWORD" psql \
    --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
    --dbname="$DST_DB" --quiet --set=ON_ERROR_STOP=1 \
    -f "$PREREQ"
else
  echo "Note: $PREREQ missing — re-run dump-from-dione.sh or apply by hand." >&2
fi

echo "Loading dump..."
gunzip -c "$DUMP" \
  | PGPASSWORD="$DST_PASSWORD" psql \
      --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
      --dbname="$DST_DB" \
      --quiet --no-psqlrc \
      --set=ON_ERROR_STOP=1 \
      2> >(tee "$(dirname "$DUMP")/psql_load.log" >&2)

echo
echo "Loaded. Refreshing materialized views..."
PGPASSWORD="$DST_PASSWORD" psql \
  --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
  --dbname="$DST_DB" -c \
  "REFRESH MATERIALIZED VIEW cys_classification.hgroup_summary;
   REFRESH MATERIALIZED VIEW cys_classification.hgroup_summary_struct;"

echo
echo "Smoke counts on $DST_HOST/$DST_DB:"
PGPASSWORD="$DST_PASSWORD" psql \
  --host="$DST_HOST" --port="$DST_PORT" --username="$DST_USER" \
  --dbname="$DST_DB" -c \
  "SELECT
     (SELECT count(*) FROM ecod_commons.domains)                             AS domains,
     (SELECT count(*) FROM ecod_commons.proteins)                            AS proteins,
     (SELECT count(*) FROM cys_classification.cysteine_classifications)      AS classifications,
     (SELECT count(*) FROM cys_classification.esm2_run_domains WHERE run_id=1) AS paper_v1,
     (SELECT count(*) FROM cys_classification.uniprot_subcellular)           AS uniprot_subcellular,
     (SELECT count(*) FROM cys_classification.hgroup_summary)                AS hgroup_summary;"
