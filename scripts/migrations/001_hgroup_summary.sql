-- Migration 001: cys_classification.hgroup_summary materialized view
-- Source: DB_CONTRACT.md §4.1.
-- Replaces the live scan in src/lib/queries.ts getHGroupSummary() with a
-- precomputed per-H-group rollup of the confusion-matrix inputs over the
-- paper-v1 inference scope (DB_CONTRACT §2.12). Joining via
-- esm2_run_domains instead of the live F70 filter keeps the MV pinned to
-- the published manuscript dataset even as ECOD's F70 set drifts.
--
-- Refresh after every data load:
--   REFRESH MATERIALIZED VIEW CONCURRENTLY cys_classification.hgroup_summary;
--
-- Idempotent: drop-and-recreate so re-running the migration picks up
-- column additions without leaving a stale view behind.

\set ON_ERROR_STOP on

BEGIN;

DROP MATERIALIZED VIEW IF EXISTS cys_classification.hgroup_summary;

CREATE MATERIALIZED VIEW cys_classification.hgroup_summary AS
SELECT
  fa.h_group_id,
  COALESCE(hc.name, fa.h_group_id)                               AS h_group_name,
  fa.x_group_id,
  COALESCE(xc.name, fa.x_group_id)                               AS x_group_name,
  count(DISTINCT d.id) FILTER (WHERE p.source_type =  'pdb')     AS n_pdb_reps,
  count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')     AS n_afdb_reps,
  COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type =  'pdb'), 0) AS pdb_total_cys,
  COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_total_cys,
  COALESCE(sum(ds.n_disulfide)     FILTER (WHERE p.source_type =  'pdb'), 0) AS pdb_n_disulfide,
  COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type =  'pdb'), 0) AS pdb_n_metal,
  COALESCE(sum(ds.n_disulfide)     FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_n_disulfide,
  COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_n_metal
FROM cys_classification.domain_summary       ds
JOIN cys_classification.esm2_run_domains     rd  ON rd.domain_id = ds.domain_id AND rd.run_id = 1
JOIN ecod_commons.domains                    d   ON ds.domain_id = d.id
JOIN ecod_commons.proteins                   p   ON d.protein_id = p.id
JOIN ecod_commons.f_group_assignments        fa  ON ds.domain_id = fa.domain_id
LEFT JOIN ecod_rep.cluster                   hc  ON fa.h_group_id = hc.id::text AND hc.type = 'H'
LEFT JOIN ecod_rep.cluster                   xc  ON fa.x_group_id = xc.id::text AND xc.type = 'X'
GROUP BY fa.h_group_id, hc.name, fa.x_group_id, xc.name
HAVING count(DISTINCT d.id) >= 1;

-- Unique index required by REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE UNIQUE INDEX hgroup_summary_h_group_pk
  ON cys_classification.hgroup_summary (h_group_id);

CREATE INDEX hgroup_summary_x_group_idx
  ON cys_classification.hgroup_summary (x_group_id);

COMMENT ON MATERIALIZED VIEW cys_classification.hgroup_summary IS
  'Per-H-group F70-rep confusion-matrix inputs. Backs /h-group browser '
  '(see DB_CONTRACT.md §4.1). Refresh after every data load.';

COMMIT;
