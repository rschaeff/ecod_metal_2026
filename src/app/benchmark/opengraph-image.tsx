import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'TriCyp benchmark — held-out ESM2-3state vs structure-template tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// OG card kept neutral on purpose. Iron-stratum AUROC was the original
// hero metric here, but the RC1 metal-type-stratification analysis
// reframed iron as a confounded comparison (training-set scope, not
// algorithmic superiority). Until the fair-metals (Zn/Ca/Mg/Mn) AUROCs
// are transcribed from the manuscript figure-data CSVs and we can
// promote those, the card leads with the dataset shape and links into
// the page rather than spotlighting any single number.
export default function BenchmarkOpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 60%)',
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
            lineHeight: 1.2,
            maxWidth: 1040,
          }}
        >
          Held-out comparison of ESM2-3state against SSBONDPredict, LMetalSite, and GPSite, with metal-type-stratified ROC.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', gap: 12 }}>
          <span style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: 2, color: '#525252' }}>
            Paper Fig 2 + Fig S1
          </span>
          <div style={{ display: 'flex', gap: 56, fontSize: 22, color: '#404040' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: '#737373', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Disulfide
              </span>
              <span>ESM2-3state · SSBONDPredict</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, color: '#737373', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Metal-binding
              </span>
              <span>ESM2-3state · LMetalSite · GPSite</span>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
