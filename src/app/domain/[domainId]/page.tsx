import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDomainDetail, getDomainClassifications, getDomainEvidence } from '@/lib/queries';
import DomainClient from './DomainClient';
import CopyButton from '@/components/ui/CopyButton';
import StructureViewer from '@/components/viewer/StructureViewer';
import { PAPER_REF } from '@/lib/paperData';
import { classifyCysteinesByStructure, encodeCysList } from '@/lib/structurePositions';

export const dynamic = 'force-dynamic';

interface DomainPageProps {
  params: Promise<{ domainId: string }>;
}

// Cheap HEAD probe so the page can render a "structure unavailable"
// fallback when an AFDB-source domain points at an obsolete UniProt
// accession (the AFDB CIF endpoint 404s, the viewer iframe loads
// blank, and the user sees a broken-looking panel). Cached at the
// fetch layer so repeat loads of the same domain skip the network.
async function probeAfdbExists(uniprotAcc: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://alphafold.ebi.ac.uk/files/AF-${uniprotAcc}-F1-model_v6.cif`,
      { method: 'HEAD', next: { revalidate: 3600 } },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function generateMetadata({ params }: DomainPageProps) {
  const { domainId } = await params;
  const info = await getDomainDetail(domainId);
  return {
    title: info ? `Domain: ${info.domainId}` : 'Domain Not Found',
  };
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { domainId } = await params;
  const domainInfo = await getDomainDetail(domainId);

  if (!domainInfo) notFound();

  const [classifications, evidence] = await Promise.all([
    getDomainClassifications(domainInfo.id),
    getDomainEvidence(domainInfo.id),
  ]);

  // Probe AFDB only for AFDB-source domains; PDB-source domains use
  // their own structure path which doesn't have the obsolete-accession
  // problem the same way.
  const afdbAvailable =
    domainInfo.sourceType !== 'pdb' && domainInfo.uniprotAcc
      ? await probeAfdbExists(domainInfo.uniprotAcc)
      : true;

  const nDisulfide = classifications.filter((c) => c.classification === 'DISULFIDE').length;
  const nMetal = classifications.filter((c) => c.classification === 'METAL_BINDING').length;
  const nUnclassified = classifications.filter((c) => c.classification === 'UNCLASSIFIED').length;

  // Map domain-local cysteine positions to source-structure (chain, resnum)
  // pairs so the 3D viewer can paint them with the canonical site palette.
  const cysHighlights = classifyCysteinesByStructure(classifications, domainInfo.rangeDefinition);
  const metalCysParam = encodeCysList(cysHighlights.metal);
  const disulfideCysParam = encodeCysList(cysHighlights.disulfide);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-amber-600 dark:hover:text-amber-400">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href={`/family/${domainInfo.fGroupId}`} className="hover:text-amber-600 dark:hover:text-amber-400">
          Family {domainInfo.fGroupId}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-gray-100">{domainInfo.domainId}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Domain Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{domainInfo.domainId}</h1>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="font-medium">Source:</span> {domainInfo.sourceType.toUpperCase()}
              </div>
              {domainInfo.pdbId && (
                <div>
                  <span className="font-medium">PDB:</span>{' '}
                  <a
                    href={`https://www.rcsb.org/structure/${domainInfo.pdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {domainInfo.pdbId.toUpperCase()}
                  </a>
                  {domainInfo.chainId && ` chain ${domainInfo.chainId}`}
                </div>
              )}
              <div><span className="font-medium">Range:</span> {domainInfo.rangeDefinition}</div>
              <div><span className="font-medium">Length:</span> {domainInfo.sequence.length} residues</div>
            </div>
          </div>

          {/* Sequence + Evidence */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Sequence</h2>
            <DomainClient
              sequence={domainInfo.sequence}
              classifications={classifications}
              evidence={evidence}
              rangeDefinition={domainInfo.rangeDefinition}
            />
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Structure viewer */}
          {(domainInfo.pdbId || domainInfo.uniprotAcc) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                3D structure ({domainInfo.sourceType.toUpperCase()})
              </div>
              {domainInfo.sourceType === 'pdb' && domainInfo.pdbId ? (
                <StructureViewer
                  pdbId={domainInfo.pdbId}
                  chainId={domainInfo.chainId}
                  range={domainInfo.rangeDefinition}
                  domainId={domainInfo.domainId}
                  metalCysteines={metalCysParam}
                  disulfideCysteines={disulfideCysParam}
                  className="w-full h-72"
                />
              ) : domainInfo.uniprotAcc && afdbAvailable ? (
                <StructureViewer
                  afId={domainInfo.uniprotAcc}
                  range={domainInfo.rangeDefinition}
                  domainId={domainInfo.domainId}
                  metalCysteines={metalCysParam}
                  disulfideCysteines={disulfideCysParam}
                  className="w-full h-72"
                />
              ) : domainInfo.uniprotAcc ? (
                <div className="p-6 h-72 flex flex-col items-center justify-center text-center text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-700 dark:text-gray-300">Structure unavailable</p>
                  <p className="mt-1 max-w-xs">
                    The AlphaFold model for{' '}
                    <a
                      href={`https://www.uniprot.org/uniprotkb/${domainInfo.uniprotAcc}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline-offset-2 hover:underline text-amber-600 dark:text-amber-400"
                    >
                      {domainInfo.uniprotAcc}
                    </a>{' '}
                    is not currently served by AFDB; the UniProt accession may be obsolete or merged.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {/* Classification Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Classification Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Cysteines</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{classifications.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
                  Disulfide
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">{nDisulfide}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
                  Metal-binding
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">{nMetal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm bg-gray-400 inline-block" />
                  Free thiol
                </span>
                <span className="font-medium text-gray-500">{nUnclassified}</span>
              </div>
            </div>
          </div>

          {/* Cite this domain */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Cite this domain</h2>
              <CopyButton
                label="text"
                text={
                  `Per-cysteine three-state classification for ECOD domain ${domainInfo.domainId} ` +
                  `from TriCyp (${PAPER_REF.title}; ${PAPER_REF.authors}, ${PAPER_REF.year})` +
                  (PAPER_REF.bioRxivUrl ? `. ${PAPER_REF.bioRxivUrl}` : '')
                }
              />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              Per-cysteine three-state classification for ECOD domain{' '}
              <span className="font-mono">{domainInfo.domainId}</span> from TriCyp (
              <em>{PAPER_REF.title}</em>; {PAPER_REF.authors}, {PAPER_REF.year})
              {PAPER_REF.bioRxivUrl ? (
                <>
                  .{' '}
                  <a
                    href={PAPER_REF.bioRxivUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:underline break-all"
                  >
                    {PAPER_REF.bioRxivUrl}
                  </a>
                </>
              ) : (
                <>
                  {' '}<span className="italic text-gray-500 dark:text-gray-400">— preprint URL pending</span>
                </>
              )}
              .
            </p>
          </div>

          {/* ECOD Hierarchy */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">ECOD Hierarchy</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">X-group:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{domainInfo.xGroupId}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">H-group:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{domainInfo.hGroupId}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">T-group:</span>{' '}
                <span className="text-gray-900 dark:text-gray-100">{domainInfo.tGroupId}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">F-group:</span>{' '}
                <Link
                  href={`/family/${domainInfo.fGroupId}`}
                  className="text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {domainInfo.fGroupId}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
