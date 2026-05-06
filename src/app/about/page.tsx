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

export const metadata: Metadata = {
  title: 'About / Methods',
  description:
    'Methods overview for TriCyp: pipeline, training data, ESM2-3state ' +
    'model architecture, threshold selection, benchmarking, and software / ' +
    'data availability.',
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
          TriCyp is the deposition for an ESM2-based three-state cysteine
          classifier — disulfide-bonded, metal-binding, or free thiol — applied
          across roughly 700,000 ECOD F70 representative domains. Section
          anchors below match the manuscript Methods subheadings.
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
          For every cysteine in a domain, the pipeline runs a fine-tuned ESM2
          classifier that emits a probability over three states — free thiol,
          disulfide, metal-binding. Probabilities are thresholded into a
          three-state call; per-cysteine outputs are aggregated to per-domain
          and per-H-group summaries that back the dashboard, the family browser,
          and the H-group browser. PDB-source domains additionally carry
          structural ground truth from geometric Sγ–Sγ scanning, PDB SSBOND
          records, and PDB metal LINK records, which the benchmark page uses to
          score the classifier.
        </p>
        <div className="mt-4">
          <FigureImage
            src="/figures/fig1_pipeline.png"
            alt="Fig 1 — pipeline overview"
            label="Fig 1 · Pipeline"
            description="ESM2-3state classifier inputs (sequence) and outputs (three-state per-cysteine call), plus the structural-evidence streams used to validate PDB-source ground truth."
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
          The classifier is trained on PDB-source cysteines with structural
          ground truth: disulfide labels from PDB SSBOND records cross-checked
          by Sγ–Sγ geometric scanning at 2.5 Å, metal-binding labels from PDB
          LINK / SITE records where a cysteine sulfur coordinates a metal ion
          or metal-bearing cofactor, and free-thiol labels for cysteines not
          captured by either evidence stream. Held-out validation and test
          sets are drawn at the F-group level so the splits do not leak
          structural family between training and evaluation.
        </p>
      </section>

      {/* Model */}
      <section id="model" className="mb-10 scroll-mt-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Model architecture
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed">
          The published 3-state classifier is an ensemble of five ESM2
          checkpoints (<code className="font-mono">best_modelA.pth</code>{' '}…{' '}
          <code className="font-mono">best_modelE.pth</code>), each fine-tuned
          from the same ESM2 base with a per-cysteine softmax head over the
          three classes. Inference averages per-class probabilities across the
          ensemble. The full source — <code className="font-mono">cys3state</code>{' '}
          — is available alongside the model weights; see{' '}
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
          Operating thresholds were tuned on the held-out validation set to
          hit a fixed per-task precision target. The published 3-state call
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
          page (paper Fig 2 + Fig S1). The headline finding is that
          ESM2-3state generalises across metal types where structure-template
          baselines degrade most on iron coordination — iron-only AUROC reaches{' '}
          <span className="font-mono font-semibold text-green-700 dark:text-green-300">
            {BENCHMARK_IRON_ONLY[0].auroc.toFixed(3)}
          </span>{' '}
          for ESM2-3state versus{' '}
          <span className="font-mono">{BENCHMARK_IRON_ONLY[1].auroc.toFixed(3)}</span>{' '}
          (LMetalSite) and{' '}
          <span className="font-mono">{BENCHMARK_IRON_ONLY[2].auroc.toFixed(3)}</span>{' '}
          (GPSite).
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
            <code className="font-mono">cys3state</code> repository — see the
            link on the{' '}
            <Link href="/downloads#predictor" className="text-amber-600 dark:text-amber-400 hover:underline">
              Downloads
            </Link>{' '}
            page.
          </li>
          <li>
            <strong>Model weights:</strong> five ESM2 checkpoints, deposited
            on Zenodo alongside the per-cysteine TSV.
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
            figure, mirroring the manuscript&apos;s{' '}
            <code className="font-mono">paper/figure_data/</code> exports.
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
          source code (<code className="font-mono">cys3state</code>) carries
          its own existing license — check the repository for terms before
          redistribution.
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
