// Frozen numbers from the manuscript's main + supplementary figures.
// These back panels we cannot yet derive live from the database (Fig 3A
// source-stratified counts, Fig 3D subcellular). Step 6 of the TriCyp
// implementation order materializes the underlying tables; once that
// lands, the corresponding panels can switch to live queries.

export interface Fig3ASourceRow {
  source: string;          // x-axis label
  nDomains: number;        // panel-A subtotal
  freeThiolFrac: number;   // 0..1
  disulfideFrac: number;
  metalFrac: number;
}

// Paper Fig 3A: PDB-geom (geometric ground truth), PDB-TriCyP (PDB-source domains
// classified by TriCyP), AFDB-TriCyP (AFDB-source domains classified by TriCyP).
// Numbers transcribed from the current manuscript Fig 3A / results.md.
// nDomains is actually the cysteine count for the source stratum — kept under
// the existing field name for backward compatibility with consumers.
// Updated 2026-11-23 for TriCyP v3 (p(Dis) >= 0.740, p(Met) >= 0.625, argmax-gated), from
// revision/regen_runs/v3_final/l2/fig3/fig3A_by_source.tsv (the manuscript's Fig 3A source data).
// The PDB-geom row is geometric and model-independent (unchanged since 2026-09-21, when it was CORRECTED:
// its previous 0.212 / 0.080 counted geometric annotations that were not
// restricted to the 157,480 cysteines in the denominator. See
// results/regen_2026-09-21/fig3_data_RETRAIN/PDB_GEOM_SETTLEMENT.md).
export const FIG_3A: Fig3ASourceRow[] = [
  {
    source: 'PDB-geom',
    nDomains: 157_480,
    freeThiolFrac: 0.724,
    disulfideFrac: 0.199,
    metalFrac: 0.077,
  },
  {
    source: 'PDB-TriCyP',
    nDomains: 157_480,
    freeThiolFrac: 0.676,
    disulfideFrac: 0.235,
    metalFrac: 0.089,
  },
  {
    source: 'AFDB-TriCyP',
    nDomains: 2_435_246,
    freeThiolFrac: 0.743,
    disulfideFrac: 0.160,
    metalFrac: 0.097,
  },
];

export const FIG_3A_CAPTION =
  'Cysteine states by structural source. PDB-geom uses geometric criteria ' +
  '(Sγ within 3 Å of another cysteine Sγ, or of a metal atom); PDB-TriCyP and AFDB-TriCyP ' +
  'are TriCyP predictions on PDB-sourced and AFDB-sourced F70 representatives.';

// Paper Fig 3B: domain fraction vs cysteine fraction by superkingdom.
// Numbers (%) of the three superkingdoms; v3_final l2/fig3/fig3B_kingdom_shares.tsv (2026-11-23;
// model-independent, moved only by the ECOD v294 hierarchy pin).
export interface KingdomFractionRow {
  kingdom: string;       // 'Eukaryota' | 'Bacteria' | 'Archaea'
  domainPct: number;     // % of all classified domains
  cysteinePct: number;   // % of all classified cysteines
}

export const FIG_3B: KingdomFractionRow[] = [
  { kingdom: 'Eukaryota', domainPct: 55.6, cysteinePct: 74.7 },
  { kingdom: 'Bacteria',  domainPct: 25.7, cysteinePct: 14.2 },
  { kingdom: 'Archaea',   domainPct: 18.8, cysteinePct: 11.1 },
];

// Caption is intentionally number-free — Fig3BPanel renders live percentages
// directly on the bars, so spelling them in prose risks drift between live
// and paper-snapshot rows.
export const FIG_3B_CAPTION =
  'Eukaryotic domains contribute disproportionately to total cysteine count. ' +
  'Bacterial and archaeal domains are cysteine-poor by comparison; the gap ' +
  'between domain fraction and cysteine fraction is the headline of this panel.';

export const FIG_3C_CAPTION =
  'TriCyP classification rates across the three domains of life. Eukaryotic ' +
  'cysteines are enriched for disulfides; metal-binding rates fall from archaea ' +
  'to bacteria to eukaryotes, the archaeal excess reflecting a larger share of ' +
  'iron–sulfur families.';

