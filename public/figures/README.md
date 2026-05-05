# Paper figure assets

Static PNG/SVG exports of paper figures referenced by TriCyp pages. Drop files
here using these exact filenames; pages will pick them up at the next dev
server reload (or build). Pages render a graceful placeholder when an asset is
missing, so partial deposition is fine.

Recommended export: PNG at 2x device pixel ratio (around 1600px wide for full
panels, 800px wide for sub-panels), or SVG if the source is matplotlib/
ggplot. Keep colour palette consistent with the site (red disulfide, green
metal-binding, grey free thiol).

## Expected filenames

| Path | Source | Used by |
| --- | --- | --- |
| `fig1_pipeline.png` | Paper Fig 1 (full pipeline diagram) | `/about` (step 8) |
| `fig2a_disulfide_roc.png` | Paper Fig 2A | `/benchmark` |
| `fig2b_disulfide_pr.png` | Paper Fig 2B | `/benchmark` |
| `fig2c_disulfide_threshold.png` | Paper Fig 2C | `/benchmark` |
| `fig2d_metal_roc.png` | Paper Fig 2D | `/benchmark` |
| `fig2e_metal_pr.png` | Paper Fig 2E | `/benchmark` |
| `fig2f_metal_threshold.png` | Paper Fig 2F | `/benchmark` |
| `figS1_iron_only_roc.png` | Paper Fig S1 | `/benchmark` |
| `fig4a_af_geom_overview.png` | Paper Fig 4A | `/af-geometric` (step 5) |
| `fig4b_af_geom_distance.png` | Paper Fig 4B | `/af-geometric` |
| `fig4c_af_geom_pae.png` | Paper Fig 4C | `/af-geometric` |
| `fig4d_af_geom_example1.png` | Paper Fig 4D | `/af-geometric` |
| `fig4e_af_geom_example2.png` | Paper Fig 4E | `/af-geometric` |
| `fig4f_af_geom_example3.png` | Paper Fig 4F | `/af-geometric` |
| `fig5a_hgroup_disulfide_confusion.png` | Paper Fig 5A | `/h-group` (step 6) |
| `fig5b_hgroup_metal_confusion.png` | Paper Fig 5B | `/h-group` |
| `fig5c_hgroup_3380_1.png` | Paper Fig 5C | `/h-group/3380.1` |
| `fig5d_hgroup_804_1.png` | Paper Fig 5D | `/h-group/804.1` |
| `fig5e_hgroup_3991_1.png` | Paper Fig 5E | `/h-group/3991.1` |
