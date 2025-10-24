// Custom Search Engine endpoint
export async function GET(request: Request) {
  return Response.json({ message: 'CSE endpoint' });
}
