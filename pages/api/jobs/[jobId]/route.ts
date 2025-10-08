// Job details endpoint
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  return Response.json({ jobId: params.jobId, message: 'Job details' });
}
