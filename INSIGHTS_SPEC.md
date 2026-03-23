# Spec: Analytical Insights Pages

## Context

The existing site has a solid browsing layer: dashboard stats, family browser, domain detail with sequence viewer. What it lacks is the analytical story — the findings from comparing ground truth vs predictions, the site-type taxonomy, the cross-domain disulfide patterns, and the family-level expansion analysis. These are the insights that make this a paper, not just a database.

## Database

Same as existing: PostgreSQL on `dione:45000`, database `ecod_protein`, schemas `ecod_commons`, `cys_classification`, `ecod_rep`.

Since the last spec, two schema changes:
- `pdb_metal_links` now has a `cofactor VARCHAR(4)` column (NULL for free ions, 'SF4'/'FES'/'HEM'/etc. for cofactor-bound metals)
- `gpsite_hits` and `gpsite_overview` tables added (same pattern as lmetalsite_hits)

## New Pages

### 1. Validation Dashboard (`/validation`)

The core question: how well do predictions agree with experimental ground truth?

**Layout:** Two main sections side by side (disulfide left, metal-binding right), each with summary stats at top and a concordance table below.

**Disulfide concordance panel:**
- Top stat cards: PDB SSBOND count, Geometric detection count, Agreement count, Sensitivity %, Precision %
- Table below: by T-group, columns: T-group ID, Name, # SSBOND, # Geometric, Sensitivity, Precision
  - Sortable by any column
  - Only show T-groups with ≥5 domains having either annotation
  - Color-code sensitivity/precision cells (green >90%, amber 70-90%, red <70%)

**Metal-binding concordance panel:**
- Top stat cards: same pattern but PDB LINK (Cys-metal) vs LMetalSite (ZN on Cys)
- Important: show both "free ions only" and "free ions + cofactors" numbers
- Small toggle or tabs to switch between the two ground truth definitions
- Table below: by T-group, same pattern

**Key queries:**
```sql
-- Disulfide concordance by T-group
WITH pdb_domains AS (
    SELECT DISTINCT d.id as domain_id, fa.t_group_id
    FROM ecod_commons.domains d
    JOIN ecod_commons.proteins p ON d.protein_id = p.id
    JOIN ecod_commons.f_group_assignments fa ON fa.domain_id = d.id
    JOIN ecod_commons.domain_clusters dc ON dc.domain_id = d.id
    JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
    WHERE p.source_type = 'pdb' AND cr.parameter_set_id = 2 AND dc.is_representative = TRUE
),
ss_truth AS (SELECT DISTINCT domain_id FROM cys_classification.pdb_ssbonds WHERE both_in_domain),
ss_pred AS (SELECT DISTINCT domain_id FROM cys_classification.geometric_disulfides)
SELECT pd.t_group_id, c.name,
       count(DISTINCT pd.domain_id) FILTER (WHERE st.domain_id IS NOT NULL) as n_ssbond,
       count(DISTINCT pd.domain_id) FILTER (WHERE sp.domain_id IS NOT NULL) as n_geom,
       count(DISTINCT pd.domain_id) FILTER (WHERE st.domain_id IS NOT NULL AND sp.domain_id IS NOT NULL) as n_both,
       count(DISTINCT pd.domain_id) FILTER (WHERE st.domain_id IS NOT NULL AND sp.domain_id IS NULL) as fn,
       count(DISTINCT pd.domain_id) FILTER (WHERE st.domain_id IS NULL AND sp.domain_id IS NOT NULL) as fp
FROM pdb_domains pd
LEFT JOIN ss_truth st ON pd.domain_id = st.domain_id
LEFT JOIN ss_pred sp ON pd.domain_id = sp.domain_id
LEFT JOIN ecod_rep.cluster c ON c.id = pd.t_group_id AND c.type = 'T'
GROUP BY pd.t_group_id, c.name
HAVING count(DISTINCT pd.domain_id) FILTER (WHERE st.domain_id IS NOT NULL OR sp.domain_id IS NOT NULL) >= 5
ORDER BY n_ssbond DESC;
```

---

### 2. Site Type Browser (`/site-types`)

A navigational taxonomy that groups ECOD families by the type of Cys-metal coordination.

**Layout:** Expandable tree/accordion on the left, detail panel on the right.

**Tree structure:**
```
Metal-Coordinating
├── Zinc (free ion) — 207 T-groups
│   ├── Structural zinc (zinc fingers, RING, LIM, PHD...)
│   ├── Catalytic zinc (ADH, carbonic anhydrase...)
│   └── Regulatory zinc
├── Iron-sulfur clusters
│   ├── [4Fe-4S] — 44 T-groups
│   ├── [2Fe-2S] — 17 T-groups
│   └── [3Fe-4S] — 2 T-groups
├── Heme-thiolate
│   ├── P450-type
│   └── Heme C (covalent)
├── Copper — 1 T-group
├── Nickel — 4 T-groups
└── Other metals

Disulfide Bonds
├── Intradomain structural
├── Interdomain
└── Interchain
```

