import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
// Image generation
export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="https://res.cloudinary.com/dko2hk0yo/image/upload/e_make_transparent:10,w_180,h_180,c_fit/v1762455309/nukrimilogo2_tybkqx.png"
        alt="NaukriMili"
        width={180}
        height={180}
      />
    ),
    {
      ...size,
    }
  )
}

