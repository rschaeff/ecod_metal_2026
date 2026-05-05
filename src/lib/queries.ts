import { query, queryOne, escapeLike } from './db';
import type {
  DashboardSummary,
  XGroupBreakdown,
  FamilyInfo,
  FamilyDomain,
  DomainInfo,
  CysteineRecord,
  DomainEvidence,
  Esm2Prediction,
  GeometricDisulfide,
  PdbSsbond,
  PdbMetalLink,
  SearchResult,
} from '@/types/cysteine';

// ---- Dashboard ----

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [classificationCounts, domainCounts, sourceCounts] = await Promise.all([
    query<{ classification: string; count: string }>(
      `SELECT classification, count(*)::text as count
       FROM cys_classification.cysteine_classifications
       GROUP BY classification`
    ),
    query<{ total: string }>(
      `SELECT count(DISTINCT domain_id)::text as total
       FROM cys_classification.domain_summary`
    ),
    query<{ source_type: string; count: string }>(
      `SELECT p.source_type, count(DISTINCT ds.domain_id)::text as count
       FROM cys_classification.domain_summary ds
       JOIN ecod_commons.domains d ON ds.domain_id = d.id
       JOIN ecod_commons.proteins p ON d.protein_id = p.id
       GROUP BY p.source_type`
    ),
  ]);

  const counts: Record<string, number> = {};
  let totalCys = 0;
  for (const row of classificationCounts) {
    counts[row.classification] = parseInt(row.count);
    totalCys += parseInt(row.count);
  }

  const sourceMap: Record<string, number> = {};
  for (const row of sourceCounts) {
    sourceMap[row.source_type] = parseInt(row.count);
  }

  return {
    totalDomains: parseInt(domainCounts[0]?.total || '0'),
    totalCysteines: totalCys,
    nDisulfide: counts['DISULFIDE'] || 0,
    nMetalBinding: counts['METAL_BINDING'] || 0,
    nUnclassified: counts['UNCLASSIFIED'] || 0,
    pdbDomains: sourceMap['pdb'] || 0,
    predictedDomains: (sourceMap['afdb'] || 0) + (sourceMap['prodigal'] || 0) + (sourceMap['uniparc'] || 0),
  };
}

export interface MethodStat {
  method: string;
  description: string;
  type: 'prediction' | 'annotation';
  records: number;
  domains: number;
}

export async function getMethodStats(): Promise<MethodStat[]> {
  let rows: { method: string; records: string; domains: string }[] = [];
  try {
    rows = await query<{ method: string; records: string; domains: string }>(`
      SELECT 'ESM2 3-state' as method, count(*)::text as records, count(DISTINCT domain_id)::text as domains FROM cys_classification.esm2_predictions
      UNION ALL SELECT 'Geometric SS', count(*)::text, count(DISTINCT domain_id)::text FROM cys_classification.geometric_disulfides
      UNION ALL SELECT 'PDB SSBOND', count(*)::text, count(DISTINCT domain_id)::text FROM cys_classification.pdb_ssbonds
      UNION ALL SELECT 'PDB Metal LINK', count(*)::text, count(DISTINCT domain_id)::text FROM cys_classification.pdb_metal_links
    `);
  } catch {
    // esm2_predictions table may not exist yet — fall back without it
    rows = await query<{ method: string; records: string; domains: string }>(`
      SELECT 'Geometric SS' as method, count(*)::text as records, count(DISTINCT domain_id)::text as domains FROM cys_classification.geometric_disulfides
      UNION ALL SELECT 'PDB SSBOND', count(*)::text, count(DISTINCT domain_id)::text FROM cys_classification.pdb_ssbonds
      UNION ALL SELECT 'PDB Metal LINK', count(*)::text, count(DISTINCT domain_id)::text FROM cys_classification.pdb_metal_links
    `);
  }

  const meta: Record<string, { description: string; type: 'prediction' | 'annotation' }> = {
    'ESM2 3-state': { description: 'Per-cysteine 3-class prediction (Neg/Dis/Met) via fine-tuned ESM2', type: 'prediction' },
    'Geometric SS': { description: 'Disulfide bonds detected by S\u03B3-S\u03B3 distance < 2.5 \u00C5', type: 'prediction' },
    'PDB SSBOND': { description: 'Experimental disulfide bonds from PDB SSBOND records', type: 'annotation' },
    'PDB Metal LINK': { description: 'Metal coordination from PDB LINK/SITE records', type: 'annotation' },
  };

  return rows.map((r) => ({
    method: r.method,
    description: meta[r.method]?.description || '',
    type: meta[r.method]?.type || 'prediction',
    records: parseInt(r.records),
    domains: parseInt(r.domains),
  }));
}

