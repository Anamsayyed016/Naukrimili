import { ImageResponse } from 'next/og'
 
// Image metadata - Optimized for browser tab display
export const size = {
  width: 96,
  height: 96,
}
export const contentType = 'image/png'
 
// Image generation - Crystal clear favicon optimized for small display
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
          background: '#2563eb', // Solid blue for maximum clarity
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'system-ui, -apple-system, Arial, sans-serif',
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          N
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
