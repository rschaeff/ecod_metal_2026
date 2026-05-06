-- Migration 006: cys_classification.cysteine_classifications.evidence_class
-- + cys_classification.hgroup_summary_struct (sibling MV)
--
-- Resolves the §5.1 open semantic question. cysteine_classifications
-- .classification is the ESM2-3state thresholded call regardless of
-- whether structural ground truth exists for the cysteine — we
-- verified empirically that 376 PDB-source cysteines with both PDB
-- SSBOND records and geometric disulfide bonds are still UNCLASSIFIED
-- because ESM2 fell short of the threshold. The H-group browser
-- caption ("structurally-known × ESM2-predicted") therefore can't be
-- reproduced from the existing column.
--
-- This migration adds an evidence_class column to carry the
-- structural-evidence-only call:
--   STRUCT_DIS  cys appears in pdb_ssbonds(both_in_domain=TRUE) or
--               geometric_disulfides
--   STRUCT_MET  cys appears in pdb_metal_links with coord_resname='CYS'
--   STRUCT_NEG  PDB-source domain, none of the above (structure was
--               examined and shows free thiol)
--   NULL        AFDB / EPP / UniParc — no structural ground truth
--
-- When both STRUCT_DIS and STRUCT_MET signals are present for the
-- same cysteine (rare), STRUCT_DIS wins (covalent disulfide is the
-- unambiguous post-translational state; cysteine-mediated metal
-- coordination doesn't change residue identity).
--
-- The migration is read-only at the page level: it does NOT touch the
-- existing hgroup_summary MV or any frontend query. A sibling MV
-- (hgroup_summary_struct) is built so a side-by-side old-vs-new
-- diff of Fig 5A/B can be computed before the page is flipped over.

\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE cys_classification.cysteine_classifications
  ADD COLUMN IF NOT EXISTS evidence_class text;

ALTER TABLE cys_classification.cysteine_classifications
  DROP CONSTRAINT IF EXISTS cysteine_classifications_evidence_class_check;
ALTER TABLE cys_classification.cysteine_classifications
  ADD CONSTRAINT cysteine_classifications_evidence_class_check
  CHECK (evidence_class IS NULL
         OR evidence_class IN ('STRUCT_DIS', 'STRUCT_MET', 'STRUCT_NEG'));

COMMENT ON COLUMN cys_classification.cysteine_classifications.evidence_class IS
  'Structural-evidence-only call (STRUCT_DIS/STRUCT_MET/STRUCT_NEG; '
  'NULL when no structural ground truth is available). Independent '
  'of the ESM2-3state threshold rule that drives the classification '
  'column. Populated for PDB-source domains; null elsewhere.';

\echo 'Backfilling evidence_class...'

WITH per_cys AS (
  SELECT cc.id, p.source_type,
         EXISTS (
           SELECT 1 FROM cys_classification.pdb_ssbonds s
            WHERE s.domain_id = cc.domain_id
              AND s.both_in_domain
              AND (s.resnum1 = cc.cys_position OR s.resnum2 = cc.cys_position)
         ) AS has_ssbond,
         EXISTS (
           SELECT 1 FROM cys_classification.geometric_disulfides g
            WHERE g.domain_id = cc.domain_id
              AND (g.resnum1 = cc.cys_position OR g.resnum2 = cc.cys_position)
         ) AS has_geom_ss,
         EXISTS (
           SELECT 1 FROM cys_classification.pdb_metal_links m
            WHERE m.domain_id = cc.domain_id
              AND m.coord_resname = 'CYS'
              AND m.coord_resnum = cc.cys_position
         ) AS has_metal_link
    FROM cys_classification.cysteine_classifications cc
    JOIN ecod_commons.domains  d ON cc.domain_id = d.id
    JOIN ecod_commons.proteins p ON d.protein_id = p.id
)
-- evidence_class is the *experimental* structural-evidence axis,
-- so we restrict to source_type='pdb' before consulting the
-- structural-evidence tables. geometric_disulfides is also computed
-- for AFDB-source domains (Sγ-Sγ on the AlphaFold model), which is
-- predicted-structure agreement, not ground truth — those rows must
-- not flow into evidence_class.
UPDATE cys_classification.cysteine_classifications cc
   SET evidence_class = CASE
     WHEN per_cys.source_type <> 'pdb'                     THEN NULL
     WHEN per_cys.has_ssbond OR per_cys.has_geom_ss        THEN 'STRUCT_DIS'
     WHEN per_cys.has_metal_link                           THEN 'STRUCT_MET'
     ELSE                                                       'STRUCT_NEG'
   END
  FROM per_cys
 WHERE per_cys.id = cc.id;

CREATE INDEX IF NOT EXISTS idx_cysteine_classifications_evidence_class
  ON cys_classification.cysteine_classifications (evidence_class)
  WHERE evidence_class IS NOT NULL;

-- Sibling MV for the side-by-side diff. Same shape as hgroup_summary
-- but the pdb_n_disulfide / pdb_n_metal counters use evidence_class
-- instead of classification on PDB-source rows. The afdb_* counters
-- are unchanged (still classification, since AFDB has no ground
-- truth axis). pdb_total_cys denominator counts cysteines that have
-- a non-null evidence_class — i.e. only those whose structure was
-- examined.
DROP MATERIALIZED VIEW IF EXISTS cys_classification.hgroup_summary_struct;

CREATE MATERIALIZED VIEW cys_classification.hgroup_summary_struct AS
SELECT
  fa.h_group_id,
  COALESCE(hc.name, fa.h_group_id)                               AS h_group_name,
  fa.x_group_id,
  COALESCE(xc.name, fa.x_group_id)                               AS x_group_name,
  count(DISTINCT d.id) FILTER (WHERE p.source_type =  'pdb')     AS n_pdb_reps,
  count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')     AS n_afdb_reps,
  -- PDB axis denominator: only cysteines with structural ground truth.
  count(*) FILTER (WHERE p.source_type =  'pdb' AND cc.evidence_class IS NOT NULL) AS pdb_total_cys,
  -- AFDB axis denominator: every classified cysteine (existing semantics).
  COALESCE(sum(ds.total_cys) FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_total_cys,
  -- PDB axis numerators: structural ground truth.
  count(*) FILTER (WHERE p.source_type = 'pdb' AND cc.evidence_class = 'STRUCT_DIS') AS pdb_n_disulfide,
  count(*) FILTER (WHERE p.source_type = 'pdb' AND cc.evidence_class = 'STRUCT_MET') AS pdb_n_metal,
  -- AFDB axis numerators: ESM2 threshold call (unchanged).
  COALESCE(sum(ds.n_disulfide)     FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_n_disulfide,
  COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_n_metal
FROM cys_classification.cysteine_classifications  cc
JOIN cys_classification.esm2_run_domains          rd  ON rd.domain_id = cc.domain_id AND rd.run_id = 1
JOIN ecod_commons.domains                         d   ON cc.domain_id = d.id
JOIN ecod_commons.proteins                        p   ON d.protein_id = p.id
JOIN ecod_commons.f_group_assignments             fa  ON cc.domain_id = fa.domain_id
LEFT JOIN cys_classification.domain_summary       ds  ON ds.domain_id = cc.domain_id
LEFT JOIN ecod_rep.cluster                        hc  ON fa.h_group_id = hc.id::text AND hc.type = 'H'
LEFT JOIN ecod_rep.cluster                        xc  ON fa.x_group_id = xc.id::text AND xc.type = 'X'
GROUP BY fa.h_group_id, hc.name, fa.x_group_id, xc.name
HAVING count(DISTINCT d.id) >= 1;

CREATE UNIQUE INDEX hgroup_summary_struct_h_group_pk
  ON cys_classification.hgroup_summary_struct (h_group_id);
CREATE INDEX hgroup_summary_struct_x_group_idx
  ON cys_classification.hgroup_summary_struct (x_group_id);

COMMENT ON MATERIALIZED VIEW cys_classification.hgroup_summary_struct IS
  'Sibling of hgroup_summary that uses evidence_class (structural '
  'ground truth) on the PDB axis instead of classification (ESM2 '
  'threshold call). For the side-by-side diff vs hgroup_summary '
  'before flipping the H-group browser page over to ground-truth '
  'semantics. See DB_CONTRACT.md §3.3 / §5.1.';

COMMIT;
