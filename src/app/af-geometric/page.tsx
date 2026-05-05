import type { Metadata } from 'next';
import FigureImage from '@/components/ui/FigureImage';
import {
  FIG_4_THESIS,
  FIG_4_PANELS,
  FIG_4_STRUCTURES,
} from '@/lib/paperData';

export const metadata: Metadata = {
  title: 'AlphaFold geometric scanning',
  description:
    'Why AlphaFold-monomer geometric scanning is fundamentally limited as a ' +
    'disulfide annotation source — paper Fig 4 panels A–F with downloadable ' +
    'PyMOL sessions and matched PDB / AFDB structures.',
};

interface StructureExample {
  panel: 'D' | 'E' | 'F';
  uniprotAcc: string | null;
  afdbId: string | null;
  pdbId: string | null;
  chainId: string | null;
  pseFilename: string;
  afdbPdbFilename: string;
  pdbFilename: string;
}

function StructureCard({ example }: { example: StructureExample }) {
  const hasIdentifiers =
    example.afdbId || example.pdbId || example.uniprotAcc;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Fig 4{example.panel} · structure assets
      </p>
      <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {example.uniprotAcc && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">UniProt:</span>{' '}
            <a
              href={`https://www.uniprot.org/uniprotkb/${example.uniprotAcc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline font-mono"
            >
              {example.uniprotAcc}
            </a>
          </div>
        )}
        {example.afdbId && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">AFDB model:</span>{' '}
            <a
              href={`https://alphafold.ebi.ac.uk/entry/${example.afdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline font-mono"
            >
              {example.afdbId}
            </a>
          </div>
        )}
        {example.pdbId && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">PDB:</span>{' '}
            <a
              href={`https://www.rcsb.org/structure/${example.pdbId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-600 dark:text-amber-400 hover:underline font-mono"
            >
              {example.pdbId.toUpperCase()}
              {example.chainId ? ` · chain ${example.chainId}` : ''}
            </a>
          </div>
        )}
        {!hasIdentifiers && (
          <p className="text-xs italic text-gray-500 dark:text-gray-400">
            Paper-supplementary identifiers pending.
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`/structures/${example.pseFilename}`}
          download
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono"
        >
          ↓ {example.pseFilename}
        </a>
        <a
          href={`/structures/${example.afdbPdbFilename}`}
          download
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono"
        >
          ↓ AFDB.pdb
        </a>
        <a
          href={`/structures/${example.pdbFilename}`}
          download
          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono"
        >
          ↓ PDB.pdb
        </a>
      </div>
    </div>
  );
}

export default function AfGeometricPage() {
  const examples = FIG_4_STRUCTURES.reduce<Record<string, StructureExample>>(
    (acc, e) => {
      acc[e.panel] = e;
      return acc;
    },
    {},
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Paper Fig 4
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
          AlphaFold geometric scanning
        </h1>
        <p className="mt-3 text-base text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed">
          {FIG_4_THESIS}
        </p>
      </header>

      {/* Overview row: A, B, C */}
      <section className="mb-10">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Population statistics
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            Aggregate evidence across paired AFDB / PDB structures.
          </p>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {FIG_4_PANELS.filter((p) => p.panel <= 'C').map((panel) => (
            <article
              key={panel.panel}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <FigureImage
                src={`/figures/${panel.imageFilename}`}
                alt={`Fig 4${panel.panel} — ${panel.title}`}
                label={`Fig 4${panel.panel} · ${panel.title}`}
                description={panel.caption}
              />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
      </section>

      {/* Examples row: D, E, F */}
      <section className="mb-10">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Structural examples
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            Three case studies where a disulfide is firmly geometric in the
            PDB experimental structure but absent from the matched AFDB-monomer
            model. Download the PyMOL sessions to inspect the cysteine-pair
            geometry locally.
          </p>
        </header>
        <div className="space-y-6">
          {FIG_4_PANELS.filter((p) => p.panel >= 'D').map((panel) => {
            const ex = examples[panel.panel];
            return (
              <article
                key={panel.panel}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="lg:col-span-2">
                  <FigureImage
                    src={`/figures/${panel.imageFilename}`}
                    alt={`Fig 4${panel.panel} — ${panel.title}`}
                    label={`Fig 4${panel.panel} · ${panel.title}`}
                    description={panel.caption}
                  />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fig 4{panel.panel}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                    {panel.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {panel.caption}
                  </p>
                </div>
                {ex && <StructureCard example={ex} />}
              </article>
            );
          })}
        </div>
      </section>

      {/* Methods note */}
      <section className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Methods note
        </h2>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-3xl">
          Sγ–Sγ geometric scanning uses a 2.5 Å cutoff between cysteine sulfurs
          to call a disulfide. Scanning AFDB-monomer models with the same cutoff
          recovers a small minority of PDB-annotated disulfides; relaxing the
          cutoff to 5 Å trades sensitivity for a high false-positive rate. The
          point of this page is not that AlphaFold is wrong — the residue-level
          conformations are reasonable — but that monomer geometry is the wrong
          inference layer for disulfide annotation, which is why TriCyp uses
          ESM2-3state predictions over geometric scanning for AFDB-source
          domains.
        </p>
      </section>
    </div>
  );
}
