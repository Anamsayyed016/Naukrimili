import { ImageResponse } from 'next/og'
 
// Image metadata - Increased size for better visibility
export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="https://res.cloudinary.com/dko2hk0yo/image/upload/e_bgremoval/f_png/q_auto/w_64,h_64,c_fit/v1762626132/naulokriilogo2_upnzxr.png"
        alt="NaukriMili"
        width={64}
        height={64}
      />
    ),
    {
      ...size,
    }
  )
}
