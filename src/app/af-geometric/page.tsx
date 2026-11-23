import type { Metadata } from 'next';
import FigureImage from '@/components/ui/FigureImage';
import StructureViewer from '@/components/viewer/StructureViewer';
import {
  FIG_4_TITLE,
  FIG_4_THESIS,
  FIG_4_PANELS,
  FIG_4_STRUCTURES,
  FIG_4_INTERCHAIN,
} from '@/lib/paperData';

// Route kept as /af-geometric so existing links resolve; the content follows
// the manuscript's Fig 4 (rewritten 2026-11-23).
const PAGE_TITLE = FIG_4_TITLE;
const PAGE_DESCRIPTION =
  'Paper Fig 4: TriCyP disulfide calls checked against experimental and ' +
  'AlphaFold structures, partnerless calls in low-confidence regions, and ' +
  'inter-protein disulfides.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
  twitter: { title: `${PAGE_TITLE} | TriCyp`, description: PAGE_DESCRIPTION },
};

const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`;

export default function Fig4Page() {
  const panels = (from: string, to: string) =>
    FIG_4_PANELS.filter((p) => p.panel >= from && p.panel <= to);
  const ic = FIG_4_INTERCHAIN;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Paper Fig 4
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          {FIG_4_TITLE}
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          {FIG_4_THESIS}
        </p>
      </header>

      <section className="mb-10">
        <FigureImage
          src="/figures/fig4_structural_validation.png"
          alt="Fig 4 — structural validation of TriCyP predictions and inter-protein disulfides"
          label="Fig 4"
          description="Manuscript Fig 4, panels A–G."
          className="w-full"
        />
      </section>

      {[
        { heading: 'Population statistics', from: 'A', to: 'C' },
        { heading: 'Mismodeled disulfides in AlphaFold models', from: 'D', to: 'E' },
        { heading: 'Inter-protein disulfides', from: 'F', to: 'G' },
      ].map((grp) => (
        <section key={grp.heading} className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {grp.heading}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {panels(grp.from, grp.to).map((panel) => (
              <article
                key={panel.panel}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Fig 4{panel.panel}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {panel.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {panel.caption}
                </p>
              </article>
            ))}
          </div>
          {grp.from === 'F' && (
            <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
              Inter-chain disulfides are a small share of the bonds in these
              representative domains: of {ic.bondedCysteines.toLocaleString('en-US')}{' '}
              geometrically bonded cysteines (Sγ–Sγ ≤ 2.5 Å in biological
              assembly 1), {pct(ic.interChainShare)} bridge two chains, compared
              with about 5% of all PDB disulfide bonds. TriCyP recovers{' '}
              {pct(ic.interChainRecall)} of inter-chain disulfide cysteines (mean
              P(Dis) {ic.interChainMeanPDis.toFixed(2)}), against about{' '}
              {pct(ic.intraChainRecall)} of intra-chain ones (mean P(Dis){' '}
              {ic.intraChainMeanPDis.toFixed(2)}).
            </p>
          )}
        </section>
      ))}

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Structures for panels D–G
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {FIG_4_STRUCTURES.map((ex) => (
            <article
              key={ex.panel}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Fig 4{ex.panel} · {ex.label}
              </div>
              {ex.uniprotAcc ? (
                <StructureViewer afId={ex.uniprotAcc} className="w-full h-80" />
              ) : (
                <StructureViewer pdbId={ex.pdbId} className="w-full h-80" />
              )}
              <div className="px-4 py-2 text-sm flex flex-wrap gap-x-4">
                {ex.uniprotAcc && (
                  <a
                    href={`https://alphafold.ebi.ac.uk/entry/${ex.uniprotAcc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline font-mono"
                  >
                    AFDB {ex.uniprotAcc}
                  </a>
                )}
                {ex.pdbId && (
                  <a
                    href={`https://www.rcsb.org/structure/${ex.pdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline font-mono"
                  >
                    PDB {ex.pdbId}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 max-w-3xl">
          The viewers show the monomer AlphaFold model or the deposited
          structure; the TPC2 homodimer in panel F is an AlphaFold-Multimer
          model shown only in the figure.
        </p>
      </section>
    </div>
  );
}
