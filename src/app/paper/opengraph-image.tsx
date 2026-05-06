import { ImageResponse } from 'next/og';
import { PAPER_REF, FIGURE_TO_SURFACE } from '@/lib/paperData';

export const runtime = 'edge';
export const alt = 'TriCyp paper — figure-by-figure index';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function PaperOpengraphImage() {
  const mainCount = FIGURE_TO_SURFACE.filter((f) => f.isMain).length;
  const supplementaryCount = FIGURE_TO_SURFACE.filter((f) => !f.isMain).length;

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
          <span style={{ fontSize: 24, color: '#737373' }}>· Paper</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 30,
            fontWeight: 700,
            color: '#171717',
            lineHeight: 1.18,
            maxWidth: 1040,
          }}
        >
          {PAPER_REF.title}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 16,
            fontSize: 22,
            color: '#525252',
          }}
        >
          {PAPER_REF.authors} · {PAPER_REF.year}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 22,
            color: '#404040',
            maxWidth: 980,
            lineHeight: 1.4,
          }}
        >
          Figure-by-figure index of the manuscript. Every main and supplementary figure links directly to its TriCyp surface.
        </div>

        <div style={{ display: 'flex', gap: 64, marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Main figures
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#171717' }}>
              {mainCount}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Supplementary
            </span>
            <span style={{ fontSize: 56, fontWeight: 700, color: '#171717' }}>
              {supplementaryCount}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 16, color: '#737373', textTransform: 'uppercase', letterSpacing: 2 }}>
              Citation
            </span>
            <span style={{ fontSize: 28, fontWeight: 600, color: '#171717' }}>
              BibTeX · RIS
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
