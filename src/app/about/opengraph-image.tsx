import { ImageResponse } from 'next/og';
import { BENCHMARK_THRESHOLDS } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp methods overview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function AboutOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f5f5f4 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· About / Methods</span>
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
          ESM2-3state fine-tuned on PDB-source cysteines with structural ground truth — published thresholds, ensemble inference, benchmarked against structure-aware baselines.
        </div>

        <div style={{ display: 'flex', gap: 64, marginTop: 'auto', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Metal-binding threshold
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#16A34A', fontFamily: 'monospace' }}>
              ≥ {BENCHMARK_THRESHOLDS.metalBinding}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Disulfide threshold
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#DC2626', fontFamily: 'monospace' }}>
              ≥ {BENCHMARK_THRESHOLDS.disulfide}
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
