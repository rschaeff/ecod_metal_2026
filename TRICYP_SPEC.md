# Spec: TriCyp — Public-facing Cysteine Fate Browser

**Working name:** TriCyp (three cysteine fates: metal-binding,
disulfide-bonded, free thiol).

**Purpose.** Public-facing deposition site for the per-cysteine
classifications described in *"Classification of cysteine fates in
structure predictions using a protein language model"* (Yuan, Durham,
Cong, Schaeffer). A reader of the paper should be able to land on
TriCyp, recognize each main figure as a navigable view, look up any
domain/protein/family that appears in the paper, and download the
underlying per-cysteine TSV.

**Relationship to existing code.** The Next.js app in
`src/app` is the substrate. The browse infrastructure (dashboard,
family list, family detail, domain detail with sequence viewer,
search) is largely retained. The analysis pages are reframed to
mirror paper figures rather than the internal validation
experiments. Several pages from the internal site are dropped
(see §"Removed / out-of-scope" below).

**Supersedes.** `SPEC.md`, `INSIGHTS_SPEC.md`, `NEXTJS_PAGE_SPEC.md`.
The first two are kept as historical references; this document is
the canonical spec going forward. The third is already marked
superseded.

---

## Naming and audience

- **Site name in UI:** TriCyp.
- **Subtitle in header:** "Three-state cysteine classification across
  ~700,000 ECOD representative domains".
- **Audience:** readers of the paper (primary) and researchers looking
  up specific proteins/domains (secondary). Not a pedagogical resource
  on cysteine biochemistry.
- **Tone:** terminology matches the paper exactly — *free thiol*,
  *disulfide-bonded*, *metal-binding*. Three-letter codes (Neg / Dis /
  Met) are used only in download formats and tooltips, never as the
  primary user-facing label.

---

## Paper-figure correspondence

Each main figure in the paper maps to a page or panel in TriCyp.
This is the single most important design constraint: a reader
arriving from the paper's data-availability statement should see
the figures they recognized.

| Paper figure | TriCyp surface                                        |
| ------------ | ----------------------------------------------------- |
| Fig 1 (pipeline)              | About / Methods page; static diagram + text |
| Fig 2 (benchmark ROC/PR/threshold) | "Benchmark" page; ROC + PR + threshold tuning |
| Fig 3A (PDB-geom vs ESM rates)     | Dashboard panel; stacked bar by structure source |
| Fig 3B (kingdom representation)    | Dashboard panel; domain vs cysteine fraction by kingdom |
| Fig 3C (per-kingdom rates)         | Dashboard panel; stacked bar Bac / Arc / Euk |
| Fig 3D (subcellular gradient)      | Dashboard panel; subcellular bars (Euk only) |
| Fig 4 (geometric AF disulfide)     | "AlphaFold geometric scanning" page; replicates panels A–F |
| Fig 5A,B (H-group confusion)       | "H-group browser"; confusion matrix entry surface |
| Fig 5C–E (novel-metal H-groups)    | H-group detail pages 3380.1, 804.1, 3991.1 |
| Fig S1 (metal-type stratification) | Benchmark page; iron-only ROC strip |
| Fig S2 (source-type breakdown)     | Dashboard panel; source-type stacked bar |
| Fig S3 (confidence distributions)  | Dashboard panel; confidence histogram |

The dashboard (`/`) becomes the visual landing page that mirrors
Figure 3 directly. Other figures are linked from the dashboard and
from a "Paper" navigation item.

---

## Pages

### 1. Landing / Dashboard (`/`)

Reader's first stop. Mirrors Fig 3A–D.

**Above the fold:**
- One-line site description and link to the paper (DOI, bioRxiv).
- Stat strip: `691,078 domains · 2,706,778 cysteines · 456,109
  disulfide (16.9%) · 166,445 metal-binding (6.1%) · 2,084,224 free
  thiol (77.0%)`.
- Search bar: domain ID, PDB ID, F-group ID, UniProt accession.

**Figure 3 panels, in order:**
- **A.** Stacked bars: PDB-geom (n=157,480) / PDB-ESM / AFDB-ESM,
  showing Free thiol / Dis / Met fractions. Same numeric content as
  paper Fig 3A.
- **B.** Paired bars: domain fraction vs cysteine fraction, by
  kingdom (Eu 55.0/74.1, Bac 25.4/14.1, Arc 16.6/11.0).
- **C.** Stacked bars: per-kingdom classification rates (Bac, Arc,
  Eu).
