-- Migration 003: cys_classification.esm2_runs + esm2_run_domains
--
-- Records the F70-representative input scope of each ESM2-3state inference
-- run. Decoupled from ecod_commons.domain_clusters because the live F70 set
-- drifts with each ECOD update, and the published dataset must reference a
-- frozen snapshot of the domains that the model was actually applied to.
--
-- Header table also captures the per-run model card and operating
-- thresholds so the published call set can be reproduced from the
-- per-cysteine probabilities. Per-cys probs that match the published
-- classifications live inline in cysteine_classifications.evidence as
-- 'esm2_neg:X;esm2_dis:Y;esm2_met:Z'; see migrations 004 (rename of
-- esm2_predictions → esm2_predictions_held_out_v1) and 005 (drop) for
-- the older inconsistent inference table that's no longer present.
--
-- Bootstrap policy: the paper-v1 run is populated from the union of
-- domains that produced any classification artifact (domain_summary ∪
-- cysteine_classifications). Cysteine-free F70 reps that were in the
-- original ESM2 input list produce no output rows in any current table
-- and are therefore NOT yet captured here — they need to be backfilled
-- from the inference input manifest when it is recovered.

\set ON_ERROR_STOP on

BEGIN;

CREATE TABLE IF NOT EXISTS cys_classification.esm2_runs (
  id               int   PRIMARY KEY,
  run_label        text  UNIQUE NOT NULL,
  description      text,
  model_card       text,
  -- Operating thresholds applied to the per-cysteine probabilities to
  -- produce the published 3-state calls. Keep in sync with
  -- src/lib/paperData.ts BENCHMARK_THRESHOLDS.
  thresholds       jsonb,
  parameter_set_id int   REFERENCES ecod_commons.clustering_parameters(id),
  -- Free-form ECOD release pin for traceability when the F70 set
  -- happens to align with a release; null when the run pre-dates a
  -- tagged release (paper-v1 is null until the manuscript is bound to
  -- a specific release).
  ecod_version     text,
  domain_count     int,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cys_classification.esm2_run_domains (
  run_id     int NOT NULL
             REFERENCES cys_classification.esm2_runs(id) ON DELETE CASCADE,
  domain_id  int NOT NULL
             REFERENCES ecod_commons.domains(id),
  PRIMARY KEY (run_id, domain_id)
);

CREATE INDEX IF NOT EXISTS esm2_run_domains_domain_idx
  ON cys_classification.esm2_run_domains (domain_id);

COMMENT ON TABLE cys_classification.esm2_runs IS
  'Header rows for each ESM2-3state inference run. One row per logical '
  'model invocation; the membership of each run is in esm2_run_domains. '
  'Decouples the published dataset scope from ecod_commons.domain_clusters '
  'which drifts with ECOD updates.';

COMMENT ON TABLE cys_classification.esm2_run_domains IS
  'F70-rep membership for each ESM2 run. paper-v1 is currently partial — '
  'cys-free F70 reps in the original input list are not yet captured.';

-- Bootstrap paper-v1.
INSERT INTO cys_classification.esm2_runs
  (id, run_label, description, model_card, thresholds, parameter_set_id, ecod_version)
VALUES (
  1,
  'paper-v1',
  'F70-representative scope used by the manuscript publication. Initial '
  'population is partial: only cys-bearing domains are recorded. Cys-free '
  'F70 reps from the original inference input list must be backfilled '
  'from that manifest when it is recovered.',
  'ESM2-t33-650M-UR50D + 3-state classification head (free-thiol / disulfide / metal-binding)',
  '{"disulfide": 0.742, "metal_binding": 0.972}'::jsonb,
  2,
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cys_classification.esm2_run_domains (run_id, domain_id)
SELECT 1, ds.domain_id
  FROM cys_classification.domain_summary ds
ON CONFLICT DO NOTHING;

UPDATE cys_classification.esm2_runs
   SET domain_count = (
     SELECT count(*) FROM cys_classification.esm2_run_domains WHERE run_id = 1
   )
 WHERE id = 1;

COMMIT;
