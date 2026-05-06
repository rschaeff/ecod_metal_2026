-- Generate the per-figure CSV deposits for /downloads.
--
-- Produces the live-DB-derivable figure_data CSVs (fig3b, fig3c, fig3d,
-- figS2, figS3, fig5ab). The paper-frozen / benchmark-derived ones
-- (fig3a, fig2, figS1, fig4) come from scripts/dump-figure-data-static.mjs
-- in the same wrapper. All numbers are scoped to paper-v1
-- (esm2_run_domains.run_id = 1) where applicable, matching the queries
-- the rendered panels use.
--
-- Output paths come from psql variables set by the wrapper script:
--   :fig3b_out  :fig3c_out  :fig3d_out
--   :figS2_out  :figS3_out  :fig5ab_out

\set ON_ERROR_STOP on
\timing on

-- ---------- Fig 3B: domain fraction vs cysteine fraction by superkingdom ----------
\echo 'fig3b_kingdom_fractions.csv ...'
\o :fig3b_out
COPY (
  WITH per_kingdom AS (
    SELECT pt.superkingdom,
           count(DISTINCT ds.domain_id)              AS n_domains,
           sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified) AS n_cys
      FROM cys_classification.domain_summary ds
      JOIN cys_classification.esm2_run_domains rd
           ON rd.domain_id = ds.domain_id AND rd.run_id = 1
      JOIN ecod_commons.domains  d ON ds.domain_id = d.id
      JOIN ecod_commons.proteins p ON d.protein_id = p.id
      JOIN ecod_commons.protein_taxonomy pt
           ON p.source_id = pt.source_id AND p.source_type = pt.source_type
     WHERE pt.superkingdom IN ('Eukaryota','Bacteria','Archaea')
     GROUP BY pt.superkingdom
  ),
  totals AS (
    SELECT sum(n_domains) AS tot_domains, sum(n_cys) AS tot_cys FROM per_kingdom
  )
  SELECT pk.superkingdom AS kingdom,
         round(100.0 * pk.n_domains::numeric / NULLIF(t.tot_domains, 0), 2) AS domain_pct,
         round(100.0 * pk.n_cys::numeric     / NULLIF(t.tot_cys, 0),     2) AS cysteine_pct,
         pk.n_domains,
         pk.n_cys
    FROM per_kingdom pk CROSS JOIN totals t
   ORDER BY pk.n_domains DESC
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