- **D.** Subcellular localization (eukaryotic): horizontal bars,
  disulfide and metal rates per compartment.

Each panel:
- Caption identical to figure caption in the paper.
- "Show data" link → CSV download of the underlying counts.
- Hover/click → drill-down (e.g., clicking the Bac bar in panel C
  filters the family browser to bacterial domains).

**Below Figure 3 panels:**
- Confidence distribution histogram (Fig S3).
- Source-type breakdown (Fig S2).

### 2. About / Methods (`/about`)

Static page. Pipeline diagram (Fig 1), benchmark summary, model
architecture, training data provenance, threshold rationale (Met ≥
0.972, Dis ≥ 0.742). One paragraph each, with section anchors that
match the paper's Methods subheadings.

Includes:
- Citation block (BibTeX + RIS).
- Reference to the predictor code (`cys3state` repo / Zenodo).
- Reference to the per-cysteine TSV (Zenodo DOI).
- License (CC-BY-4.0 for data; the predictor code's existing license).

### 3. Benchmark (`/benchmark`)

Mirrors Fig 2 + Fig S1.

- ROC and PR curves: ESM2 (held-out + ensemble), GPSite, LMetalSite,
  SSBONDPredict.
- Threshold-tuning panels (Fig 2C, F).
- **Iron-only strip** (Fig S1): ESM2 0.993 / LMetalSite 0.917 /
  GPSite 0.877 — the paper's main benchmarking conclusion (metal-type
  stratification). Make this prominent; readers were specifically
  pointed at this finding.
- Tabular summary: AUROC and AP per tool per stratum (all metals,
  Zn/Ca/Mg/Mn, iron-only).

Static plots (matplotlib output as PNG/SVG) are fine here — these
don't need interactivity beyond a hover-tooltip.

### 4. AlphaFold geometric scanning (`/af-geometric`)

Mirrors Fig 4. The point of this page is to make the
"AlphaFold-monomer geometric scanning is fundamentally limited"
argument visible to readers who want to inspect the underlying
structures.

- Panels A–F as static figures, with captions matching the paper.
- For panels D, E, F: clickable PyMOL session links to the example
  structures (the AFDB models and matched PDB experimental structures
  shown in the paper). Examples should be served as static `.pse` /
  `.pdb` files, not generated on the fly.

### 5. Family browser (`/family`)

Existing functionality, retained:
- Paginated, sortable F-group table.
- Columns: F-group ID, name, X-group, # domains, total Cys,
  disulfide, metal, free thiol.
- Sort default: metal count descending.

Term changes from internal site:
- "Unclassified" column → "Free thiol".
- Add a "Has PDB rep?" boolean column for filtering candidate-novel
  families.

### 6. H-group browser (`/h-group`)

NEW. Mirrors Fig 5A,B and gives readers a way to find the "novel
cysteine-chemistry H-groups" the paper highlights.

- 4×4 confusion-matrix heatmap (structurally-known × ESM2-predicted
  bins: <5%, 5–50%, 50–95%, ≥95%) for disulfide and metal
  separately.
- Cell click → list of H-groups in that cell, ranked by ESM2
  predicted fraction.
- Highlighted "low known, high predicted" cells with the candidate
  novel H-groups (12 disulfide / 3 metal per the paper) link
  directly to H-group detail pages.

### 7. H-group detail (`/h-group/[hGroupId]`)

For 3380.1, 804.1, 3991.1 (Fig 5C–E), this page must show the
PDB-source representative on the left and the AFDB-source
representative on the right, with ESM2-predicted metal-binding
cysteines (magenta) and sub-threshold cysteines (grey) marked,
exactly as in Fig 5C–E. Other H-groups get the same template.

- Header: H-group name + ID + parent X-group / hierarchy
  breadcrumb.
- Stat cards: # F70 reps in this H-group (PDB / AFDB), counts of
  domains with metal/disulfide annotation, ESM2 predicted fractions.
- Side-by-side molecular viewer (NGL.js or Mol*) for the two
  representatives, with the cysteine cartoon highlighted.
- Domain table: all F70 reps in this H-group with classification
  badges.

### 8. Family detail (`/family/[fGroupId]`)

Existing functionality, retained:
- Hierarchy breadcrumb (A → X → H → T → F).
- Stat cards with classification breakdown.
- Classification pie chart (Free thiol / Dis / Met).
- Paginated domain table.

Add (matching the paper):
- "Kingdom mix" mini-bar at the top showing the Euk / Bac / Arc
  composition of this F-group's F70 reps.

