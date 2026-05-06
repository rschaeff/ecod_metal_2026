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

// Paper Fig 3A: PDB-geom (geometric ground truth), PDB-ESM (PDB-source domains
// classified by ESM2), AFDB-ESM (AFDB-source domains classified by ESM2).
// Numbers from manuscript draft Fig 3A.
export const FIG_3A: Fig3ASourceRow[] = [
  {
    source: 'PDB-geom',
    nDomains: 157_480,
    freeThiolFrac: 0.668,
    disulfideFrac: 0.241,
    metalFrac: 0.091,
  },
  {
    source: 'PDB-ESM',
    nDomains: 157_480,
    freeThiolFrac: 0.741,
    disulfideFrac: 0.187,
    metalFrac: 0.072,
  },
  {
    source: 'AFDB-ESM',
    nDomains: 533_598,
    freeThiolFrac: 0.785,
    disulfideFrac: 0.157,
    metalFrac: 0.058,
  },
];

export const FIG_3A_CAPTION =
  'Cysteine fate breakdown stratified by classification source. PDB-geom uses ' +
  'geometric ground truth (Sγ–Sγ disulfides plus PDB metal LINK records); PDB-ESM ' +
  'and AFDB-ESM are ESM2-3state predictions on PDB-source and AFDB-source F70 ' +
  'representatives, respectively.';

// Paper Fig 3B: domain fraction vs cysteine fraction by superkingdom.
// Numbers (%) from manuscript draft.
export interface KingdomFractionRow {
  kingdom: string;       // 'Eukaryota' | 'Bacteria' | 'Archaea'
  domainPct: number;     // % of all classified domains
  cysteinePct: number;   // % of all classified cysteines
}

export const FIG_3B: KingdomFractionRow[] = [
  { kingdom: 'Eukaryota', domainPct: 55.0, cysteinePct: 74.1 },
  { kingdom: 'Bacteria',  domainPct: 25.4, cysteinePct: 14.1 },
  { kingdom: 'Archaea',   domainPct: 16.6, cysteinePct: 11.0 },
];

export const FIG_3B_CAPTION =
  'Eukaryotic domains contribute disproportionately to total cysteine count: ' +
  '55% of classified domains hold 74% of classified cysteines. Bacterial and ' +
  'archaeal domains are cysteine-poor by comparison.';

export const FIG_3C_CAPTION =
  'Per-kingdom three-state classification rates. Eukaryotic cysteines are ' +
  'enriched for disulfides; archaeal cysteines retain a higher metal-binding ' +
  'rate consistent with iron–sulfur cluster prevalence in archaea.';

// Paper Fig 3D: subcellular localization for eukaryotic domains. Compartments
// ordered as in the paper. Rates are fractions (0..1) of cysteines in
// classified eukaryotic domains for that compartment.
export interface SubcellularRow {
  compartment: string;
  disulfideFrac: number;
  metalFrac: number;
  nDomains: number;
}

export const FIG_3D: SubcellularRow[] = [
  { compartment: 'Extracellular',     disulfideFrac: 0.491, metalFrac: 0.024, nDomains: 28_140 },
  { compartment: 'Plasma membrane',   disulfideFrac: 0.388, metalFrac: 0.041, nDomains: 22_910 },
  { compartment: 'Endoplasmic ret.',  disulfideFrac: 0.353, metalFrac: 0.038, nDomains: 12_004 },
  { compartment: 'Golgi',             disulfideFrac: 0.293, metalFrac: 0.046, nDomains:  6_882 },
  { compartment: 'Lysosome',          disulfideFrac: 0.282, metalFrac: 0.037, nDomains:  3_117 },
  { compartment: 'Cytoplasm',         disulfideFrac: 0.124, metalFrac: 0.078, nDomains: 71_550 },
  { compartment: 'Nucleus',           disulfideFrac: 0.071, metalFrac: 0.118, nDomains: 49_088 },
  { compartment: 'Mitochondrion',     disulfideFrac: 0.108, metalFrac: 0.142, nDomains: 18_245 },
];

