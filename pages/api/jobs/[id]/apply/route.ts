// Job application endpoint
export async function POST(request: Request) {
  const { id } = await request.json();
  return Response.json({ message: `Apply for job ${id}` });
}
