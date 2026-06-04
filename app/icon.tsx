import { ImageResponse } from 'next/og';

/**
 * Browser tab favicon only — crisp "NM" mark (not full logo artwork).
 * Authoritative source: /icon (Next.js file convention).
 */
export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontSize: 22,
            fontWeight: 900,
            fontFamily: 'Arial Black, Helvetica, sans-serif',
            letterSpacing: '-0.1em',
            lineHeight: 1,
          }}
        >
          <span style={{ color: '#1d4ed8' }}>N</span>
          <span style={{ color: '#0f172a' }}>M</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
