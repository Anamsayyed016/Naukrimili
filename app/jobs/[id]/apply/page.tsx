import ApplyClient from "./pageClient";

interface Params { params: Promise<{ id: string }> }

export default async function ApplyPage({ params }: Params) {
  const { id } = await params;
  return <ApplyClient jobId={id} />;
}


