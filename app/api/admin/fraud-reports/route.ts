export async function GET() {
  return new Response(JSON.stringify({
    reports: [
      {
        id: "1",
        title: "Suspicious Job Listing",
        description: "This job listing appears to be fraudulent",
        status: "pending",
        createdAt: new Date().toISOString(),
        reportedBy: {
          id: "user1",
          name: "John Doe",
          email: "john@example.com"
        },
        reportedJob: {
          id: "job1",
          title: "Remote Developer",
          company: "Tech Corp"
        }
      }
    ]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST() {
  return new Response(JSON.stringify({
    message: "Fraud report creation temporarily disabled"
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
