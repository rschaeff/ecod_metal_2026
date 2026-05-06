import type { Metadata } from 'next';
import FigureImage from '@/components/ui/FigureImage';
import PanelCard from '@/components/dashboard/PanelCard';
import {
  BENCHMARK_THRESHOLDS,
  BENCHMARK_IRON_ONLY,
  BENCHMARK_IRON_ONLY_TEXT,
  BENCHMARK_TABLE,
  FIG_2_CAPTION,
  FIG_S1_CAPTION,
  type BenchmarkRow,
} from '@/lib/paperData';

const PAGE_TITLE = 'Benchmark';
const PAGE_DESCRIPTION =
  'Held-out benchmarking of ESM2-3state cysteine classification against ' +
  'SSBONDPredict, LMetalSite, and GPSite, with metal-type-stratified ' +
  'AUROC reported alongside the all-metals comparison.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
  twitter: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
};

const STRATUM_LABEL: Record<string, string> = {
  all: 'All metals',
  iron_only: 'Iron only',
  zn: 'Zn',
  ca: 'Ca',
  mg: 'Mg',
  mn: 'Mn',
};

const TASK_LABEL: Record<BenchmarkRow['task'], string> = {
  disulfide: 'Disulfide',
  metal_binding: 'Metal-binding',
};

function fmtMetric(v: number | null): string {
  return v === null ? '—' : v.toFixed(3);
}

const benchmarkCsvRows: (string | number)[][] = [
  ['tool', 'task', 'stratum', 'auroc', 'ap'],
  ...BENCHMARK_TABLE.map((r) => [
    r.tool,
    r.task,
    r.stratum,
    r.auroc ?? '',
    r.ap ?? '',
  ]),
];

// Headline section: pulls the all-stratum rows for both tasks straight
// out of BENCHMARK_TABLE so there is one source of truth. ESM2-3state
// renders first per task, baselines after, in the order they appear in
// the table.
const HEADLINE_TASK_LABEL: Record<BenchmarkRow['task'], string> = {
  disulfide: 'Disulfide',
  metal_binding: 'Metal-binding (all metals)',
};

const headlineRows = BENCHMARK_TABLE.filter((r) => r.stratum === 'all');
const headlineByTask: { task: BenchmarkRow['task']; rows: BenchmarkRow[] }[] = [
  { task: 'disulfide',     rows: headlineRows.filter((r) => r.task === 'disulfide') },
  { task: 'metal_binding', rows: headlineRows.filter((r) => r.task === 'metal_binding') },
];

