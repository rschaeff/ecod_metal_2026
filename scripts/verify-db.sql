-- DB contract verifier. Each block emits a single row in the form
--   (label TEXT, status TEXT, detail TEXT)
-- where status is one of 'PASS', 'FAIL', 'MISSING'. The bash wrapper
-- (scripts/verify-db.sh) collects the results and exits non-zero when
-- anything is not PASS.
--
-- Maintain alongside DB_CONTRACT.md: when a new requirement is added to
-- the contract, add a check here.

\set ON_ERROR_STOP on
\pset format unaligned
\pset fieldsep '|'
\pset tuples_only on

-- Aggregate results into a temp table so the wrapper can sort + colour-code.
-- NB: psql runs in autocommit mode by default, so `ON COMMIT DROP` would
-- destroy the table before the next INSERT. The table is session-scoped
-- (psql disconnects when this file finishes) so explicit cleanup is not
-- required.
CREATE TEMP TABLE verify_results (
  label  text NOT NULL,
  status text NOT NULL,  -- 'PASS' | 'FAIL' | 'MISSING'
  detail text
);

-- ---------- §1 schemas ----------
INSERT INTO verify_results
SELECT
  'schema:' || s,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN 'PASS' ELSE 'MISSING' END,
  NULL
FROM unnest(ARRAY['ecod_commons','ecod_rep','cys_classification']) AS s;

-- ---------- §2 required tables ----------
WITH required AS (
  SELECT * FROM (VALUES
    ('ecod_commons','domains'),
    ('ecod_commons','proteins'),
    ('ecod_commons','protein_taxonomy'),
    ('ecod_commons','f_group_assignments'),
    ('ecod_commons','domain_clusters'),
    ('ecod_commons','clustering_runs'),
    ('ecod_commons','domain_sequences'),
    ('ecod_rep','cluster'),
    ('cys_classification','cysteine_classifications'),
    ('cys_classification','domain_summary'),
    ('cys_classification','geometric_disulfides'),
    ('cys_classification','pdb_ssbonds'),
    ('cys_classification','pdb_metal_links'),
    ('cys_classification','esm2_runs'),
    ('cys_classification','esm2_run_domains')
  ) AS t(schema, name)
)
INSERT INTO verify_results
SELECT 'table:' || schema || '.' || name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = schema AND table_name = name
       ) THEN 'PASS' ELSE 'MISSING' END,
       NULL
FROM required;

-- ---------- §2 required columns (sampled — focus on the load-bearing ones) ----------
WITH required_cols AS (
  SELECT * FROM (VALUES
    ('ecod_commons','domains','id'),
    ('ecod_commons','domains','domain_id'),
    ('ecod_commons','domains','range_definition'),
    ('ecod_commons','domains','protein_id'),
    ('ecod_commons','proteins','source_type'),
    ('ecod_commons','proteins','pdb_id'),
    ('ecod_commons','proteins','chain_id'),
    ('ecod_commons','proteins','uniprot_acc'),
    ('ecod_commons','protein_taxonomy','superkingdom'),
    ('ecod_commons','f_group_assignments','f_group_id'),
    ('ecod_commons','f_group_assignments','t_group_id'),
    ('ecod_commons','f_group_assignments','h_group_id'),
    ('ecod_commons','f_group_assignments','x_group_id'),
    ('ecod_commons','domain_clusters','is_representative'),
    ('ecod_commons','clustering_runs','parameter_set_id'),
    ('ecod_commons','domain_sequences','sequence'),
    ('ecod_rep','cluster','type'),
    ('ecod_rep','cluster','name'),
    ('cys_classification','cysteine_classifications','classification'),
    ('cys_classification','cysteine_classifications','confidence'),
    ('cys_classification','cysteine_classifications','evidence'),
    ('cys_classification','domain_summary','total_cys'),
    ('cys_classification','domain_summary','n_disulfide'),
    ('cys_classification','domain_summary','n_metal_binding'),
    ('cys_classification','domain_summary','n_unclassified'),
    ('cys_classification','geometric_disulfides','sg_sg_distance'),
    ('cys_classification','pdb_ssbonds','both_in_domain'),
    ('cys_classification','pdb_metal_links','metal'),
    ('cys_classification','pdb_metal_links','cofactor'),
    ('cys_classification','esm2_runs','run_label'),
    ('cys_classification','esm2_runs','model_card'),
    ('cys_classification','esm2_runs','thresholds'),
    ('cys_classification','esm2_runs','domain_count'),
    ('cys_classification','esm2_run_domains','run_id'),
    ('cys_classification','esm2_run_domains','domain_id')
  ) AS t(schema, name, col)
)
INSERT INTO verify_results
SELECT 'column:' || schema || '.' || name || '.' || col,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = schema AND table_name = name AND column_name = col
       ) THEN 'PASS' ELSE 'MISSING' END,
       NULL
FROM required_cols;

-- ---------- §2.5 F70-rep filter sanity ----------
INSERT INTO verify_results
SELECT 'data:F70-rep-domains',
       CASE
         WHEN c > 0 THEN 'PASS'
         ELSE 'FAIL'
       END,
       'count = ' || c
