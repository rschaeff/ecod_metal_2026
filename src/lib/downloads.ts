// Manifest of files surfaced on /downloads. The page renders one row per
// entry; rows whose `path` resolves on disk show real size / mtime / SHA-256;
// missing rows show a "pending" badge so the page stays informative before
// every artefact has been deposited.
//
// Generation is server-side (scripts/dump-tsv.sh + figure_data drop) — the
// site does not produce these files at request time.

export interface DownloadEntry {
  id: string;            // stable slug, used as React key
  filename: string;      // basename, displayed verbatim
  path: string;          // public-relative path; "/data/foo.tsv" → public/data/foo.tsv
  description: string;   // 1–2 sentences, what's in the file
  format: string;        // "TSV" | "CSV" | "JSON" | "PDB" | "ZIP" | …
  schema?: string[];     // column list for tabular files
  paperFigure?: string;  // "Fig 3A" etc. for figure-data CSVs
  zenodoUrl?: string;    // optional canonical Zenodo target
  notes?: string;        // free-form caveats / generation cadence
}

export const BULK_DATA: DownloadEntry[] = [
  {
    id: 'cysteine-classifications',
    filename: 'cysteine-classifications.tsv',
    path: '/data/cysteine-classifications.tsv',
    description:
      'Canonical full dump: one row per classified cysteine across all F70 representative domains, with three-state classification, TriCyP per-class probabilities, structural-evidence tags, and ECOD hierarchy.',
    format: 'TSV',
    schema: [
      'domain_id',
      'cys_position',
      'classification',
      'p_neg',
      'p_dis',
      'p_met',
      'evidence_tags',
      'f_group_id',
      'h_group_id',
      'x_group_id',
      'source_type',
      'heme_thioether',
    ],
    notes:
      'Regenerated nightly via scripts/dump-tsv.sh. SHA-256 sidecar published alongside the file. ' +
      'heme_thioether is the CX(n)CH motif for c-type heme attachment cysteines (shown on the site as their own ' +
      'class) and empty otherwise; classification keeps the model call.',
  },
  {
    id: 'domain-summary',
    filename: 'domain-summary.tsv',
    path: '/data/domain-summary.tsv',
    description:
      'Per-domain classification counts and source-type. One row per F70 representative domain.',
    format: 'TSV',
    schema: [
      'domain_id',
      'source_type',
      'pdb_id',
      'uniprot_acc',
      'total_cys',
      'n_disulfide',
      'n_metal_binding',
      'n_unclassified',
      'f_group_id',
      'h_group_id',
      'x_group_id',
    ],
  },
  {
    id: 'hgroup-aggregates',
    filename: 'hgroup-aggregates.tsv',
    path: '/data/hgroup-aggregates.tsv',
    description:
      'Per-H-group aggregate behind the H-group browser (known vs predicted fractions; extends Fig 5). One row per H-group.',
    format: 'TSV',
    schema: [
      'h_group_id',
      'h_group_name',
      'x_group_id',
      'n_pdb_reps',
      'n_afdb_reps',
      'pdb_total_cys',
      'afdb_total_cys',
      'pdb_disulfide_pct',
      'pdb_metal_pct',
      'afdb_disulfide_pct',
      'afdb_metal_pct',
    ],
  },
];

