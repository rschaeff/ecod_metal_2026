# Spec: ECOD Cysteine Classification Browser

## Project Context

Collaboration between the Schaeffer and Cong labs to classify cysteine
residues across the ECOD protein domain universe. The ESM2 3-state
classifier (Cong lab) classifies each cysteine as **disulfide-bonded**,
**metal-binding**, or **negative/reduced** based on fine-tuned ESM2-650M
embeddings. Applied to 691,078 F70 representative domains containing
2,706,778 cysteines.

### Classification Pipeline

1. Extract per-residue ESM2-650M embeddings from domain sequences
2. Classify cysteine positions with 5-model ensemble (1280 → 256 → 3)
3. Argmax of averaged softmax probabilities → class assignment
4. Structural evidence (PDB SSBOND, LINK records, geometric Sγ-Sγ scan) recorded as corroboration

### Key Results

| Metric | Value |
|--------|-------|
| Domains classified | 691,078 |
| Total cysteines | 2,706,778 |
| Disulfide | 648,708 (24.0%) |
| Metal-binding | 211,623 (7.8%) |
| Negative/reduced | 1,846,447 (68.2%) |

Benchmark on b2 dataset (166K Cys, 48K proteins):

| Tool | Task | AUROC | AP |
|------|------|-------|----|
| ESM2 3-state | Metal | 0.979 | 0.621 |
| LMetalSite | Metal | 0.894 | 0.138 |
| GPSite | Metal | 0.841 | 0.069 |
| ESM2 3-state | Disulfide | 0.987 | 0.969 |
| SSBONDPredict | Disulfide | 0.975 | 0.938 |

---

## Database

PostgreSQL on `dione:45000`, database `ecod_protein`, user `ecod`.

### Schema: `ecod_commons` (ECOD core)

Key tables:
- `domains` — id (PK), domain_id (string), ecod_uid, protein_id, sequence_length
- `domain_sequences` — domain_id (FK), sequence
- `proteins` — id, source_id, source_type, pdb_id, chain_id, uniprot_acc
- `f_group_assignments` — domain_id (FK), f_group_id, t_group_id, h_group_id, x_group_id, a_group_id
- `domain_clusters` — domain_id, clustering_run_id, is_representative
- `clustering_runs` — id, parameter_set_id (2 = F70)
- `domain_summary` — ecod_uid, source_type, f_group_id, etc.
- `protein_taxonomy` — source_id, superkingdom, kingdom, phylum, etc.

### Schema: `ecod_rep` (ECOD hierarchy names)

- `cluster` — id (text, e.g. "131.1.1"), type (enum: X/H/T/F), name, parent, pfam_acc

### Schema: `cys_classification` (our results)

```sql
-- Per-cysteine classification (2.7M rows)
cysteine_classifications (
    id              SERIAL PRIMARY KEY,
    domain_id       INTEGER REFERENCES ecod_commons.domains(id),
    cys_position    INTEGER,
    classification  VARCHAR,    -- DISULFIDE | METAL_BINDING | UNCLASSIFIED
    confidence      REAL,       -- max class probability
    evidence        TEXT        -- semicolon-separated evidence tags
)

-- Per-domain summary (691K rows)
domain_summary (
    domain_id       INTEGER PRIMARY KEY,
    total_cys       INTEGER,
    n_disulfide     INTEGER,
    n_metal_binding INTEGER,
    n_unclassified  INTEGER
)

-- Structural evidence (PDB domains only)
geometric_disulfides (domain_id, chain1, resnum1, chain2, resnum2, sg_sg_distance)
pdb_ssbonds (domain_id, pdb_id, chain1, resnum1, chain2, resnum2, both_in_domain)
pdb_metal_links (domain_id, pdb_id, metal, metal_chain, metal_resnum,
                 coord_resname, coord_chain, coord_resnum, coord_atom, cofactor)
```

### F70 representative query pattern

```sql
-- Standard CTE for F70 reps with cysteine
WITH f70 AS (
    SELECT d.id AS domain_id, d.domain_id AS domain_name
    FROM ecod_commons.domain_clusters dc
    JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
    JOIN ecod_commons.domains d ON dc.domain_id = d.id
    WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
)
```

### Hierarchy name lookup pattern

```sql
LEFT JOIN ecod_rep.cluster xg ON fga.x_group_id = xg.id AND xg.type = 'X'
LEFT JOIN ecod_rep.cluster fg ON fga.f_group_id = fg.id AND fg.type = 'F'
```

