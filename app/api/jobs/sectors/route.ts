import { handleApiError } from '@/lib/error-handler';

const sectors = [
  {
    id: 'technology',
    name: 'Technology',
    icon: '💻',
    description: 'Software development, IT services, and tech innovation',
    jobCount: 15420,
    averageSalary: '₹18 LPA',
    growth: '+25%',
    topSkills: ['JavaScript', 'Python', 'React', 'Java', 'AWS'],
    topCompanies: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple']
  },
  {
    id: 'finance',
    name: 'Banking & Finance',
    icon: '💰',
    description: 'Banking, investment, insurance, and financial services',
    jobCount: 8750,
    averageSalary: '₹12 LPA',
    growth: '+15%',
    topSkills: ['Financial Analysis', 'Risk Management', 'Excel', 'SQL', 'Bloomberg'],
    topCompanies: ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Goldman Sachs', 'JP Morgan']
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Medical services, pharmaceuticals, and health technology',
    jobCount: 6890,
    averageSalary: '₹10 LPA',
    growth: '+20%',
    topSkills: ['Medical Knowledge', 'Patient Care', 'Clinical Research', 'Healthcare IT'],
    topCompanies: ['Apollo Hospitals', 'Fortis', 'Max Healthcare', 'Cipla', 'Dr. Reddy\'s']
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    icon: '⚙️',
    description: 'Production, quality control, and industrial operations',
    jobCount: 7890,
    averageSalary: '₹9 LPA',
    growth: '+10%',
    topSkills: ['Production Planning', 'Quality Control', 'Lean Manufacturing', 'Six Sigma'],
    topCompanies: ['Tata Motors', 'Mahindra', 'Bajaj Auto', 'L&T', 'Maruti Suzuki']
  }
];

export async function GET() {
  try {
    return Response.json({
      success: true,
      sectors: sectors,
      total: sectors.length,
      totalJobs: sectors.reduce((sum, sector) => sum + sector.jobCount, 0)
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: 'GET /api/jobs/sectors',
      context: { timestamp: new Date().toISOString() }
    });
  }
}