import { ImageResponse } from 'next/og'
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="https://res.cloudinary.com/dko2hk0yo/image/upload/e_make_transparent:10,w_32,h_32,c_fit/v1762455309/nukrimilogo2_tybkqx.png"
        alt="NaukriMili"
        width={32}
        height={32}
      />
    ),
    {
      ...size,
    }
  )
}
