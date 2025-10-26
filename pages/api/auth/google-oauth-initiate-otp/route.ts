// Google OAuth OTP initiation
export async function POST(_request: Request) {
  return Response.json({ message: 'Google OAuth OTP initiated' });
}