export default function BenchmarkPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Paper Fig 2 + Fig S1
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          Benchmark
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl">
          Held-out benchmarking of ESM2-3state against the structure-aware
          baselines used in the manuscript. Disulfide prediction is compared
          against SSBONDPredict; metal-binding prediction against LMetalSite
          and GPSite. Operating thresholds were chosen on the held-out
          validation set (metal-binding ≥ {BENCHMARK_THRESHOLDS.metalBinding},
          disulfide ≥ {BENCHMARK_THRESHOLDS.disulfide}).
        </p>
      </header>

      {/* Headline: held-out AUROC + AP for both tasks, all-stratum.
          The all-metals metal-binding number is iron-dominated by ~83%;
          the fair-metals (Zn / Ca / Mg / Mn) AUROCs are not yet
          transcribed, so the panel cites the manuscript narrowing
          claim in prose rather than displaying numbers we cannot back. */}
      <section className="mb-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Held-out evaluation · b2 dataset
        </p>
        <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          AUROC and average precision
        </h2>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {headlineByTask.map(({ task, rows }) => (
            <div key={task} className="rounded-md border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {HEADLINE_TASK_LABEL[task]}
              </p>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                    <th className="font-medium pb-1">Tool</th>
                    <th className="font-medium pb-1 text-right">AUROC</th>
                    <th className="font-medium pb-1 text-right">AP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {rows.map((r) => (
                    <tr key={r.tool}>
                      <td className="py-1.5 font-medium text-gray-900 dark:text-gray-100">{r.tool}</td>
                      <td className="py-1.5 text-right font-mono text-gray-900 dark:text-gray-100">
                        {fmtMetric(r.auroc)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-gray-900 dark:text-gray-100">
                        {fmtMetric(r.ap)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
          The metal-binding all-metals number is iron-dominated — roughly
          83% of held-out positives are Fe-coordinated, and LMetalSite /
          GPSite were not trained on Fe / Fe-S / heme cysteine sites. On
          the metals where all three tools share training coverage
          (Zn / Ca / Mg / Mn), the AUROC gap narrows from ~8.5 to ~3.7
          points, and the published narrative is "broader scope plus
          structural independence", not algorithmic dominance.
          Average precision (AP) on the imbalanced metal-binding task
          shows the gap more honestly than AUROC: ESM2-3state {' '}
          <span className="font-mono">0.621</span> vs LMetalSite{' '}
          <span className="font-mono">0.138</span> reflects training-
          objective alignment as much as architecture.
        </p>
      </section>

      {/* Fig 2 panels */}
      <section className="mb-10">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Fig 2
          </p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Per-task ROC, PR, and threshold tuning
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            {FIG_2_CAPTION}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <FigureImage
            src="/figures/fig2a_disulfide_roc.png"
            alt="Fig 2A — Disulfide ROC: ESM2-3state vs SSBONDPredict"
            label="Fig 2A · Disulfide ROC"
            description="ESM2-3state held-out and ensemble curves vs SSBONDPredict."
          />
          <FigureImage
            src="/figures/fig2b_disulfide_pr.png"
            alt="Fig 2B — Disulfide precision–recall"
            label="Fig 2B · Disulfide PR"
            description="Precision–recall on the disulfide task."
          />
          <FigureImage
            src="/figures/fig2c_disulfide_threshold.png"
            alt="Fig 2C — Disulfide threshold tuning"
            label="Fig 2C · Disulfide threshold"
            description={`Threshold-tuning curve; chosen operating point ≥ ${BENCHMARK_THRESHOLDS.disulfide}.`}
          />
          <FigureImage
            src="/figures/fig2d_metal_roc.png"
            alt="Fig 2D — Metal-binding ROC vs LMetalSite and GPSite"
            label="Fig 2D · Metal ROC"
            description="ESM2-3state vs LMetalSite and GPSite, all metals pooled."
          />
          <FigureImage
            src="/figures/fig2e_metal_pr.png"
            alt="Fig 2E — Metal-binding precision–recall"
            label="Fig 2E · Metal PR"
            description="Precision–recall on the metal-binding task."
          />
          <FigureImage
            src="/figures/fig2f_metal_threshold.png"
            alt="Fig 2F — Metal-binding threshold tuning"
            label="Fig 2F · Metal threshold"
            description={`Threshold-tuning curve; chosen operating point ≥ ${BENCHMARK_THRESHOLDS.metalBinding}.`}
          />
        </div>
      </section>

      {/* Fig S1 strip — metal-type-stratified ROC. Iron is one of several
          strata; the all-metals number is dominated by Fe (FeS / heme), so
          this section reports per-stratum AUROC for fair comparison. */}
      <section className="mb-10">
        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Fig S1
          </p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Metal-type-stratified ROC strip
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            {FIG_S1_CAPTION}
          </p>
        </header>
        <FigureImage
          src="/figures/figS1_iron_only_roc.png"
          alt="Fig S1 — metal-type-stratified ROC strip"
          label="Fig S1 · Metal-type-stratified ROC"
          description="ROC curves stratified by metal type (Fe / Zn / Ca / Mg / Mn) across ESM2-3state, LMetalSite, GPSite."
          className="w-full"
        />

        {/* Iron stratum AUROC — demoted from a marquee finding. The
            iron stratum is shown here because the supplementary numbers
            are transcribed; Zn/Ca/Mg/Mn live in BENCHMARK_TABLE and
            currently render as em-dashes until the figure-data CSVs
            are loaded. */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Iron stratum (Fe / Fe-S / heme)
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            {BENCHMARK_IRON_ONLY_TEXT}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {BENCHMARK_IRON_ONLY.map((row) => (
              <div
                key={row.tool}
                className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.tool}</p>
                <p className="mt-0.5 text-xl font-semibold text-gray-900 dark:text-gray-100 font-mono">
                  {row.auroc.toFixed(3)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">AUROC · Fe</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabular summary */}
      <PanelCard
        title="AUROC / AP per tool per stratum"
        caption="Tabular summary of the benchmark. Iron stratum cells are transcribed from the manuscript supplementary; the all-metals and remaining per-metal strata will be populated once the figure-data CSVs are loaded."
        csvFilename="benchmark_summary.csv"
        csvRows={benchmarkCsvRows}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="px-3 py-2">Tool</th>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Stratum</th>
                <th className="px-3 py-2 text-right">AUROC</th>
                <th className="px-3 py-2 text-right">AP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {BENCHMARK_TABLE.map((row, i) => {
                const isIron = row.stratum === 'iron_only';
                return (
                  <tr
                    key={i}
                    className={isIron ? 'bg-green-50/60 dark:bg-green-900/10' : ''}
                  >
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                      {row.tool}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {TASK_LABEL[row.task]}
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {STRATUM_LABEL[row.stratum] ?? row.stratum}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-gray-100">
                      {fmtMetric(row.auroc)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-900 dark:text-gray-100">
                      {fmtMetric(row.ap)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PanelCard>

      {/* Threshold rationale */}
      <section className="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Operating thresholds
        </h2>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          The classification published on TriCyp uses fixed thresholds chosen on
          the held-out validation set: a cysteine is called{' '}
          <span className="text-green-700 dark:text-green-400 font-medium">metal-binding</span>{' '}
          when{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            P(Met) ≥ {BENCHMARK_THRESHOLDS.metalBinding}
          </code>
          ,{' '}
          <span className="text-red-700 dark:text-red-400 font-medium">disulfide</span>{' '}
          when{' '}
          <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
            P(Dis) ≥ {BENCHMARK_THRESHOLDS.disulfide}
          </code>
          , and otherwise <span className="text-gray-700 dark:text-gray-300 font-medium">free thiol</span>.
          The two thresholds were tuned independently to the same per-task
          precision target on held-out data; raw probabilities for every
          cysteine remain available via the per-cysteine TSV download (see{' '}
          <span className="italic">Downloads</span>) so users can re-threshold
          for their own use case.
        </p>
      </section>
    </div>
  );
}
