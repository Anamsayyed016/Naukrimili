// Debug authentication endpoint
export async function GET(request: Request) {
  return Response.json({ message: 'Debug auth endpoint' });
}
