import { query, queryOne } from './db';

// ---- Interfaces ----

export interface ConcordanceRow {
  tGroupId: string;
  tGroupName: string;
  nSsbond: number;
  nGeom: number;
  nBoth: number;
  fn: number;
  fp: number;
  sensitivity: number;
  precision: number;
}

export interface ConcordanceSummary {
  nSsbond: number;
  nGeom: number;
  nBoth: number;
  fn: number;
  fp: number;
  sensitivity: number;
  precision: number;
}

export interface ConcordanceResult {
  rows: ConcordanceRow[];
  summary: ConcordanceSummary;
}

export interface CrossDomainRow {
  xGroupId: string;
  xGroupName: string;
  intra: number;
  crossDomain: number;
  nDomains: number;
  crossPct: number;
}

export interface CrossDomainSummary {
  totalSsbonds: number;
  intra: number;
  cross: number;
}

export interface CrossDomainResult {
  rows: CrossDomainRow[];
  summary: CrossDomainSummary;
}

export interface LevelCounts {
  truth: number;
  predicted: number;
}

export interface ExpansionStats {
  disulfide: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
  metal: { x: LevelCounts; t: LevelCounts; f: LevelCounts };
}

export interface PdbVsAfdbRow {
  tGroupId: string;
  tGroupName: string;
  pdbDomains: number;
  pdbPredicted: number;
  pdbPct: number;
  predictedDomains: number;
  predictedPredicted: number;
  predictedPct: number;
}

export interface CofactorDetail {
  cofactor: string;
  totalLinks: number;
  cysLinks: number;
  nDomains: number;
}

export interface CofactorBreakdown {
  freeIon: number;
  cofactor: number;
  byCofactor: CofactorDetail[];
}

export interface SiteTypeRow {
  tGroupId: string;
  tGroupName: string;
  metal: string;
  cofactor: string | null;
  nLinks: number;
}

// ---- paper-v1 inference scope CTE (reused) ----
//
// Filters to the published manuscript scope (cys_classification.esm2_runs
// run_label='paper-v1', id=1) rather than the live F70 set, which has
// already drifted by ~3,275 domains. See DB_CONTRACT.md §2.12.
const PAPER_V1_RUN_ID = 1;

const F70_REP_CTE = `f70 AS (
    SELECT fa.domain_id, fa.x_group_id, fa.t_group_id, fa.f_group_id
    FROM ecod_commons.f_group_assignments fa
    JOIN cys_classification.esm2_run_domains rd
      ON rd.domain_id = fa.domain_id AND rd.run_id = ${PAPER_V1_RUN_ID}
  )`;

const PDB_F70_CTE = `pdb_f70 AS (
    SELECT f70.domain_id, f70.x_group_id, f70.t_group_id, f70.f_group_id
    FROM f70
    JOIN ecod_commons.domains d ON f70.domain_id = d.id
    JOIN ecod_commons.proteins p ON d.protein_id = p.id
    WHERE p.source_type = 'pdb'
  )`;

// ---- 1. Disulfide Concordance (geometric detection vs PDB SSBOND) ----

