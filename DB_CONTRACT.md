# TriCyp database contract

The frontend in this repo reads a fixed set of tables, columns, and join
relationships from a Postgres instance. This document is the **single source of
truth** for what that backend must provide. Anything not listed here is not
load-bearing for TriCyp pages.

Two consumers should keep this contract in mind:
- **Backend / DB authors**: a fresh database that satisfies §§1–4 makes every
  page render. §5 describes the open semantic questions that need a single
  authoritative answer before the H-group browser numbers can be cited
  against the manuscript.
- **Frontend authors**: when adding a new query in `src/lib/queries.ts`,
  list the columns you read here and update §6 (verifier) so the new
  requirement is checked at deploy time.

When this document and `src/lib/queries.ts` disagree, the queries win and
this document is stale; submit a PR. Run `scripts/verify-db.sh` against any
new schema build to confirm everything declared here resolves.

---

## 1. Schemas

The frontend assumes three Postgres schemas:

| Schema | Purpose |
| --- | --- |
| `ecod_commons` | Domains, proteins, F70 representative clustering, hierarchy assignments, taxonomy. Shared with the rest of the ECOD ecosystem. |
| `ecod_rep` | Cluster name lookup (X / H / T / F levels). Read-only from TriCyp. |
| `cys_classification` | Per-cysteine classifications, per-domain summaries, structural-evidence streams, predictor outputs. The TriCyp-specific schema. |

---

## 2. Required tables (already exist or assumed)

### 2.1 `ecod_commons.domains`

| Column | Type | Read by | Notes |
| --- | --- | --- | --- |
| `id` | `bigint` | every domain query | Numeric primary key joined into `cys_classification` and `domain_clusters`. |
| `domain_id` | `text` | domain detail, search, family list | ECOD identifier (`e3h35A1`). Indexed; ILIKE-prefix query in search. |
| `range_definition` | `text` | domain detail, structure viewer | One or more `<chain>:<start>-<end>` segments, comma-separated. Drives `parseRangeDefinition` in `src/lib/structurePositions.ts`. |
| `protein_id` | `bigint` | every domain query | FK to `ecod_commons.proteins`. |

### 2.2 `ecod_commons.proteins`

| Column | Type | Read by | Notes |
| --- | --- | --- | --- |
| `id` | `bigint` | join target | Primary key. |
| `source_type` | `text` | dashboard, every aggregate | One of: `'pdb'`, `'afdb'`, `'prodigal'`, `'uniparc'`. The frontend treats `'pdb'` as the structurally-evidenced source and the other three as predicted-source. |
| `pdb_id` | `text \| null` | structure viewer, search | 4-character lowercase PDB code; null for non-PDB sources. |
| `chain_id` | `text \| null` | structure viewer | Single author chain id (e.g. `'A'`); null for non-PDB sources. |
| `uniprot_acc` | `text \| null` | structure viewer (AFDB), search | UniProt accession; drives the `https://alphafold.ebi.ac.uk/files/AF-{acc}-F1-model_v6.cif` URL. |
| `source_id` | `bigint` | taxonomy join | Composite FK to `protein_taxonomy(source_id, source_type)`. |

### 2.3 `ecod_commons.protein_taxonomy`

| Column | Type | Notes |
| --- | --- | --- |
| `source_id` | `bigint` | FK target (with `source_type`). |
| `source_type` | `text` | Same vocabulary as `proteins.source_type`. |
| `superkingdom` | `text \| null` | One of `'Eukaryota'`, `'Bacteria'`, `'Archaea'`, `'Viruses'` (or null/empty when unknown — those rows are filtered out). The kingdom drill-down on `/family?kingdom=` matches verbatim. |

### 2.4 `ecod_commons.f_group_assignments`

| Column | Type | Notes |
| --- | --- | --- |
| `domain_id` | `bigint` | FK to `domains.id`. One row per domain. |
| `f_group_id` | `text` | Dotted notation (`131.1.1.0`). |
| `t_group_id` | `text` | Dotted notation. |
| `h_group_id` | `text` | Dotted notation (`3380.1`). |
| `x_group_id` | `text` | Dotted notation (`3380` or `131`). |

