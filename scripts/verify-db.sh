#!/usr/bin/env bash
# Verify the live DB satisfies the contract documented in DB_CONTRACT.md.
# Runs scripts/verify-db.sql via psql, prints a coloured PASS / FAIL /
# MISSING report, and exits non-zero if anything is not PASS — suitable
# as a CI / deploy gate or a nightly cron alongside scripts/dump-tsv.sh.
#
# Usage:
#     scripts/verify-db.sh
#     PG_CONN='postgresql://…' scripts/verify-db.sh
#     STRICT=1 scripts/verify-db.sh   # MISSING also exits non-zero

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_CONN="${PG_CONN:-}"
STRICT="${STRICT:-0}"

# Detect TTY for colour output.
if [[ -t 1 ]]; then
  C_RED='\033[31m'
  C_YEL='\033[33m'
  C_GRN='\033[32m'
  C_DIM='\033[2m'
  C_RST='\033[0m'
else
  C_RED=''; C_YEL=''; C_GRN=''; C_DIM=''; C_RST=''
fi

PSQL_ARGS=(--quiet --no-psqlrc --file="$REPO_ROOT/scripts/verify-db.sql")
if [[ -n "$PG_CONN" ]]; then
  RAW="$(psql "$PG_CONN" "${PSQL_ARGS[@]}")"
else
  RAW="$(psql "${PSQL_ARGS[@]}")"
fi

declare -i fail=0 missing=0 pass=0
echo
printf '  %-58s %-9s %s\n' 'CHECK' 'STATUS' 'DETAIL'
printf '  %-58s %-9s %s\n' '-----' '------' '------'

while IFS='|' read -r label status detail; do
  [[ -z "$label" ]] && continue
  # NB: use pre-increment so the arithmetic expression evaluates non-zero
  # under `set -e`. `((var++))` returns the pre-increment value, which is
  # 0 the first time around and trips errexit.
  case "$status" in
    PASS)    color="$C_GRN"; ((++pass))    ;;
    MISSING) color="$C_YEL"; ((++missing)) ;;
    FAIL)    color="$C_RED"; ((++fail))    ;;
    *)       color="$C_DIM" ;;
  esac
  printf '  %-58s %b%-9s%b %s\n' "$label" "$color" "$status" "$C_RST" "$detail"
done <<< "$RAW"

echo
printf '  %bPASS%b: %d   %bMISSING%b: %d   %bFAIL%b: %d\n' \
  "$C_GRN" "$C_RST" "$pass" \
  "$C_YEL" "$C_RST" "$missing" \
  "$C_RED" "$C_RST" "$fail"

if (( fail > 0 )); then
  exit 1
fi
if (( missing > 0 )) && [[ "$STRICT" == "1" ]]; then
  exit 2
fi
exit 0