export async function getDisulfideConcordance(): Promise<ConcordanceResult> {
  const rows = await query<{
    t_group_id: string;
    t_group_name: string;
    n_ssbond: string;
    n_geom: string;
    n_both: string;
    fn: string;
    fp: string;
  }>(
    `WITH ${F70_REP_CTE},
    ${PDB_F70_CTE},
    ss_truth AS (
      SELECT DISTINCT s.domain_id
      FROM cys_classification.pdb_ssbonds s
      JOIN pdb_f70 ON s.domain_id = pdb_f70.domain_id
      WHERE s.both_in_domain = TRUE
    ),
    ss_pred AS (
      SELECT DISTINCT g.domain_id
      FROM cys_classification.geometric_disulfides g
      JOIN pdb_f70 ON g.domain_id = pdb_f70.domain_id
    ),
    per_domain AS (
      SELECT pdb_f70.domain_id,
             pdb_f70.t_group_id,
             CASE WHEN st.domain_id IS NOT NULL THEN 1 ELSE 0 END AS has_truth,
             CASE WHEN sp.domain_id IS NOT NULL THEN 1 ELSE 0 END AS has_pred
      FROM pdb_f70
      LEFT JOIN ss_truth st ON pdb_f70.domain_id = st.domain_id
      LEFT JOIN ss_pred sp ON pdb_f70.domain_id = sp.domain_id
      WHERE st.domain_id IS NOT NULL OR sp.domain_id IS NOT NULL
    )
    SELECT pd.t_group_id,
           COALESCE(c.name, pd.t_group_id) AS t_group_name,
           count(*) FILTER (WHERE has_truth = 1)::text AS n_ssbond,
           count(*) FILTER (WHERE has_pred = 1)::text AS n_geom,
           count(*) FILTER (WHERE has_truth = 1 AND has_pred = 1)::text AS n_both,
           count(*) FILTER (WHERE has_truth = 1 AND has_pred = 0)::text AS fn,
           count(*) FILTER (WHERE has_truth = 0 AND has_pred = 1)::text AS fp
    FROM per_domain pd
    LEFT JOIN ecod_rep.cluster c ON pd.t_group_id = c.id::text AND c.type = 'T'
    GROUP BY pd.t_group_id, c.name
    HAVING count(*) >= 5
    ORDER BY count(*) FILTER (WHERE has_truth = 1) DESC`
  );

  const mapped: ConcordanceRow[] = rows.map((r) => {
    const nBoth = parseInt(r.n_both);
    const fn = parseInt(r.fn);
    const fp = parseInt(r.fp);
    return {
      tGroupId: r.t_group_id,
      tGroupName: r.t_group_name,
      nSsbond: parseInt(r.n_ssbond),
      nGeom: parseInt(r.n_geom),
      nBoth,
      fn,
      fp,
      sensitivity: nBoth + fn > 0 ? nBoth / (nBoth + fn) : 0,
      precision: nBoth + fp > 0 ? nBoth / (nBoth + fp) : 0,
    };
  });

  const totals = mapped.reduce(
    (acc, r) => ({
      nSsbond: acc.nSsbond + r.nSsbond,
      nGeom: acc.nGeom + r.nGeom,
      nBoth: acc.nBoth + r.nBoth,
      fn: acc.fn + r.fn,
      fp: acc.fp + r.fp,
    }),
    { nSsbond: 0, nGeom: 0, nBoth: 0, fn: 0, fp: 0 }
  );

  const summary: ConcordanceSummary = {
    ...totals,
    sensitivity: totals.nBoth + totals.fn > 0 ? totals.nBoth / (totals.nBoth + totals.fn) : 0,
    precision: totals.nBoth + totals.fp > 0 ? totals.nBoth / (totals.nBoth + totals.fp) : 0,
  };

  return { rows: mapped, summary };
}

// ---- 2. Metal Concordance (ESM2 prediction vs PDB metal links) ----

