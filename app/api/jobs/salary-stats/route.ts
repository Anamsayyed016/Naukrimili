import { handleApiError } from '@/lib/error-handler';

export async function GET() {
  try {
    return Response.json({
      success: true,
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
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/salary-stats',
      context: { timestamp: new Date().toISOString() }
    });
  }
}
