#!/usr/bin/env bash
# Generate the canonical TSV deposition files for /downloads. Runs the SQL
# in dump-tsv.sql via psql, writes outputs into $OUT_DIR (default
# public/data/ relative to the repo root), and emits SHA-256 sidecars.
#
# Usage:
#     scripts/dump-tsv.sh                    # writes into <repo>/public/data
#     OUT_DIR=/srv/tricyp/data scripts/dump-tsv.sh
#     PG_CONN='postgresql://...' scripts/dump-tsv.sh
#
# Environment:
#     PG_CONN     postgres connection string. Falls back to the local libpq
#                 default (PGHOST/PGUSER/etc.) when unset.
#     OUT_DIR     output directory; created if missing.
#
# Cron suggestion (nightly at 03:15):
#     15 3 * * * cd /home/rschaeff/dev/ecod_metal_2026 && scripts/dump-tsv.sh \
#                  >> /var/log/tricyp/dump-tsv.log 2>&1

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/public/data}"
PG_CONN="${PG_CONN:-}"

mkdir -p "$OUT_DIR"

CYS_OUT="$OUT_DIR/cysteine-classifications.tsv"
DOM_OUT="$OUT_DIR/domain-summary.tsv"
HGR_OUT="$OUT_DIR/hgroup-aggregates.tsv"

# Use absolute paths for \copy ... TO so psql writes to the intended directory
# regardless of the cron working directory.
PSQL_ARGS=(
  --set=ON_ERROR_STOP=1
  --set="cys_out=$CYS_OUT"
  --set="dom_out=$DOM_OUT"
  --set="hgr_out=$HGR_OUT"
  --file="$REPO_ROOT/scripts/dump-tsv.sql"
)

if [[ -n "$PG_CONN" ]]; then
  psql "$PG_CONN" "${PSQL_ARGS[@]}"
else
  psql "${PSQL_ARGS[@]}"
fi

# Emit SHA-256 sidecars and a combined manifest.
MANIFEST="$OUT_DIR/MANIFEST.sha256"
: > "$MANIFEST"
for f in "$CYS_OUT" "$DOM_OUT" "$HGR_OUT"; do
  sha256sum "$f" | tee "$f.sha256" >> "$MANIFEST"
done

# Stamp the generation time so the page can show a clear "last updated" label.
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT_DIR/.generated-at"

echo "Wrote:"
ls -lh "$CYS_OUT" "$DOM_OUT" "$HGR_OUT" "$MANIFEST"
