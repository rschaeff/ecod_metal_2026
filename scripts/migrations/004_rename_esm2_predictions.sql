-- Migration 004: rename cys_classification.esm2_predictions
-- → cys_classification.esm2_predictions_held_out_v1
--
-- The original table holds per-cysteine probabilities from an earlier /
-- different ESM2 inference run whose values disagree with the published
-- classifications in cys_classification.cysteine_classifications. The
-- authoritative per-class probs are inlined in
-- cysteine_classifications.evidence as 'esm2_neg:X;esm2_dis:Y;esm2_met:Z'
-- (or 'no_esm2'). Renaming makes the semantics of this older table
-- explicit: it is the held-out v1 inference run and is no longer cited
-- by the website's domain pages. The analysisQueries module still uses
-- it for argmax-based "predicted-metal" coverage stats.
--
-- Indexes auto-follow the table rename in PostgreSQL but the index
-- names are still tied to the old base name; we rename them
-- individually so dropping/replacing the table later doesn't leave
-- mismatched index names.

\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE cys_classification.esm2_predictions
  RENAME TO esm2_predictions_held_out_v1;

ALTER INDEX cys_classification.esm2_predictions_pkey
  RENAME TO esm2_predictions_held_out_v1_pkey;
ALTER INDEX cys_classification.idx_esm2_domain
  RENAME TO idx_esm2_held_out_v1_domain;
ALTER INDEX cys_classification.idx_esm2_met
  RENAME TO idx_esm2_held_out_v1_met;

COMMENT ON TABLE cys_classification.esm2_predictions_held_out_v1 IS
  'Per-cysteine ESM2 3-state probabilities from the held-out v1 '
  'inference run. Disagrees with the published classifications in '
  'cys_classification.cysteine_classifications, whose authoritative '
  'per-class probabilities live inline in the evidence column '
  'as ''esm2_neg:X;esm2_dis:Y;esm2_met:Z''. Retained for argmax-based '
  'coverage analysis (src/lib/analysisQueries.ts) but no longer '
  'cited by the domain detail page or the bulk TSV download.';

COMMIT;
