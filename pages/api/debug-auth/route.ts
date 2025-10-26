// Debug authentication endpoint
export async function GET(_request: Request) {
  return Response.json({ message: 'Debug auth endpoint' });
}