---

## Application Architecture

Next.js 16 app with Tailwind CSS, recharts for charts, pg for direct
PostgreSQL queries. No ORM. Server components for data fetching, client
components for interactivity.

### Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- recharts 2
- pg 8 (node-postgres)
- vitest

### Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Dashboard
│   ├── layout.tsx                    # Root layout with header/footer
│   ├── api/                          # API routes
│   │   ├── summary/route.ts
│   │   ├── search/route.ts
│   │   ├── domain/[domainId]/route.ts
│   │   └── family/[fGroupId]/route.ts
│   ├── domain/[domainId]/            # Domain detail page
│   ├── family/                       # Family browser + detail
│   │   ├── page.tsx                  # Family list (sortable table)
│   │   └── [fGroupId]/              # Family detail
│   ├── expansion/                    # Coverage expansion analysis
│   ├── site-types/                   # Metal site type taxonomy
│   └── validation/                   # Ground truth comparison
│       ├── cofactors/               # Cofactor analysis
│       └── cross-domain/            # Cross-domain disulfides
├── components/
│   ├── charts/                       # ClassificationPieChart, FamilyStackedBar
│   ├── layout/                       # Header, Footer
│   ├── sequence/                     # SequenceViewer
│   ├── providers/                    # ThemeProvider
│   └── ui/                          # ClassificationBadge, SearchBar, StatCard, etc.
├── lib/
│   ├── db.ts                        # PostgreSQL connection pool + query helpers
│   ├── cache.ts                     # In-memory cache with TTL
│   ├── queries.ts                   # Core data queries (dashboard, family, domain, search)
│   └── analysisQueries.ts           # Analysis page queries (validation, expansion, etc.)
└── types/
    └── cysteine.ts                  # TypeScript interfaces
