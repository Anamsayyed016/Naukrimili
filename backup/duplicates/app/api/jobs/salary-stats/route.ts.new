export async function GET() {
  return new Response(JSON.stringify({
    averageSalary: 75000,
    medianSalary: 70000,
    salaryRange: {
      min: 50000,
      max: 100000
    },
    jobCount: 150,
    topCompanies: [
      { name: 'Tech Corp', avgSalary: 80000 },
      { name: 'Dev Solutions', avgSalary: 75000 }
    ],
    mostCommonBenefits: [
      'Health Insurance',
      'Remote Work',
      '401k'
    ]
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