export async function getMetalConcordance(includeCofactors: boolean): Promise<ConcordanceResult> {
  const cofactorFilter = includeCofactors ? '' : 'AND ml.cofactor IS NULL';

  const rows = await query<{
    t_group_id: string;
    t_group_name: string;
    n_ssbond: string;
    n_geom: string;
    n_both: string;
    fn: string;
    fp: string;
  }>(
    `WITH ${F70_REP_CTE},
    ${PDB_F70_CTE},
    metal_truth AS (
      SELECT DISTINCT ml.domain_id
      FROM cys_classification.pdb_metal_links ml
      JOIN pdb_f70 ON ml.domain_id = pdb_f70.domain_id
      WHERE ml.coord_resname = 'CYS' ${cofactorFilter}
    ),
    metal_pred AS (
      SELECT DISTINCT ep.domain_id
      FROM cys_classification.esm2_predictions ep
      JOIN pdb_f70 ON ep.domain_id = pdb_f70.domain_id
      WHERE ep.met_prob > ep.dis_prob AND ep.met_prob > ep.neg_prob
    ),
    per_domain AS (
      SELECT pdb_f70.domain_id,
             pdb_f70.t_group_id,
             CASE WHEN mt.domain_id IS NOT NULL THEN 1 ELSE 0 END AS has_truth,
             CASE WHEN mp.domain_id IS NOT NULL THEN 1 ELSE 0 END AS has_pred
      FROM pdb_f70
      LEFT JOIN metal_truth mt ON pdb_f70.domain_id = mt.domain_id
      LEFT JOIN metal_pred mp ON pdb_f70.domain_id = mp.domain_id
      WHERE mt.domain_id IS NOT NULL OR mp.domain_id IS NOT NULL
    )
    SELECT pd.t_group_id,
           COALESCE(c.name, pd.t_group_id) AS t_group_name,
           count(*) FILTER (WHERE has_truth = 1)::text AS n_ssbond,
           count(*) FILTER (WHERE has_pred = 1)::text AS n_geom,
           count(*) FILTER (WHERE has_truth = 1 AND has_pred = 1)::text AS n_both,
           count(*) FILTER (WHERE has_truth = 1 AND has_pred = 0)::text AS fn,
           count(*) FILTER (WHERE has_truth = 0 AND has_pred = 1)::text AS fp
    FROM per_domain pd
    LEFT JOIN ecod_rep.cluster c ON pd.t_group_id = c.id::text AND c.type = 'T'
    GROUP BY pd.t_group_id, c.name
    HAVING count(*) >= 5
    ORDER BY count(*) FILTER (WHERE has_truth = 1) DESC`
  );

  const mapped: ConcordanceRow[] = rows.map((r) => {
    const nBoth = parseInt(r.n_both);
    const fn = parseInt(r.fn);
    const fp = parseInt(r.fp);
    return {
      tGroupId: r.t_group_id,
      tGroupName: r.t_group_name,
      nSsbond: parseInt(r.n_ssbond),
      nGeom: parseInt(r.n_geom),
      nBoth,
      fn,
      fp,
      sensitivity: nBoth + fn > 0 ? nBoth / (nBoth + fn) : 0,
      precision: nBoth + fp > 0 ? nBoth / (nBoth + fp) : 0,
    };
  });

  const totals = mapped.reduce(
    (acc, r) => ({
      nSsbond: acc.nSsbond + r.nSsbond,
      nGeom: acc.nGeom + r.nGeom,
      nBoth: acc.nBoth + r.nBoth,
      fn: acc.fn + r.fn,
      fp: acc.fp + r.fp,
    }),
    { nSsbond: 0, nGeom: 0, nBoth: 0, fn: 0, fp: 0 }
  );

  const summary: ConcordanceSummary = {
    ...totals,
    sensitivity: totals.nBoth + totals.fn > 0 ? totals.nBoth / (totals.nBoth + totals.fn) : 0,
    precision: totals.nBoth + totals.fp > 0 ? totals.nBoth / (totals.nBoth + totals.fp) : 0,
  };

  return { rows: mapped, summary };
}

// ---- 3. Cross-Domain Disulfides ----

export async function getCrossDomainDisulfides(): Promise<CrossDomainResult> {
  const [rows, summaryRow] = await Promise.all([
    query<{
      x_group_id: string;
      x_group_name: string;
      intra: string;
      cross_domain: string;
      n_domains: string;
    }>(
      `WITH ${F70_REP_CTE},
      ${PDB_F70_CTE}
      SELECT pdb_f70.x_group_id,
             COALESCE(c.name, pdb_f70.x_group_id) AS x_group_name,
             count(*) FILTER (WHERE s.both_in_domain = TRUE)::text AS intra,
             count(*) FILTER (WHERE s.both_in_domain = FALSE)::text AS cross_domain,
             count(DISTINCT pdb_f70.domain_id)::text AS n_domains
      FROM cys_classification.pdb_ssbonds s
      JOIN pdb_f70 ON s.domain_id = pdb_f70.domain_id
      LEFT JOIN ecod_rep.cluster c ON pdb_f70.x_group_id = c.id::text AND c.type = 'X'
      GROUP BY pdb_f70.x_group_id, c.name
      HAVING count(*) >= 10
      ORDER BY count(*) FILTER (WHERE s.both_in_domain = FALSE) DESC`
    ),
    queryOne<{
      total: string;
      intra: string;
      cross: string;
    }>(
      `SELECT count(*)::text AS total,
              count(*) FILTER (WHERE both_in_domain = TRUE)::text AS intra,
              count(*) FILTER (WHERE both_in_domain = FALSE)::text AS cross
       FROM cys_classification.pdb_ssbonds`
    ),
  ]);

  const mapped: CrossDomainRow[] = rows.map((r) => {
    const intra = parseInt(r.intra);
    const crossDomain = parseInt(r.cross_domain);
    const total = intra + crossDomain;
    return {
      xGroupId: r.x_group_id,
      xGroupName: r.x_group_name,
      intra,
      crossDomain,
      nDomains: parseInt(r.n_domains),
      crossPct: total > 0 ? crossDomain / total : 0,
    };
  });

  const summary: CrossDomainSummary = {
    totalSsbonds: parseInt(summaryRow?.total || '0'),
    intra: parseInt(summaryRow?.intra || '0'),
    cross: parseInt(summaryRow?.cross || '0'),
  };

  return { rows: mapped, summary };
}