export async function getXGroupBreakdown(): Promise<XGroupBreakdown[]> {
  const rows = await query<{
    x_group_id: string;
    x_group_name: string;
    n_disulfide: string;
    n_metal: string;
    n_unclassified: string;
    total: string;
  }>(
    `SELECT fa.x_group_id,
            COALESCE(c.name, fa.x_group_id) as x_group_name,
            count(*) FILTER (WHERE cc.classification = 'DISULFIDE')::text as n_disulfide,
            count(*) FILTER (WHERE cc.classification = 'METAL_BINDING')::text as n_metal,
            count(*) FILTER (WHERE cc.classification = 'UNCLASSIFIED')::text as n_unclassified,
            count(*)::text as total
     FROM cys_classification.cysteine_classifications cc
     JOIN ecod_commons.f_group_assignments fa ON cc.domain_id = fa.domain_id
     LEFT JOIN ecod_rep.cluster c ON fa.x_group_id = c.id::text AND c.type = 'X'
     GROUP BY fa.x_group_id, c.name
     HAVING count(*) FILTER (WHERE cc.classification = 'METAL_BINDING') > 0
     ORDER BY count(*) FILTER (WHERE cc.classification = 'METAL_BINDING')::float / NULLIF(count(*), 0) DESC
     LIMIT 20`
  );

  return rows.map((r) => {
    const total = parseInt(r.total);
    const nMetal = parseInt(r.n_metal);
    return {
      xGroupId: r.x_group_id,
      xGroupName: r.x_group_name,
      nDisulfide: parseInt(r.n_disulfide),
      nMetal,
      nUnclassified: parseInt(r.n_unclassified),
      total,
      metalFraction: total > 0 ? nMetal / total : 0,
    };
  });
}

// ---- Superkingdom Taxonomy ----

export interface SuperkingdomBreakdown {
  superkingdom: string;
  nDomains: number;
  nDisulfide: number;
  nMetal: number;
  nUnclassified: number;
}

export async function getSuperkingdomBreakdown(): Promise<SuperkingdomBreakdown[]> {
  const rows = await query<{
    superkingdom: string;
    n_domains: string;
    n_disulfide: string;
    n_metal: string;
    n_unclassified: string;
  }>(
    `SELECT pt.superkingdom,
            count(DISTINCT ds.domain_id)::text as n_domains,
            COALESCE(sum(ds.n_disulfide), 0)::text as n_disulfide,
            COALESCE(sum(ds.n_metal_binding), 0)::text as n_metal,
            COALESCE(sum(ds.n_unclassified), 0)::text as n_unclassified
     FROM cys_classification.domain_summary ds
     JOIN ecod_commons.domains d ON ds.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.protein_taxonomy pt ON p.source_id = pt.source_id AND p.source_type = pt.source_type
     WHERE pt.superkingdom IS NOT NULL AND pt.superkingdom != ''
     GROUP BY pt.superkingdom
     ORDER BY count(DISTINCT ds.domain_id) DESC`
  );

  return rows.map((r) => ({
    superkingdom: r.superkingdom,
    nDomains: parseInt(r.n_domains),
    nDisulfide: parseInt(r.n_disulfide),
    nMetal: parseInt(r.n_metal),
    nUnclassified: parseInt(r.n_unclassified),
  }));
}

export async function getFamilyTaxonomy(fGroupId: string): Promise<SuperkingdomBreakdown[]> {
  const rows = await query<{
    superkingdom: string;
    n_domains: string;
    n_disulfide: string;
    n_metal: string;
    n_unclassified: string;
  }>(
    `SELECT pt.superkingdom,
            count(DISTINCT ds.domain_id)::text as n_domains,
            COALESCE(sum(ds.n_disulfide), 0)::text as n_disulfide,
            COALESCE(sum(ds.n_metal_binding), 0)::text as n_metal,
            COALESCE(sum(ds.n_unclassified), 0)::text as n_unclassified
     FROM cys_classification.domain_summary ds
     JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
     JOIN ecod_commons.domains d ON ds.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.protein_taxonomy pt ON p.source_id = pt.source_id AND p.source_type = pt.source_type
     WHERE fa.f_group_id = $1 AND pt.superkingdom IS NOT NULL AND pt.superkingdom != ''
     GROUP BY pt.superkingdom
     ORDER BY count(DISTINCT ds.domain_id) DESC`,
    [fGroupId]
  );

  return rows.map((r) => ({
    superkingdom: r.superkingdom,
    nDomains: parseInt(r.n_domains),
    nDisulfide: parseInt(r.n_disulfide),
    nMetal: parseInt(r.n_metal),
    nUnclassified: parseInt(r.n_unclassified),
  }));
}

// ---- H-group aggregates (Fig 5A,B) ----

// One row per H-group with PDB-source and AFDB-source classification
// fractions. Backs the /h-group browser confusion matrix and the
// /h-group/[id] detail header.
//
// NOTE: this query is expensive — it scans every classified F70 rep and
// aggregates per H-group. Per TRICYP_SPEC step 6 this should be replaced
// with `SELECT * FROM cys_classification.hgroup_summary` once that
// materialized view lands. The in-memory cache (24 h TTL) keeps the live
// query workable in the meantime.
export interface HGroupSummary {
  hGroupId: string;
  hGroupName: string;
  xGroupId: string;
  xGroupName: string;
  nPdbReps: number;
  nAfdbReps: number;
  pdbTotalCys: number;
  afdbTotalCys: number;
  pdbDisulfidePct: number | null;   // % of PDB-rep cys called disulfide
  pdbMetalPct: number | null;       // % of PDB-rep cys called metal-binding
  afdbDisulfidePct: number | null;  // % of AFDB-rep cys called disulfide (ESM2)
  afdbMetalPct: number | null;      // % of AFDB-rep cys called metal-binding (ESM2)
}

