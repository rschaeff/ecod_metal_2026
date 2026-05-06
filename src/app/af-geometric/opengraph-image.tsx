import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TriCyp · AlphaFold geometric scanning is fundamentally limited';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function AfGeometricOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fef2f2 0%, #ffffff 60%)',
          padding: '64px 80px',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: '#D97706', letterSpacing: -2 }}>
            TriCyp
          </span>
          <span style={{ fontSize: 24, color: '#737373' }}>· AlphaFold geometric scanning</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 38,
            fontWeight: 700,
            color: '#991b1b',
            lineHeight: 1.18,
            maxWidth: 1040,
          }}
        >
          AlphaFold-monomer geometric scanning is fundamentally limited as a disulfide annotation source.
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 24,
            fontSize: 24,
            color: '#404040',
            lineHeight: 1.4,
            maxWidth: 1000,
          }}
        >
          Sγ–Sγ scanning of AFDB models recovers only a small fraction of disulfides annotated in matched PDB structures, even at generous distance cutoffs.
        </div>

        <div style={{ display: 'flex', gap: 56, marginTop: 'auto', alignItems: 'baseline' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Paper figure
            </span>
            <span style={{ fontSize: 48, fontWeight: 700, color: '#171717' }}>
              Fig 4 · A–F
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Includes
            </span>
            <span style={{ fontSize: 28, fontWeight: 600, color: '#171717' }}>
              PyMOL sessions · matched PDB / AFDB
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
