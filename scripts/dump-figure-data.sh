#!/usr/bin/env bash
# Generate the per-figure CSV deposits for /downloads. Live-DB-derivable
# CSVs go through psql + dump-figure-data.sql; static / benchmark-derived
# CSVs go through scripts/dump-figure-data-static.mjs.
#
# Usage:
#     scripts/dump-figure-data.sh
#     PG_CONN='postgresql://…' scripts/dump-figure-data.sh
#     OUT_DIR=/srv/tricyp/figure_data scripts/dump-figure-data.sh
#
# Cron suggestion (after dump-tsv): 25 3 * * *

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${OUT_DIR:-$REPO_ROOT/public/data/figure_data}"
PG_CONN="${PG_CONN:-}"

mkdir -p "$OUT_DIR"

# Live-DB CSVs (paper-v1 scope).
PSQL_ARGS=(
  --set=ON_ERROR_STOP=1
  --set="fig3b_out=$OUT_DIR/fig3b_kingdom_fractions.csv"
  --set="fig3c_out=$OUT_DIR/fig3c_kingdom_rates.csv"
  --set="fig3d_out=$OUT_DIR/fig3d_subcellular.csv"
  --set="figS2_out=$OUT_DIR/figS2_source_breakdown.csv"
  --set="figS3_out=$OUT_DIR/figS3_confidence_distribution.csv"
  --set="fig5ab_out=$OUT_DIR/fig5ab_hgroup_confusion.csv"
  --file="$REPO_ROOT/scripts/dump-figure-data.sql"
)

if [[ -n "$PG_CONN" ]]; then
  psql "$PG_CONN" "${PSQL_ARGS[@]}"
else
  psql "${PSQL_ARGS[@]}"
fi

# Static + benchmark-derived CSVs.
OUT_DIR="$OUT_DIR" node "$REPO_ROOT/scripts/dump-figure-data-static.mjs"

# SHA-256 sidecars + manifest.
MANIFEST="$OUT_DIR/MANIFEST.sha256"
: > "$MANIFEST"
for f in "$OUT_DIR"/*.csv; do
  [[ -f "$f" ]] || continue
  sha256sum "$f" | tee "$f.sha256" >> "$MANIFEST"
done

date -u +"%Y-%m-%dT%H:%M:%SZ" > "$OUT_DIR/.generated-at"

echo
echo "Wrote:"
ls -lh "$OUT_DIR"/*.csv 2>/dev/null
