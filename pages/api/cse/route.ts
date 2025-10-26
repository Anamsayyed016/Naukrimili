// Custom Search Engine endpoint
export async function GET(_request: Request) {
  return Response.json({ message: 'CSE endpoint' });
}
