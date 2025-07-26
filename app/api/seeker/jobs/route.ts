export async function GET() {
  return new Response(JSON.stringify({
    jobs: [
      {
        id: "1",
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Remote",
        salary: "100,000 - 150,000",
        description: "Looking for an experienced software engineer...",
        requirements: ["JavaScript", "React", "Node.js"],
        postedDate: "2025-07-20T00:00:00Z"
      },
      {
        id: "2",
        title: "Product Manager",
        company: "Product Co",
        location: "New York",
        salary: "120,000 - 180,000",
        description: "Join our product team...",
        requirements: ["Product Management", "Agile", "MBA"],
        postedDate: "2025-07-21T00:00:00Z"
      }
    ]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST() {
  return new Response(JSON.stringify({
    message: "Job application functionality temporarily disabled"
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