// Paper Fig 3D: subcellular localization for eukaryotic domains. Compartments
// ordered as in the paper. Rates are fractions (0..1) of cysteines in
// classified eukaryotic domains for that compartment.
export interface SubcellularRow {
  compartment: string;
  disulfideFrac: number;
  metalFrac: number;
  nDomains: number;
}

// Snapshot from the live getSubcellularDistribution query (paper-v1 scope:
// run_id=1, source_type=afdb, eukaryotic, with uniprot_subcellular). Only
// used as a fallback when the DB is unreachable; Fig3DPanel.tsx prefers
// live rows. Refresh by running the query in src/lib/queries.ts and
// transcribing results.
// Updated 2026-09-21: adopted retrain, and recomputed against the current
// uniprot_subcellular snapshot (284,478 accessions), which is why nDomains
// moved as well. Fractions are per-cysteine; nDomains counts F70 domains.
// Updated 2026-11-23: fractions for TriCyP v3 from v3_final l2/fig3/fig3D_subcellular.tsv
// (same pinned subcellular snapshot); nDomains is model-independent and unchanged.
export const FIG_3D: SubcellularRow[] = [
  { compartment: 'Extracellular',     disulfideFrac: 0.890, metalFrac: 0.003, nDomains: 14_105 },
  { compartment: 'Plasma membrane',   disulfideFrac: 0.440, metalFrac: 0.017, nDomains: 17_846 },
  { compartment: 'Endoplasmic ret.',  disulfideFrac: 0.200, metalFrac: 0.053, nDomains:  8_171 },
  { compartment: 'Golgi',             disulfideFrac: 0.298, metalFrac: 0.038, nDomains:  6_478 },
  { compartment: 'Lysosome',          disulfideFrac: 0.330, metalFrac: 0.082, nDomains:  1_363 },
  { compartment: 'Cytoplasm',         disulfideFrac: 0.052, metalFrac: 0.094, nDomains: 36_335 },
  { compartment: 'Nucleus',           disulfideFrac: 0.020, metalFrac: 0.197, nDomains: 48_707 },
  { compartment: 'Mitochondrion',     disulfideFrac: 0.055, metalFrac: 0.064, nDomains:  9_943 },
];

export const FIG_3D_CAPTION =
  'Eukaryotic-only subcellular gradient: extracellular and secretory-pathway ' +
  'compartments are disulfide-rich; cytoplasmic, nuclear, and mitochondrial ' +
  'compartments are metal-binding-rich. Source: UniProt Subcellular Location ' +
  'annotations cross-referenced to ECOD F70 representative domains.';

// Stat strip headline numbers: TriCyP v3 catalogue (2026-11-23; = Zenodo 10.5281/zenodo.24328342). The dashboard prefers
// live counts from the database but falls back to these when the DB query fails.
export const PAPER_TOTALS = {
  domains: 691_078,
  cysteines: 2_706_778,
  disulfide: 430_871,
  metalBinding: 278_096,
  freeThiol: 1_997_811,
} as const;

// Data-version pin. Per TRICYP_SPEC "Open questions": the public site
// tracks the paper-publication snapshot as v1. Bump this string when the
// underlying data refresh is intentional and breaks compatibility with prior
// downloads; users cite the stamped version when they reference TriCyp.
export const DATA_VERSION = 'v3-2026-11' as const;  // TriCyP v3 (was 'paper-v1')

// Paper reference. Update when the bioRxiv preprint URL is assigned.
export const PAPER_REF = {
  authors: 'Yuan, Durham, Cong, Schaeffer',
  title:
    'Cataloging cysteines in ECOD domains using a protein language model',
  year: 2026,
  // Placeholder — replace with bioRxiv DOI once preprint is posted.
  doi: null as string | null,
  bioRxivUrl: null as string | null,
};

// Figure → TriCyp surface map for the /paper page. Mirrors the
// "Paper-figure correspondence" table at the top of TRICYP_SPEC.md.
export interface FigureSurfaceEntry {
  figure: string;        // "Fig 1" | "Fig 3A" | "Fig S1" …
  shortTitle: string;
  description: string;
  href: string;          // page or page#anchor
  surfaceLabel: string;  // human-readable surface name
  isMain: boolean;       // true for main figures, false for supplementary
}