### 9. Domain detail (`/domain/[domainId]`)

Existing functionality, retained:
- Header: domain ID, source type, PDB / UniProt links, family
  breadcrumb.
- Sequence viewer with cysteines colored by classification.
  - **Color scheme:** disulfide red, metal-binding green, free thiol
    grey. Match these colors in all bar charts site-wide.
  - Hover / click: position, classification, P(Neg) / P(Dis) /
    P(Met), structural-evidence tags.
- Evidence panels (collapsible):
  - ESM2 per-Cys probability table.
  - Geometric Sγ-Sγ disulfides.
  - PDB SSBOND records.
  - PDB Metal LINK records (with cofactor column: SF4 / FES / HEM
    / etc.).
- "Cite this domain" snippet (suggested attribution).

### 10. Search (`/search?q=...` and via header bar)

Existing functionality, retained. Match scope:
- ECOD domain ID (`e*` pattern).
- PDB ID (4-char) and chain.
- F-group / H-group / X-group dotted notation.
- UniProt accession (with redirect to first matching domain).

### 11. Downloads & API (`/downloads`)

NEW, central to the deposition value:

- **Per-cysteine TSV** (canonical full dump): `domain_id`,
  `cys_position`, `classification` (Free / Dis / Met), `p_neg`,
  `p_dis`, `p_met`, `evidence_tags`, `f_group_id`, `h_group_id`,
  `x_group_id`, `source_type`. Generated nightly; SHA-256 published.
- **Per-domain summary TSV.**
- **Per-H-group aggregates** (one row per H-group with the data
  underlying Figure 3C and Figure 5A,B).
- **Figure data CSVs** matching the paper's `paper/figure_data/`
  set, one CSV per main and supplementary figure.
- **Predictor code** link (`cys3state` repo) and model weights link.
- **REST API** (read-only):
  - `GET /api/domain/{domainId}` — per-cysteine predictions for one
    domain.
  - `GET /api/family/{fGroupId}` — aggregate stats and domain list.
  - `GET /api/hgroup/{hGroupId}` — same at H-group level.
  - `GET /api/search?q=...` — same as UI search.
  - JSON only. Documented on this page.

The Downloads page is what the paper's "Software and data
availability" section will point at; both must be linked
bidirectionally (paper DOI on this page, this URL in the paper
Methods).

### 12. Paper (`/paper`)

NEW. A short page that links figure-by-figure to the corresponding
TriCyp surfaces, matches paper figure captions, and contains the full
citation block. Designed for someone reading the PDF who wants to
check a specific figure interactively.

---

## Removed / out-of-scope

The following pages and features are present in the internal site
(`SPEC.md`, `INSIGHTS_SPEC.md`) but are not in TriCyp scope:

