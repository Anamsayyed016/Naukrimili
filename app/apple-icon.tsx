export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default async function AppleIcon() {
  // Fetch the Cloudinary image
  const imageUrl = 'https://res.cloudinary.com/dko2hk0yo/image/upload/e_make_transparent:10,w_180,h_180,c_fit/v1762455309/nukrimilogo2_tybkqx.png'
  
  return fetch(imageUrl).then(res => res)