export const FIGURE_TO_SURFACE: FigureSurfaceEntry[] = [
  {
    figure: 'Fig 1',
    shortTitle: 'TriCyP architecture',
    description: 'The 1280 → 64 → 3 classifier on frozen ESM-2 embeddings, and its application to ECOD F70 representative domains at p(Dis) ≥ 0.740 / p(Met) ≥ 0.625.',
    href: '/about',
    surfaceLabel: 'About / Methods',
    isMain: true,
  },
  {
    figure: 'Fig 2',
    shortTitle: 'Benchmark',
    description: 'ROC, PR and threshold curves for TriCyP vs SSBONDPredict (disulfide) and vs LMetalSite / GPSite (metal-binding) on 39,482 proteins / 151,438 cysteines.',
    href: '/benchmark',
    surfaceLabel: 'Benchmark',
    isMain: true,
  },
  {
    figure: 'Fig 3A',
    shortTitle: 'Cysteine states by structural source',
    description: 'Free thiol / disulfide / metal-binding fractions: PDB geometry, TriCyP on PDB-sourced domains, TriCyP on AFDB-sourced domains.',
    href: '/#fig3a',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3B',
    shortTitle: 'Domains vs cysteines by domain of life',
    description: 'Share of representative domains and of cysteines for Eukaryota, Bacteria and Archaea.',
    href: '/#fig3b',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3C',
    shortTitle: 'Rates by domain of life',
    description: 'TriCyP classification rates for Bacteria / Archaea / Eukaryota.',
    href: '/#fig3c',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3D',
    shortTitle: 'Subcellular gradient',
    description: 'Eukaryotic cysteine classification by subcellular localization.',
    href: '/#fig3d',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 4',
    shortTitle: 'Structural validation',
    description: 'Sγ–Sγ distances of predicted disulfide cysteines, partner location in biological assemblies, pLDDT of partnerless calls, mismodeled and inter-chain examples (panels A–G).',
    href: '/af-geometric',
    surfaceLabel: 'Structural validation',
    isMain: true,
  },
  {
    figure: 'Fig 5A',
    shortTitle: 'H-groups with the most metal-binding domains',
    description: 'H-groups ranked by their count of predicted metal-binding domains; browse and sort all H-groups in the H-group browser.',
    href: '/h-group',
    surfaceLabel: 'H-group browser',
    isMain: true,
  },
  {
    figure: 'Fig 5B',
    shortTitle: 'Novel metal H-group · 3380.1',
    description: 'PDB-sourced and AFDB-sourced representatives side by side, with TriCyP-predicted metal-binding cysteines highlighted.',
    href: '/h-group/3380.1',
    surfaceLabel: 'H-group 3380.1',
    isMain: true,
  },
  {
    figure: 'Fig 5C',
    shortTitle: 'Novel metal H-group · 804.1',
    description: 'Second previously uncharacterized metal-coordinating H-group.',
    href: '/h-group/804.1',
    surfaceLabel: 'H-group 804.1',
    isMain: true,
  },
  {
    figure: 'Fig 5D',
    shortTitle: 'Novel metal H-group · 3991.1',
    description: 'Third previously uncharacterized metal-coordinating H-group.',
    href: '/h-group/3991.1',
    surfaceLabel: 'H-group 3991.1',
    isMain: true,
  },
  {
    figure: 'S1 Fig',
    shortTitle: 'Dataset pipeline',
    description: 'How the training and benchmark datasets were built from PDB chains mapped to AlphaFold DB.',
    href: '/about#training-data',
    surfaceLabel: 'About / Methods',
    isMain: false,
  },
  {
    figure: 'S2 Fig',
    shortTitle: 'Metal-type comparison',
    description: 'Zn / Ca / Mg / Mn and iron strata: TriCyP 0.999 and 0.998 AUROC, against LMetalSite 0.996 / 0.855 and GPSite 0.997 / 0.821.',
    href: '/benchmark#figS1',
    surfaceLabel: 'Benchmark',
    isMain: false,
  },
  {
    figure: 'S4 Fig',
    shortTitle: 'Score distribution',
    description: 'Confidence (probability of the assigned class) across all classified cysteines (panel A).',
    href: '/#figS3',
    surfaceLabel: 'Dashboard',
    isMain: false,
  },
];


