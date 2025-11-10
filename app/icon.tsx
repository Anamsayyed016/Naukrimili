import { ImageResponse } from 'next/og'
 
// Image metadata - Large size for maximum visibility in browser tabs
export const size = {
  width: 128,
  height: 128,
}
export const contentType = 'image/png'
 
// Image generation - High quality favicon
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '20px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
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
