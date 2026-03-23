'use client';

import SequenceViewer from '@/components/sequence/SequenceViewer';
import EvidencePanel from '@/components/ui/EvidencePanel';
import ClassificationBadge from '@/components/ui/ClassificationBadge';
import type { CysteineRecord, DomainEvidence } from '@/types/cysteine';

interface DomainClientProps {
  sequence: string;
  classifications: CysteineRecord[];
  evidence: DomainEvidence;
}

function ProbBar({ neg, dis, met }: { neg: number; dis: number; met: number }) {
  const total = neg + dis + met;
  if (total === 0) return null;
  const negPct = (neg / total) * 100;
  const disPct = (dis / total) * 100;
  const metPct = (met / total) * 100;

  return (
    <div className="flex h-4 w-24 rounded overflow-hidden" title={`Neg: ${neg.toFixed(2)}, Dis: ${dis.toFixed(2)}, Met: ${met.toFixed(2)}`}>
      <div className="bg-gray-300 dark:bg-gray-500" style={{ width: `${negPct}%` }} />
      <div className="bg-amber-400" style={{ width: `${disPct}%` }} />
      <div className="bg-teal-500" style={{ width: `${metPct}%` }} />
    </div>
  );
}

export default function DomainClient({ sequence, classifications, evidence }: DomainClientProps) {
  const classMap = new Map<number, CysteineRecord>();
  for (const c of classifications) classMap.set(c.cysPosition, c);

  return (
    <div className="space-y-6">
      <SequenceViewer sequence={sequence} classifications={classifications} />

      {/* Evidence Panels */}
      <div className="space-y-3">
        {/* ESM2 Predictions */}
        {evidence.esm2Predictions.length > 0 && (
          <EvidencePanel
            title="ESM2 3-State Predictions"
            count={evidence.esm2Predictions.length}
            defaultOpen
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-3 py-2">Position</th>
                  <th className="px-3 py-2">P(Neg)</th>
                  <th className="px-3 py-2">P(Dis)</th>
                  <th className="px-3 py-2">P(Met)</th>
                  <th className="px-3 py-2">Distribution</th>
                  <th className="px-3 py-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {evidence.esm2Predictions.map((p) => {
                  const cls = classMap.get(p.cysPosition);
                  return (
                    <tr key={p.cysPosition}>
                      <td className="px-3 py-2 font-mono">{p.cysPosition}</td>
                      <td className="px-3 py-2 text-gray-500">{p.negProb.toFixed(3)}</td>
                      <td className="px-3 py-2 text-amber-600 dark:text-amber-400">{p.disProb.toFixed(3)}</td>
                      <td className="px-3 py-2 text-teal-600 dark:text-teal-400">{p.metProb.toFixed(3)}</td>
                      <td className="px-3 py-2">
                        <ProbBar neg={p.negProb} dis={p.disProb} met={p.metProb} />
                      </td>
                      <td className="px-3 py-2">
                        {cls && <ClassificationBadge classification={cls.classification} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-500 inline-block" /> Neg</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Dis</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-teal-500 inline-block" /> Met</span>
            </div>
          </EvidencePanel>
        )}

        {/* Geometric Disulfides */}
        <EvidencePanel
          title="Geometric Disulfide Bonds"
          count={evidence.geometricDisulfides.length}
          defaultOpen={evidence.geometricDisulfides.length > 0}
        >
          {evidence.geometricDisulfides.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No geometric disulfides detected</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-3 py-2">Residue 1</th>
                  <th className="px-3 py-2">Residue 2</th>
                  <th className="px-3 py-2">S{'\u03B3'}-S{'\u03B3'} Distance ({'\u00C5'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {evidence.geometricDisulfides.map((d) => (
                  <tr key={d.id}>
                    <td className="px-3 py-2">{d.chain1} {d.resnum1}</td>
                    <td className="px-3 py-2">{d.chain2} {d.resnum2}</td>
                    <td className="px-3 py-2">{d.sgSgDistance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </EvidencePanel>

        {/* PDB SS-bonds */}
        {evidence.pdbSsbonds.length > 0 && (
          <EvidencePanel title="PDB SSBOND Records" count={evidence.pdbSsbonds.length} defaultOpen>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-3 py-2">PDB</th>
                  <th className="px-3 py-2">Residue 1</th>
                  <th className="px-3 py-2">Residue 2</th>
                  <th className="px-3 py-2">Both in Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {evidence.pdbSsbonds.map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.pdbId.toUpperCase()}</td>
                    <td className="px-3 py-2">{s.chain1} {s.resnum1}</td>
                    <td className="px-3 py-2">{s.chain2} {s.resnum2}</td>
                    <td className="px-3 py-2">{s.bothInDomain ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EvidencePanel>
        )}

        {/* PDB Metal Links */}
        {evidence.pdbMetalLinks.length > 0 && (
          <EvidencePanel title="PDB Metal Coordination" count={evidence.pdbMetalLinks.length} defaultOpen>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                  <th className="px-3 py-2">Metal</th>
                  <th className="px-3 py-2">Cofactor</th>
                  <th className="px-3 py-2">Metal Position</th>
                  <th className="px-3 py-2">Coord. Residue</th>
                  <th className="px-3 py-2">Atom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {evidence.pdbMetalLinks.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-medium">{m.metal}</td>
                    <td className="px-3 py-2">
                      {m.cofactor ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                          {m.cofactor}
                        </span>
                      ) : (
                        <span className="text-gray-400">free ion</span>
                      )}
                    </td>
                    <td className="px-3 py-2">{m.metalChain} {m.metalResnum}</td>
                    <td className="px-3 py-2">{m.coordResname} {m.coordChain}{m.coordResnum}</td>
                    <td className="px-3 py-2">{m.coordAtom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </EvidencePanel>
        )}
      </div>
    </div>
  );
}