// Citation templates. The bioRxiv DOI / URL are filled in from PAPER_REF
// when available; until then the templates render with explicit placeholders
// so a downstream user does not accidentally cite an unresolved DOI.
export function buildBibTeX(): string {
  const doiLine = PAPER_REF.doi ? `  doi = {${PAPER_REF.doi}},\n` : '';
  const urlLine = PAPER_REF.bioRxivUrl ? `  url = {${PAPER_REF.bioRxivUrl}},\n` : '';
  return [
    '@article{yuan_tricyp_' + PAPER_REF.year + ',',
    '  title = {' + PAPER_REF.title + '},',
    '  author = {Yuan and Durham and Cong and Schaeffer},',
    '  year = {' + PAPER_REF.year + '},',
    '  journal = {bioRxiv},',
    doiLine.replace(/\n$/, ''),
    urlLine.replace(/\n$/, ''),
    '  note = {TriCyp companion site: https://tricyp.swmed.edu},',
    '}',
  ].filter(Boolean).join('\n');
}

export function buildRIS(): string {
  const lines = [
    'TY  - JOUR',
    `TI  - ${PAPER_REF.title}`,
    'AU  - Yuan',
    'AU  - Durham',
    'AU  - Cong',
    'AU  - Schaeffer, Dustin',
    `PY  - ${PAPER_REF.year}`,
    'JO  - bioRxiv',
  ];
  if (PAPER_REF.doi) lines.push(`DO  - ${PAPER_REF.doi}`);
  if (PAPER_REF.bioRxivUrl) lines.push(`UR  - ${PAPER_REF.bioRxivUrl}`);
  lines.push('ER  - ');
  return lines.join('\n');
}

export const FIG_S2_CAPTION =  // site-only panel: Fig 3A extended to all four sources
  'Classification by source type across F70 representative domains, extending ' +
  'Fig 3A to metagenomic (EPP) and UniParc representatives. PDB-sourced domains ' +
  'have experimental coverage; the others rely on TriCyP predictions only.';

export const FIG_S3_CAPTION =  // shown with the paper's S4 Fig (panel A)
  'Distribution of max-class probability across all classified cysteines. The ' +
  'long right tail in disulfide and metal-binding classes shows that the ' +
  'positive predictions are made with high confidence; free-thiol calls ' +
  'dominate the lower-probability bins where the model is appropriately ' +
  'uncertain.';

// ----------------------------------------------------------------------------
// Benchmark numbers (Fig 2 + Fig S1)
// ----------------------------------------------------------------------------

// Operating thresholds: the F1 optima of TriCyP v3 (QC's step22 ensemble, trained
// on the corrected metal labels) on all 216,277 held-out labelled cysteines,
// applied to the argmax class. Adopted 2026-11. Earlier releases used 0.696 / 0.788
// (September 2026) and 0.742 / 0.972 (original); thresholds are not interchangeable.
export const BENCHMARK_THRESHOLDS = {
  metalBinding: 0.625,
  disulfide: 0.740,
} as const;

// Fig S1: metal-type-stratified ROC. Iron-only is the prominent finding —
// readers were specifically pointed at this. Numbers from manuscript draft.
export interface IronOnlyEntry {
  tool: string;
  auroc: number;
}
// BENCHMARK_IRON_ONLY is defined further down, after BENCHMARK_TABLE,
// since it is derived from BENCHMARK_TABLE.

export const BENCHMARK_IRON_ONLY_TEXT =
  'The iron-stratum AUROC gap reflects training-set scope rather than ' +
  'algorithmic superiority. TriCyP was trained directly on ' +
  'cysteine 3-state labels covering Fe / Fe-S / heme coordination; ' +
  'LMetalSite and GPSite were trained on Zn / Ca / Mg / Mn binding. On ' +
  'the metals all three tools share training coverage (Zn / Ca / Mg / ' +
  'Mn) the AUROC values are essentially tied (0.996–0.999). The ' +
  'difference shows up specifically on iron coordination (TriCyP 0.998 ' +
  'vs LMetalSite 0.855 vs GPSite 0.821), including heme (0.998 vs ' +
  '0.853 vs 0.725) — a sub-domain the specialist tools were not designed for. ' +
  'Read the iron-stratum advantage as a coverage statement, not a ' +
  'head-to-head outperformance claim.';

