# TriCyp production deployment

This directory is the production checkout of the TriCyp Next.js site
at `/data/ecod/tricyp`. Source repo is `~/dev/ecod_metal_2026` on
leda; deploy this checkout via `git pull` from that origin.

## Topology

- **DB**: `sangala:45000/tricyp` (production Postgres). The TriCyp
  schema is migrated from dione via `deploy/dump-from-dione.sh` →
  `deploy/load-to-sangala.sh`.
- **App**: standalone Next.js 16 server on `127.0.0.1:3003` under
  systemd unit `tricyp.service`.
- **Public URL**: Apache reverse-proxies `/tricyp` → `:3003/tricyp`,
  path-preserving. The Next.js build carries `basePath=/tricyp` so
  asset URLs resolve under the proxy mount.

## First-time deploy

### 1. Migrate the backend (one-time, then on data refresh)

```bash
cd /data/ecod/tricyp
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
cd /data/ecod/tricyp
cp deploy/.env.local.example .env.local
$EDITOR .env.local      # set DB_PASSWORD; verify NEXT_PUBLIC_BASE_PATH=/tricyp

npm ci                  # install dependencies
NEXT_PUBLIC_BASE_PATH=/tricyp npm run build
                        # builds .next/standalone with the basePath baked in

# Standalone bundle doesn't include static assets — copy them into
# the bundle so server.js can serve them at /tricyp/_next/static/*.
cp -r .next/static .next/standalone/.next/static
cp -r public      .next/standalone/public
```

### 3. Install + start the service

```bash
sudo cp /data/ecod/tricyp/deploy/systemd/tricyp.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tricyp.service

systemctl status tricyp.service
journalctl -u tricyp.service -f
```

The unit reads `/data/ecod/tricyp/.env.local`, runs as
`rschaeff:ecod`, and listens on `127.0.0.1:3003`.

### 4. Wire up the Apache reverse proxy

```bash
sudo a2enmod proxy proxy_http headers     # if not already enabled
sudo cp /data/ecod/tricyp/deploy/apache-tricyp.conf \
        /etc/apache2/conf-available/tricyp.conf
sudo a2enconf tricyp
sudo apachectl configtest
sudo systemctl reload apache2
```

### 5. Smoke test

```bash
curl -I http://127.0.0.1:3003/tricyp                        # standalone server direct
curl -I https://<public-host>/tricyp                        # through Apache
```

Both should return 200 with `text/html`. The dashboard hero loads
the four DB-derived stat-strip cards; if any are missing you'll see
the "Database unreachable — showing the manuscript snapshot" amber
banner — that's the `dbError` fallback in `src/app/page.tsx` and
means the app couldn't reach `sangala:45000`.

## Updating after source changes

```bash
cd /data/ecod/tricyp
git pull
npm ci                                                      # if package-lock.json changed
NEXT_PUBLIC_BASE_PATH=/tricyp npm run build
cp -r .next/static .next/standalone/.next/static
cp -r public      .next/standalone/public
sudo systemctl restart tricyp.service
```

## Updating after data refresh

```bash
cd /data/ecod/tricyp
SRC_PASSWORD='…' deploy/dump-from-dione.sh
DST_PASSWORD='…' deploy/load-to-sangala.sh

# In-app caches (24h TTL on H-group / paper-v1 queries) flush on
# next cold cache hit; force a restart to clear immediately.
sudo systemctl restart tricyp.service
```

## Files

| Path | Purpose |
| --- | --- |
| `deploy/dump-from-dione.sh` | pg_dump from dione → `deploy/dump/tricyp-prod.sql.gz` |
| `deploy/load-to-sangala.sh` | gunzip + psql into sangala; refreshes MVs; prints smoke counts |
| `deploy/.env.local.example` | template for the runtime DB credentials |
| `deploy/apache-tricyp.conf` | reverse-proxy snippet (matches `ProxyPass /tricyp …`) |
| `deploy/systemd/tricyp.service` | systemd unit for the standalone Next.js server |
| `scripts/verify-db.sh` | runs the DB_CONTRACT contract checks against a connection string; useful after `load-to-sangala.sh` |
