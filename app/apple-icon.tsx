import { ImageResponse } from 'next/og'
 
// Image metadata - Apple touch icon (larger for iOS devices)
export const size = {
  width: 256,
  height: 256,
}
export const contentType = 'image/png'
 
// Image generation - High quality Apple icon
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
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '28px',
        }}
      >
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
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

