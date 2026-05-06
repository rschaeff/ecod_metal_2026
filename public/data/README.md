# Bulk + figure data deposition

Files served from this directory back the `/downloads` page on TriCyp. The
page renders one row per file declared in `src/lib/downloads.ts`, with a live
"pending" badge when the file is missing. This README explains how each file
is produced.

## Bulk TSVs (regenerate via cron)

| File | Schema | Generator |
| --- | --- | --- |
| `cysteine-classifications.tsv` | one row per classified cysteine; columns: `domain_id, cys_position, classification, p_neg, p_dis, p_met, evidence_tags, f_group_id, h_group_id, x_group_id, source_type` | `scripts/dump-tsv.sh` |
| `domain-summary.tsv` | one row per F70 representative domain | `scripts/dump-tsv.sh` |
| `hgroup-aggregates.tsv` | one row per H-group; backs Fig 5A/B confusion matrices | `scripts/dump-tsv.sh` |

Run from the repo root:

```bash
scripts/dump-tsv.sh                       # → public/data/*.tsv + .sha256
OUT_DIR=/srv/tricyp/data scripts/dump-tsv.sh
PG_CONN='postgresql://…' scripts/dump-tsv.sh
```

Each file gets a SHA-256 sidecar (`<file>.sha256`) plus a combined
`MANIFEST.sha256`. The `.generated-at` stamp records the UTC timestamp of the
last successful run; the page uses this to label "last updated".

Suggested nightly cron:

```cron
15 3 * * * cd /home/rschaeff/dev/ecod_metal_2026 && scripts/dump-tsv.sh \
            >> /var/log/tricyp/dump-tsv.log 2>&1
```

The `cysteine-classifications.tsv` query LEFT JOINs
`cys_classification.esm2_predictions`; if that table is absent (it's the
ESM2-prediction store noted in the missing-backend audit), `p_neg / p_dis /
p_met` columns will be empty.

## Figure-data CSVs

`figure_data/*.csv` are the per-figure data exports cited in the manuscript's
"Software and data availability" section. They mirror the contents of
`paper/figure_data/` in the manuscript repo. Drop those CSVs into
`public/data/figure_data/` with the filenames declared in
`src/lib/downloads.ts → FIGURE_DATA[]`. The `/downloads` page picks them up
automatically.

## Sizes and Zenodo

If a file grows beyond ~50 MB, prefer hosting on Zenodo and replacing the
local entry with `zenodoUrl` only — the page renders an external link in that
case. The Zenodo deposition (per spec §"Out-of-band: Zenodo") will eventually
hold the canonical versioned copies; this directory remains as the public
landing for nightly rebuilds and the latest snapshot.