FROM (
  SELECT count(*)::bigint AS c
  FROM ecod_commons.domain_clusters dc
  JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
  WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
) q;

-- ---------- §2.8 classification vocabulary ----------
INSERT INTO verify_results
SELECT 'data:classification-values',
       CASE WHEN array_length(values_array, 1) IS NOT NULL
              AND values_array <@ ARRAY['DISULFIDE','METAL_BINDING','UNCLASSIFIED']
            THEN 'PASS' ELSE 'FAIL' END,
       'observed = ' || array_to_string(values_array, ',')
FROM (
  -- classification is varchar(20) on this DB; cast to text[] so the <@
  -- containment check below has matching operand types.
  SELECT array_agg(DISTINCT classification::text ORDER BY classification::text)
           AS values_array
  FROM cys_classification.cysteine_classifications
) q;

-- ---------- §2.9 domain_summary agreement with cysteine_classifications ----------
INSERT INTO verify_results
SELECT 'data:domain_summary-vs-classifications',
       CASE WHEN mismatched = 0 THEN 'PASS' ELSE 'FAIL' END,
       mismatched || ' domain(s) with disagreeing totals'
FROM (
  SELECT count(*) AS mismatched
  FROM (
    SELECT ds.domain_id,
           ds.total_cys,
           (SELECT count(*) FROM cys_classification.cysteine_classifications cc
            WHERE cc.domain_id = ds.domain_id) AS live_total
    FROM cys_classification.domain_summary ds
  ) joined
  WHERE total_cys IS DISTINCT FROM live_total
) q;

-- ---------- §2.12 esm2_runs: paper-v1 exists and domain_count matches ----------
INSERT INTO verify_results
SELECT 'data:esm2_runs-paper-v1',
       CASE
         WHEN r.id IS NULL THEN 'MISSING'
         WHEN r.domain_count IS DISTINCT FROM live_count THEN 'FAIL'
         ELSE 'PASS'
       END,
       CASE
         WHEN r.id IS NULL THEN 'no row with run_label = paper-v1'
         ELSE 'header.domain_count=' || r.domain_count ||
              ', membership=' || live_count
       END
FROM (SELECT 1 AS pin) p
LEFT JOIN cys_classification.esm2_runs r ON r.run_label = 'paper-v1'
LEFT JOIN LATERAL (
  SELECT count(*) AS live_count
    FROM cys_classification.esm2_run_domains
   WHERE run_id = r.id
) c ON TRUE;

-- ---------- §3.1 esm2_predictions_held_out_v1: held-out v1 inference ----------
-- Authoritative per-cysteine probabilities live in
-- cysteine_classifications.evidence; this table is the older held-out
-- v1 inference whose values disagree with the published classifications.
-- Kept around for argmax-based coverage analysis (analysisQueries.ts).
INSERT INTO verify_results
SELECT 'table:cys_classification.esm2_predictions_held_out_v1',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'cys_classification' AND table_name = 'esm2_predictions_held_out_v1'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'held-out v1 ESM2 inference; not cited from the domain detail page';

-- Probability sum sanity (only when the table exists).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'cys_classification' AND table_name = 'esm2_predictions_held_out_v1') THEN
    INSERT INTO verify_results
    SELECT 'data:esm2_predictions_held_out_v1-sum-to-one',
           CASE WHEN bad = 0 THEN 'PASS' ELSE 'FAIL' END,
           bad || ' row(s) where neg+dis+met deviates from 1.0 by > 0.01'
    FROM (
      SELECT count(*) AS bad
      FROM cys_classification.esm2_predictions_held_out_v1
      WHERE abs(neg_prob + dis_prob + met_prob - 1.0) > 0.01
    ) q;
  END IF;
END $$;

-- ---------- §4 missing-piece checks ----------
INSERT INTO verify_results
SELECT 'view:cys_classification.hgroup_summary',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'cys_classification' AND table_name = 'hgroup_summary'
       ) OR EXISTS (
         SELECT 1 FROM pg_matviews
         WHERE schemaname = 'cys_classification' AND matviewname = 'hgroup_summary'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'materialise per DB_CONTRACT §4.1 to switch /h-group off the live scan';

INSERT INTO verify_results
SELECT 'table:cys_classification.uniprot_subcellular',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'cys_classification' AND table_name = 'uniprot_subcellular'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'load from data/uniprot_subcellular_location.tsv per DB_CONTRACT §4.2';

-- ---------- §5.1 evidence_class column (open semantic question) ----------
INSERT INTO verify_results
SELECT 'column:cys_classification.cysteine_classifications.evidence_class',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'cys_classification'
           AND table_name = 'cysteine_classifications'
           AND column_name = 'evidence_class'
       ) THEN 'PASS' ELSE 'MISSING' END,
       'recommended fix for the H-group provenance question (DB_CONTRACT §5.1)';

-- ---------- Emit rows for the wrapper ----------
SELECT label || '|' || status || '|' || COALESCE(detail, '')
FROM verify_results
ORDER BY
  CASE status WHEN 'FAIL' THEN 0 WHEN 'MISSING' THEN 1 ELSE 2 END,
  label;
