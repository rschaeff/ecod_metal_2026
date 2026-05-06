import { ImageResponse } from 'next/og';
import { PAPER_TOTALS } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp — Three-state cysteine classification';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function fmt(n: number): string {
  return n.toLocaleString();
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 88, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 28, color: '#737373' }}>
            three-state cysteine classification
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 30,
            color: '#171717',
            lineHeight: 1.25,
            maxWidth: 1040,
          }}
        >
          Disulfide, metal-binding, or free thiol — across ~700,000 ECOD F70
          representative protein domains.
        </div>

        <div style={{ display: 'flex', gap: 56, marginTop: 'auto', alignItems: 'baseline' }}>
          <Stat label="Domains"      value={fmt(PAPER_TOTALS.domains)} />
          <Stat label="Cysteines"    value={fmt(PAPER_TOTALS.cysteines)} />
          <Stat label="Disulfide"    value={fmt(PAPER_TOTALS.disulfide)}    color="#DC2626" />
          <Stat label="Metal-binding" value={fmt(PAPER_TOTALS.metalBinding)} color="#16A34A" />
          <Stat label="Free thiol"   value={fmt(PAPER_TOTALS.freeThiol)}   color="#737373" />
        </div>
      </div>
    ),
    size,
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </span>
      <span style={{ fontSize: 40, fontWeight: 700, color: color ?? '#171717' }}>
        {value}
      </span>
    </div>
  );
}