export async function getHGroupSummary(): Promise<HGroupSummary[]> {
  const rows = await query<{
    h_group_id: string;
    h_group_name: string;
    x_group_id: string;
    x_group_name: string;
    n_pdb_reps: string;
    n_afdb_reps: string;
    pdb_total_cys: string;
    afdb_total_cys: string;
    pdb_n_disulfide: string;
    pdb_n_metal: string;
    afdb_n_disulfide: string;
    afdb_n_metal: string;
  }>(
    `SELECT
        fa.h_group_id,
        COALESCE(hc.name, fa.h_group_id) as h_group_name,
        fa.x_group_id,
        COALESCE(xc.name, fa.x_group_id) as x_group_name,
        count(DISTINCT d.id) FILTER (WHERE p.source_type = 'pdb')::text as n_pdb_reps,
        count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')::text as n_afdb_reps,
        COALESCE(sum(ds.total_cys) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_total_cys,
        COALESCE(sum(ds.total_cys) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_total_cys,
        COALESCE(sum(ds.n_disulfide) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_n_disulfide,
        COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_n_metal,
        COALESCE(sum(ds.n_disulfide) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_n_disulfide,
        COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_n_metal
     FROM cys_classification.domain_summary ds
     JOIN ecod_commons.domains d ON ds.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
     JOIN ecod_commons.domain_clusters dc ON d.id = dc.domain_id
     JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
     LEFT JOIN ecod_rep.cluster hc ON fa.h_group_id = hc.id::text AND hc.type = 'H'
     LEFT JOIN ecod_rep.cluster xc ON fa.x_group_id = xc.id::text AND xc.type = 'X'
     WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
     GROUP BY fa.h_group_id, hc.name, fa.x_group_id, xc.name
     HAVING count(DISTINCT d.id) >= 1`,
  );

  return rows.map((r) => {
    const pdbTotal = parseInt(r.pdb_total_cys);
    const afdbTotal = parseInt(r.afdb_total_cys);
    const pdbDis = parseInt(r.pdb_n_disulfide);
    const pdbMet = parseInt(r.pdb_n_metal);
    const afdbDis = parseInt(r.afdb_n_disulfide);
    const afdbMet = parseInt(r.afdb_n_metal);
    return {
      hGroupId: r.h_group_id,
      hGroupName: r.h_group_name,
      xGroupId: r.x_group_id,
      xGroupName: r.x_group_name,
      nPdbReps: parseInt(r.n_pdb_reps),
      nAfdbReps: parseInt(r.n_afdb_reps),
      pdbTotalCys: pdbTotal,
      afdbTotalCys: afdbTotal,
      pdbDisulfidePct: pdbTotal > 0 ? (pdbDis / pdbTotal) * 100 : null,
      pdbMetalPct: pdbTotal > 0 ? (pdbMet / pdbTotal) * 100 : null,
      afdbDisulfidePct: afdbTotal > 0 ? (afdbDis / afdbTotal) * 100 : null,
      afdbMetalPct: afdbTotal > 0 ? (afdbMet / afdbTotal) * 100 : null,
    };
  });
}

// ---- H-group detail (`/h-group/[id]`) ----

export interface HGroupDetail extends HGroupSummary {
  representatives: HGroupRepresentative[];
}

export interface HGroupRepresentative {
  domainId: string;
  domainDbId: number;
  sourceType: string;
  pdbId: string | null;
  uniprotAcc: string | null;
  fGroupId: string;
  fGroupName: string;
  totalCys: number;
  nDisulfide: number;
  nMetalBinding: number;
  nUnclassified: number;
}

