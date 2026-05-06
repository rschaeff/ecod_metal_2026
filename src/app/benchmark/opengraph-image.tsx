import { ImageResponse } from 'next/og';
import { BENCHMARK_IRON_ONLY } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp benchmark — iron-only AUROC';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function BenchmarkOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· Benchmark</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 36,
            fontWeight: 700,
            color: '#171717',
            lineHeight: 1.15,
            maxWidth: 1040,
          }}
        >
          ESM2-3state generalises across metal types where structure-template baselines degrade most on iron coordination.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 16 }}>
          <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, color: '#15803d' }}>
            Iron-only AUROC · paper Fig S1
          </span>
          <div style={{ display: 'flex', gap: 56 }}>
            {BENCHMARK_IRON_ONLY.map((row) => (
              <div key={row.tool} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, color: '#737373' }}>{row.tool}</span>
                <span style={{ fontSize: 64, fontWeight: 700, color: row.tool === 'ESM2-3state' ? '#15803d' : '#171717' }}>
                  {row.auroc.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