### 2.5 `ecod_commons.domain_clusters` and `ecod_commons.clustering_runs`

The F70-rep filter that gates almost every aggregate:

```sql
JOIN ecod_commons.domain_clusters  dc ON d.id = dc.domain_id
JOIN ecod_commons.clustering_runs  cr ON dc.clustering_run_id = cr.id
WHERE cr.parameter_set_id = 2
  AND dc.is_representative = TRUE
```

Required columns: `domain_clusters.domain_id`, `domain_clusters.clustering_run_id`,
`domain_clusters.is_representative` (`bool`); `clustering_runs.id`,
`clustering_runs.parameter_set_id` (`int`; F70 is `2`).

### 2.6 `ecod_commons.domain_sequences`

| Column | Type | Notes |
| --- | --- | --- |
| `domain_id` | `bigint` | FK to `domains.id`. |
| `sequence` | `text` | 1-letter amino-acid sequence. The SequenceViewer reads this verbatim. |

### 2.7 `ecod_rep.cluster`

Read-only name lookup. Required columns:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` | Cast to text in joins (`c.id::text = fa.x_group_id`). |
| `type` | `text` | One of `'X'`, `'H'`, `'T'`, `'F'`. |
| `name` | `text \| null` | Human-readable cluster name. Falls back to the dotted id when null. |

### 2.8 `cys_classification.cysteine_classifications`

The canonical per-cysteine row. **One row per classified cysteine** across
all F70 representative domains.

| Column | Type | Read by | Notes |
| --- | --- | --- | --- |
| `id` | `bigint` | domain detail | Primary key. |
| `domain_id` | `bigint` | every cysteine query | FK to `domains.id`. |
| `cys_position` | `int` | every cysteine query | 1-indexed position within `domain_sequences.sequence`. |
| `classification` | `text` | every aggregate, dashboard, H-group browser | One of `'DISULFIDE'`, `'METAL_BINDING'`, `'UNCLASSIFIED'`. **See §5.1 for the open semantic question on PDB-source rows.** |
| `confidence` | `numeric` | confidence histogram, domain detail | Max-class probability used for histogramming on the dashboard. |
| `evidence` | `text` | domain detail tooltip | Free-form tag string (e.g. `"SSBOND"`, `"METAL_LINK:ZN"`, `"ESM2-Met"`). Surfaced verbatim in the SequenceViewer tooltip. |

### 2.9 `cys_classification.domain_summary`

Per-domain rollup of `cysteine_classifications`. **One row per F70 rep**.

| Column | Type | Read by |
| --- | --- | --- |
| `domain_id` | `bigint` | every per-domain aggregate |
| `total_cys` | `int` | all rollups |
| `n_disulfide` | `int` | all rollups |
| `n_metal_binding` | `int` | all rollups |
| `n_unclassified` | `int` | all rollups |

The frontend never recomputes these on the fly — they must agree with
`cysteine_classifications` row counts per `domain_id`.

### 2.10 `cys_classification.geometric_disulfides`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` | Primary key. |
| `domain_id` | `bigint` | FK to `domains.id`. |
| `chain1`, `chain2` | `text` | Author chain ids. |
| `resnum1`, `resnum2` | `int` | Author residue numbers. |
| `sg_sg_distance` | `numeric` | Sγ–Sγ distance in Å. |

### 2.11 `cys_classification.pdb_ssbonds`

PDB SSBOND records. Schema mirrors `geometric_disulfides` plus:

| Column | Type | Notes |
| --- | --- | --- |
| `pdb_id` | `text` | Source PDB code. |
| `both_in_domain` | `bool` | True iff both endpoints fall inside the domain's `range_definition`. |

### 2.12 `cys_classification.esm2_runs` and `esm2_run_domains`

