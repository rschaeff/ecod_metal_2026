-- Generate the canonical TSV deposition files for /downloads.
--
-- Usage (via the dump-tsv.sh wrapper):
--     scripts/dump-tsv.sh
-- The wrapper sets the OUT_DIR env var, runs psql with this file, and emits
-- SHA-256 sidecars next to each output. Cron-runnable.
--
-- Output files (written via `\o :<var>` + server-side COPY TO STDOUT —
-- this avoids the single-line restriction on the psql `\copy` meta-command.
-- Use unquoted `:<var>` for `\o` since psql passes quoted forms verbatim
-- to the file-open call):
--   :cys_out  → cysteine-classifications.tsv
--   :dom_out  → domain-summary.tsv
--   :hgr_out  → hgroup-aggregates.tsv

\set ON_ERROR_STOP on
\timing on

\echo 'Generating cysteine-classifications.tsv ...'
\o :cys_out
COPY (
  SELECT
    d.domain_id,
    cc.cys_position,
    cc.classification,
    esm.neg_prob AS p_neg,
    esm.dis_prob AS p_dis,
    esm.met_prob AS p_met,
    cc.evidence AS evidence_tags,
    fa.f_group_id,
    fa.h_group_id,
    fa.x_group_id,
    p.source_type
  FROM cys_classification.cysteine_classifications cc
  JOIN cys_classification.esm2_run_domains rd
       ON rd.domain_id = cc.domain_id AND rd.run_id = 1  -- paper-v1
  JOIN ecod_commons.domains d              ON cc.domain_id = d.id
  JOIN ecod_commons.proteins p             ON d.protein_id = p.id
  JOIN ecod_commons.f_group_assignments fa ON cc.domain_id = fa.domain_id
  LEFT JOIN cys_classification.esm2_predictions esm
         ON esm.domain_id = cc.domain_id
        AND esm.cys_position = cc.cys_position
  ORDER BY d.domain_id, cc.cys_position
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', HEADER true);
\o

\echo 'Generating domain-summary.tsv ...'
\o :dom_out
COPY (
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
  JOIN cys_classification.esm2_run_domains rd
       ON rd.domain_id = ds.domain_id AND rd.run_id = 1  -- paper-v1
  JOIN ecod_commons.domains d              ON ds.domain_id = d.id
  JOIN ecod_commons.proteins p             ON d.protein_id = p.id
  JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
  ORDER BY d.domain_id
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', HEADER true);
\o

\echo 'Generating hgroup-aggregates.tsv ...'
-- Reads the materialized view created by scripts/migrations/001_hgroup_summary.sql.
-- Derived percentage columns are computed here so the TSV download matches the
-- legacy "pdb_disulfide_pct / afdb_metal_pct" schema cited in the manuscript's
-- "Software and data availability" section.
\o :hgr_out
COPY (
  SELECT
    h_group_id,
    h_group_name,
    x_group_id,
    n_pdb_reps,
    n_afdb_reps,
    pdb_total_cys,
    afdb_total_cys,
    CASE WHEN pdb_total_cys > 0
         THEN round(100.0 * pdb_n_disulfide::numeric  / pdb_total_cys,  2)
    END AS pdb_disulfide_pct,
    CASE WHEN pdb_total_cys > 0
         THEN round(100.0 * pdb_n_metal::numeric      / pdb_total_cys,  2)
    END AS pdb_metal_pct,
    CASE WHEN afdb_total_cys > 0
         THEN round(100.0 * afdb_n_disulfide::numeric / afdb_total_cys, 2)
    END AS afdb_disulfide_pct,
    CASE WHEN afdb_total_cys > 0
         THEN round(100.0 * afdb_n_metal::numeric     / afdb_total_cys, 2)
    END AS afdb_metal_pct
  FROM cys_classification.hgroup_summary
  ORDER BY h_group_id
) TO STDOUT WITH (FORMAT csv, DELIMITER E'\t', HEADER true);
\o

\echo 'Done.'
