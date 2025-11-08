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
        src="https://res.cloudinary.com/dko2hk0yo/image/upload/w_180,h_180,c_fit/v1762626132/naulokriilogo2_upnzxr.png"
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

