# TriCyp production deployment

Mirrors the deploy pattern from `~/dev/ecod_frontpage_2026` (`ecod2_app`).

- **Single git checkout** at `~/dev/ecod_metal_2026` on **leda**.
- **Production tree** at `/data/ECOD/html/tricyp_app` on **sangala**
  is a deploy artifact — no `.git/`, treat as overwriteable.
- Build runs in the dev tree, `scripts/deploy.sh` rsyncs the
  standalone bundle into prod, preserves `.env.production` and
  runtime files, and records the deployed git SHA in
  `PROD_DIR/VERSION`.

## Topology

- **DB**: `sangala:45000/tricyp` (production Postgres). Schema is
  migrated from dione via `deploy/dump-from-dione.sh` →
  `deploy/load-to-sangala.sh`.
- **App**: standalone Next.js 16 server bound to `0.0.0.0:3003` on
  sangala. Managed by `scripts/start-production.sh` (nohup +
  `.next-server.pid`); no systemd unit. `deploy/systemd/` is unused
  legacy kept for reference.
- **Public URL**: Apache vhost on **prodata** reverse-proxies
  `/tricyp` → `http://sangala:3003/tricyp` over the SWMED LAN
  (cross-host; the app and the proxy live on different machines).
  The Next.js build carries `basePath=/tricyp` so asset URLs resolve
  under the proxy mount.

## First-time deploy

### 1. Migrate the backend (one-time, then on data refresh)

```bash
cd ~/dev/ecod_metal_2026                          # leda
SRC_PASSWORD='…' deploy/dump-from-dione.sh
# Produces deploy/dump/tricyp-prod.sql.gz (size depends on data
# volume; cysteine_classifications alone is 2.7M rows).

DST_PASSWORD='…' deploy/load-to-sangala.sh
# Confirms before clobbering. Refreshes both H-group MVs at the end
# and prints smoke counts to confirm row counts on the destination.
```

The dump is cherry-picked from three schemas (`ecod_commons`,
`ecod_rep`, `cys_classification`); see `deploy/dump-from-dione.sh`
for the exact list. Loaded with `--no-owner --no-privileges
--clean --if-exists` so re-runs are idempotent.

### 2. First app build + deploy

```bash
cd ~/dev/ecod_metal_2026                          # leda

# .env.production lives at the project root; copy the template and fill in DB_PASSWORD.
cp deploy/.env.production.example .env.production
$EDITOR .env.production                           # set DB_PASSWORD; verify BASE_PATH=/tricyp

npm ci

# next.config.ts reads BASE_PATH at build time, so source the env first.
set -a; source .env.production; set +a
npm run build                                     # writes .next/standalone/dev/ecod_metal_2026/

# Push the build to /data/ECOD/html/tricyp_app and start the server:
./scripts/deploy.sh --restart
```

`deploy.sh` does (in order):

1. Stops the running server (if any) via `$PROD_DIR/start.sh stop`.
2. `rsync -a --delete` the standalone bundle into `PROD_DIR`,
   excluding `logs/`, `.next-server.pid`, `.env.production`,
   `start.sh`, `VERSION` so prod-local files are preserved.
3. `rsync -a --delete` `.next/static/` and `public/` to their
   respective subdirectories.
4. Seeds `.env.production` from the dev tree on first deploy;
   preserves the prod copy on subsequent deploys.
5. Installs `start.sh` from `scripts/start-production.sh` and
   rewrites `APP_DIR` to the prod path with `sed`.
6. Symlinks Turbopack-mangled module names in `node_modules/` to
   their real packages (a Next.js 16 standalone-bundle quirk).
7. Writes `PROD_DIR/VERSION` with the deployed git SHA, commit
   subject, commit timestamp, deploy timestamp, and a `dirty=true`
   flag if the dev tree had uncommitted changes.
8. With `--restart`, re-runs `start.sh start`.

### 3. Wire up the Apache reverse proxy (on prodata, not sangala)

Apache lives on prodata; the snippet in `deploy/apache-tricyp.conf`
points at `http://sangala:3003/tricyp`. Drop it into prodata's
Apache config and reload:

```bash
# on prodata
sudo a2enmod proxy proxy_http headers     # if not already enabled
sudo cp <path-to-config>/apache-tricyp.conf \
        /etc/apache2/conf-available/tricyp.conf
sudo a2enconf tricyp
sudo apachectl configtest
sudo systemctl reload apache2
```

### 4. Smoke test

```bash
# direct against the standalone server (on sangala or any LAN host):
curl -I http://sangala:3003/tricyp

# through Apache:
curl -I https://<prodata-public-host>/tricyp

# what's running:
cat /data/ECOD/html/tricyp_app/VERSION
```

Both `curl` commands should return 200 with `text/html`. The
dashboard hero loads the four DB-derived stat-strip cards; if any
are missing you'll see the "Database unreachable — showing the
manuscript snapshot" amber banner — that's the `dbError` fallback
in `src/app/page.tsx` and means the app couldn't reach
`sangala:45000`.

## Updating after source changes

```bash
cd ~/dev/ecod_metal_2026                          # leda
git pull                                          # source updates
npm ci                                            # only if package-lock.json changed

set -a; source .env.production; set +a
npm run build
./scripts/deploy.sh --restart

# Verify:
cat /data/ECOD/html/tricyp_app/VERSION
curl -I http://sangala:3003/tricyp
```

Note: on a clean `git pull`, the dev tree's `.env.production` may
be absent (it's gitignored). The deploy script will warn and skip
re-seeding prod's copy — which is what we want, since prod's env
file holds the live DB credentials and shouldn't be clobbered.

## Updating after data refresh

```bash
cd ~/dev/ecod_metal_2026                          # leda
SRC_PASSWORD='…' deploy/dump-from-dione.sh
DST_PASSWORD='…' deploy/load-to-sangala.sh

# In-app caches (24h TTL on H-group / paper-v1 queries) flush on
# next cold cache hit; force a restart to clear immediately.
/data/ECOD/html/tricyp_app/start.sh restart
```

## Files

| Path | Purpose |
| --- | --- |
| `scripts/deploy.sh` | rsync standalone bundle from dev → prod, patch `start.sh`, record VERSION |
| `scripts/start-production.sh` | start/stop/restart/status launcher (nohup + PID file). Template — `APP_DIR` is sed-rewritten by `deploy.sh` |
| `deploy/dump-from-dione.sh` | pg_dump from dione → `deploy/dump/tricyp-prod.sql.gz` |
| `deploy/load-to-sangala.sh` | gunzip + psql into sangala; refreshes MVs; prints smoke counts |
| `deploy/.env.production.example` | template for the runtime config (`BASE_PATH`, DB creds, `PORT`) |
| `deploy/apache-tricyp.conf` | reverse-proxy snippet for prodata's Apache (`ProxyPass /tricyp http://sangala:3003/tricyp`) |
| `deploy/systemd/tricyp.service` | legacy systemd unit, **not in use** — kept for reference if we move to systemd later |
| `scripts/verify-db.sh` | runs the DB_CONTRACT contract checks against a connection string; useful after `load-to-sangala.sh` |
