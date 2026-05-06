import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getHGroupDetail } from '@/lib/queries';
import { summaryCache, CACHE_TTL, cachedQuery } from '@/lib/cache';
import { HGROUP_HIGHLIGHTS } from '@/lib/paperData';
import FigureImage from '@/components/ui/FigureImage';
import StructureViewer from '@/components/viewer/StructureViewer';

export const dynamic = 'force-dynamic';

interface HGroupPageProps {
  params: Promise<{ hGroupId: string }>;
}

export async function generateMetadata({ params }: HGroupPageProps): Promise<Metadata> {
  const { hGroupId } = await params;
  return {
    title: `H-group ${decodeURIComponent(hGroupId)}`,
  };
}

function fmtPct(v: number | null): string {
  return v === null ? '—' : `${v.toFixed(1)}%`;
}

interface StructureLinkProps {
  domainId: string;
  pdbId: string | null;
  uniprotAcc: string | null;
  sourceType: string;
}

function StructureLinks({ domainId, pdbId, uniprotAcc, sourceType }: StructureLinkProps) {
  if (sourceType === 'pdb' && pdbId) {
    return (
      <a
        href={`https://www.rcsb.org/structure/${pdbId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
      >
        RCSB {pdbId.toUpperCase()}
      </a>
    );
  }
  if (uniprotAcc) {
    return (
      <a
        href={`https://alphafold.ebi.ac.uk/entry/${uniprotAcc}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
      >
        AFDB {uniprotAcc}
      </a>
    );
  }
  return <span className="text-xs text-gray-400">—</span>;
}

export default async function HGroupDetailPage({ params }: HGroupPageProps) {
  const { hGroupId: raw } = await params;
  const hGroupId = decodeURIComponent(raw);

  let detail: Awaited<ReturnType<typeof getHGroupDetail>> = null;
  try {
    detail = await cachedQuery(
      summaryCache,
      `hgroup-detail-${hGroupId}`,
      CACHE_TTL.FAMILY,
      () => getHGroupDetail(hGroupId),
    );
  } catch (e) {
    console.error('H-group detail query failed:', e);
  }
  if (!detail) notFound();

  const highlight = HGROUP_HIGHLIGHTS[hGroupId];

  // Pick a representative for each source type for the side-by-side viewer.
  const pdbRep = detail.representatives.find((r) => r.sourceType === 'pdb');
  const afdbRep = detail.representatives.find((r) => r.sourceType !== 'pdb');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/h-group" className="hover:text-amber-600 dark:hover:text-amber-400">H-groups</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300">
          X-group {detail.xGroupId}
        </span>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100 font-mono">{detail.hGroupId}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        {highlight && (
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">
            Paper {highlight.paperFigure} · candidate novel cysteine-chemistry H-group
          </p>
        )}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {detail.hGroupName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-mono">
          H-group {detail.hGroupId} · X-group {detail.xGroupId} ({detail.xGroupName})
        </p>
        {highlight && (
          <p className="mt-3 max-w-3xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {highlight.shortDescription}
          </p>
        )}
      </header>

      {/* Stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">PDB reps</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{detail.nPdbReps.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">AFDB reps</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{detail.nAfdbReps.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400">PDB disulfide</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{fmtPct(detail.pdbDisulfidePct)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400">AFDB disulfide</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 font-mono">{fmtPct(detail.afdbDisulfidePct)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-green-600 dark:text-green-400">PDB metal</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{fmtPct(detail.pdbMetalPct)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs uppercase tracking-wider text-green-600 dark:text-green-400">AFDB metal</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400 font-mono">{fmtPct(detail.afdbMetalPct)}</p>
        </div>
      </section>

      {/* Side-by-side molecular viewer slots */}
      <section className="mb-10">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Side-by-side representatives
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
            PDB-source representative on the left, AFDB-source representative
            on the right. Both viewers load via PDBe Mol* from public CDNs;
            external links open the corresponding RCSB / AFDB pages.
          </p>
        </header>

        {highlight && (
          <div className="mb-4">
            <FigureImage
              src={`/figures/${highlight.imageFilename}`}
              alt={`${highlight.paperFigure} — H-group ${detail.hGroupId} side-by-side`}
              label={`${highlight.paperFigure} · H-group ${detail.hGroupId}`}
              description="Paper-figure rendering: ESM2-predicted metal-binding cysteines highlighted in magenta, sub-threshold cysteines in grey."
              className="w-full"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PDB-source rep */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                PDB-source representative
              </span>
              {pdbRep && (
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {pdbRep.domainId}
                </span>
              )}
            </div>
            {pdbRep && pdbRep.pdbId ? (
              <StructureViewer
                pdbId={pdbRep.pdbId}
                chainId={null}
                className="w-full h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 italic px-4 text-center">
                {pdbRep
                  ? 'PDB representative has no PDB ID — cannot render structure.'
                  : 'No PDB-source F70 representative in this H-group.'}
              </div>
            )}
            {pdbRep && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                <StructureLinks
                  domainId={pdbRep.domainId}
                  pdbId={pdbRep.pdbId}
                  uniprotAcc={pdbRep.uniprotAcc}
                  sourceType={pdbRep.sourceType}
                />
              </div>
            )}
          </div>

          {/* AFDB-source rep */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                AFDB-source representative
              </span>
              {afdbRep && (
                <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {afdbRep.domainId}
                </span>
              )}
            </div>
            {afdbRep && afdbRep.uniprotAcc ? (
              <StructureViewer
                afId={afdbRep.uniprotAcc}
                className="w-full h-80"
              />
            ) : (
              <div className="h-80 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 italic px-4 text-center">
                {afdbRep
                  ? 'AFDB representative has no UniProt accession — cannot render structure.'
                  : 'No AFDB-source F70 representative in this H-group.'}
              </div>
            )}
            {afdbRep && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                <StructureLinks
                  domainId={afdbRep.domainId}
                  pdbId={afdbRep.pdbId}
                  uniprotAcc={afdbRep.uniprotAcc}
                  sourceType={afdbRep.sourceType}
                />
              </div>
            )}
          </div>
        </div>

        {highlight && (
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={`/structures/${highlight.pdbPseFilename}`}
              download
              className="text-xs px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono"
            >
              ↓ {highlight.pdbPseFilename} (PDB-source PyMOL session)
            </a>
            <a
              href={`/structures/${highlight.afdbPseFilename}`}
              download
              className="text-xs px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono"
            >
              ↓ {highlight.afdbPseFilename} (AFDB-source PyMOL session)
            </a>
          </div>
        )}
      </section>

      {/* Domain table */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            F70 representatives
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {detail.representatives.length.toLocaleString()} domains, ordered by source then by metal-binding count.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                <th className="px-4 py-2">Domain</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">F-group</th>
                <th className="px-4 py-2 text-right">Cys</th>
                <th className="px-4 py-2 text-right">Disulfide</th>
                <th className="px-4 py-2 text-right">Metal</th>
                <th className="px-4 py-2 text-right">Free thiol</th>
                <th className="px-4 py-2">External</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {detail.representatives.map((r) => (
                <tr key={r.domainId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 font-mono">
                    <Link
                      href={`/domain/${encodeURIComponent(r.domainId)}`}
                      className="text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {r.domainId}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 uppercase font-mono text-xs">
                    {r.sourceType}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link
                      href={`/family/${encodeURIComponent(r.fGroupId)}`}
                      className="text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {r.fGroupId}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">{r.totalCys}</td>
                  <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">{r.nDisulfide}</td>
                  <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">{r.nMetalBinding}</td>
                  <td className="px-4 py-2 text-right text-gray-500">{r.nUnclassified}</td>
                  <td className="px-4 py-2">
                    <StructureLinks
                      domainId={r.domainId}
                      pdbId={r.pdbId}
                      uniprotAcc={r.uniprotAcc}
                      sourceType={r.sourceType}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
