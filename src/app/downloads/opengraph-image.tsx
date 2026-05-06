import { ImageResponse } from 'next/og';
import { RATE_LIMIT_CONFIG } from '@/lib/rateLimit';
import { BULK_DATA, FIGURE_DATA } from '@/lib/downloads';

export const runtime = 'edge';
export const alt = 'TriCyp downloads & REST API';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function DownloadsOpengraphImage() {
  const rateLimitLine = `${RATE_LIMIT_CONFIG.limit} req / ${Math.round(RATE_LIMIT_CONFIG.windowMs / 1000)} s`;

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
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· Downloads &amp; API</span>
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
          Per-cysteine TSV, per-domain summary, H-group aggregates, figure CSVs, predictor source — and a public read-only REST API.
        </div>

        <div style={{ display: 'flex', gap: 56, marginTop: 'auto' }}>
          <Stat label="Bulk TSVs"      value={`${BULK_DATA.length}`} />
          <Stat label="Figure CSVs"    value={`${FIGURE_DATA.length}`} />
          <Stat label="REST endpoints" value="5" />
          <Stat label="Rate limit"     value={rateLimitLine} mono />
        </div>
      </div>
    ),
    size,
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#171717',
          fontFamily: mono ? 'monospace' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
