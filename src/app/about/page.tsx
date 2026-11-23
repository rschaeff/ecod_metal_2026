import type { Metadata } from 'next';
import Link from 'next/link';
import FigureImage from '@/components/ui/FigureImage';
import CopyButton from '@/components/ui/CopyButton';
import {
  PAPER_REF,
  BENCHMARK_THRESHOLDS,
  BENCHMARK_IRON_ONLY,
  buildBibTeX,
  buildRIS,
} from '@/lib/paperData';

const PAGE_TITLE = 'About / Methods';
const PAGE_DESCRIPTION =
  'Methods overview for TriCyp: pipeline, training data, TriCyP ' +
  'model architecture, threshold selection, benchmarking, and software / ' +
  'data availability.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
  twitter: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
};

const SECTIONS = [
  { id: 'pipeline',      label: 'Pipeline' },
  { id: 'training-data', label: 'Training data' },
  { id: 'model',         label: 'Model architecture' },
  { id: 'thresholds',    label: 'Threshold selection' },
  { id: 'benchmarking',  label: 'Benchmarking' },
  { id: 'software-data', label: 'Software & data' },
  { id: 'license',       label: 'License' },
  { id: 'cite',          label: 'Cite' },
];

export default function AboutPage() {
  const bibtex = buildBibTeX();
  const ris = buildRIS();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          About / Methods
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          How TriCyp classifies cysteine fates
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          TriCyp is the companion site for TriCyP, a three-state cysteine
          classifier — disulfide-bonded, metal-binding, or free thiol — that
          works from sequence alone (ESM-2 embeddings), applied to the
          2,706,778 cysteines of the 691,078 ECOD F70 representative domains
          that contain one. Sections follow the manuscript Methods.
        </p>
      </header>

      {/* Section nav */}
      <nav className="mb-10 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Jump to
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-amber-600 dark:text-amber-400 hover:underline"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pipeline */}
      <section id="pipeline" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Pipeline
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Each domain sequence is embedded with the pretrained ESM-2 650M
          language model; the embedding at every cysteine goes to the TriCyP
          classifier, which returns probabilities for free thiol, disulfide
          and metal-binding. Probabilities are thresholded into a three-state
          call, and per-cysteine calls are aggregated to the per-domain and
          per-H-group summaries behind the dashboard, the family browser and
          the H-group browser. PDB-sourced domains also carry geometric
          annotations (Sγ–Sγ and Sγ–metal distances in the deposited
          structure), shown alongside the predictions.
        </p>
        <div className="mt-4">
          <FigureImage
            src="/figures/fig1_pipeline.png"
            alt="Fig 1 — pipeline overview"
            label="Fig 1 · Pipeline"
            description="Paper Fig 1: the TriCyP network (1,280-dimensional ESM-2 embedding → 64 hidden units → 3 classes) and its application to ECOD F70 representative domains."
            className="w-full"
          />
        </div>
      </section>

      {/* Training data */}
      <section id="training-data" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Training data
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Labels come from the geometry of 89,698 representative,
          high-resolution PDB chains. A cysteine is disulfide-bonded if its Sγ
          is within 3 Å of another cysteine&apos;s Sγ, metal-binding if its Sγ
          is within 3 Å of a metal atom (Zn, Fe, Ca, Cu, Hg, Mg, Ni, Cd, Mn,
          Co), and a free thiol if its Sγ is more than 5 Å from any other
          cysteine or metal. Grey-zone cysteines (3–5 Å) and cysteines meeting
          both criteria are excluded. Labels are transferred to matched
          AlphaFold DB (v4) entries and made non-redundant at 90% identity,
          giving 216,278 labelled cysteines in 58,259 proteins (37,418
          disulfide, 34,452 metal-binding, 144,408 free thiol).
        </p>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Models are trained with five-fold cross-validation over 90%-identity
          sequence clusters: each fold in turn is the test set, and 25% of the
          remaining proteins are held out for early stopping. Splits by 50%
          identity, ECOD F-, H- and X-group, and a temporal split (trained
          before 2020, tested on 2020 and later) give consistent performance
          (manuscript Table 1).
        </p>
        <div className="mt-4">
          <FigureImage
            src="/figures/s1fig_dataset_pipeline.png"
            alt="S1 Fig — pipeline to prepare the training and benchmark datasets"
            label="S1 Fig · Dataset pipeline"
            description="Manuscript S1 Fig: from PDB chains to the labelled training set and the benchmark set."
            className="w-full"
          />
        </div>
      </section>

      {/* Model */}
      <section id="model" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Model architecture
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          ESM-2 is frozen. The TriCyP classifier is a two-layer network on the
          1,280-dimensional embedding of the target cysteine: a linear layer
          to 64 units, batch normalization, ReLU and dropout, then a linear
          layer to the three classes (82,307 parameters). It is trained with
          weighted cross-entropy (Adam, learning rate 0.00004, dropout 0.6).
          The five cross-validation models (<code className="font-mono">best_modelA.pth</code>{' '}…{' '}
          <code className="font-mono">best_modelE.pth</code>) form the
          ensemble; a cysteine&apos;s prediction is the mean of their
          probabilities. Source and weights are in the{' '}
          <code className="font-mono">tricyp</code> repository; see{' '}
          <Link href="/downloads" className="text-amber-600 dark:text-amber-400 hover:underline">
            Downloads
          </Link>
          .
        </p>
      </section>

      {/* Thresholds */}
      <section id="thresholds" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Threshold selection
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Each operating threshold is the F1 optimum for its class over all
          216,277 held-out labelled cysteines, applied to the argmax class. The published 3-state call
          on TriCyp uses{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            P(Met) ≥ {BENCHMARK_THRESHOLDS.metalBinding}
          </code>{' '}
          for metal-binding and{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            P(Dis) ≥ {BENCHMARK_THRESHOLDS.disulfide}
          </code>{' '}
          for disulfide; otherwise a cysteine is called free thiol. Raw
          per-class probabilities for every cysteine remain in the
          per-cysteine TSV so users can re-threshold for their own workflows.
        </p>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          <span className="font-medium">Heme thioether.</span> Cysteines in a c-type heme attachment motif
          (CXXCH, CX<sub>3</sub>CH or CX<sub>4</sub>CH) inside the nine cytochrome H-groups where PDB structures show
          these cysteines bonded to the heme are shown as a fourth class. They are covalently linked to the heme
          by a thioether rather than coordinated to its iron, a state the three-state model has no class for.
          Against PDB geometry the flag has 94% precision and 95% recall. The model call is kept in the
          per-cysteine TSV (<code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">classification</code>,
          with the motif in <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">heme_thioether</code>),
          and site-wide counts use the model call.
        </p>
      </section>

      {/* Benchmarking */}
      <section id="benchmarking" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Benchmarking
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          The full ROC + PR + threshold-tuning panels and the metal-type
          stratified strip live on the{' '}
          <Link href="/benchmark" className="text-amber-600 dark:text-amber-400 hover:underline">
            Benchmark
          </Link>{' '}
          page (paper Fig 2 + S2 Fig). On the v3 benchmark, all three
          metal-binding tools score in the same band on the metals they
          were trained for (Zn / Ca / Mg / Mn, AUROC 0.996–0.999); TriCyP&apos;s residual advantage shows
          up specifically on iron coordination, where iron-stratum AUROC
          reaches{' '}
          <span className="font-mono font-semibold">{BENCHMARK_IRON_ONLY[0].auroc.toFixed(3)}</span>{' '}
          for TriCyP versus{' '}
          <span className="font-mono">{BENCHMARK_IRON_ONLY[1].auroc.toFixed(3)}</span>{' '}
          (LMetalSite) and{' '}
          <span className="font-mono">{BENCHMARK_IRON_ONLY[2].auroc.toFixed(3)}</span>{' '}
          (GPSite). This is a training-coverage difference, not an
          architectural one — the specialist tools were not designed to
          predict iron-coordinating cysteines.
        </p>
      </section>

      {/* Software & data */}
      <section id="software-data" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Software &amp; data availability
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
          <li>
            <strong>Predictor source:</strong>{' '}
            <code className="font-mono">tricyp</code> repository (github.com/conglab2020/tricyp) — see the
            link on the{' '}
            <Link href="/downloads#predictor" className="text-amber-600 dark:text-amber-400 hover:underline">
              Downloads
            </Link>{' '}
            page.
          </li>
          <li>
            <strong>Model weights and full deposit:</strong> the five TriCyP v3
            classifier heads, predictions, benchmark and figure data on Zenodo,{' '}
            <a href="https://doi.org/10.5281/zenodo.24328342" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">
              10.5281/zenodo.24328342
            </a>.
          </li>
          <li>
            <strong>Per-cysteine TSV:</strong> canonical full dump
            (one row per classified cysteine across all F70 representative
            domains), regenerated nightly with SHA-256 sidecars. Direct
            download on the{' '}
            <Link href="/downloads" className="text-amber-600 dark:text-amber-400 hover:underline">
              Downloads
            </Link>{' '}
            page.
          </li>
          <li>
            <strong>Figure data:</strong> one CSV per main and supplementary
            figure panel the site shows; the complete source data for every
            manuscript figure and table is in the Zenodo record.
          </li>
          <li>
            <strong>REST API:</strong> read-only JSON endpoints for domain,
            family, H-group, and search lookups; documented on the{' '}
            <Link href="/downloads" className="text-amber-600 dark:text-amber-400 hover:underline">
              Downloads &amp; API
            </Link>{' '}
            page.
          </li>
        </ul>
      </section>

      {/* License */}
      <section id="license" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          License
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          TriCyp data is released under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            CC-BY-4.0
          </a>
          : free reuse with attribution to the manuscript. The predictor
          source code and model weights (<code className="font-mono">tricyp</code>)
          are released under the MIT license.
        </p>
      </section>

      {/* Cite */}
      <section id="cite" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          How to cite
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          Please cite{' '}
          <em>{PAPER_REF.title}</em> ({PAPER_REF.authors}, {PAPER_REF.year}).
          {' '}
          {PAPER_REF.bioRxivUrl ? (
            <a
              href={PAPER_REF.bioRxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {PAPER_REF.bioRxivUrl}
            </a>
          ) : (
            <span className="italic text-gray-500 dark:text-gray-400">
              preprint DOI pending
            </span>
          )}
          .
        </p>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <header className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                BibTeX
              </h3>
              <CopyButton text={bibtex} label="BibTeX" />
            </header>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
              {bibtex}
            </pre>
          </article>
          <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <header className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                RIS
              </h3>
              <CopyButton text={ris} label="RIS" />
            </header>
            <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
              {ris}
            </pre>
          </article>
        </div>
      </section>
    </div>
  );
}