// Fig 2 + Fig S1: per-tool, per-stratum AUROC and AP. Numbers not yet
// transcribed from the paper figure_data CSVs are marked `null`; the page
// renders these as em-dashes until the CSVs are loaded.
export interface BenchmarkRow {
  tool: string;
  task: 'disulfide' | 'metal_binding';
  stratum: string;       // 'all' | 'iron_only' | 'zn' | 'ca' | 'mg' | 'mn'
  auroc: number | null;
  ap: number | null;     // average precision
}

// BENCHMARK_TABLE is derived from src/lib/data/benchmark_metrics.json,
// which is regenerated by scripts/etl/benchmark_web_panels.py at the same
// time as the figures in public/figures/. The figure annotations and the
// page text therefore always come from a single source — re-running the
// script updates both. Since 2026-11-23 the JSON carries the v3 benchmark
// (39,482 proteins / 151,438 cysteines; scripts/etl/benchmark_web_panels_v3.py),
// the evaluation set of the manuscript's Fig 2, S2 Fig and S2 Table.
import benchmarkMetrics from './data/benchmark_metrics.json';

interface RawBenchmarkMetric {
  tool: string;
  task: 'disulfide' | 'metal_binding';
  stratum: string;
  auroc: number | null;
  ap: number | null;
  n_pos: number;
  n_total: number;
}

export const BENCHMARK_TABLE: BenchmarkRow[] =
  (benchmarkMetrics.metrics as RawBenchmarkMetric[]).map((m) => ({
    tool: m.tool,
    task: m.task,
    stratum: m.stratum,
    auroc: m.auroc,
    ap: m.ap,
  }));

// Generation timestamp + cysteine count from the JSON, surfaced for
// any caption that wants to cite "computed YYYY-MM-DD over N cysteines".
export const BENCHMARK_GENERATED_AT = benchmarkMetrics.generated_at as string;
export const BENCHMARK_N_CYSTEINES = benchmarkMetrics.evaluation_set.n_cysteines as number;

// Iron-stratum AUROC, derived from BENCHMARK_TABLE so any future
// benchmark re-run flows through to the iron-stratum sub-section on
// the /benchmark page without a separate transcription step.
export const BENCHMARK_IRON_ONLY: IronOnlyEntry[] = BENCHMARK_TABLE
  .filter((r) => r.task === 'metal_binding' && r.stratum === 'iron_only' && r.auroc !== null)
  .map((r) => ({ tool: r.tool, auroc: r.auroc as number }));

export const FIG_2_CAPTION =
  'Held-out benchmarking of three-state cysteine classification. Panels A–C ' +
  'compare TriCyP against SSBONDPredict for disulfide prediction (ROC, ' +
  'PR, and threshold-tuning curves). Panels D–F repeat the comparison for ' +
  'metal-binding against LMetalSite and GPSite.';

export const FIG_S1_CAPTION =
  'Metal-type-stratified ROC. On the metals all three tools were ' +
  'trained for (Zn / Ca / Mg / Mn), AUROC values are essentially tied ' +
  '(0.996–0.999). The differences in the all-metals comparison are ' +
  'entirely from the iron stratum (Fe-S clusters and heme), where ' +
  'specialist tools were not designed to predict (TriCyP 0.998, ' +
  'LMetalSite 0.855, GPSite 0.821). Iron-coordinating cysteines are ' +
  '12.7% of the metal positives in the benchmark (3,051 of 24,083).';

// ----------------------------------------------------------------------------
// H-group browser (Fig 5A,B) and detail (Fig 5C–E)
// ----------------------------------------------------------------------------

// 4 bins from Fig 5A,B confusion matrices: structurally-known × ESM2-predicted
// fractions of cysteines. Bin edges are paper-fixed.
export const HGROUP_BIN_EDGES = [0, 5, 50, 95, 100] as const;
export const HGROUP_BIN_LABELS = ['<5%', '5–50%', '50–95%', '≥95%'] as const;
export type HGroupBinIndex = 0 | 1 | 2 | 3;

