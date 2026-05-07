# TriCyp production deployment

Production checkout lives at **`/data/ECOD/html/tricyp_app`** on
**sangala**. Source repo is `~/dev/ecod_metal_2026` on leda;
`origin` is the GitHub remote. Deploys flow leda → GitHub → sangala
via `git pull`.

## Topology

- **DB**: `sangala:45000/tricyp` (production Postgres). The TriCyp
  schema is migrated from dione via `deploy/dump-from-dione.sh` →
  `deploy/load-to-sangala.sh`.
- **App**: standalone Next.js 16 server bound to `0.0.0.0:3003` on
  sangala. Managed by `scripts/start-production.sh` (nohup +
  `.next-server.pid`); **no systemd unit** — `deploy/systemd/` is
  unused legacy.
- **Public URL**: Apache vhost on **prodata** reverse-proxies
  `/tricyp` → `http://sangala:3003/tricyp` over the SWMED LAN
  (cross-host; the app and the proxy live on different machines).
  The Next.js build carries `basePath=/tricyp` so asset URLs resolve
  under the proxy mount.

## First-time deploy

### 1. Migrate the backend (one-time, then on data refresh)

```bash
cd /data/ECOD/html/tricyp_app
SRC_PASSWORD='…' deploy/dump-from-dione.sh
# Produces deploy/dump/tricyp-prod.sql.gz (size depends on data
# volume; cysteine_classifications alone is 2.7M rows).

DST_PASSWORD='…' deploy/load-to-sangala.sh
# Confirms before clobbering. Refreshes both H-group MVs at the end
# and prints smoke counts to confirm row counts on the destination.
```

The dump is cherry-picked from three schemas:
- `ecod_commons` (10 tables: `domains`, `proteins`, `organism_taxonomy`,
  `f_group_assignments`, `domain_clusters`, `clustering_runs`,
  `clustering_parameters`, `clustering_algorithms`, `domain_sequences`,
  `versions`, plus the `protein_taxonomy` view)
- `ecod_rep` (whole schema — pulls `cluster` + custom `dom_cid` /
  `ctype` types)
- `cys_classification` (whole schema — TriCyp-specific)

The dump is `--no-owner --no-privileges --clean --if-exists` so it
loads cleanly on a destination with different roles, and re-runs are
idempotent.

### 2. Configure the app

```bash
cd /data/ECOD/html/tricyp_app
cp deploy/.env.production.example .env.production
$EDITOR .env.production    # set DB_PASSWORD; verify BASE_PATH=/tricyp

npm ci                      # install dependencies

# next.config.ts reads BASE_PATH at build time, so the build must run
# with .env.production loaded.
set -a; source .env.production; set +a
npm run build
                           # builds .next/standalone with the basePath baked in

# Standalone bundle doesn't include static assets — copy them into
# the bundle so server.js can serve them at /tricyp/_next/static/*.
cp -r .next/static .next/standalone/.next/static
cp -r public      .next/standalone/public
```

### 3. Start the server

```bash
cd /data/ECOD/html/tricyp_app
scripts/start-production.sh start
scripts/start-production.sh status
tail -f logs/production.log
```

The script sources `.env.production`, prepends `~/.local/node/bin` to
`PATH`, fixes `LD_LIBRARY_PATH=/usr/lib64` for sangala's libstdc++
quirk, and runs `nohup node server.js` from `.next/standalone`. PID
goes to `.next-server.pid`.

### 4. Wire up the Apache reverse proxy (on prodata, not sangala)

Apache lives on prodata; the snippet in `deploy/apache-tricyp.conf`
points at `http://sangala:3003/tricyp`. Drop it into prodata's
Apache config and reload:

```bash
# on prodata
sudo a2enmod proxy proxy_http headers     # if not already enabled
sudo cp <path-to-tricyp-checkout>/deploy/apache-tricyp.conf \
        /etc/apache2/conf-available/tricyp.conf
sudo a2enconf tricyp
sudo apachectl configtest
sudo systemctl reload apache2
```

### 5. Smoke test

```bash
# direct against the standalone server (on sangala or any LAN host):
curl -I http://sangala:3003/tricyp

# through Apache:
curl -I https://<prodata-public-host>/tricyp
```

Both should return 200 with `text/html`. The dashboard hero loads
the four DB-derived stat-strip cards; if any are missing you'll see
the "Database unreachable — showing the manuscript snapshot" amber
banner — that's the `dbError` fallback in `src/app/page.tsx` and
means the app couldn't reach `sangala:45000`.

## Updating after source changes

```bash
cd /data/ECOD/html/tricyp_app
git pull
npm ci                                    # if package-lock.json changed

set -a; source .env.production; set +a
npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public      .next/standalone/public

scripts/start-production.sh restart
scripts/start-production.sh status
```

## Updating after data refresh

```bash
cd /data/ECOD/html/tricyp_app
SRC_PASSWORD='…' deploy/dump-from-dione.sh
DST_PASSWORD='…' deploy/load-to-sangala.sh

# In-app caches (24h TTL on H-group / paper-v1 queries) flush on
# next cold cache hit; force a restart to clear immediately.
scripts/start-production.sh restart
```

## Files

| Path | Purpose |
| --- | --- |
| `deploy/dump-from-dione.sh` | pg_dump from dione → `deploy/dump/tricyp-prod.sql.gz` |
| `deploy/load-to-sangala.sh` | gunzip + psql into sangala; refreshes MVs; prints smoke counts |
| `deploy/.env.production.example` | template for the runtime config (`BASE_PATH`, DB creds, `PORT`) |
| `deploy/apache-tricyp.conf` | reverse-proxy snippet for prodata's Apache (`ProxyPass /tricyp http://sangala:3003/tricyp`) |
| `deploy/systemd/tricyp.service` | legacy systemd unit, **not in use** — kept for reference if we move to systemd later |
| `scripts/start-production.sh` | start/stop/restart/status launcher (nohup + PID file) |
| `scripts/verify-db.sh` | runs the DB_CONTRACT contract checks against a connection string; useful after `load-to-sangala.sh` |
