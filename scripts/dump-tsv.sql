-- Generate the canonical TSV deposition files for /downloads.
--
-- Usage (via the dump-tsv.sh wrapper):
--     scripts/dump-tsv.sh
-- The wrapper sets the OUT_DIR env var, runs psql with this file, and emits
-- SHA-256 sidecars next to each output. Cron-runnable.
--
-- Output files (written to :outdir):
--   cysteine-classifications.tsv
--   domain-summary.tsv
--   hgroup-aggregates.tsv

\timing on

\echo 'Generating cysteine-classifications.tsv ...'
\copy (
  SELECT
    d.domain_id,
    cc.cys_position,
    cc.classification,
    COALESCE(esm.neg_prob, NULL) AS p_neg,
    COALESCE(esm.dis_prob, NULL) AS p_dis,
    COALESCE(esm.met_prob, NULL) AS p_met,
    cc.evidence AS evidence_tags,
    fa.f_group_id,
    fa.h_group_id,
    fa.x_group_id,
    p.source_type
  FROM cys_classification.cysteine_classifications cc
  JOIN ecod_commons.domains d              ON cc.domain_id = d.id
  JOIN ecod_commons.proteins p             ON d.protein_id = p.id
  JOIN ecod_commons.f_group_assignments fa ON cc.domain_id = fa.domain_id
  JOIN ecod_commons.domain_clusters dc     ON d.id = dc.domain_id
  JOIN ecod_commons.clustering_runs cr     ON dc.clustering_run_id = cr.id
  LEFT JOIN cys_classification.esm2_predictions esm
         ON esm.domain_id = cc.domain_id
        AND esm.cys_position = cc.cys_position
  WHERE cr.parameter_set_id = 2
    AND dc.is_representative = TRUE
  ORDER BY d.domain_id, cc.cys_position
) TO :'cys_out' WITH (FORMAT csv, DELIMITER E'\t', HEADER true);

\echo 'Generating domain-summary.tsv ...'
\copy (
  SELECT
    d.domain_id,
    p.source_type,
    p.pdb_id,
    p.uniprot_acc,
    ds.total_cys,
    ds.n_disulfide,
    ds.n_metal_binding,
    ds.n_unclassified,
    fa.f_group_id,
    fa.h_group_id,
    fa.x_group_id
  FROM cys_classification.domain_summary ds
  JOIN ecod_commons.domains d              ON ds.domain_id = d.id
  JOIN ecod_commons.proteins p             ON d.protein_id = p.id
  JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
  JOIN ecod_commons.domain_clusters dc     ON d.id = dc.domain_id
  JOIN ecod_commons.clustering_runs cr     ON dc.clustering_run_id = cr.id
  WHERE cr.parameter_set_id = 2
    AND dc.is_representative = TRUE
  ORDER BY d.domain_id
) TO :'dom_out' WITH (FORMAT csv, DELIMITER E'\t', HEADER true);

\echo 'Generating hgroup-aggregates.tsv ...'
-- Mirrors getHGroupSummary() in src/lib/queries.ts. Once the materialized view
-- cys_classification.hgroup_summary lands (TRICYP_SPEC §"Database changes"),
-- this block can be replaced with a single SELECT * FROM hgroup_summary.
\copy (
  SELECT
    fa.h_group_id,
    COALESCE(hc.name, fa.h_group_id) AS h_group_name,
    fa.x_group_id,
    count(DISTINCT d.id) FILTER (WHERE p.source_type = 'pdb')   AS n_pdb_reps,
    count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')  AS n_afdb_reps,
    COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type = 'pdb'), 0)  AS pdb_total_cys,
    COALESCE(sum(ds.total_cys)       FILTER (WHERE p.source_type <> 'pdb'), 0) AS afdb_total_cys,
    CASE
      WHEN sum(ds.total_cys) FILTER (WHERE p.source_type = 'pdb') > 0
      THEN round(100.0 * sum(ds.n_disulfide) FILTER (WHERE p.source_type = 'pdb')::numeric
                       / sum(ds.total_cys)   FILTER (WHERE p.source_type = 'pdb'), 2)
      ELSE NULL
    END AS pdb_disulfide_pct,
    CASE
      WHEN sum(ds.total_cys) FILTER (WHERE p.source_type = 'pdb') > 0
      THEN round(100.0 * sum(ds.n_metal_binding) FILTER (WHERE p.source_type = 'pdb')::numeric
                       / sum(ds.total_cys)       FILTER (WHERE p.source_type = 'pdb'), 2)
      ELSE NULL
    END AS pdb_metal_pct,
    CASE
      WHEN sum(ds.total_cys) FILTER (WHERE p.source_type <> 'pdb') > 0
      THEN round(100.0 * sum(ds.n_disulfide) FILTER (WHERE p.source_type <> 'pdb')::numeric
                       / sum(ds.total_cys)   FILTER (WHERE p.source_type <> 'pdb'), 2)
      ELSE NULL
    END AS afdb_disulfide_pct,
    CASE
      WHEN sum(ds.total_cys) FILTER (WHERE p.source_type <> 'pdb') > 0
      THEN round(100.0 * sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb')::numeric
                       / sum(ds.total_cys)       FILTER (WHERE p.source_type <> 'pdb'), 2)
      ELSE NULL
    END AS afdb_metal_pct
  FROM cys_classification.domain_summary ds
  JOIN ecod_commons.domains d              ON ds.domain_id = d.id
  JOIN ecod_commons.proteins p             ON d.protein_id = p.id
  JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
  JOIN ecod_commons.domain_clusters dc     ON d.id = dc.domain_id
  JOIN ecod_commons.clustering_runs cr     ON dc.clustering_run_id = cr.id
  LEFT JOIN ecod_rep.cluster hc            ON fa.h_group_id = hc.id::text AND hc.type = 'H'
  WHERE cr.parameter_set_id = 2
    AND dc.is_representative = TRUE
  GROUP BY fa.h_group_id, hc.name, fa.x_group_id
  HAVING count(DISTINCT d.id) >= 1
  ORDER BY fa.h_group_id
) TO :'hgr_out' WITH (FORMAT csv, DELIMITER E'\t', HEADER true);

\echo 'Done.'