export async function getHGroupDetail(hGroupId: string): Promise<HGroupDetail | null> {
  const summaryRow = await queryOne<{
    h_group_id: string;
    h_group_name: string;
    x_group_id: string;
    x_group_name: string;
    n_pdb_reps: string;
    n_afdb_reps: string;
    pdb_total_cys: string;
    afdb_total_cys: string;
    pdb_n_disulfide: string;
    pdb_n_metal: string;
    afdb_n_disulfide: string;
    afdb_n_metal: string;
  }>(
    `SELECT
        fa.h_group_id,
        COALESCE(hc.name, fa.h_group_id) as h_group_name,
        fa.x_group_id,
        COALESCE(xc.name, fa.x_group_id) as x_group_name,
        count(DISTINCT d.id) FILTER (WHERE p.source_type = 'pdb')::text as n_pdb_reps,
        count(DISTINCT d.id) FILTER (WHERE p.source_type <> 'pdb')::text as n_afdb_reps,
        COALESCE(sum(ds.total_cys) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_total_cys,
        COALESCE(sum(ds.total_cys) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_total_cys,
        COALESCE(sum(ds.n_disulfide) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_n_disulfide,
        COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type = 'pdb'), 0)::text as pdb_n_metal,
        COALESCE(sum(ds.n_disulfide) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_n_disulfide,
        COALESCE(sum(ds.n_metal_binding) FILTER (WHERE p.source_type <> 'pdb'), 0)::text as afdb_n_metal
     FROM cys_classification.domain_summary ds
     JOIN ecod_commons.domains d ON ds.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
     JOIN ecod_commons.domain_clusters dc ON d.id = dc.domain_id
     JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
     LEFT JOIN ecod_rep.cluster hc ON fa.h_group_id = hc.id::text AND hc.type = 'H'
     LEFT JOIN ecod_rep.cluster xc ON fa.x_group_id = xc.id::text AND xc.type = 'X'
     WHERE cr.parameter_set_id = 2 AND dc.is_representative = TRUE
       AND fa.h_group_id = $1
     GROUP BY fa.h_group_id, hc.name, fa.x_group_id, xc.name`,
    [hGroupId],
  );

  if (!summaryRow) return null;

  const repRows = await query<{
    domain_id: string;
    domain_db_id: number;
    source_type: string;
    pdb_id: string | null;
    uniprot_acc: string | null;
    f_group_id: string;
    f_group_name: string;
    total_cys: number | null;
    n_disulfide: number | null;
    n_metal_binding: number | null;
    n_unclassified: number | null;
  }>(
    `SELECT d.domain_id, d.id as domain_db_id, p.source_type, p.pdb_id, p.uniprot_acc,
            fa.f_group_id,
            COALESCE(fc.name, fa.f_group_id) as f_group_name,
            ds.total_cys, ds.n_disulfide, ds.n_metal_binding, ds.n_unclassified
     FROM ecod_commons.f_group_assignments fa
     JOIN ecod_commons.domains d ON fa.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.domain_clusters dc ON d.id = dc.domain_id
     JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
     LEFT JOIN cys_classification.domain_summary ds ON d.id = ds.domain_id
     LEFT JOIN ecod_rep.cluster fc ON fa.f_group_id = fc.id::text AND fc.type = 'F'
     WHERE fa.h_group_id = $1 AND cr.parameter_set_id = 2 AND dc.is_representative = TRUE
     ORDER BY p.source_type, ds.n_metal_binding DESC NULLS LAST, d.domain_id`,
    [hGroupId],
  );

  const pdbTotal = parseInt(summaryRow.pdb_total_cys);
  const afdbTotal = parseInt(summaryRow.afdb_total_cys);
  const pdbDis = parseInt(summaryRow.pdb_n_disulfide);
  const pdbMet = parseInt(summaryRow.pdb_n_metal);
  const afdbDis = parseInt(summaryRow.afdb_n_disulfide);
  const afdbMet = parseInt(summaryRow.afdb_n_metal);

  return {
    hGroupId: summaryRow.h_group_id,
    hGroupName: summaryRow.h_group_name,
    xGroupId: summaryRow.x_group_id,
    xGroupName: summaryRow.x_group_name,
    nPdbReps: parseInt(summaryRow.n_pdb_reps),
    nAfdbReps: parseInt(summaryRow.n_afdb_reps),
    pdbTotalCys: pdbTotal,
    afdbTotalCys: afdbTotal,
    pdbDisulfidePct: pdbTotal > 0 ? (pdbDis / pdbTotal) * 100 : null,
    pdbMetalPct: pdbTotal > 0 ? (pdbMet / pdbTotal) * 100 : null,
    afdbDisulfidePct: afdbTotal > 0 ? (afdbDis / afdbTotal) * 100 : null,
    afdbMetalPct: afdbTotal > 0 ? (afdbMet / afdbTotal) * 100 : null,
    representatives: repRows.map((r) => ({
      domainId: r.domain_id,
      domainDbId: r.domain_db_id,
      sourceType: r.source_type,
      pdbId: r.pdb_id,
      uniprotAcc: r.uniprot_acc,
      fGroupId: r.f_group_id,
      fGroupName: r.f_group_name,
      totalCys: r.total_cys ?? 0,
      nDisulfide: r.n_disulfide ?? 0,
      nMetalBinding: r.n_metal_binding ?? 0,
      nUnclassified: r.n_unclassified ?? 0,
    })),
  };
}

// ---- Source-type breakdown (Fig S2) ----

export interface SourceTypeBreakdown {
  sourceType: string;
  nDomains: number;
  nDisulfide: number;
  nMetal: number;
  nUnclassified: number;
}

