-- Migration 007: cys_classification.cysteine_classifications.heme_thioether
--
-- c-type heme attachment cysteines (CX(n)CH, n = 2-4) are covalently bonded to the heme by a thioether, not
-- coordinated to its iron. The three-state model has no class for them and calls them disulfide or metal.
-- This column flags them so the site can show them as their own display class (src/lib/displayClass.ts).
-- `classification` is NOT changed: every aggregate keeps the model call and still matches the manuscript.
--
-- Values: 'CX2CH' | 'CX3CH' | 'CX4CH' (the motif) or NULL.
-- Source: scripts/data/heme_thioether_flags.tsv (domain_id, cys_position, motif), exported from the
-- ECOD-side catalogue (revision/task_relabel/heme_flags.py): motif cysteines in the 9 H-groups where PDB
-- geometry shows such cysteines are heme thioethers (2-fold CV over PDB entries: precision 94.1%, recall 95.3%).
--
-- Usage: psql -f scripts/migrations/007_heme_thioether.sql < scripts/data/heme_thioether_flags.tsv
--        (the flag file is read from psql's stdin; psql does not expand variables inside \copy)
-- Re-runnable: clears and reloads the column inside one transaction; aborts (no change) unless every staged
-- row maps to exactly one cysteine row of the adopted run whose sequence position is a C.

\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE cys_classification.cysteine_classifications
  ADD COLUMN IF NOT EXISTS heme_thioether text;
ALTER TABLE cys_classification.cysteine_classifications
  DROP CONSTRAINT IF EXISTS cysteine_classifications_heme_thioether_check;
ALTER TABLE cys_classification.cysteine_classifications
  ADD CONSTRAINT cysteine_classifications_heme_thioether_check
  CHECK (heme_thioether IS NULL OR heme_thioether IN ('CX2CH', 'CX3CH', 'CX4CH'));

CREATE TEMP TABLE heme_stage (domain_id text, cys_position int, motif text) ON COMMIT DROP;
\copy heme_stage FROM pstdin WITH (FORMAT csv, DELIMITER E'\t', HEADER true)

CREATE TEMP TABLE heme_match ON COMMIT DROP AS
SELECT s.domain_id AS ecod_id, s.cys_position, s.motif, cc.id AS cc_id,
       substr(ds.sequence, s.cys_position, 1) AS residue
  FROM heme_stage s
  JOIN ecod_commons.domains d ON d.domain_id = s.domain_id
  JOIN cys_classification.esm2_run_domains rd ON rd.domain_id = d.id AND rd.run_id = 3  -- v3-2026-11 (adopted; same 691,078 domains as runs 1-2)
  JOIN cys_classification.cysteine_classifications cc
       ON cc.domain_id = d.id AND cc.cys_position = s.cys_position
  LEFT JOIN ecod_commons.domain_sequences ds ON ds.domain_id = d.id;

DO $$
DECLARE n_stage int; n_match int; n_dup int; n_notc int;
BEGIN
  SELECT count(*) INTO n_stage FROM heme_stage;
  SELECT count(DISTINCT (ecod_id, cys_position)) INTO n_match FROM heme_match;
  SELECT count(*) - count(DISTINCT (ecod_id, cys_position)) INTO n_dup FROM heme_match;
  SELECT count(*) INTO n_notc FROM heme_match WHERE residue IS DISTINCT FROM 'C';
  RAISE NOTICE 'heme_thioether: staged %, matched %, duplicate matches %, not a C %', n_stage, n_match, n_dup, n_notc;
  IF n_stage = 0 OR n_match <> n_stage OR n_dup <> 0 OR n_notc <> 0 THEN
    RAISE EXCEPTION 'heme_thioether load aborted (staged %, matched %, duplicates %, not C %)', n_stage, n_match, n_dup, n_notc;
  END IF;
END $$;

UPDATE cys_classification.cysteine_classifications SET heme_thioether = NULL WHERE heme_thioether IS NOT NULL;
UPDATE cys_classification.cysteine_classifications cc
   SET heme_thioether = m.motif
  FROM heme_match m
 WHERE cc.id = m.cc_id;

DO $$
DECLARE n_set int; n_stage int;
BEGIN
  SELECT count(*) INTO n_set FROM cys_classification.cysteine_classifications WHERE heme_thioether IS NOT NULL;
  SELECT count(*) INTO n_stage FROM heme_stage;
  IF n_set <> n_stage THEN
    RAISE EXCEPTION 'heme_thioether: % rows set, % staged', n_set, n_stage;
  END IF;
  RAISE NOTICE 'heme_thioether: % cysteines flagged', n_set;
END $$;

COMMIT;
