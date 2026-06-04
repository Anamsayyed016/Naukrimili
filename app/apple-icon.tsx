import { ImageResponse } from 'next/og';

/** Apple touch icon — same NM mark as tab favicon, larger for home screen */
export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontSize: 108,
            fontWeight: 900,
            fontFamily: 'Arial Black, Helvetica, sans-serif',
            letterSpacing: '-0.08em',
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