- **`/site-types`** — the internal "site type taxonomy" (zinc fingers
  vs Fe-S vs heme-thiolate hand-curated mapping per T-group). This
  was internal exploration work; the paper does not categorize
  metal sites this way (intentionally — see paper Discussion §"What
  the metal-binding class identifies"). Drop entirely.
- **`/validation/cofactors`** with the LMetalSite cross-reactivity
  three-category FP decomposition (annotation gaps / Fe-S
  cross-reactivity / catalytic Cys, ~40/15/45%). Pre-rebalance
  diagnostic; ESM2 now scores Fe directly and the decomposition is
  no longer the framing the paper uses.
- **`/expansion`** Coverage-expansion analysis ("predictions expand
  metal-binding to 4× more families"). The paper makes this point
  through Fig 5 H-group analysis instead — fold this into the
  H-group browser story rather than reproducing the old
  group-coverage-counts framing.
- **Old benchmark numbers** in `SPEC.md` ("Tool / Task / AUROC / AP"
  table with iron-only AUROC 0.841 / 0.905 / etc.) — these are stale
  pre-rebalance numbers. Replace with the published numbers from
  paper Fig 2 + Fig S1.
- **mebipred / ZincSight / consensus-pipeline content** from
  `NEXTJS_PAGE_SPEC.md`. The paper uses ESM2-only; mebipred was
  excluded; ZincSight is cited as background but not as a
  classifier. The DB tables (`mebipred_predictions`, `zinc_sites`,
  `lmetalsite_hits`, `gpsite_hits`) remain on disk for
  reproducibility but are not surfaced in the UI.

---

## Terminology normalization (apply throughout codebase)

The paper standardizes on **"free thiol"** for the third class. The
internal site has at least four variants (`negative`, `negative/reduced`,
`unclassified`, `Free`). These need to be normalized:

- UI labels: "Free thiol" everywhere a class is named in user-facing
  text.
- Code-level enum: keep `UNCLASSIFIED` in the DB if changing it is
  cost-prohibitive, but every UI rendering of `UNCLASSIFIED` →
  "Free thiol".
- API responses: use the canonical strings `disulfide`,
  `metal_binding`, `free_thiol` in JSON. Document the legacy
  internal value (`UNCLASSIFIED`) in the API doc only.
- Three-letter codes (`Neg` / `Dis` / `Met`) appear only in TSV
  downloads, evidence-string parsing, and tooltips listing
  probabilities (where space matters). Never as a primary label.

---

## Database changes

Minimal. The current schema (`ecod_commons`, `cys_classification`,
`ecod_rep`) supports everything above. Two small adjustments:

1. **Materialize H-group aggregates** as a view or table:
   `cys_classification.hgroup_summary` with the columns from
   `paper/figure_data/hgroup_pdb_afdb_summary.tsv`. The H-group
   browser query is expensive; materialize once per data refresh.

2. **Subcellular-localization table.** Currently lives as a TSV in
   `data/uniprot_subcellular_location.tsv`; load into
   `cys_classification.uniprot_subcellular` (cols: uniprot_acc,
   compartment) so the dashboard panel D query joins cleanly.

Existing tables are sufficient for everything else.

---

## Performance and caching

The current code uses an in-memory cache with TTL. Retain that
pattern. The expensive queries are the H-group confusion matrix and
the dashboard aggregates; both are static between data refreshes
(weekly at most), so cache TTL of 24 h is acceptable.

Materialize as DB views where queries cost > 5 s on warm cache:

- Dashboard counts (currently fast).
- Source-type breakdown (currently fast).
- H-group summary (slow — materialize).
- Subcellular localization (medium — materialize).

---

## Hosting and deployment

Same as the existing internal site (Next.js on the lab server, fronted
by whatever ECOD's existing reverse-proxy setup uses), but at a public
URL. URL pattern: `tricyp.swmed.edu` or
`prodata.swmed.edu/tricyp` — pick one and stick with it; the paper's
data-availability section needs to commit to a stable URL.

---

## Out-of-band: Zenodo

The Downloads page links must include a Zenodo deposition with:

- The full per-cysteine TSV (versioned).
- The five model weight files (`best_modelA.pth` … `best_modelE.pth`).
- The predictor source (`cys3state`) snapshotted at paper-publication
  commit.
- The 26 figure-data CSVs from `paper/figure_data/`.
- A README that mirrors the paper's "Software and data availability"
  Methods subsection.

The Zenodo DOI is what the paper cites; TriCyp is the interactive
browser layered on top of the same data.

---

## Implementation order

1. **Terminology normalization** sweep across `src/` (mostly a
   find-replace from "Unclassified" / "negative" → "Free thiol", and
   colour palette unification: red disulfide, green metal, grey free
   thiol).
2. **Dashboard rebuild** to mirror Fig 3 panels A–D exactly. This is
   the biggest visible change.
3. **Drop superseded pages** (`/site-types`, `/validation/cofactors`,
   `/expansion`) and update navigation. Keep the queries on disk,
   delete the routes.
4. **Benchmark page** with current Fig 2 + Fig S1 numbers.
5. **AlphaFold geometric scanning page** with Fig 4 panels.
6. **H-group browser + H-group detail** pages (NEW; needs the
   materialized `hgroup_summary` view).
7. **Downloads / API** page with TSV generation and REST endpoints.
8. **Paper page** with figure-to-surface map.
9. **Zenodo deposition** in parallel with site launch.

---

## Open questions

- **URL.** Confirm `tricyp.swmed.edu` vs `prodata.swmed.edu/tricyp`
  before paper submission; the URL goes in the manuscript.
- **API rate-limiting.** Public REST API needs a basic rate limit
  (e.g., 100 req/min/IP). Tooling choice is open.
- **Citation tracking.** Worth adding a UMAMI / Plausible-style
  privacy-respecting analytics so we can report usage in any future
  grant or paper revisions.
- **Versioning.** The data on TriCyp may change as ECOD F70 updates.
  Decide whether the public site tracks the current ECOD release or
  pins to the paper-version snapshot. Recommend pinning the paper
  release as `v1` and offering a separate "current ECOD" toggle
  later.
