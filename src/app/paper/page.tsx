import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PAPER_REF,
  FIGURE_TO_SURFACE,
  buildBibTeX,
  buildRIS,
} from '@/lib/paperData';
import CopyButton from '@/components/ui/CopyButton';

const PAGE_TITLE = 'Paper';
const PAGE_DESCRIPTION =
  'Figure-by-figure index of the manuscript with direct links to the ' +
  'corresponding TriCyp surfaces. Includes BibTeX and RIS citation blocks.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
  twitter: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
};

export default function PaperPage() {
  const bibtex = buildBibTeX();
  const ris = buildRIS();

  const mainFigures = FIGURE_TO_SURFACE.filter((f) => f.isMain);
  const supplementaryFigures = FIGURE_TO_SURFACE.filter((f) => !f.isMain);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Paper
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {PAPER_REF.title}
        </h1>
        <p className="mt-2 text-base text-gray-700 dark:text-gray-300">
          {PAPER_REF.authors} · {PAPER_REF.year}
        </p>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          TriCyp is the companion deposition for this manuscript. Each main
          and supplementary figure maps to a navigable surface here so a
          reader landing from the PDF can re-find the exact panel they want
          to inspect interactively.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {PAPER_REF.bioRxivUrl ? (
            <a
              href={PAPER_REF.bioRxivUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded bg-amber-600 text-white font-medium hover:bg-amber-700"
            >
              Read on bioRxiv →
            </a>
          ) : (
            <span className="inline-block px-4 py-2 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
              bioRxiv link pending
            </span>
          )}
          {PAPER_REF.doi && (
            <a
              href={`https://doi.org/${PAPER_REF.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-mono text-xs"
            >
              doi:{PAPER_REF.doi}
            </a>
          )}
          <Link
            href="/downloads"
            className="inline-block px-4 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Downloads &amp; API
          </Link>
        </div>
      </header>

      {/* Main figure table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Main figures
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-2 w-24">Figure</th>
                <th className="px-4 py-2">What it shows</th>
                <th className="px-4 py-2 w-56">TriCyp surface</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mainFigures.map((f) => (
                <tr key={f.figure} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100 align-top">
                    {f.figure}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {f.shortTitle}.
                    </span>{' '}
                    {f.description}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={f.href}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                    >
                      {f.surfaceLabel} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supplementary figure table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Supplementary figures
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-2 w-24">Figure</th>
                <th className="px-4 py-2">What it shows</th>
                <th className="px-4 py-2 w-56">TriCyp surface</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {supplementaryFigures.map((f) => (
                <tr key={f.figure} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100 align-top">
                    {f.figure}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 align-top">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {f.shortTitle}.
                    </span>{' '}
                    {f.description}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link
                      href={f.href}
                      className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                    >
                      {f.surfaceLabel} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Citation block */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          How to cite
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 max-w-3xl leading-relaxed">
          Please cite the manuscript when reusing TriCyp data. Data is
          released under <strong>CC-BY 4.0</strong>; the predictor source
          carries its existing license.
          {!PAPER_REF.doi && (
            <span className="ml-1 italic text-gray-500 dark:text-gray-400">
              Templates below contain DOI/URL placeholders until the bioRxiv
              preprint is assigned — they will fill in automatically.
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* How to read this site */}
      <section className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          How to read this site
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <li>
            Every panel that mirrors a paper figure is labelled with that
            figure number in the top-left of the card; click <em>Show data</em>{' '}
            beside any dashboard panel to inspect the underlying counts or
            download the panel CSV.
          </li>
          <li>
            For raw artefacts — per-cysteine TSV, per-domain TSV, per-H-group
            aggregates, and the manuscript's <code className="font-mono">paper/figure_data/</code>{' '}
            CSVs — see the <Link href="/downloads" className="text-amber-600 dark:text-amber-400 hover:underline">Downloads</Link> page.
          </li>
          <li>
            The <Link href="/h-group" className="text-amber-600 dark:text-amber-400 hover:underline">H-group browser</Link>{' '}
            replicates Fig 5A,B as click-through confusion matrices; the three
            highlighted novel-metal H-groups link directly to their detail pages.
          </li>
          <li>
            Public REST API endpoints are documented on the{' '}
            <Link href="/downloads" className="text-amber-600 dark:text-amber-400 hover:underline">Downloads &amp; API</Link>{' '}
            page; every response uses the same <code className="font-mono">{`{ success, data, error }`}</code> envelope.
          </li>
        </ul>
      </section>
    </div>
  );
}