-- ---------- Fig 3C: per-kingdom 3-state classification rates ----------
\echo 'fig3c_kingdom_rates.csv ...'
\o :fig3c_out
COPY (
  SELECT pt.superkingdom AS kingdom,
         count(DISTINCT ds.domain_id) AS n_domains,
         sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified) AS total_cys,
         round(100.0 * sum(ds.n_unclassified)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS free_thiol_pct,
         round(100.0 * sum(ds.n_disulfide)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS disulfide_pct,
         round(100.0 * sum(ds.n_metal_binding)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS metal_pct
    FROM cys_classification.domain_summary ds
    JOIN cys_classification.esm2_run_domains rd
         ON rd.domain_id = ds.domain_id AND rd.run_id = 1
    JOIN ecod_commons.domains  d ON ds.domain_id = d.id
    JOIN ecod_commons.proteins p ON d.protein_id = p.id
    JOIN ecod_commons.protein_taxonomy pt
         ON p.source_id = pt.source_id AND p.source_type = pt.source_type
   WHERE pt.superkingdom IN ('Eukaryota','Bacteria','Archaea')
   GROUP BY pt.superkingdom
   ORDER BY n_domains DESC
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

-- ---------- Fig 3D: eukaryotic subcellular distribution ----------
\echo 'fig3d_subcellular.csv ...'
\o :fig3d_out
COPY (
  WITH eukaryote_scope AS (
    SELECT rd.domain_id, p.uniprot_acc
      FROM cys_classification.esm2_run_domains rd
      JOIN ecod_commons.domains  d ON rd.domain_id = d.id
      JOIN ecod_commons.proteins p ON d.protein_id = p.id
      JOIN ecod_commons.protein_taxonomy pt
           ON p.source_id = pt.source_id AND p.source_type = pt.source_type
     WHERE rd.run_id = 1
       AND p.source_type = 'afdb'
       AND p.uniprot_acc IS NOT NULL
       AND pt.superkingdom = 'Eukaryota'
  )
  SELECT us.compartment,
         count(DISTINCT es.domain_id) AS n_domains,
         sum(ds.total_cys)            AS total_cys,
         sum(ds.n_disulfide)          AS n_disulfide,
         sum(ds.n_metal_binding)      AS n_metal_binding,
         round(100.0 * sum(ds.n_disulfide)::numeric / NULLIF(sum(ds.total_cys), 0), 2) AS disulfide_pct,
         round(100.0 * sum(ds.n_metal_binding)::numeric / NULLIF(sum(ds.total_cys), 0), 2) AS metal_pct
    FROM eukaryote_scope es
    JOIN cys_classification.uniprot_subcellular us ON us.uniprot_acc = es.uniprot_acc
    JOIN cys_classification.domain_summary ds      ON ds.domain_id   = es.domain_id
   GROUP BY us.compartment
   ORDER BY n_domains DESC
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

-- ---------- Fig S2: source-type breakdown (panel hides EPP — so does this CSV) ----------
\echo 'figS2_source_breakdown.csv ...'
\o :figS2_out
COPY (
  SELECT p.source_type,
         count(DISTINCT ds.domain_id) AS n_domains,
         sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified) AS total_cys,
         round(100.0 * sum(ds.n_unclassified)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS free_thiol_pct,
         round(100.0 * sum(ds.n_disulfide)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS disulfide_pct,
         round(100.0 * sum(ds.n_metal_binding)::numeric
               / NULLIF(sum(ds.n_disulfide + ds.n_metal_binding + ds.n_unclassified), 0), 2)  AS metal_pct
    FROM cys_classification.domain_summary ds
    JOIN cys_classification.esm2_run_domains rd
         ON rd.domain_id = ds.domain_id AND rd.run_id = 1
    JOIN ecod_commons.domains  d ON ds.domain_id = d.id
    JOIN ecod_commons.proteins p ON d.protein_id = p.id
   WHERE p.source_type <> 'epp'
   GROUP BY p.source_type
   ORDER BY n_domains DESC
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

-- ---------- Fig S3: max-class probability distribution ----------
\echo 'figS3_confidence_distribution.csv ...'
\o :figS3_out
COPY (
  SELECT
    CASE width_bucket(confidence, 0.3, 1.0, 7)
      WHEN 1 THEN '0.3-0.4' WHEN 2 THEN '0.4-0.5' WHEN 3 THEN '0.5-0.6'
      WHEN 4 THEN '0.6-0.7' WHEN 5 THEN '0.7-0.8' WHEN 6 THEN '0.8-0.9'
      WHEN 7 THEN '0.9-1.0' ELSE '<0.3'
    END AS bucket,
    classification,
    count(*) AS n_cysteines
   FROM cys_classification.cysteine_classifications
  WHERE confidence IS NOT NULL
  GROUP BY 1, classification
  ORDER BY 1, classification
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

-- ---------- Fig 5A,B: H-group confusion matrix data (per-H-group) ----------
\echo 'fig5ab_hgroup_confusion.csv ...'
\o :fig5ab_out
COPY (
  SELECT h_group_id, h_group_name, x_group_id, x_group_name,
         n_pdb_reps, n_afdb_reps, pdb_total_cys, afdb_total_cys,
         CASE WHEN pdb_total_cys  > 0
              THEN round(100.0 * pdb_n_disulfide::numeric  / pdb_total_cys,  2) END AS pdb_disulfide_pct,
         CASE WHEN pdb_total_cys  > 0
              THEN round(100.0 * pdb_n_metal::numeric      / pdb_total_cys,  2) END AS pdb_metal_pct,
         CASE WHEN afdb_total_cys > 0
              THEN round(100.0 * afdb_n_disulfide::numeric / afdb_total_cys, 2) END AS afdb_disulfide_pct,
         CASE WHEN afdb_total_cys > 0
              THEN round(100.0 * afdb_n_metal::numeric     / afdb_total_cys, 2) END AS afdb_metal_pct
    FROM cys_classification.hgroup_summary
   ORDER BY h_group_id
) TO STDOUT WITH (FORMAT csv, HEADER true);
\o

\echo 'Done (live CSVs).'