Records the F70-representative input scope of each ESM2-3state inference
run. Decoupled from `ecod_commons.domain_clusters` because the live F70 set
drifts with each ECOD update; the published dataset must reference a frozen
snapshot of the domains that the model was actually applied to. The
manuscript scope is `run_label = 'paper-v1'` (domain_count = 691,078, which
agrees with `PAPER_TOTALS.domains` in `src/lib/paperData.ts`). 3,275 of
those domains are no longer in the live F70 rep set, so any "manuscript
reproducibility" query MUST filter on `esm2_run_domains.run_id` instead of
joining to live `domain_clusters` + `clustering_runs`.

`esm2_runs`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `int` | Primary key. |
| `run_label` | `text` | Unique. `'paper-v1'` for the manuscript scope. |
| `description` | `text` | Free-form provenance. |
| `model_card` | `text` | Model + head identifier (`'ESM2-t33-650M-UR50D + 3-state head'`). |
| `thresholds` | `jsonb` | `{disulfide, metal_binding}`; mirrors `BENCHMARK_THRESHOLDS`. |
| `parameter_set_id` | `int \| null` | FK to `clustering_parameters` (F70 = 2). |
| `ecod_version` | `text \| null` | Free-form ECOD release pin when available. |
| `domain_count` | `int` | Cached count of `esm2_run_domains` rows for this run. |
| `created_at` | `timestamptz` | Insertion time. |

`esm2_run_domains`:

| Column | Type | Notes |
| --- | --- | --- |
| `run_id` | `int` | FK to `esm2_runs.id`, ON DELETE CASCADE. |
| `domain_id` | `int` | FK to `ecod_commons.domains.id`. |

Composite PK `(run_id, domain_id)`; secondary index on `domain_id` for the
"is this domain in scope?" check.

**Open issue**: cys-free F70 reps in the original ESM2 input list are not
yet captured (they have no row in `domain_summary` to bootstrap from).
Backfill from the inference input manifest when it is recovered.

### 2.13 `cys_classification.pdb_metal_links`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `bigint` | Primary key. |
| `domain_id` | `bigint` | FK to `domains.id`. |
| `pdb_id` | `text` | |
| `metal` | `text` | Element symbol (`'ZN'`, `'FE'`, `'CA'`, …). |
| `metal_chain`, `metal_resnum` | `text`, `int` | Coordinates of the metal ion. |
| `coord_resname` | `text` | Coordinating residue 3-letter code (always `'CYS'` for the rows TriCyp surfaces). |
| `coord_chain`, `coord_resnum` | `text`, `int` | Coordinating residue position. |
| `coord_atom` | `text` | Always `'SG'` for cysteine coordinations. |
| `cofactor` | `text \| null` | 3-letter cofactor code (`'SF4'`, `'FES'`, `'HEM'`, …) when the metal is part of a cofactor; null for free ions. |

---

## 3. Per-cysteine ESM2 probabilities

### 3.1 Authoritative source — `cysteine_classifications.evidence`

The per-cysteine ESM2 3-state probabilities for the **published**
classifications are stored inline on
`cys_classification.cysteine_classifications.evidence` as a single
string of the form `'esm2_neg:X;esm2_dis:Y;esm2_met:Z'` (or
`'no_esm2'` for structural-evidence-only calls). They always match
the `classification` column by construction.

The domain page (`getDomainEvidence` in `src/lib/queries.ts`) parses
the evidence string for each cysteine; the bulk per-cysteine TSV
(`scripts/dump-tsv.sql`) extracts the three probabilities via
`regexp_match` over the same column.

There is no separate per-class probability table. An older
`cys_classification.esm2_predictions` table (renamed to
`esm2_predictions_held_out_v1` in migration 004 and dropped in
migration 005) held probabilities from an earlier inference run that
disagreed with the published classifications; it was producing
sub-threshold `met_prob` values under `METAL_BINDING` badges on the
domain page before the page switched to evidence-string parsing.

---

## 4. Tables that **don't exist yet** and must be created

### 4.1 `cys_classification.hgroup_summary` (materialized view)