// ---- 4. Expansion Stats (ESM2 predictions) ----

export async function getExpansionStats(): Promise<ExpansionStats> {
  const levels = ['x_group_id', 't_group_id', 'f_group_id'] as const;
  const levelKeys = ['x', 't', 'f'] as const;

  // Build all 12 queries in parallel (3 levels x 2 feature types x 2 truth/pred)
  const queries: Promise<{ count: string } | null>[] = [];

  for (const level of levels) {
    // disulfide truth
    queries.push(
      queryOne<{ count: string }>(
        `WITH ${F70_REP_CTE}
        SELECT count(DISTINCT f70.${level})::text AS count
        FROM cys_classification.pdb_ssbonds s
        JOIN f70 ON s.domain_id = f70.domain_id
        WHERE s.both_in_domain = TRUE`
      )
    );
    // disulfide predicted (ESM2: dis_prob is argmax)
    queries.push(
      queryOne<{ count: string }>(
        `WITH ${F70_REP_CTE}
        SELECT count(DISTINCT f70.${level})::text AS count
        FROM cys_classification.esm2_predictions ep
        JOIN f70 ON ep.domain_id = f70.domain_id
        WHERE ep.dis_prob > ep.neg_prob AND ep.dis_prob > ep.met_prob`
      )
    );
    // metal truth
    queries.push(
      queryOne<{ count: string }>(
        `WITH ${F70_REP_CTE}
        SELECT count(DISTINCT f70.${level})::text AS count
        FROM cys_classification.pdb_metal_links ml
        JOIN f70 ON ml.domain_id = f70.domain_id
        WHERE ml.coord_resname = 'CYS' AND ml.cofactor IS NULL`
      )
    );
    // metal predicted (ESM2: met_prob is argmax)
    queries.push(
      queryOne<{ count: string }>(
        `WITH ${F70_REP_CTE}
        SELECT count(DISTINCT f70.${level})::text AS count
        FROM cys_classification.esm2_predictions ep
        JOIN f70 ON ep.domain_id = f70.domain_id
        WHERE ep.met_prob > ep.dis_prob AND ep.met_prob > ep.neg_prob`
      )
    );
  }

  const results = await Promise.all(queries);

  const stats: ExpansionStats = {
    disulfide: { x: { truth: 0, predicted: 0 }, t: { truth: 0, predicted: 0 }, f: { truth: 0, predicted: 0 } },
    metal: { x: { truth: 0, predicted: 0 }, t: { truth: 0, predicted: 0 }, f: { truth: 0, predicted: 0 } },
  };

  for (let i = 0; i < levels.length; i++) {
    const base = i * 4;
    const key = levelKeys[i];
    stats.disulfide[key].truth = parseInt(results[base]?.count || '0');
    stats.disulfide[key].predicted = parseInt(results[base + 1]?.count || '0');
    stats.metal[key].truth = parseInt(results[base + 2]?.count || '0');
    stats.metal[key].predicted = parseInt(results[base + 3]?.count || '0');
  }

  return stats;
}

// ---- 5. PDB vs AFDB Rates (ESM2 predictions) ----

