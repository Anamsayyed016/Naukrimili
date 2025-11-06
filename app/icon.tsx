export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default async function Icon() {
  // Fetch the Cloudinary image
  const imageUrl = 'https://res.cloudinary.com/dko2hk0yo/image/upload/e_make_transparent:10,w_32,h_32,c_fit/v1762455309/nukrimilogo2_tybkqx.png'
  
  return fetch(imageUrl).then(res => res)
