#!/bin/bash
# Deploy TriCyp Next.js app to production directory.
# Mirrors ~/dev/ecod_frontpage_2026/scripts/deploy.sh.
#
# Usage:
#   npm run build                              # produces .next/standalone in DEV_DIR
#   ./scripts/deploy.sh                        # rsync into PROD_DIR
#   ./scripts/deploy.sh --restart              # rsync, then start the prod server
#
# Run from any host where DEV_DIR and PROD_DIR are both reachable
# (leda or sangala — both see /data/ECOD/html/ over NFS).
#
# Prod tree is treated as an artifact — its current contents (except
# .env.production, runtime files, the existing start.sh, and VERSION)
# get rsync'd from scratch each deploy. There is no .git/ on prod.
# The deployed git SHA is recorded in PROD_DIR/VERSION.

set -e

DEV_DIR="/home/rschaeff/dev/ecod_metal_2026"
PROD_DIR="/data/ECOD/html/tricyp_app"

# Next.js standalone output nests by relative path from the workspace
# root (which Next.js auto-detects via /home/rschaeff/package.json).
# Adjust this if the workspace root or repo path changes.
STANDALONE_APP="$DEV_DIR/.next/standalone/dev/ecod_metal_2026"

# Sanity-check the build
if [ ! -f "$STANDALONE_APP/server.js" ]; then
    echo "Error: No standalone build at $STANDALONE_APP/server.js"
    echo "Run 'npm run build' in $DEV_DIR first (output: 'standalone' in next.config.ts)."
    exit 1
fi

echo "Deploying $DEV_DIR → $PROD_DIR..."

mkdir -p "$PROD_DIR/logs"

# Stop the running server so we don't deploy under it
if [ -f "$PROD_DIR/start.sh" ]; then
    "$PROD_DIR/start.sh" stop 2>/dev/null || true
fi

# 1) Standalone server bundle + minimal node_modules. --delete prunes
#    stale files from PROD_DIR; excludes preserve runtime / env / launcher.
echo "  Copying standalone server..."
rsync -a --delete \
    --exclude='logs' \
    --exclude='.next-server.pid' \
    --exclude='.env.production' \
    --exclude='start.sh' \
    --exclude='VERSION' \
    "$STANDALONE_APP/" "$PROD_DIR/"

# 2) Static assets (Next.js build chunks served at /tricyp/_next/static/*)
echo "  Copying .next/ build output..."
rsync -a --delete "$DEV_DIR/.next/static/" "$PROD_DIR/.next/static/"

# 3) public/ (favicon, /tricyp/data/*.tsv bulk dumps, viewer iframe HTML, …)
echo "  Copying public/ assets..."
rsync -a --delete "$DEV_DIR/public/" "$PROD_DIR/public/"

# 4) Seed .env.production on first deploy; preserve subsequent local edits
if [ ! -f "$PROD_DIR/.env.production" ]; then
    if [ -f "$DEV_DIR/.env.production" ]; then
        cp "$DEV_DIR/.env.production" "$PROD_DIR/.env.production"
        echo "  Created .env.production (new install) — review DB_PASSWORD"
    else
        echo "  WARNING: no .env.production in DEV_DIR; copy deploy/.env.production.example into PROD_DIR/.env.production and edit"
    fi
else
    echo "  .env.production already exists (preserved)"
fi

# 5) Install start.sh and patch APP_DIR for the prod tree
cp "$DEV_DIR/scripts/start-production.sh" "$PROD_DIR/start.sh"
chmod +x "$PROD_DIR/start.sh"
sed -i "s|APP_DIR=.*|APP_DIR=\"$PROD_DIR\"|" "$PROD_DIR/start.sh"

# 6) Turbopack standalone-build workaround. Next.js 16's Turbopack mangles
#    external module names into "<base>-<16hex>" forms when emitting the
#    standalone bundle, but doesn't ship those names in node_modules. Symlink
#    each mangled name to its real package so server.js can resolve them.
#    No-op when no mangled refs are present.
echo "  Fixing Turbopack module references..."
cd "$PROD_DIR/node_modules"
for mangled in $(grep -ohP 'e\.y\("[^"]+"\)' "$PROD_DIR/.next/server/chunks/"*.js 2>/dev/null \
                 | sed 's/e\.y("//;s/")//' | sort -u); do
    base=$(echo "$mangled" | sed 's/-[0-9a-f]\{16\}$//')
    if [ -d "$base" ] && [ ! -e "$mangled" ]; then
        ln -sf "$base" "$mangled"
        echo "    Linked $mangled -> $base"
    fi
done
cd "$DEV_DIR"

# 7) Record the deployed SHA so "what's running?" is answerable from prod
GIT="LD_LIBRARY_PATH= git -c safe.directory=$DEV_DIR -C $DEV_DIR"
SHA=$(eval $GIT rev-parse HEAD)
SUBJ=$(eval $GIT log -1 --pretty=%s)
DATE=$(eval $GIT log -1 --pretty=%cI)
DIRTY=$(eval $GIT status --porcelain | head -1)
{
    echo "sha=$SHA"
    echo "subject=$SUBJ"
    echo "committed=$DATE"
    echo "deployed=$(date -Iseconds)"
    [ -n "$DIRTY" ] && echo "dirty=true"
} > "$PROD_DIR/VERSION"
echo "  Recorded VERSION (sha=${SHA:0:8}${DIRTY:+, dirty})"

echo ""
echo "Deploy complete."
echo ""
echo "To start/restart the production server:"
echo "  $PROD_DIR/start.sh restart"

if [ "$1" = "--restart" ]; then
    echo ""
    "$PROD_DIR/start.sh" start
fi