Backs the H-group browser confusion matrix. **Currently computed live** on
every cold cache hit by `getHGroupSummary()` (an expensive scan); the spec
calls for a materialized view.

Proposed columns (mirror `getHGroupSummary` output):

```sql
CREATE MATERIALIZED VIEW cys_classification.hgroup_summary AS
SELECT
  fa.h_group_id,
  COALESCE(hc.name, fa.h_group_id)           AS h_group_name,
  fa.x_group_id,
  COALESCE(xc.name, fa.x_group_id)           AS x_group_name,
  count(DISTINCT d.id) FILTER (WHERE p.source_type = 'pdb')   AS n_pdb_reps,
  count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')  AS n_afdb_reps,
  COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type = 'pdb'), 0)   AS pdb_total_cys,
  COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type <> 'pdb'), 0)  AS afdb_total_cys,
  COALESCE(sum(ds.n_disulfide)     FILTER (WHERE p.source_type = 'pdb'), 0)   AS pdb_n_disulfide,
  COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type = 'pdb'), 0)   AS pdb_n_metal,
  COALESCE(sum(ds.n_disulfide)     FILTER (WHERE p.source_type <> 'pdb'), 0)  AS afdb_n_disulfide,
  COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb'), 0)  AS afdb_n_metal
FROM cys_classification.domain_summary ds
JOIN ecod_commons.domains              d  ON ds.domain_id = d.id
JOIN ecod_commons.proteins             p  ON d.protein_id = p.id
JOIN ecod_commons.f_group_assignments  fa ON ds.domain_id = fa.domain_id
JOIN ecod_commons.domain_clusters      dc ON d.id = dc.domain_id
JOIN ecod_commons.clustering_runs      cr ON dc.clustering_run_id = cr.id
LEFT JOIN ecod_rep.cluster hc  ON fa.h_group_id = hc.id::text AND hc.type = 'H'
LEFT JOIN ecod_rep.cluster xc  ON fa.x_group_id = xc.id::text AND xc.type = 'X'
WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
GROUP BY fa.h_group_id, hc.name, fa.x_group_id, xc.name
HAVING count(DISTINCT d.id) >= 1;

CREATE INDEX hgroup_summary_x_group_idx ON cys_classification.hgroup_summary (x_group_id);
```

Refresh cadence: after any data load. `getHGroupSummary()` should be
swap­able to `SELECT * FROM cys_classification.hgroup_summary` — the column
names are aligned.

### 4.2 `cys_classification.uniprot_subcellular`

Backs Fig 3D (subcellular gradient panel). Currently the dashboard panel
renders paper-frozen constants from `src/lib/paperData.ts`; once the table
exists the panel can switch to live data.

```sql
CREATE TABLE cys_classification.uniprot_subcellular (
  uniprot_acc text NOT NULL,
  compartment text NOT NULL,           -- 'Extracellular' | 'Plasma membrane' | …
  PRIMARY KEY (uniprot_acc, compartment)
);
CREATE INDEX uniprot_subcellular_compartment_idx
  ON cys_classification.uniprot_subcellular (compartment);
```

Source: `data/uniprot_subcellular_location.tsv` (already in the repo per
the spec). Compartment vocabulary should match the labels used in `FIG_3D`
constants.

### 4.3 Source-stratification view for Fig 3A

Fig 3A breaks classifications into PDB-geom (geometric ground truth),
PDB-ESM (PDB-source ESM2 calls), and AFDB-ESM (AFDB-source ESM2 calls).
Today the dashboard renders paper constants. A live materialized view
would let the panel switch to live numbers.

The right partition depends on §5.1 below — once the classification
provenance question has an answer, the view definition is straightforward.

---

## 5. Open semantic questions

### 5.1 `cysteine_classifications.classification` provenance on PDB-source rows

**The question.** For a row with a PDB-source `domain_id`, does
`classification` reflect (a) the structural ground truth alone (geometric
SS / SSBOND / metal LINK), (b) the ESM2-3state prediction alone, or (c) a
merge of the two?