export async function getPdbVsAfdbRates(): Promise<PdbVsAfdbRow[]> {
  const rows = await query<{
    t_group_id: string;
    t_group_name: string;
    pdb_domains: string;
    pdb_predicted: string;
    predicted_domains: string;
    predicted_predicted: string;
  }>(
    `WITH ${F70_REP_CTE},
    dom_source AS (
      SELECT f70.domain_id, f70.t_group_id, p.source_type
      FROM f70
      JOIN ecod_commons.domains d ON f70.domain_id = d.id
      JOIN ecod_commons.proteins p ON d.protein_id = p.id
    ),
    metal_domains AS (
      SELECT DISTINCT domain_id
      FROM cys_classification.esm2_predictions
      WHERE met_prob > dis_prob AND met_prob > neg_prob
    ),
    grouped AS (
      SELECT ds.t_group_id,
             count(*) FILTER (WHERE ds.source_type = 'pdb')::text AS pdb_domains,
             count(*) FILTER (WHERE ds.source_type = 'pdb' AND md.domain_id IS NOT NULL)::text AS pdb_predicted,
             count(*) FILTER (WHERE ds.source_type != 'pdb')::text AS predicted_domains,
             count(*) FILTER (WHERE ds.source_type != 'pdb' AND md.domain_id IS NOT NULL)::text AS predicted_predicted
      FROM dom_source ds
      LEFT JOIN metal_domains md ON ds.domain_id = md.domain_id
      GROUP BY ds.t_group_id
      HAVING count(*) FILTER (WHERE ds.source_type = 'pdb') >= 5
         AND count(*) FILTER (WHERE ds.source_type != 'pdb') >= 5
    )
    SELECT g.t_group_id,
           COALESCE(c.name, g.t_group_id) AS t_group_name,
           g.pdb_domains,
           g.pdb_predicted,
           g.predicted_domains,
           g.predicted_predicted
    FROM grouped g
    LEFT JOIN ecod_rep.cluster c ON g.t_group_id = c.id::text AND c.type = 'T'
    ORDER BY g.pdb_predicted::int::float / NULLIF(g.pdb_domains::int, 0) DESC NULLS LAST
    LIMIT 30`
  );

  return rows.map((r) => {
    const pdbDomains = parseInt(r.pdb_domains);
    const pdbPredicted = parseInt(r.pdb_predicted);
    const predictedDomains = parseInt(r.predicted_domains);
    const predictedPredicted = parseInt(r.predicted_predicted);
    return {
      tGroupId: r.t_group_id,
      tGroupName: r.t_group_name,
      pdbDomains,
      pdbPredicted,
      pdbPct: pdbDomains > 0 ? pdbPredicted / pdbDomains : 0,
      predictedDomains,
      predictedPredicted,
      predictedPct: predictedDomains > 0 ? predictedPredicted / predictedDomains : 0,
    };
  });
}

// ---- 6. Cofactor Breakdown ----

export async function getCofactorBreakdown(): Promise<CofactorBreakdown> {
  const [countRow, byCofactorRows] = await Promise.all([
    queryOne<{ free_ion: string; cofactor: string }>(
      `SELECT count(*) FILTER (WHERE cofactor IS NULL)::text AS free_ion,
              count(*) FILTER (WHERE cofactor IS NOT NULL)::text AS cofactor
       FROM cys_classification.pdb_metal_links`
    ),
    query<{
      cofactor: string;
      total_links: string;
      cys_links: string;
      n_domains: string;
    }>(
      `SELECT cofactor,
              count(*)::text AS total_links,
              count(*) FILTER (WHERE coord_resname = 'CYS')::text AS cys_links,
              count(DISTINCT domain_id)::text AS n_domains
       FROM cys_classification.pdb_metal_links
       WHERE cofactor IS NOT NULL
       GROUP BY cofactor
       ORDER BY count(*) DESC`
    ),
  ]);

  return {
    freeIon: parseInt(countRow?.free_ion || '0'),
    cofactor: parseInt(countRow?.cofactor || '0'),
    byCofactor: byCofactorRows.map((r) => ({
      cofactor: r.cofactor,
      totalLinks: parseInt(r.total_links),
      cysLinks: parseInt(r.cys_links),
      nDomains: parseInt(r.n_domains),
    })),
  };
}

// ---- 7. Site Type Mapping ----

export async function getSiteTypeMapping(): Promise<SiteTypeRow[]> {
  const rows = await query<{
    t_group_id: string;
    t_group_name: string;
    metal: string;
    cofactor: string | null;
    n_links: string;
  }>(
    `WITH ranked AS (
      SELECT fa.t_group_id,
             ml.metal,
             ml.cofactor,
             count(*) AS n,
             ROW_NUMBER() OVER (PARTITION BY fa.t_group_id ORDER BY count(*) DESC) AS rn
      FROM cys_classification.pdb_metal_links ml
      JOIN ecod_commons.f_group_assignments fa ON ml.domain_id = fa.domain_id
      WHERE ml.coord_resname = 'CYS'
      GROUP BY fa.t_group_id, ml.metal, ml.cofactor
    )
    SELECT r.t_group_id,
           COALESCE(c.name, r.t_group_id) AS t_group_name,
           r.metal,
           r.cofactor,
           r.n::text AS n_links
    FROM ranked r
    LEFT JOIN ecod_rep.cluster c ON r.t_group_id = c.id::text AND c.type = 'T'
    WHERE r.rn = 1 AND r.n >= 3
    ORDER BY r.n DESC`
  );

  return rows.map((r) => ({
    tGroupId: r.t_group_id,
    tGroupName: r.t_group_name,
    metal: r.metal,
    cofactor: r.cofactor,
    nLinks: parseInt(r.n_links),
  }));
}
