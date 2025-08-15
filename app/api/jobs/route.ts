import { NextRequest, NextResponse } from 'next/server';

// Fast mock data - no database needed
const mockJobs = [
  { id: 1, title: 'Senior Software Engineer', company: 'TechCorp', companyLogo: '', location: 'Bangalore', country: 'IN', description: 'Build and scale web apps', salary: '15-25 LPA', salaryMin: 1500000, salaryMax: 2500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'senior', isRemote: true, isHybrid: false, isUrgent: false, isFeatured: true, sector: 'IT', skills: ['React', 'Node'], postedAt: new Date(), applyUrl: '/jobs/1/apply', views: 150, applications: 12, createdAt: new Date() },
  { id: 2, title: 'Product Manager', company: 'InnovateSoft', companyLogo: '', location: 'Mumbai', country: 'IN', description: 'Lead product roadmap', salary: '20-35 LPA', salaryMin: 2000000, salaryMax: 3500000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: true, isUrgent: true, isFeatured: true, sector: 'Product', skills: ['Agile', 'Analytics'], postedAt: new Date(), applyUrl: '/jobs/2/apply', views: 200, applications: 18, createdAt: new Date() },
  { id: 3, title: 'Data Scientist', company: 'Digital Solutions', companyLogo: '', location: 'Delhi', country: 'IN', description: 'ML/AI models', salary: '18-30 LPA', salaryMin: 1800000, salaryMax: 3000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Data', skills: ['Python', 'ML'], postedAt: new Date(), applyUrl: '/jobs/3/apply', views: 120, applications: 8, createdAt: new Date() },
  { id: 4, title: 'UX Designer', company: 'Future Systems', companyLogo: '', location: 'Hyderabad', country: 'IN', description: 'Design delightful experiences', salary: '12-20 LPA', salaryMin: 1200000, salaryMax: 2000000, salaryCurrency: 'INR', jobType: 'full-time', experienceLevel: 'mid', isRemote: true, isHybrid: false, isUrgent: false, isFeatured: false, sector: 'Design', skills: ['Figma', 'Prototyping'], postedAt: new Date(), applyUrl: '/jobs/4/apply', views: 90, applications: 6, createdAt: new Date() }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const jobType = searchParams.get('jobType') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const isRemote = searchParams.get('isRemote') === 'true';
    const sector = searchParams.get('sector') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Fast filtering
    let filteredJobs = mockJobs;
    
    if (query) {
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (company) {
      filteredJobs = filteredJobs.filter(job => 
        job.company.toLowerCase().includes(company.toLowerCase())
      );
    }
    
    if (jobType) {
      filteredJobs = filteredJobs.filter(job => job.jobType === jobType);
    }
    
    if (experienceLevel) {
      filteredJobs = filteredJobs.filter(job => job.experienceLevel === experienceLevel);
    }
    
    if (isRemote !== undefined) {
      filteredJobs = filteredJobs.filter(job => job.isRemote === isRemote);
    }
    
    if (sector) {
      filteredJobs = filteredJobs.filter(job => 
        job.sector.toLowerCase().includes(sector.toLowerCase())
      );
    }
    
    // Simple pagination
    const total = filteredJobs.length;
    const skip = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(skip, skip + limit);
    
    return NextResponse.json({
      success: true,
      jobs: paginatedJobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    // Fallback - always return data
    return NextResponse.json({
      success: true,
      jobs: mockJobs,
      pagination: { page: 1, limit: 20, total: mockJobs.length, pages: 1 }
    });
  }
}