```

---

## Pages

### 1. Dashboard (`/`)

Summary statistics and top-level overview.

**Content:**
- Stat cards: total domains, total cysteines, counts by classification
- Method stats table: ESM2, geometric SS, PDB SSBOND, PDB Metal LINK — records and domain counts
- X-group breakdown: top 20 X-groups by metal-binding fraction (stacked bar)
- Source breakdown: PDB vs AFDB domain counts

**Data:** `getDashboardSummary()`, `getMethodStats()`, `getXGroupBreakdown()`

### 2. Family Browser (`/family`)

Paginated, sortable table of all F-groups with classification aggregates.

**Columns:** F-group ID, Name, X-group, Domains, Total Cys, Disulfide, Metal, Unclassified
**Sort by:** any column, default by metal count descending
**Pagination:** 50 per page

**Data:** `getFamilyList(page, limit, sortBy, sortDir)`

### 3. Family Detail (`/family/[fGroupId]`)

Per-family view with hierarchy context and domain listing.

**Content:**
- Header: F-group name, hierarchy breadcrumb (A → X → H → T → F)
- Stat cards: domain count, total Cys, classification breakdown
- Classification pie chart
- Paginated domain table: domain ID, source type, Cys counts by class

**Data:** `getFamilyInfo(fGroupId)`, `getFamilyDomains(fGroupId, page)`

### 4. Domain Detail (`/domain/[domainId]`)

Per-domain view with sequence viewer and evidence panels.

**Content:**
- Header: domain ID, source type, PDB link, family breadcrumb
- Sequence viewer: full sequence with cysteines colored by classification
  - DISULFIDE = red, METAL_BINDING = green, UNCLASSIFIED = grey
  - Hover/click shows position, classification, confidence, evidence
- Evidence panels (collapsible):
  - ESM2 predictions: per-Cys probability table (Neg/Dis/Met)
  - Geometric disulfides: Sγ-Sγ distances
  - PDB SSBOND records
  - PDB Metal LINK records (with cofactor column)

**Data:** `getDomainDetail(domainId)`, `getDomainClassifications(dbId)`, `getDomainEvidence(dbId)`

### 5. Search

Global search bar in header. Matches:
- Domain IDs (prefix match on `e*` pattern)
- PDB IDs (4-char match)
- F-group IDs (dotted notation like `131.1.1.0`)

Returns typed results linking to domain or family detail pages.

**Data:** `searchQuery(q)`

### 6. Validation Dashboard (`/validation`)

Ground truth comparison: how well do predictions agree with PDB structural evidence?

**Content:**
- Two panels: disulfide concordance (geometric vs PDB SSBOND) and metal concordance (ESM2 vs PDB LINK)
- Summary stat cards: sensitivity, precision
- T-group concordance table: sortable, color-coded by performance
- Metal concordance toggle: free ions only vs free ions + cofactors

**Data:** `getDisulfideConcordance()`, `getMetalConcordance(includeCofactors)`

### 7. Cross-Domain Disulfides (`/validation/cross-domain`)

Analysis of SSBOND records that span domain boundaries.

**Content:**
- Summary: total SSBONDs, intradomain vs cross-domain counts
- Stacked bar chart: top X-groups by cross-domain count
- Table: X-groups ranked by % cross-domain

**Data:** `getCrossDomainDisulfides()`

### 8. Cofactor Analysis (`/validation/cofactors`)

Metal coordination through cofactors vs free ions.

**Content:**
- Pie chart: free ion vs cofactor LINK records
- Cofactor detail table: SF4, FES, F3S, HEM, etc.

**Data:** `getCofactorBreakdown()`

### 9. Expansion Analysis (`/expansion`)

How much do ESM2 predictions expand classification beyond PDB ground truth?

**Content:**
- Grouped bar chart: truth vs predicted counts at X/T/F-group levels
- PDB vs AFDB prediction rate concordance table

**Data:** `getExpansionStats()`, `getPdbVsAfdbRates()`

### 10. Site Type Browser (`/site-types`)

Metal site type taxonomy grouping T-groups by coordination chemistry.

**Content:**
- Expandable tree: Zinc (structural/catalytic), Iron-sulfur ([4Fe-4S]/[2Fe-2S]), Heme-thiolate, etc.
- Detail panel on click: T-groups in category, domain counts

**Data:** `getSiteTypeMapping()`

---

## Superseded Specs

The following specs are superseded by this document:
- `NEXTJS_PAGE_SPEC.md` — original spec from multi-tool consensus era (mebipred, LMetalSite, ZincSight priority rules). The classification pipeline now uses ESM2 as sole classifier.
- `INSIGHTS_SPEC.md` — analysis pages spec, partially updated. Queries referencing `lmetalsite_hits`, `zinc_sites`, `mebipred_predictions` as primary classifiers are obsolete. These tables still exist in the DB for reproducibility but are not used for classification.

### Key schema changes from old specs

- `esm2_predictions` table was never created in the DB; ESM2 predictions were loaded directly from TSV into `cysteine_classifications` via `integrate_results_esm2.py`
- `cysteine_classifications.evidence` field contains ESM2 probabilities and structural corroboration tags
- `cysteine_classifications.confidence` is the max ESM2 class probability
- Old tool tables (`mebipred_predictions`, `lmetalsite_hits`, `gpsite_hits`, `gpsite_overview`, `zinc_sites`, `zinc_site_residues`) remain in the schema but are not queried by the current application except for benchmark comparison

### Code status

The existing code in `src/lib/queries.ts` and `src/lib/analysisQueries.ts` is largely correct for the current DB state. Key points:
- `queries.ts` uses `cysteine_classifications` and `domain_summary` — correct
- `analysisQueries.ts` metal concordance uses `esm2_predictions` — this table doesn't exist; should query from `cysteine_classifications` where `classification = 'METAL_BINDING'` instead
- `getMethodStats()` gracefully handles missing `esm2_predictions` table — can be simplified since we now have `cysteine_classifications`
- Dashboard and family pages work correctly against current data
- The expansion and PDB-vs-AFDB queries in `analysisQueries.ts` reference `esm2_predictions` — need update to use `cysteine_classifications`

---

## Implementation Priorities

### Must fix (queries broken against current DB)
1. `getMetalConcordance()` — replace `esm2_predictions` reference with `cysteine_classifications`
2. `getExpansionStats()` — same
3. `getPdbVsAfdbRates()` — same
4. `getMethodStats()` — simplify, remove try/catch for missing esm2_predictions

### Should update
5. Dashboard — add ESM2 confidence distribution summary
6. Domain detail — show ESM2 probabilities from evidence string (parsed) rather than separate table
7. Family detail — add site-type badge from PDB metal LINK data

### Nice to have
8. Add subcellular localization panel (data in `data/uniprot_subcellular_location.tsv`, not yet in DB)
9. Add superkingdom breakdown to family/X-group views
10. Add confidence threshold filter to classification views
