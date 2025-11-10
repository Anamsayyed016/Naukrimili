import { ImageResponse } from 'next/og'
 
// Image metadata - Perfect for browser tab favicon (scales to 16x16)
export const size = {
  width: 48,
  height: 48,
}
export const contentType = 'image/png'
 
// Image generation - Ultra-sharp favicon optimized for 16x16px display
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
          background: '#2563eb', // Bright blue for maximum visibility
          borderRadius: '0px', // No rounded corners at tiny size
        }}
      >
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'Arial Black, Arial, sans-serif',
            lineHeight: '48px',
            textAlign: 'center',
            paddingTop: '2px',
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
