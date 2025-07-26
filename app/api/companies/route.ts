import { NextRequest, NextResponse } from 'next/server'

// Mock database - replace with actual database integration
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

// Mock companies data
const mockCompanies: Company[] = [
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
  },
  {
    id: "3",
    name: "AI Solutions Inc",
    description: "Pioneering artificial intelligence solutions for enterprise clients worldwide. We're building the future of intelligent automation and machine learning.",
    industry: "Artificial Intelligence",
    size: "200-500 employees",
    location: "Remote",
    founded: "2020",
    website: "https://aisolutions.com",
    logo: "/company-logos/aisolutions.png",
    rating: 4.8,
    reviewCount: 89,
    workLifeBalance: 4.5,
    salaryRating: 4.7,
    cultureRating: 4.8,
    activeJobs: 15,
    isHiring: true,
    isTrending: true,
    benefits: ["Competitive salary", "Stock options", "Remote work", "Learning budget", "Health insurance"],
    technologies: ["Python", "TensorFlow", "PyTorch", "AWS", "Kubernetes", "MLflow"],
    verified: true,
    employees: 280,
    headquarters: "Remote",
    type: "startup",
    createdAt: "2020-06-10T00:00:00Z",
    updatedAt: "2024-01-20T09:15:00Z"
  },
  {
    id: "4",
    name: "StartupXYZ",
    description: "Fast-growing fintech startup revolutionizing the payment industry with innovative blockchain solutions and digital wallet technology.",
    industry: "Fintech",
    size: "10-50 employees",
    location: "Austin, TX",
    founded: "2022",
    website: "https://startupxyz.com",
    logo: "/company-logos/startupxyz.png",
    rating: 4.1,
    reviewCount: 67,
    workLifeBalance: 3.8,
    salaryRating: 4.0,
    cultureRating: 4.2,
    activeJobs: 5,
    isHiring: true,
    benefits: ["Equity", "Flexible PTO", "Health insurance", "Remote work", "Learning stipend"],
    technologies: ["React", "Node.js", "PostgreSQL", "Stripe", "Docker", "Redis"],
    verified: false,
    employees: 32,
    headquarters: "Austin, TX",
    type: "startup",
    createdAt: "2022-01-05T00:00:00Z",
    updatedAt: "2024-01-18T16:45:00Z"
  },
  {
    id: "5",
    name: "Global Corp",
    description: "Fortune 500 multinational corporation with operations in over 50 countries. We're leaders in manufacturing, logistics, and supply chain management.",
    industry: "Manufacturing",
    size: "10000+ employees",
    location: "Chicago, IL",
    founded: "1965",
    website: "https://globalcorp.com",
    logo: "/company-logos/globalcorp.png",
    rating: 3.9,
    reviewCount: 892,
    workLifeBalance: 3.5,
    salaryRating: 4.1,
    cultureRating: 3.8,
    activeJobs: 45,
    isHiring: true,
    benefits: ["Comprehensive benefits", "Pension plan", "Global opportunities", "Training programs"],
    technologies: ["SAP", "Oracle", "Java", "Python", "Tableau", "Power BI"],
    verified: true,
    employees: 15000,
    headquarters: "Chicago, IL",
    type: "corporation",
    createdAt: "1965-07-01T00:00:00Z",
    updatedAt: "2024-01-12T11:30:00Z"
  },
  {
    id: "6",
    name: "Green Energy Co",
    description: "Sustainable energy company focused on renewable solutions and environmental innovation. We're committed to creating a cleaner future.",
    industry: "Energy",
    size: "500-1000 employees",
    location: "Portland, OR",
    founded: "2010",
    website: "https://greenenergy.com",
    logo: "/company-logos/greenenergy.png",
    rating: 4.4,
    reviewCount: 312,
    workLifeBalance: 4.3,
    salaryRating: 4.0,
    cultureRating: 4.5,
    activeJobs: 22,
    isHiring: true,
    isTrending: true,
    benefits: ["Green initiatives", "Health benefits", "401k", "Professional development", "Bike to work"],
    technologies: ["IoT", "Python", "R", "Tableau", "AWS", "Solar tech"],
    verified: true,
    employees: 650,
    headquarters: "Portland, OR",
    type: "corporation",
    createdAt: "2010-04-22T00:00:00Z",
    updatedAt: "2024-01-14T13:20:00Z"
  }
]

// GET /api/companies - Get all companies with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const size = searchParams.get('size') || ''
    const location = searchParams.get('location') || ''
    const isHiring = searchParams.get('hiring') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'rating'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filter companies
    let filteredCompanies = mockCompanies.filter(company => {
      const matchesSearch = !search || 
        company.name.toLowerCase().includes(search.toLowerCase()) ||
        company.description.toLowerCase().includes(search.toLowerCase()) ||
        company.industry.toLowerCase().includes(search.toLowerCase()) ||
        company.location.toLowerCase().includes(search.toLowerCase())
      
      const matchesIndustry = !industry || company.industry === industry
      const matchesSize = !size || company.size === size
      const matchesLocation = !location || company.location.toLowerCase().includes(location.toLowerCase())
      const matchesHiring = !isHiring || company.isHiring
      const matchesVerified = !verified || company.verified

      return matchesSearch && matchesIndustry && matchesSize && matchesLocation && matchesHiring && matchesVerified
    })

    // Sort companies
    filteredCompanies.sort((a, b) => {
      let aValue = a[sortBy as keyof Company]
      let bValue = b[sortBy as keyof Company]
      
      // Handle undefined values
      if (aValue === undefined) aValue = ''
      if (bValue === undefined) bValue = ''
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    // Paginate results
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex)
    
    // Calculate pagination info
    const totalPages = Math.ceil(filteredCompanies.length / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: paginatedCompanies,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: filteredCompanies.length,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        industries: [...new Set(mockCompanies.map(c => c.industry))],
        sizes: [...new Set(mockCompanies.map(c => c.size))],
        locations: [...new Set(mockCompanies.map(c => c.location))]
      }
    })

  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'industry', 'location', 'website']
    const missingFields = requiredFields.filter(field => !body[field])
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Create new company
    const newCompany: Company = {
      id: (mockCompanies.length + 1).toString(),
      name: body.name,
      description: body.description,
      industry: body.industry,
      size: body.size || '1-10 employees',
      location: body.location,
      founded: body.founded || new Date().getFullYear().toString(),
      website: body.website,
      logo: body.logo,
      rating: 0,
      reviewCount: 0,
      workLifeBalance: 0,
      salaryRating: 0,
      cultureRating: 0,
      activeJobs: 0,
      isHiring: body.isHiring || false,
      isTrending: false,
      benefits: body.benefits || [],
      technologies: body.technologies || [],
      verified: false,
      employees: body.employees || 1,
      headquarters: body.headquarters || body.location,
      type: body.type || 'startup',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // In a real app, save to database
    mockCompanies.push(newCompany)

    return NextResponse.json({
      success: true,
      data: newCompany,
      message: 'Company created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