export function hGroupBin(pct: number | null): HGroupBinIndex | null {
  if (pct === null || isNaN(pct)) return null;
  if (pct < 5) return 0;
  if (pct < 50) return 1;
  if (pct < 95) return 2;
  return 3;
}

// Paper Fig 5B/C/D highlight three previously uncharacterized metal-coordinating H-groups —
// metal-binding predictions in H-groups with no PDB-source metal evidence.
// Detail pages for these IDs render the paper's side-by-side panels.
export interface HGroupHighlight {
  hGroupId: string;
  paperFigure: 'Fig 5B' | 'Fig 5C' | 'Fig 5D';
  shortDescription: string;
  pdbPseFilename: string;
  afdbPseFilename: string;
  imageFilename: string;
}

export const HGROUP_HIGHLIGHTS: Record<string, HGroupHighlight> = {
  '3380.1': {
    hGroupId: '3380.1',
    paperFigure: 'Fig 5B',
    shortDescription:
      'Previously uncharacterized metal-coordinating H-group: its PDB entries show no geometric evidence of metal binding, but TriCyP predicts metal-binding cysteines in more than half of its AFDB-sourced representatives.',
    pdbPseFilename: 'hgroup_3380_1_pdb.pse',
    afdbPseFilename: 'hgroup_3380_1_afdb.pse',
    imageFilename: 'fig5c_hgroup_3380_1.png',
  },
  '804.1': {
    hGroupId: '804.1',
    paperFigure: 'Fig 5C',
    shortDescription:
      'Previously uncharacterized metal-coordinating H-group (YwqG): no geometric metal evidence in its PDB entries, metal-binding calls in most AFDB-sourced representatives.',
    pdbPseFilename: 'hgroup_804_1_pdb.pse',
    afdbPseFilename: 'hgroup_804_1_afdb.pse',
    imageFilename: 'fig5d_hgroup_804_1.png',
  },
  '3991.1': {
    hGroupId: '3991.1',
    paperFigure: 'Fig 5D',
    shortDescription:
      'Previously uncharacterized metal-coordinating H-group (Rabin8 C-terminal domain): no geometric metal evidence in its PDB entries, metal-binding calls in most AFDB-sourced representatives.',
    pdbPseFilename: 'hgroup_3991_1_pdb.pse',
    afdbPseFilename: 'hgroup_3991_1_afdb.pse',
    imageFilename: 'fig5e_hgroup_3991_1.png',
  },
};

export const FIG_5AB_CAPTION =  // site view extending paper Fig 5 (not a manuscript panel)
  'H-groups binned by structurally-known cysteine fraction (PDB-source ' +
  'representatives) versus TriCyP-predicted cysteine fraction (all F70 ' +
  'representatives in the H-group). Cells in the lower-right quadrant — ' +
  'low structural evidence, high TriCyP prediction — flag candidate novel ' +
  'cysteine-chemistry H-groups; the manuscript identifies ten metal-binding ' +
  'H-groups of this kind (at a ≥10-representative floor), two of them heme ' +
  'cytochromes whose calls are heme-thioether cysteines.';

// ----------------------------------------------------------------------------
// Structural validation and inter-protein disulfides (Fig 4)
// ----------------------------------------------------------------------------
// Rewritten 2026-11-23 to match the manuscript's Fig 4 ("Structural validation of
// TriCyP predictions and identification of inter-protein disulfides"). The page
// previously described an older Fig 4 (AlphaFold geometric scanning). Numbers are
// TriCyP v3, from revision/regen_runs/v3_final/l2/fig4{a,b,c} and fig4b_all.

export const FIG_4_TITLE = 'Structural validation and inter-protein disulfides';

export const FIG_4_THESIS =
  'Cysteines that TriCyP calls disulfide-bonded from sequence alone are, in ' +
  'experimental and predicted structures, almost always within bonding distance ' +
  'of another cysteine. The exceptions are informative: partnerless calls in ' +
  'AlphaFold models sit in low-confidence regions where the model likely failed ' +
  'to close a bond, and some mark disulfides that bridge two protein chains.';