export async function getSourceTypeBreakdown(): Promise<SourceTypeBreakdown[]> {
  const rows = await query<{
    source_type: string;
    n_domains: string;
    n_disulfide: string;
    n_metal: string;
    n_unclassified: string;
  }>(
    `SELECT p.source_type,
            count(DISTINCT ds.domain_id)::text as n_domains,
            COALESCE(sum(ds.n_disulfide), 0)::text as n_disulfide,
            COALESCE(sum(ds.n_metal_binding), 0)::text as n_metal,
            COALESCE(sum(ds.n_unclassified), 0)::text as n_unclassified
     FROM cys_classification.domain_summary ds
     JOIN ecod_commons.domains d ON ds.domain_id = d.id
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     GROUP BY p.source_type
     ORDER BY count(DISTINCT ds.domain_id) DESC`,
  );

  return rows.map((r) => ({
    sourceType: r.source_type,
    nDomains: parseInt(r.n_domains),
    nDisulfide: parseInt(r.n_disulfide),
    nMetal: parseInt(r.n_metal),
    nUnclassified: parseInt(r.n_unclassified),
  }));
}

// ---- Confidence Distribution ----

export interface ConfidenceBucket {
  bucket: string;
  classification: string;
  count: number;
}

export async function getConfidenceDistribution(): Promise<ConfidenceBucket[]> {
  const rows = await query<{ bucket: string; classification: string; count: string }>(
    `SELECT
       CASE width_bucket(confidence, 0.3, 1.0, 7)
         WHEN 1 THEN '0.3-0.4'
         WHEN 2 THEN '0.4-0.5'
         WHEN 3 THEN '0.5-0.6'
         WHEN 4 THEN '0.6-0.7'
         WHEN 5 THEN '0.7-0.8'
         WHEN 6 THEN '0.8-0.9'
         WHEN 7 THEN '0.9-1.0'
         ELSE '<0.3'
       END as bucket,
       classification,
       count(*)::text as count
     FROM cys_classification.cysteine_classifications
     WHERE confidence IS NOT NULL
     GROUP BY 1, classification
     ORDER BY 1, classification`
  );

  return rows.map((r) => ({
    bucket: r.bucket,
    classification: r.classification,
    count: parseInt(r.count),
  }));
}

// ---- Family Index ----

export interface FamilyListItem {
  fGroupId: string;
  fGroupName: string;
  xGroupId: string;
  xGroupName: string;
  domainCount: number;
  totalCys: number;
  nDisulfide: number;
  nMetal: number;
  nUnclassified: number;
}

export async function getFamilyList(
  page: number = 1,
  limit: number = 50,
  sortBy: string = 'n_metal',
  sortDir: 'asc' | 'desc' = 'desc'
): Promise<{ items: FamilyListItem[]; total: number }> {
  const allowedSorts: Record<string, string> = {
    f_group_id: 'fa.f_group_id',
    f_group_name: "COALESCE(fc.name, fa.f_group_id)",
    x_group_name: "COALESCE(xc.name, fa.x_group_id)",
    domain_count: 'count(DISTINCT ds.domain_id)',
    total_cys: 'sum(ds.total_cys)',
    n_disulfide: 'sum(ds.n_disulfide)',
    n_metal: 'sum(ds.n_metal_binding)',
    n_unclassified: 'sum(ds.n_unclassified)',
  };

  const orderCol = allowedSorts[sortBy] || 'n_metal';
  const orderDir = sortDir === 'desc' ? 'DESC' : 'ASC';
  const offset = (page - 1) * limit;

  const [countResult, rows] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT count(DISTINCT fa.f_group_id)::text as count
       FROM cys_classification.domain_summary ds
       JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id`
    ),
    query<{
      f_group_id: string;
      f_group_name: string;
      x_group_id: string;
      x_group_name: string;
      domain_count: string;
      total_cys: string;
      n_disulfide: string;
      n_metal: string;
      n_unclassified: string;
    }>(
      `SELECT fa.f_group_id,
              COALESCE(fc.name, fa.f_group_id) as f_group_name,
              fa.x_group_id,
              COALESCE(xc.name, fa.x_group_id) as x_group_name,
              count(DISTINCT ds.domain_id)::text as domain_count,
              sum(ds.total_cys)::text as total_cys,
              sum(ds.n_disulfide)::text as n_disulfide,
              sum(ds.n_metal_binding)::text as n_metal,
              sum(ds.n_unclassified)::text as n_unclassified
       FROM cys_classification.domain_summary ds
       JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
       LEFT JOIN ecod_rep.cluster fc ON fa.f_group_id = fc.id::text AND fc.type = 'F'
       LEFT JOIN ecod_rep.cluster xc ON fa.x_group_id = xc.id::text AND xc.type = 'X'
       GROUP BY fa.f_group_id, fc.name, fa.x_group_id, xc.name
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);

  return {
    total: parseInt(countResult?.count || '0'),
    items: rows.map((r) => ({
      fGroupId: r.f_group_id,
      fGroupName: r.f_group_name,
      xGroupId: r.x_group_id,
      xGroupName: r.x_group_name,
      domainCount: parseInt(r.domain_count),
      totalCys: parseInt(r.total_cys),
      nDisulfide: parseInt(r.n_disulfide),
      nMetal: parseInt(r.n_metal),
      nUnclassified: parseInt(r.n_unclassified),
    })),
  };
}