export const FIGURE_DATA: DownloadEntry[] = [
  {
    id: 'fig3a',
    filename: 'fig3a_source_stratification.csv',
    path: '/data/figure_data/fig3a_source_stratification.csv',
    description: 'Source-stratified cysteine fates: PDB-geom / PDB-TriCyP / AFDB-TriCyP × free-thiol / disulfide / metal-binding fractions.',
    format: 'CSV',
    paperFigure: 'Fig 3A',
  },
  {
    id: 'fig3b',
    filename: 'fig3b_kingdom_fractions.csv',
    path: '/data/figure_data/fig3b_kingdom_fractions.csv',
    description: 'Domain fraction vs cysteine fraction by superkingdom.',
    format: 'CSV',
    paperFigure: 'Fig 3B',
  },
  {
    id: 'fig3c',
    filename: 'fig3c_kingdom_rates.csv',
    path: '/data/figure_data/fig3c_kingdom_rates.csv',
    description: 'Per-kingdom three-state classification rates.',
    format: 'CSV',
    paperFigure: 'Fig 3C',
  },
  {
    id: 'fig3d',
    filename: 'fig3d_subcellular.csv',
    path: '/data/figure_data/fig3d_subcellular.csv',
    description: 'Disulfide and metal-binding rates per eukaryotic subcellular compartment.',
    format: 'CSV',
    paperFigure: 'Fig 3D',
  },
  {
    id: 'fig2',
    filename: 'fig2_benchmark.csv',
    path: '/data/figure_data/fig2_benchmark.csv',
    description: 'ROC + PR curves and threshold-tuning data for TriCyP vs SSBONDPredict (disulfide) and vs LMetalSite / GPSite (metal-binding).',
    format: 'CSV',
    paperFigure: 'Fig 2',
  },
  {
    id: 'figS1',
    filename: 'figS1_metal_stratification.csv',
    path: '/data/figure_data/figS1_metal_stratification.csv',
    description: 'Metal-type-stratified AUROC / AP: shared metals (Zn / Ca / Mg / Mn), iron, and iron cofactor strata across TriCyP, LMetalSite, GPSite.',
    format: 'CSV',
    paperFigure: 'S2 Fig',
  },
  {
    id: 'figS2',
    filename: 'figS2_source_breakdown.csv',
    path: '/data/figure_data/figS2_source_breakdown.csv',
    description: 'Classification by source type (PDB / AFDB / metagenomic EPP / UniParc); extends Fig 3A to all four sources.',
    format: 'CSV',
    paperFigure: 'Fig 3A (all sources)',
  },
  {
    id: 'figS3',
    filename: 'figS3_confidence_distribution.csv',
    path: '/data/figure_data/figS3_confidence_distribution.csv',
    description: 'Distribution of max-class probability across all classified cysteines (S4 Fig, panel A).',
    format: 'CSV',
    paperFigure: 'S4 Fig',
  },
  {
    id: 'fig4a',
    filename: 'fig4a_sg_distances.csv',
    path: '/data/figure_data/fig4a_sg_distances.csv',
    description: 'Nearest-cysteine Sγ–Sγ distance histogram (0.1 Å bins) for predicted disulfide cysteines in PDB and AFDB domains.',
    format: 'CSV',
    paperFigure: 'Fig 4A',
  },
  {
    id: 'fig4b',
    filename: 'fig4b_partner_location.csv',
    path: '/data/figure_data/fig4b_partner_location.csv',
    description: 'Location of the nearest cysteine within 8 Å (same domain / same chain / other chain / none) in PDB biological assemblies.',
    format: 'CSV',
    paperFigure: 'Fig 4B',
  },
  {
    id: 'fig5ab',
    filename: 'fig5ab_hgroup_confusion.csv',
    path: '/data/figure_data/fig5ab_hgroup_confusion.csv',
    description: 'Per-H-group known vs predicted disulfide and metal-binding fractions behind the H-group browser (extends Fig 5).',
    format: 'CSV',
    paperFigure: 'Fig 5 (H-group browser)',
  },
];

export interface CodeArtefact {
  id: string;
  label: string;
  description: string;
  externalUrl?: string;
  zenodoUrl?: string;
  internalPath?: string; // local public/ path, if hosted on this site
}

export const CODE_ARTEFACTS: CodeArtefact[] = [
  {
    id: 'cys3state',
    label: 'TriCyP predictor',
    description:
      'Source for the TriCyP per-cysteine classifier (predict.py, train.py and the v3 weights); a snapshot is in the Zenodo record.',
    externalUrl: 'https://github.com/conglab2020/tricyp',
    zenodoUrl: 'https://doi.org/10.5281/zenodo.24328342',
  },
  {
    id: 'model-weights',
    label: 'Model weights (best_modelA.pth … best_modelE.pth)',
    description:
      'The five TriCyP v3 classifier heads (1280 → 64 → 3 on frozen ESM2-650M embeddings) used by the published 3-state classification. Not hosted on this site; deposited on Zenodo.',
    zenodoUrl: 'https://doi.org/10.5281/zenodo.24328342',
  },
];