export interface Fig4PanelMeta {
  panel: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  title: string;
  caption: string;
}

export const FIG_4_PANELS: Fig4PanelMeta[] = [
  {
    panel: 'A',
    title: 'Nearest-cysteine Sγ–Sγ distances',
    caption:
      'Minimal Sγ–Sγ distance for cysteines predicted disulfide-bonded in PDB ' +
      'experimental structures (n = 17,191) and AlphaFold models (n = 19,773). Both ' +
      'peak at ~2.03 Å, the canonical disulfide bond length; 87.4% (PDB) and 88.6% ' +
      '(AFDB) are within 2.5 Å.',
  },
  {
    panel: 'B',
    title: 'Partner location in biological assemblies',
    caption:
      'For predicted disulfide-bonded cysteines in PDB domains, the nearest cysteine ' +
      'within 8 Å in biological assembly 1 lies in the same ECOD domain (92.3%), ' +
      'elsewhere in the same chain (2.8%) or in another chain (0.8%); 4.2% have no ' +
      'cysteine within 8 Å (n = 34,890).',
  },
  {
    panel: 'C',
    title: 'pLDDT of partnerless predictions',
    caption:
      'In AlphaFold models, predicted disulfide cysteines with a nearby predicted ' +
      'partner have higher pLDDT than those without one (mean 89.2 vs 82.4).',
  },
  {
    panel: 'D',
    title: 'Mismodeled disulfide · P91069',
    caption:
      'A predicted disulfide pair (C5–C175, magenta) that the AlphaFold model leaves ' +
      '5.0 Å apart, in a low-confidence region.',
  },
  {
    panel: 'E',
    title: 'Mismodeled disulfide · O76819',
    caption:
      'A second example: C44–C51 placed 5.5 Å apart in the AlphaFold model, ' +
      'coloured by pLDDT.',
  },
  {
    panel: 'F',
    title: 'Inter-chain disulfide · TPC2 (Q8NHX9)',
    caption:
      'TriCyP calls Cys623 disulfide-bonded although the monomer model has no nearby ' +
      'cysteine. In the AlphaFold homodimer it forms a symmetric inter-chain disulfide, ' +
      'also seen in the cryo-EM structure (PDB 6NQ1).',
  },
  {
    panel: 'G',
    title: 'Inter-chain disulfides · TGFB1–LRRC32 (PDB 8VSC)',
    caption:
      'TGFB1 dimer with its activator LRRC32: TriCyP (P(Dis) > 0.740) identifies two ' +
      'of the inter-chain disulfides (magenta, blue) and misses two (orange, yellow).',
  },
];

// Inter-chain disulfides: all-cysteine scan of the same PDB domains (bonded =
// Sγ–Sγ ≤ 2.5 Å, assembly 1; task_relabel/l2/fig4b_all/RESULT.md).
export const FIG_4_INTERCHAIN = {
  bondedCysteines: 34_230,
  interChainShare: 0.025,   // 2.5% of bonded cysteines bridge two chains (~5% PDB-wide, Carugo 2022)
  interChainRecall: 0.31,
  interChainMeanPDis: 0.42,
  intraChainRecall: 0.90,
  intraChainMeanPDis: 0.91,
} as const;

export interface Fig4StructureExample {
  panel: 'D' | 'E' | 'F' | 'G';
  label: string;
  uniprotAcc: string | null;  // AlphaFold DB model to show
  pdbId: string | null;       // experimental structure, where the paper uses one
}

export const FIG_4_STRUCTURES: Fig4StructureExample[] = [
  { panel: 'D', label: 'P91069 (AlphaFold model)', uniprotAcc: 'P91069', pdbId: null },
  { panel: 'E', label: 'O76819 (AlphaFold model)', uniprotAcc: 'O76819', pdbId: null },
  { panel: 'F', label: 'TPC2 · Q8NHX9', uniprotAcc: 'Q8NHX9', pdbId: '6NQ1' },
  { panel: 'G', label: 'TGFB1–LRRC32', uniprotAcc: null, pdbId: '8VSC' },
];