**Clicking a site type** shows:
- Description of the coordination chemistry
- List of T-groups in this category with domain counts
- Distribution chart: how many domains in each T-group have this site type
- Link to family browser filtered to these T-groups

**Data source:** The site-type-to-T-group mapping is derived from:
```sql
-- Dominant Cys-metal site type per T-group
WITH ranked AS (
    SELECT fa.t_group_id, ml.metal, ml.cofactor,
           count(*) as n,
           ROW_NUMBER() OVER (PARTITION BY fa.t_group_id ORDER BY count(*) DESC) as rn
    FROM cys_classification.pdb_metal_links ml
    JOIN ecod_commons.f_group_assignments fa ON ml.domain_id = fa.domain_id
    WHERE ml.coord_resname = 'CYS'
    GROUP BY fa.t_group_id, ml.metal, ml.cofactor
)
SELECT t_group_id, metal, cofactor, n
FROM ranked WHERE rn = 1 AND n >= 3;
```

This could be a static lookup table loaded at build time (280 T-groups), or a DB view.

---

### 3. Cross-Domain Disulfide Analysis (`/validation/cross-domain`)

Or as a tab/section within the validation page.

**Content:**
- Summary stat cards: Total SSBONDs, Intradomain count (78%), Cross-domain count (22%)
- Stacked bar chart: top 15 X-groups by cross-domain SS count, each bar split into intra vs cross
- Table: X-groups ranked by % cross-domain, columns: X-group, Name, Intra, Cross, % Cross, Domains
- Explanatory text block about why cross-domain SSBONDs exist and which families are enriched:
  - Immunoglobulins (inter-chain SS in antibodies)
  - EGF-like (tandem repeat linkages)
  - Cystine-knot cytokines
  - GPCRs (extracellular loop SS)

**Key queries:**
```sql
SELECT c.id as x_group_id, c.name,
       count(*) FILTER (WHERE ss.both_in_domain = TRUE) as intra,
       count(*) FILTER (WHERE ss.both_in_domain = FALSE) as cross_domain,
       count(DISTINCT ss.domain_id) as n_domains
FROM cys_classification.pdb_ssbonds ss
JOIN ecod_commons.f_group_assignments fa ON ss.domain_id = fa.domain_id
JOIN ecod_rep.cluster c ON c.id = fa.x_group_id AND c.type = 'X'
GROUP BY c.id, c.name
HAVING count(*) >= 10
ORDER BY count(*) FILTER (WHERE ss.both_in_domain = FALSE) DESC;
```

---

### 4. Expansion Analysis (`/expansion`)

The key paper figure: how much do computational predictions expand Cys annotation beyond PDB ground truth?

**Top section — Coverage expansion summary:**

Three paired bars (or grouped bar chart) showing ground truth vs predicted counts at X-group, T-group, and F-group levels. Each pair: left bar = PDB ground truth groups, right bar = computationally predicted groups.

| Level | Disulfide (truth → pred) | Metal (truth → pred) |
|-------|--------------------------|---------------------|
| X-group | 507 → 1,060 (+109%) | 262 → 1,067 (+307%) |
| T-group | 768 → 1,777 (+131%) | 376 → 1,728 (+360%) |
| F-group | 2,023 → 9,003 (+345%) | 852 → 7,624 (+795%) |

**Middle section — New family triage:**

Table of T-groups with predictions but no PDB ground truth, categorized by confidence:

- **High confidence** (known Fe-S, validated by literature): green badge
- **Likely false positive** (known catalytic Cys): red badge
- **Ambiguous** (needs investigation): amber badge

Columns: T-group, Name, # Predicted domains, % Predicted, # PDB domains, Confidence category

Users can click a T-group to go to the family browser.

**Bottom section — PDB vs AFDB concordance:**

Table showing prediction rates for key families across PDB vs AFDB sources. This validates that predictions generalize to AlphaFold structures.

| T-group | Name | PDB % pred | AFDB % pred |
|---------|------|------------|-------------|
| 386.1.1 | Zinc fingers | 98.9% | 97.1% |
| 375.1.1 | Rubredoxin | 95.5% | 94.6% |
| ... | ... | ... | ... |

