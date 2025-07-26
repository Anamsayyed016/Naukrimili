import { NextRequest, NextResponse } from 'next/server'

// Import the same interface and mock data from the companies route
interface Company {
  id: string
  name: string
  description: string
  industry: string
  size: string
  location: string
  founded: string
  website: string
  logo?: string
  rating: number
  reviewCount: number
  workLifeBalance: number
  salaryRating: number
  cultureRating: number
  activeJobs: number
  isHiring: boolean
  isTrending?: boolean
  benefits: string[]
  technologies: string[]
  verified?: boolean
  employees?: number
  headquarters?: string
  type?: 'startup' | 'corporation' | 'non-profit' | 'government'
  createdAt: string
  updatedAt: string
}

// Same mock data (in production, this would come from a database)
let mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp",
    description: "Leading technology company focused on innovative solutions that transform how people work and live. We specialize in cloud computing, AI, and enterprise software.",
    industry: "Technology",
    size: "100-500 employees",
    location: "San Francisco, CA",
    founded: "2018",
    website: "https://techcorp.com",
    logo: "/company-logos/techcorp.png",
    rating: 4.5,
    reviewCount: 234,
    workLifeBalance: 4.2,
    salaryRating: 4.3,
    cultureRating: 4.6,
    activeJobs: 12,
    isHiring: true,
    isTrending: true,
    benefits: ["Health insurance", "401k matching", "Remote work", "Flexible hours", "Stock options"],
    technologies: ["React", "Node.js", "Python", "AWS", "Docker", "Kubernetes"],
    verified: true,
    employees: 350,
    headquarters: "San Francisco, CA",
    type: "corporation",
    createdAt: "2018-01-15T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    name: "DesignStudio Pro",
    description: "Creative agency specializing in user experience design and digital product development. We help brands create meaningful connections with their audiences.",
    industry: "Design",
    size: "50-100 employees",
    location: "New York, NY",
    founded: "2015",
    website: "https://designstudiopro.com",
    logo: "/company-logos/designstudio.png",
    rating: 4.2,
    reviewCount: 156,
    workLifeBalance: 4.0,
    salaryRating: 3.8,
    cultureRating: 4.4,
    activeJobs: 8,
    isHiring: true,
    benefits: ["Creative environment", "Professional development", "Health benefits", "Flexible PTO"],
    technologies: ["Figma", "Adobe Creative Suite", "Sketch", "InVision", "Principle"],
    verified: true,
    employees: 75,
    headquarters: "New York, NY",
    type: "corporation",
    createdAt: "2015-03-20T00:00:00Z",
    updatedAt: "2024-01-10T14:20:00Z"
  }
  // Add more companies as needed
]

// GET /api/companies/[id] - Get specific company by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params
    
    // Find company by ID
    const company = mockCompanies.find(c => c.id === id)
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Get related companies (same industry)
    const relatedCompanies = mockCompanies
      .filter(c => c.id !== id && c.industry === company.industry)
      .slice(0, 3)

    return NextResponse.json({
      success: true,
      data: {
        company,
        relatedCompanies,
        stats: {
          totalEmployees: company.employees || 0,
          totalReviews: company.reviewCount,
          overallRating: company.rating,
          industryRank: Math.floor(Math.random() * 10) + 1, // Mock ranking
          growthRate: Math.floor(Math.random() * 50) + 10 // Mock growth rate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/[id] - Update company information
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params
    const body = await request.json()
    
    // Find company index
    const companyIndex = mockCompanies.findIndex(c => c.id === id)
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Update company data
    const updatedCompany = {
      ...mockCompanies[companyIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }

    mockCompanies[companyIndex] = updatedCompany

    return NextResponse.json({
      success: true,
      data: updatedCompany,
      message: 'Company updated successfully'
    })

  } catch (error) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update company' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/[id] - Delete company
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    const { id } = params
    
    // Find company index
    const companyIndex = mockCompanies.findIndex(c => c.id === id)
    
    if (companyIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    // Remove company
    const deletedCompany = mockCompanies.splice(companyIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedCompany,
      message: 'Company deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}