// ---- Family Detail ----

export async function getFamilyInfo(fGroupId: string): Promise<FamilyInfo | null> {
  // Get family info from f_group_assignments and names from ecod_rep.cluster
  const [infoRow, aggRow] = await Promise.all([
    queryOne<{
      f_group_id: string;
      f_group_name: string;
      t_group_id: string;
      t_group_name: string;
      h_group_id: string;
      h_group_name: string;
      x_group_id: string;
      x_group_name: string;
      domain_count: string;
    }>(
      `SELECT DISTINCT ON (fa.f_group_id)
              fa.f_group_id,
              COALESCE(fc.name, fa.f_group_id) as f_group_name,
              fa.t_group_id,
              COALESCE(tc.name, fa.t_group_id) as t_group_name,
              fa.h_group_id,
              COALESCE(hc.name, fa.h_group_id) as h_group_name,
              fa.x_group_id,
              COALESCE(xc.name, fa.x_group_id) as x_group_name,
              (SELECT count(*)
               FROM ecod_commons.f_group_assignments fa2
               JOIN ecod_commons.domain_clusters dc ON fa2.domain_id = dc.domain_id
               JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
               WHERE fa2.f_group_id = $1 AND cr.parameter_set_id = 2 AND dc.is_representative = TRUE
              )::text as domain_count
       FROM ecod_commons.f_group_assignments fa
       LEFT JOIN ecod_rep.cluster fc ON fa.f_group_id = fc.id::text AND fc.type = 'F'
       LEFT JOIN ecod_rep.cluster tc ON fa.t_group_id = tc.id::text AND tc.type = 'T'
       LEFT JOIN ecod_rep.cluster hc ON fa.h_group_id = hc.id::text AND hc.type = 'H'
       LEFT JOIN ecod_rep.cluster xc ON fa.x_group_id = xc.id::text AND xc.type = 'X'
       WHERE fa.f_group_id = $1`,
      [fGroupId]
    ),
    queryOne<{
      total_cys: string;
      n_disulfide: string;
      n_metal_binding: string;
      n_unclassified: string;
    }>(
      `SELECT COALESCE(sum(ds.total_cys), 0)::text as total_cys,
              COALESCE(sum(ds.n_disulfide), 0)::text as n_disulfide,
              COALESCE(sum(ds.n_metal_binding), 0)::text as n_metal_binding,
              COALESCE(sum(ds.n_unclassified), 0)::text as n_unclassified
       FROM cys_classification.domain_summary ds
       JOIN ecod_commons.f_group_assignments fa ON ds.domain_id = fa.domain_id
       WHERE fa.f_group_id = $1`,
      [fGroupId]
    ),
  ]);

  if (!infoRow) return null;

  return {
    fGroupId: infoRow.f_group_id,
    fGroupName: infoRow.f_group_name,
    tGroupId: infoRow.t_group_id,
    tGroupName: infoRow.t_group_name,
    hGroupId: infoRow.h_group_id,
    hGroupName: infoRow.h_group_name,
    xGroupId: infoRow.x_group_id,
    xGroupName: infoRow.x_group_name,
    domainCount: parseInt(infoRow.domain_count),
    totalCys: parseInt(aggRow?.total_cys || '0'),
    nDisulfide: parseInt(aggRow?.n_disulfide || '0'),
    nMetalBinding: parseInt(aggRow?.n_metal_binding || '0'),
    nUnclassified: parseInt(aggRow?.n_unclassified || '0'),
  };
}