**Why it matters.** The H-group browser confusion matrix
(`/h-group`, paper Fig 5A,B) treats PDB-source rows as the
"structurally-known" axis and AFDB-source rows as the "ESM2-predicted" axis.
If PDB-source `classification` is option (b) or (c), the matrix conflates
ground truth with prediction and the manuscript headline (12 disulfide / 3
metal candidate-novel cells) won't reproduce verbatim.

**Recommended resolution.** Add an `evidence_class` column to
`cysteine_classifications` carrying the structural-evidence-only call
(`'STRUCT_DIS'`, `'STRUCT_MET'`, `'STRUCT_NEG'`, or `null` when no
structural evidence exists for that cysteine). Keep `classification` as
the published call. Frontend then uses `evidence_class` for the
"structurally-known" axis on PDB-source rows.

If the resolution is option (a) — `classification` already reflects
ground-truth-only on PDB-source — confirm and document here so the
frontend's existing assumption is explicit.

### 5.2 `evidence` tag vocabulary

The SequenceViewer renders `evidence` verbatim in the tooltip. Until the
vocabulary is locked the page may show inconsistent strings. Recommended:
pipe-delimited tags from a fixed set (`SSBOND`, `GEOMETRIC_SS`,
`METAL_LINK:<element>`, `METAL_LINK_COFACTOR:<code>`, `ESM2-Dis`,
`ESM2-Met`, `ESM2-Neg`).

### 5.3 Insertion-code residue numbers in `range_definition`

`parseRangeDefinition` accepts digits-only residue numbers
(regex `^([A-Za-z0-9]+):(-?\d+)-(-?\d+)$`). If the source data contains
PDB-style insertion codes (`A:100A-100B`), those ranges silently fail to
parse and the page shows the domain without highlights. Either: forbid
insertion codes upstream, or extend the parser. The contract should pick
one and stick to it.

---

## 6. Verification

`scripts/verify-db.sh` runs `scripts/verify-db.sql` against the DB
specified by `PG_CONN` (defaults to libpq env vars) and emits one row
per contract requirement with PASS / FAIL / MISSING status. It is
intended to run:

- after every schema migration
- nightly via cron alongside `scripts/dump-tsv.sh`
- in CI before deploying the frontend

The script returns non-zero when anything is missing or mismatched, so
it works as a deployment gate.

---

## 7. Change log

| Date (UTC) | Change |
| --- | --- |
| 2026-05-05 | Initial contract drafted from `src/lib/queries.ts` HEAD `436d5b2`. |
| 2026-05-05 | Migrations `scripts/migrations/001_hgroup_summary.sql` and `002_uniprot_subcellular.sql` create §4.1 MV (3352 H-groups, 5 ms cached read) and §4.2 empty table. `getHGroupSummary()` is ready to swap to `SELECT * FROM cys_classification.hgroup_summary` — frontend swap is the next step. `uniprot_subcellular` ETL still pending. |
| 2026-05-06 | Migration `scripts/migrations/003_esm2_runs.sql` adds `esm2_runs` + `esm2_run_domains` (§2.12). Bootstrap `paper-v1` row and 691,078 domain memberships; 3,275 of those have already drifted out of the live F70 rep set. |
| 2026-05-06 | Migration `scripts/migrations/004_rename_esm2_predictions.sql` renames `cys_classification.esm2_predictions` → `esm2_predictions_held_out_v1`. Authoritative per-cys probabilities live inline in `cysteine_classifications.evidence` (§3.1); the held-out v1 table disagreed with the published classifications and was producing sub-threshold probabilities under METAL_BINDING / DISULFIDE badges on the domain page. |
| 2026-05-06 | Migration `scripts/migrations/005_drop_esm2_predictions_held_out_v1.sql` drops the held-out v1 table after `getMethodStats` and the four `analysisQueries.ts` argmax queries switched to the published `cysteine_classifications.classification` source (commit `ccf08d4`). 2,644,610 rows dropped. §3 collapsed to the single `evidence`-string source. |