**Key queries:**
```sql
-- Group coverage expansion
SELECT 'truth' as source, count(DISTINCT fa.t_group_id) as n_tgroups
FROM cys_classification.pdb_metal_links ml
JOIN ecod_commons.f_group_assignments fa ON ml.domain_id = fa.domain_id
WHERE ml.coord_resname = 'CYS'
UNION ALL
SELECT 'predicted', count(DISTINCT fa.t_group_id)
FROM cys_classification.lmetalsite_hits lm
JOIN ecod_commons.f_group_assignments fa ON lm.domain_id = fa.domain_id
WHERE lm.residue = 'C' AND lm.metal = 'ZN';

-- PDB vs AFDB prediction rates by family
SELECT fa.t_group_id, c.name, p.source_type,
       count(DISTINCT d.id) as n_domains,
       count(DISTINCT d.id) FILTER (WHERE lm.domain_id IS NOT NULL) as n_predicted
FROM ecod_commons.domain_clusters dc
JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
JOIN ecod_commons.domains d ON dc.domain_id = d.id
JOIN ecod_commons.proteins p ON d.protein_id = p.id
JOIN ecod_commons.f_group_assignments fa ON fa.domain_id = d.id
JOIN ecod_commons.domain_sequences ds ON d.id = ds.domain_id
LEFT JOIN ecod_rep.cluster c ON c.id = fa.t_group_id AND c.type = 'T'
LEFT JOIN (SELECT DISTINCT domain_id FROM cys_classification.lmetalsite_hits
           WHERE residue = 'C' AND metal = 'ZN') lm ON d.id = lm.domain_id
WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
  AND ds.sequence LIKE '%C%'
GROUP BY fa.t_group_id, c.name, p.source_type;
```

---

### 5. Cofactor Analysis (`/validation/cofactors`)

Or as a tab within the validation page. Shows the cofactor-mediated metal coordination data.

**Content:**
- Summary: Free ion vs cofactor LINK record breakdown (pie chart)
- Cofactor table: SF4, FES, F3S, HEM, HEC, CUA — total bonds, Cys-coordinated bonds, # domains
- LMetalSite cross-reactivity section: "72% of Fe-S cluster domains are predicted as ZN-binding by LMetalSite"
  - Small bar chart: Fe-S domains predicted as ZN (72%), MN (23%), none (28%)
  - Explanatory text about why this happens (LMetalSite lacks Fe category)
- Three-category decomposition of apparent false positives:
  - Annotation gaps in zinc-binding families (~40%)
  - Fe-S cross-reactivity (~15%)
  - Genuine FP on catalytic Cys (~45%)

---

## Updates to Existing Pages

### Dashboard (`/`)

Add a "Key Findings" section below the current stats, with 3-4 clickable insight cards:

1. **"95% sensitivity for disulfide detection"** → links to /validation
2. **"Predictions expand metal-binding to 4x more families"** → links to /expansion
3. **"22% of PDB disulfides are cross-domain"** → links to /validation/cross-domain
4. **"Fe-S clusters account for 15% of apparent false positives"** → links to /validation/cofactors

### Domain Detail (`/domain/[domainId]`)

- Add cofactor column to PDB Metal Coordination evidence panel (show SF4/FES/HEM when present)
- Add GPSite evidence panel when data is available (same pattern as LMetalSite panel)
- Add site-type badge in the header if the domain's T-group has a known site type mapping (e.g., "Zinc finger" or "[4Fe-4S] cluster")

### Family Detail (`/family/[fGroupId]`)

- Add a site-type badge/label if the family maps to a known site type
- Add "validation status" indicator: does this family have PDB ground truth, or is it prediction-only?
- If PDB ground truth exists, show mini concordance stats (sensitivity/precision for this family)

---

## Navigation

Add a top-level nav item "Analysis" with dropdown:
- Validation (ground truth comparison)
- Site Types (taxonomy browser)
- Expansion (coverage beyond PDB)

The existing "Browse Families" and search remain as-is.

---

## Implementation Notes

- The validation and expansion queries are expensive (full joins across large tables). Use the existing cache layer with 30-60 min TTLs. Consider materializing the key aggregations as DB views.
- The site-type taxonomy is essentially static (280 T-groups mapped from PDB data). Could be a JSON file loaded at build time rather than a live query.
- The three-category FP decomposition (annotation gaps / Fe-S cross-reactivity / catalytic Cys) requires a curated lookup table. We have this in `results/ground_truth_vs_predictions_analysis.md` — needs to be formalized as either a DB table or a static config.
- Charts: recharts is already in the project. The stacked bars for cross-domain SS and the grouped bars for expansion analysis are straightforward extensions of existing chart components.

## Data Dependencies

All queries work with the current DB contents. GPSite data will be loaded when the run completes — the domain detail page should gracefully handle its absence (the existing pattern already handles missing ZincSight data this way).
