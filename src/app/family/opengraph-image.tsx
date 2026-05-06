import { ImageResponse } from 'next/og';
import { PAPER_TOTALS } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp · Browse ECOD families with classified cysteines';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function FamilyOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· Browse families</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 36,
            fontWeight: 700,
            color: '#171717',
            lineHeight: 1.18,
            maxWidth: 1040,
          }}
        >
          Sortable F-group index across {PAPER_TOTALS.domains.toLocaleString()} ECOD F70 representative domains. Filter by kingdom, sort by metal-binding count, drill into per-domain detail.
        </div>

        <div style={{ display: 'flex', gap: 64, marginTop: 'auto', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Domains
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#171717' }}>
              {PAPER_TOTALS.domains.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Metal-binding
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#16A34A' }}>
              {PAPER_TOTALS.metalBinding.toLocaleString()}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Disulfide
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#DC2626' }}>
              {PAPER_TOTALS.disulfide.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
