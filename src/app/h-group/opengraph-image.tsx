import { ImageResponse } from 'next/og';
import { HGROUP_HIGHLIGHTS } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp H-group browser — Fig 5A,B confusion matrices';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function HGroupOpengraphImage() {
  const highlights = Object.values(HGROUP_HIGHLIGHTS);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· H-groups</span>
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
          Browse H-groups by structurally-known vs ESM2-predicted cysteine fractions — paper Fig 5A,B confusion matrices.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 16 }}>
          <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, color: '#a16207' }}>
            Candidate-novel metal-binding H-groups · Fig 5C–E
          </span>
          <div style={{ display: 'flex', gap: 32 }}>
            {highlights.map((h) => (
              <div
                key={h.hGroupId}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  border: '2px solid #fde68a',
                  borderRadius: 12,
                  padding: '12px 24px',
                }}
              >
                <span style={{ fontSize: 14, color: '#a16207', textTransform: 'uppercase', letterSpacing: 2 }}>
                  {h.paperFigure}
                </span>
                <span style={{ fontSize: 32, fontWeight: 700, color: '#171717', fontFamily: 'monospace' }}>
                  {h.hGroupId}
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
