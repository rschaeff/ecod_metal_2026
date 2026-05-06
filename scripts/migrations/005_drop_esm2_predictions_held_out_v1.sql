-- Migration 005: drop cys_classification.esm2_predictions_held_out_v1
--
-- The held-out v1 inference table is no longer cited from any analysis,
-- display, or download surface (commits ea2a7d8 + ccf08d4). The
-- authoritative per-class probabilities for the published call set are
-- inlined in cys_classification.cysteine_classifications.evidence as
-- 'esm2_neg:X;esm2_dis:Y;esm2_met:Z'.
--
-- Idempotent: IF EXISTS guards make a re-run a no-op.

\set ON_ERROR_STOP on

BEGIN;

-- Echo the row count first so the migration log carries the size of
-- what's being dropped (no SELECT FROM the table after the drop).
\echo 'Dropping cys_classification.esm2_predictions_held_out_v1; pre-drop row count:'
SELECT count(*) AS rows_about_to_drop
  FROM cys_classification.esm2_predictions_held_out_v1;

DROP TABLE IF EXISTS cys_classification.esm2_predictions_held_out_v1;

COMMIT;
