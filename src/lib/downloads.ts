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
      'Canonical full dump: one row per classified cysteine across all F70 representative domains, with three-state classification, ESM2-3state per-class probabilities, structural-evidence tags, and ECOD hierarchy.',
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
    ],
    notes:
      'Regenerated nightly via scripts/dump-tsv.sh. SHA-256 sidecar published alongside the file.',
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
      'Per-H-group aggregate underlying Fig 3C (per-kingdom rates) and Fig 5A,B (confusion matrices). One row per H-group.',
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
    description: 'Source-stratified cysteine fates: PDB-geom / PDB-ESM / AFDB-ESM × free-thiol / disulfide / metal-binding fractions.',
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
    description: 'ROC + PR curves and threshold-tuning data for ESM2-3state vs SSBONDPredict (disulfide) and vs LMetalSite / GPSite (metal-binding).',
    format: 'CSV',
    paperFigure: 'Fig 2',
  },
  {
    id: 'figS1',
    filename: 'figS1_iron_only_roc.csv',
    path: '/data/figure_data/figS1_iron_only_roc.csv',
    description: 'Metal-type-stratified ROC; iron-only is the manuscript headline finding.',
    format: 'CSV',
    paperFigure: 'Fig S1',
  },
  {
    id: 'figS2',
    filename: 'figS2_source_breakdown.csv',
    path: '/data/figure_data/figS2_source_breakdown.csv',
    description: 'Source-type breakdown across PDB / AFDB / Prodigal / UniParc.',
    format: 'CSV',
    paperFigure: 'Fig S2',
  },
  {
    id: 'figS3',
    filename: 'figS3_confidence_distribution.csv',
    path: '/data/figure_data/figS3_confidence_distribution.csv',
    description: 'Distribution of max-class probability across all classified cysteines.',
    format: 'CSV',
    paperFigure: 'Fig S3',
  },
  {
    id: 'fig4',
    filename: 'fig4_af_geometric.csv',
    path: '/data/figure_data/fig4_af_geometric.csv',
    description: 'AlphaFold geometric scanning vs PDB ground truth: distance distributions, recall, and PAE attenuation.',
    format: 'CSV',
    paperFigure: 'Fig 4',
  },
  {
    id: 'fig5ab',
    filename: 'fig5ab_hgroup_confusion.csv',
    path: '/data/figure_data/fig5ab_hgroup_confusion.csv',
    description: 'H-group confusion-matrix data underlying Fig 5A (disulfide) and Fig 5B (metal-binding).',
    format: 'CSV',
    paperFigure: 'Fig 5A,B',
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
    label: 'cys3state predictor',
    description:
      'Source for the ESM2-3state per-cysteine classifier, snapshotted at the paper-publication commit.',
    externalUrl: 'https://github.com/rschaeff/cys3state',
    zenodoUrl: undefined,
  },
  {
    id: 'model-weights',
    label: 'Model weights (best_modelA.pth … best_modelE.pth)',
    description:
      'Five fine-tuned ESM2 model checkpoints used by the published 3-state classifier. Not hosted on this site; deposited on Zenodo.',
    zenodoUrl: undefined,
  },
];