export async function getFamilyDomains(
  fGroupId: string,
  page: number = 1,
  limit: number = 50,
  sortBy: string = 'domain_id',
  sortDir: 'asc' | 'desc' = 'asc'
): Promise<{ items: FamilyDomain[]; total: number }> {
  const allowedSorts: Record<string, string> = {
    domain_id: 'd.domain_id',
    source_type: 'p.source_type',
    total_cys: 'ds.total_cys',
    n_disulfide: 'ds.n_disulfide',
    n_metal_binding: 'ds.n_metal_binding',
    n_unclassified: 'ds.n_unclassified',
  };

  const orderCol = allowedSorts[sortBy] || 'd.domain_id';
  const orderDir = sortDir === 'desc' ? 'DESC' : 'ASC';
  const offset = (page - 1) * limit;

  const [countResult, rows] = await Promise.all([
    queryOne<{ count: string }>(
      `SELECT count(*)::text as count
       FROM ecod_commons.f_group_assignments fa
       JOIN ecod_commons.domains d ON fa.domain_id = d.id
       JOIN ecod_commons.domain_clusters dc ON d.id = dc.domain_id
       JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
       WHERE fa.f_group_id = $1 AND cr.parameter_set_id = 2 AND dc.is_representative = TRUE`,
      [fGroupId]
    ),
    query<{
      domain_id: string;
      domain_db_id: number;
      source_type: string;
      pdb_id: string | null;
      total_cys: number | null;
      n_disulfide: number | null;
      n_metal_binding: number | null;
      n_unclassified: number | null;
    }>(
      `SELECT d.domain_id, d.id as domain_db_id, p.source_type, p.pdb_id,
              ds.total_cys, ds.n_disulfide, ds.n_metal_binding, ds.n_unclassified
       FROM ecod_commons.f_group_assignments fa
       JOIN ecod_commons.domains d ON fa.domain_id = d.id
       JOIN ecod_commons.proteins p ON d.protein_id = p.id
       JOIN ecod_commons.domain_clusters dc ON d.id = dc.domain_id
       JOIN ecod_commons.clustering_runs cr ON dc.clustering_run_id = cr.id
       LEFT JOIN cys_classification.domain_summary ds ON d.id = ds.domain_id
       WHERE fa.f_group_id = $1 AND cr.parameter_set_id = 2 AND dc.is_representative = TRUE
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $2 OFFSET $3`,
      [fGroupId, limit, offset]
    ),
  ]);

  return {
    total: parseInt(countResult?.count || '0'),
    items: rows.map((r) => ({
      domainId: r.domain_id,
      domainDbId: r.domain_db_id,
      sourceType: r.source_type,
      pdbId: r.pdb_id,
      totalCys: r.total_cys ?? 0,
      nDisulfide: r.n_disulfide ?? 0,
      nMetalBinding: r.n_metal_binding ?? 0,
      nUnclassified: r.n_unclassified ?? 0,
    })),
  };
}

// ---- Domain ----

export async function getDomainDetail(domainIdentifier: string | number): Promise<DomainInfo | null> {
  const isNumeric = typeof domainIdentifier === 'number' || /^\d+$/.test(String(domainIdentifier));
  const whereClause = isNumeric ? 'd.id = $1' : 'd.domain_id = $1';
  const param = isNumeric ? Number(domainIdentifier) : domainIdentifier;

  const row = await queryOne<{
    id: number;
    domain_id: string;
    range_definition: string;
    source_type: string;
    pdb_id: string | null;
    chain_id: string | null;
    x_group_id: string;
    h_group_id: string;
    t_group_id: string;
    f_group_id: string;
    sequence: string;
  }>(
    `SELECT d.id, d.domain_id, d.range_definition, p.source_type, p.pdb_id, p.chain_id,
            fa.x_group_id, fa.h_group_id, fa.t_group_id, fa.f_group_id,
            seq.sequence
     FROM ecod_commons.domains d
     JOIN ecod_commons.proteins p ON d.protein_id = p.id
     JOIN ecod_commons.f_group_assignments fa ON fa.domain_id = d.id
     JOIN ecod_commons.domain_sequences seq ON seq.domain_id = d.id
     WHERE ${whereClause}`,
    [param]
  );

  if (!row) return null;

  return {
    id: row.id,
    domainId: row.domain_id,
    rangeDefinition: row.range_definition,
    sourceType: row.source_type,
    pdbId: row.pdb_id,
    chainId: row.chain_id,
    xGroupId: row.x_group_id,
    hGroupId: row.h_group_id,
    tGroupId: row.t_group_id,
    fGroupId: row.f_group_id,
    sequence: row.sequence,
  };
}

export async function getDomainClassifications(domainDbId: number): Promise<CysteineRecord[]> {
  const rows = await query<{
    id: number;
    domain_id: number;
    cys_position: number;
    classification: string;
    confidence: number;
    evidence: string;
  }>(
    `SELECT * FROM cys_classification.cysteine_classifications
     WHERE domain_id = $1 ORDER BY cys_position`,
    [domainDbId]
  );

  return rows.map((r) => ({
    id: r.id,
    domainId: r.domain_id,
    cysPosition: r.cys_position,
    classification: r.classification as CysteineRecord['classification'],
    confidence: r.confidence,
    evidence: r.evidence,
  }));
}