export const FIG_3D_CAPTION =
  'Eukaryotic-only subcellular gradient: extracellular and secretory-pathway ' +
  'compartments are disulfide-rich; cytoplasmic, nuclear, and mitochondrial ' +
  'compartments are metal-binding-rich. Source: UniProt Subcellular Location ' +
  'annotations cross-referenced to ECOD F70 representative domains.';

// Stat strip headline numbers from the manuscript draft. The dashboard prefers
// live counts from the database but falls back to these when the DB query fails.
export const PAPER_TOTALS = {
  domains: 691_078,
  cysteines: 2_706_778,
  disulfide: 456_109,
  metalBinding: 166_445,
  freeThiol: 2_084_224,
} as const;

// Data-version pin. Per TRICYP_SPEC "Open questions": the public site
// tracks the paper-publication snapshot as v1. Bump this string when the
// underlying data refresh is intentional and breaks compatibility with prior
// downloads; users cite the stamped version when they reference TriCyp.
export const DATA_VERSION = 'paper-v1' as const;

// Paper reference. Update when the bioRxiv preprint URL is assigned.
export const PAPER_REF = {
  authors: 'Yuan, Durham, Cong, Schaeffer',
  title:
    'Classification of cysteine fates in structure predictions using a protein language model',
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
    shortTitle: 'Pipeline overview',
    description: 'Pipeline diagram for ESM2-3state classification across ECOD F70 representative domains.',
    href: '/about',
    surfaceLabel: 'About / Methods',
    isMain: true,
  },
  {
    figure: 'Fig 2',
    shortTitle: 'Held-out benchmark',
    description: 'ROC + PR curves and threshold tuning for ESM2-3state vs SSBONDPredict (disulfide) and vs LMetalSite / GPSite (metal-binding).',
    href: '/benchmark',
    surfaceLabel: 'Benchmark',
    isMain: true,
  },
  {
    figure: 'Fig 3A',
    shortTitle: 'Source-stratified rates',
    description: 'Stacked bars: PDB-geom / PDB-ESM / AFDB-ESM × free-thiol / disulfide / metal-binding fractions.',
    href: '/#fig3a',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3B',
    shortTitle: 'Kingdom representation',
    description: 'Domain fraction vs cysteine fraction by superkingdom.',
    href: '/#fig3b',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3C',
    shortTitle: 'Per-kingdom rates',
    description: 'Stacked classification rates for Bacteria / Archaea / Eukaryota.',
    href: '/#fig3c',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 3D',
    shortTitle: 'Subcellular gradient',
    description: 'Eukaryotic subcellular localisation: disulfide and metal-binding rates per compartment.',
    href: '/#fig3d',
    surfaceLabel: 'Dashboard',
    isMain: true,
  },
  {
    figure: 'Fig 4',
    shortTitle: 'AF geometric scanning',
    description: 'Why AlphaFold-monomer geometric scanning is fundamentally limited as a disulfide annotation source — panels A–F with downloadable PyMOL sessions.',
    href: '/af-geometric',
    surfaceLabel: 'AlphaFold geometric scanning',
    isMain: true,
  },
  {
    figure: 'Fig 5A,B',
    shortTitle: 'H-group confusion matrix',
    description: 'Structurally-known × ESM2-predicted cysteine fractions per H-group; click-through to the H-groups in any cell.',
    href: '/h-group',
    surfaceLabel: 'H-group browser',
    isMain: true,
  },
  {
    figure: 'Fig 5C',
    shortTitle: 'Novel metal H-group · 3380.1',
    description: 'Side-by-side PDB-source and AFDB-source representatives with ESM2-predicted metal-binding cysteines highlighted.',
    href: '/h-group/3380.1',
    surfaceLabel: 'H-group 3380.1',
    isMain: true,
  },
  {
    figure: 'Fig 5D',
    shortTitle: 'Novel metal H-group · 804.1',
    description: 'Second highlighted candidate-novel metal-binding H-group.',
    href: '/h-group/804.1',
    surfaceLabel: 'H-group 804.1',
    isMain: true,
  },
  {
    figure: 'Fig 5E',
    shortTitle: 'Novel metal H-group · 3991.1',
    description: 'Third highlighted candidate-novel metal-binding H-group.',
    href: '/h-group/3991.1',
    surfaceLabel: 'H-group 3991.1',
    isMain: true,
  },
  {
    figure: 'Fig S1',
    shortTitle: 'Iron-only ROC',
    description: 'Metal-type-stratified ROC. The headline iron-only finding (ESM2 0.993 / LMetalSite 0.917 / GPSite 0.877).',
    href: '/benchmark#figS1',
    surfaceLabel: 'Benchmark',
    isMain: false,
  },
  {
    figure: 'Fig S2',
    shortTitle: 'Source-type breakdown',
    description: 'Source-type breakdown (PDB / AFDB / Prodigal / UniParc) × classification fractions.',
    href: '/#figS2',
    surfaceLabel: 'Dashboard',
    isMain: false,
  },
  {
    figure: 'Fig S3',
    shortTitle: 'Confidence distribution',
    description: 'Distribution of max-class probability across all classified cysteines.',
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

export const FIG_S2_CAPTION =
  'Source-type breakdown across F70 representative domains. PDB-source domains ' +
  'have experimental coverage; AFDB and other predicted-source domains rely on ' +
  'ESM2-3state predictions only.';

export const FIG_S3_CAPTION =
  'Distribution of max-class probability across all classified cysteines. The ' +
  'long right tail in disulfide and metal-binding classes shows that the ' +
  'positive predictions are made with high confidence; free-thiol calls ' +
  'dominate the lower-probability bins where the model is appropriately ' +
  'uncertain.';

// ----------------------------------------------------------------------------
// Benchmark numbers (Fig 2 + Fig S1)
// ----------------------------------------------------------------------------

// Operating thresholds chosen on the held-out validation set (paper Methods).
// These thresholds determine the published 3-state classification on F70 reps.
export const BENCHMARK_THRESHOLDS = {
  metalBinding: 0.972,
  disulfide: 0.742,
} as const;

// Fig S1: metal-type-stratified ROC. Iron-only is the prominent finding —
// readers were specifically pointed at this. Numbers from manuscript draft.
export interface IronOnlyEntry {
  tool: string;
  auroc: number;
}
export const BENCHMARK_IRON_ONLY: IronOnlyEntry[] = [
  { tool: 'ESM2-3state',  auroc: 0.993 },
  { tool: 'LMetalSite',   auroc: 0.917 },
  { tool: 'GPSite',       auroc: 0.877 },
];

export const BENCHMARK_IRON_ONLY_TEXT =
  'On iron-only metal sites the gap between ESM2-3state and structure-aware ' +
  'baselines widens sharply: ESM2-3state reaches AUROC 0.993, while ' +
  'LMetalSite and GPSite drop to 0.917 and 0.877 respectively. Sequence-only ' +
  'classification of iron coordination is the regime where pretraining on ' +
  'evolutionary context most clearly outperforms structure-template lookup.';

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

export const BENCHMARK_TABLE: BenchmarkRow[] = [
  // Disulfide task
  { tool: 'ESM2-3state',     task: 'disulfide',     stratum: 'all',       auroc: null, ap: null },
  { tool: 'SSBONDPredict',   task: 'disulfide',     stratum: 'all',       auroc: null, ap: null },
  // Metal-binding task — all metals
  { tool: 'ESM2-3state',     task: 'metal_binding', stratum: 'all',       auroc: null, ap: null },
  { tool: 'LMetalSite',      task: 'metal_binding', stratum: 'all',       auroc: null, ap: null },
  { tool: 'GPSite',          task: 'metal_binding', stratum: 'all',       auroc: null, ap: null },
  // Metal-binding — iron-only (filled from spec)
  { tool: 'ESM2-3state',     task: 'metal_binding', stratum: 'iron_only', auroc: 0.993, ap: null },
  { tool: 'LMetalSite',      task: 'metal_binding', stratum: 'iron_only', auroc: 0.917, ap: null },
  { tool: 'GPSite',          task: 'metal_binding', stratum: 'iron_only', auroc: 0.877, ap: null },
  // Metal-binding — Zn / Ca / Mg / Mn placeholders
  { tool: 'ESM2-3state',     task: 'metal_binding', stratum: 'zn',        auroc: null, ap: null },
  { tool: 'LMetalSite',      task: 'metal_binding', stratum: 'zn',        auroc: null, ap: null },
  { tool: 'GPSite',          task: 'metal_binding', stratum: 'zn',        auroc: null, ap: null },
];

export const FIG_2_CAPTION =
  'Held-out benchmarking of three-state cysteine classification. Panels A–C ' +
  'compare ESM2-3state against SSBONDPredict for disulfide prediction (ROC, ' +
  'PR, and threshold-tuning curves). Panels D–F repeat the comparison for ' +
  'metal-binding against LMetalSite and GPSite.';

export const FIG_S1_CAPTION =
  'Metal-type-stratified ROC. The all-metal AUROC is dominated by zinc; ' +
  'stratifying by individual metal reveals that ESM2-3state generalises across ' +
  'metal types while structure-template tools degrade most on iron coordination.';

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

// Paper Fig 5C/D/E highlight three "novel cysteine-chemistry" H-groups —
// metal-binding predictions in H-groups with no PDB-source metal evidence.
// Detail pages for these IDs render the paper's side-by-side panels.
export interface HGroupHighlight {
  hGroupId: string;
  paperFigure: 'Fig 5C' | 'Fig 5D' | 'Fig 5E';
  shortDescription: string;
  pdbPseFilename: string;
  afdbPseFilename: string;
  imageFilename: string;
}

export const HGROUP_HIGHLIGHTS: Record<string, HGroupHighlight> = {
  '3380.1': {
    hGroupId: '3380.1',
    paperFigure: 'Fig 5C',
    shortDescription:
      'Candidate novel metal-binding H-group: PDB-source representatives carry no metal-LINK evidence, but ESM2-3state predicts metal-binding cysteines at high confidence in matched AFDB representatives.',
    pdbPseFilename: 'hgroup_3380_1_pdb.pse',
    afdbPseFilename: 'hgroup_3380_1_afdb.pse',
    imageFilename: 'fig5c_hgroup_3380_1.png',
  },
  '804.1': {
    hGroupId: '804.1',
    paperFigure: 'Fig 5D',
    shortDescription:
      'Candidate novel metal-binding H-group with sub-threshold PDB-source evidence and high ESM2-3state metal-binding rates across AFDB-source representatives.',
    pdbPseFilename: 'hgroup_804_1_pdb.pse',
    afdbPseFilename: 'hgroup_804_1_afdb.pse',
    imageFilename: 'fig5d_hgroup_804_1.png',
  },
  '3991.1': {
    hGroupId: '3991.1',
    paperFigure: 'Fig 5E',
    shortDescription:
      'Candidate novel metal-binding H-group: third example illustrating the "low PDB known, high ESM2 predicted" cell of the Fig 5 confusion matrix.',
    pdbPseFilename: 'hgroup_3991_1_pdb.pse',
    afdbPseFilename: 'hgroup_3991_1_afdb.pse',
    imageFilename: 'fig5e_hgroup_3991_1.png',
  },
};

export const FIG_5AB_CAPTION =
  'H-groups binned by structurally-known cysteine fraction (PDB-source ' +
  'representatives) versus ESM2-predicted cysteine fraction (all F70 ' +
  'representatives in the H-group). Cells in the lower-right quadrant — ' +
  'low structural evidence, high ESM2 prediction — flag candidate novel ' +
  'cysteine-chemistry H-groups; the manuscript highlights 12 disulfide and ' +
  '3 metal-binding such cells.';

// ----------------------------------------------------------------------------
// AlphaFold geometric scanning (Fig 4)
// ----------------------------------------------------------------------------

export const FIG_4_THESIS =
  'AlphaFold-monomer geometric scanning is fundamentally limited as a ' +
  'disulfide-bond predictor. AFDB-monomer models do not place Sγ atoms within ' +
  'the geometric tolerance of an experimental disulfide bond often enough to ' +
  'serve as an annotation source: well-conserved disulfides in PDB experimental ' +
  'structures are repeatedly placed beyond the Sγ–Sγ cutoff in matched AFDB ' +
  'models, even when sequence identity to a templated PDB structure is high.';

export interface Fig4PanelMeta {
  panel: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  title: string;
  caption: string;
  imageFilename: string;
}

export const FIG_4_PANELS: Fig4PanelMeta[] = [
  {
    panel: 'A',
    title: 'Geometric scanning recall',
    caption:
      'Sγ–Sγ geometric scanning of AFDB-monomer models recovers only a small ' +
      'fraction of disulfides annotated in matched PDB experimental structures, ' +
      'even at generous distance cutoffs.',
    imageFilename: 'fig4a_af_geom_overview.png',
  },
  {
    panel: 'B',
    title: 'Sγ–Sγ distance distributions',
    caption:
      'Distribution of Sγ–Sγ distances in AFDB models for cysteine pairs that ' +
      'form an experimental disulfide in the matched PDB structure. The bulk of ' +
      'the distribution sits well above the 2.5 Å disulfide bond cutoff.',
    imageFilename: 'fig4b_af_geom_distance.png',
  },
  {
    panel: 'C',
    title: 'PAE attenuation',
    caption:
      'Predicted aligned error between disulfide-paired cysteines does not ' +
      'predict whether the AFDB model places them within geometric tolerance, ' +
      'i.e., low PAE alone is not sufficient to recover the bond geometry.',
    imageFilename: 'fig4c_af_geom_pae.png',
  },
  {
    panel: 'D',
    title: 'Example 1 — AFDB vs PDB',
    caption:
      'Cartoon overlay of an AFDB-monomer model and matched PDB experimental ' +
      'structure showing a disulfide that is correctly geometric in the PDB ' +
      'structure but absent from AFDB at any reasonable cutoff.',
    imageFilename: 'fig4d_af_geom_example1.png',
  },
  {
    panel: 'E',
    title: 'Example 2 — AFDB vs PDB',
    caption:
      'Second AFDB / PDB pair with the same failure mode: an experimentally ' +
      'observed disulfide is placed beyond Sγ–Sγ geometric tolerance in the ' +
      'AFDB model.',
    imageFilename: 'fig4e_af_geom_example2.png',
  },
  {
    panel: 'F',
    title: 'Example 3 — AFDB vs PDB',
    caption:
      'Third AFDB / PDB pair illustrating the limitation across structurally ' +
      'distinct domains.',
    imageFilename: 'fig4f_af_geom_example3.png',
  },
];

// Panels D / E / F come with downloadable structure assets so readers can
// inspect the cysteine-pair geometry locally. Identifiers are placeholders
// until the manuscript supplementary specifies the exact UniProt and PDB
// codes; see public/structures/README.md for the expected files.
export interface Fig4StructureExample {
  panel: 'D' | 'E' | 'F';
  uniprotAcc: string | null;
  afdbId: string | null;     // e.g., "AF-P12345-F1"
  pdbId: string | null;      // e.g., "1ABC"
  chainId: string | null;
  pseFilename: string;       // PyMOL session, served from /structures/
  afdbPdbFilename: string;   // AFDB cif/pdb dump, served from /structures/
  pdbFilename: string;       // matched experimental PDB, served from /structures/
  notes?: string;
}

export const FIG_4_STRUCTURES: Fig4StructureExample[] = [
  {
    panel: 'D',
    uniprotAcc: null,
    afdbId: null,
    pdbId: null,
    chainId: null,
    pseFilename: 'fig4d_example1.pse',
    afdbPdbFilename: 'fig4d_example1_afdb.pdb',
    pdbFilename: 'fig4d_example1_pdb.pdb',
  },
  {
    panel: 'E',
    uniprotAcc: null,
    afdbId: null,
    pdbId: null,
    chainId: null,
    pseFilename: 'fig4e_example2.pse',
    afdbPdbFilename: 'fig4e_example2_afdb.pdb',
    pdbFilename: 'fig4e_example2_pdb.pdb',
  },
  {
    panel: 'F',
    uniprotAcc: null,
    afdbId: null,
    pdbId: null,
    chainId: null,
    pseFilename: 'fig4f_example3.pse',
    afdbPdbFilename: 'fig4f_example3_afdb.pdb',
    pdbFilename: 'fig4f_example3_pdb.pdb',
  },
];