export async function getDomainEvidence(domainDbId: number): Promise<DomainEvidence> {
  // ESM2 predictions may not exist yet — handle gracefully
  let esm2Rows: { domain_id: number; cys_position: number; neg_prob: number; dis_prob: number; met_prob: number }[] = [];
  try {
    esm2Rows = await query<{
      domain_id: number; cys_position: number; neg_prob: number; dis_prob: number; met_prob: number;
    }>(`SELECT * FROM cys_classification.esm2_predictions WHERE domain_id = $1 ORDER BY cys_position`, [domainDbId]);
  } catch {
    // Table doesn't exist yet
  }

  const [disulfideRows, ssbondRows, metalLinkRows] = await Promise.all([
    query<{
      id: number; domain_id: number; chain1: string; resnum1: number;
      chain2: string; resnum2: number; sg_sg_distance: number;
    }>(`SELECT * FROM cys_classification.geometric_disulfides WHERE domain_id = $1`, [domainDbId]),

    query<{
      id: number; domain_id: number; pdb_id: string; chain1: string; resnum1: number;
      chain2: string; resnum2: number; both_in_domain: boolean;
    }>(`SELECT * FROM cys_classification.pdb_ssbonds WHERE domain_id = $1`, [domainDbId]),

    query<{
      id: number; domain_id: number; pdb_id: string; metal: string;
      metal_chain: string; metal_resnum: number; coord_resname: string;
      coord_chain: string; coord_resnum: number; coord_atom: string;
      cofactor: string | null;
    }>(`SELECT * FROM cys_classification.pdb_metal_links WHERE domain_id = $1`, [domainDbId]),
  ]);

  const esm2Predictions: Esm2Prediction[] = esm2Rows.map((r) => ({
    domainId: r.domain_id, cysPosition: r.cys_position,
    negProb: r.neg_prob, disProb: r.dis_prob, metProb: r.met_prob,
  }));

  const geometricDisulfides: GeometricDisulfide[] = disulfideRows.map((r) => ({
    id: r.id, domainId: r.domain_id,
    chain1: r.chain1, resnum1: r.resnum1,
    chain2: r.chain2, resnum2: r.resnum2,
    sgSgDistance: r.sg_sg_distance,
  }));

  const pdbSsbonds: PdbSsbond[] = ssbondRows.map((r) => ({
    id: r.id, domainId: r.domain_id, pdbId: r.pdb_id,
    chain1: r.chain1, resnum1: r.resnum1,
    chain2: r.chain2, resnum2: r.resnum2,
    bothInDomain: r.both_in_domain,
  }));

  const pdbMetalLinks: PdbMetalLink[] = metalLinkRows.map((r) => ({
    id: r.id, domainId: r.domain_id, pdbId: r.pdb_id,
    metal: r.metal, metalChain: r.metal_chain, metalResnum: r.metal_resnum,
    coordResname: r.coord_resname, coordChain: r.coord_chain,
    coordResnum: r.coord_resnum, coordAtom: r.coord_atom,
    cofactor: r.cofactor,
  }));

  return { esm2Predictions, geometricDisulfides, pdbSsbonds, pdbMetalLinks };
}

// ---- Search ----

export async function searchQuery(q: string): Promise<SearchResult[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const results: SearchResult[] = [];

  // Check if it looks like a domain ID (e.g., e3h35A1)
  if (/^e\w+$/i.test(trimmed)) {
    const rows = await query<{ domain_id: string; id: number; source_type: string }>(
      `SELECT d.domain_id, d.id, p.source_type
       FROM ecod_commons.domains d
       JOIN ecod_commons.proteins p ON d.protein_id = p.id
       WHERE d.domain_id ILIKE $1
       LIMIT 10`,
      [escapeLike(trimmed) + '%']
    );
    for (const r of rows) {
      results.push({
        type: 'domain',
        id: r.domain_id,
        label: r.domain_id,
        description: `Domain (${r.source_type})`,
      });
    }
  }

  // Check if it looks like a PDB ID (4 chars)
  if (/^[0-9a-z]{4}$/i.test(trimmed)) {
    const rows = await query<{ domain_id: string; id: number }>(
      `SELECT d.domain_id, d.id
       FROM ecod_commons.domains d
       JOIN ecod_commons.proteins p ON d.protein_id = p.id
       WHERE p.pdb_id ILIKE $1
       LIMIT 20`,
      [trimmed]
    );
    for (const r of rows) {
      results.push({
        type: 'domain',
        id: r.domain_id,
        label: r.domain_id,
        description: `PDB ${trimmed.toUpperCase()}`,
      });
    }
  }

  // Check if it looks like a UniProt accession (6+ alphanumeric, starts with letter)
  if (/^[A-Z][A-Z0-9]{5,}$/i.test(trimmed) && !/^e\w+$/i.test(trimmed)) {
    const rows = await query<{ domain_id: string; id: number; source_type: string; uniprot_acc: string }>(
      `SELECT d.domain_id, d.id, p.source_type, p.uniprot_acc
       FROM ecod_commons.domains d
       JOIN ecod_commons.proteins p ON d.protein_id = p.id
       WHERE p.uniprot_acc ILIKE $1
       LIMIT 20`,
      [escapeLike(trimmed) + '%']
    );
    for (const r of rows) {
      results.push({
        type: 'domain',
        id: r.domain_id,
        label: r.domain_id,
        description: `UniProt ${r.uniprot_acc}`,
      });
    }
  }

  // Check if it looks like an F-group ID (dotted notation like 131.1.1.0)
  if (/^\d+(\.\d+)*$/.test(trimmed)) {
    const row = await queryOne<{ id: string; name: string }>(
      `SELECT c.id::text, COALESCE(c.name, c.id::text) as name
       FROM ecod_rep.cluster c
       WHERE c.id::text = $1 AND c.type = 'F'`,
      [trimmed]
    );
    if (row) {
      results.push({
        type: 'family',
        id: row.id,
        label: `F-group ${row.id}`,
        description: row.name,
      });
    }
  }

  return results;
}
