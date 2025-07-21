import { NextRequest, NextResponse } from 'next/server';

const JOB_SECTORS = {
  'technology': {
    name: 'Technology & IT',
    keywords: ['software developer', 'web developer', 'data scientist', 'devops engineer', 'cybersecurity', 'AI engineer', 'mobile developer', 'full stack developer', 'backend developer', 'frontend developer', 'cloud engineer', 'database administrator'],
    icon: '💻'
  },
  'healthcare': {
    name: 'Healthcare & Medical',
    keywords: ['nurse', 'doctor', 'pharmacist', 'medical assistant', 'healthcare administrator', 'therapist', 'surgeon', 'radiologist', 'dentist', 'veterinarian', 'paramedic', 'medical technician'],
    icon: '🏥'
  },
  'finance': {
    name: 'Finance & Banking',
    keywords: ['accountant', 'financial analyst', 'investment banker', 'insurance agent', 'tax advisor', 'auditor', 'financial planner', 'loan officer', 'credit analyst', 'compliance officer'],
    icon: '💰'
  },
  'education': {
    name: 'Education & Training',
    keywords: ['teacher', 'professor', 'tutor', 'education coordinator', 'school administrator', 'librarian', 'curriculum developer', 'academic advisor', 'teaching assistant', 'principal'],
    icon: '📚'
  },
  'engineering': {
    name: 'Engineering',
    keywords: ['mechanical engineer', 'civil engineer', 'electrical engineer', 'chemical engineer', 'aerospace engineer', 'structural engineer', 'environmental engineer', 'biomedical engineer', 'industrial engineer'],
    icon: '⚙️'
  },
  'marketing': {
    name: 'Marketing & Communications',
    keywords: ['digital marketer', 'content creator', 'SEO specialist', 'brand manager', 'social media manager', 'marketing coordinator', 'PR specialist', 'copywriter', 'email marketer', 'growth hacker'],
    icon: '📈'
  },
  'sales': {
    name: 'Sales & Business Development',
    keywords: ['sales representative', 'account manager', 'business development', 'sales director', 'retail associate', 'sales executive', 'inside sales', 'outside sales', 'account executive', 'sales consultant'],
    icon: '🤝'
  },
  'construction': {
    name: 'Construction & Trades',
    keywords: ['construction worker', 'project manager', 'architect', 'carpenter', 'electrician', 'plumber', 'roofer', 'painter', 'welder', 'mason', 'heavy equipment operator'],
    icon: '🏗️'
  },
  'hospitality': {
    name: 'Hospitality & Tourism',
    keywords: ['hotel manager', 'chef', 'waiter', 'event coordinator', 'travel agent', 'housekeeper', 'concierge', 'bartender', 'tour guide', 'restaurant manager', 'catering manager'],
    icon: '🏨'
  },
  'logistics': {
    name: 'Logistics & Transportation',
    keywords: ['supply chain manager', 'warehouse worker', 'delivery driver', 'logistics coordinator', 'freight forwarder', 'dispatcher', 'inventory manager', 'shipping clerk', 'truck driver'],
    icon: '🚛'
  },
  'legal': {
    name: 'Legal Services',
    keywords: ['lawyer', 'paralegal', 'legal assistant', 'compliance officer', 'contract manager', 'attorney', 'legal counsel', 'court reporter', 'legal secretary', 'judge'],
    icon: '⚖️'
  },
  'design': {
    name: 'Design & Creative',
    keywords: ['graphic designer', 'UX designer', 'interior designer', 'fashion designer', 'web designer', 'UI designer', 'product designer', 'art director', 'animator', 'photographer', 'video editor'],
    icon: '🎨'
  },
  'manufacturing': {
    name: 'Manufacturing & Production',
    keywords: ['production manager', 'quality control', 'machine operator', 'maintenance technician', 'assembly worker', 'supervisor', 'quality inspector', 'plant manager', 'process engineer'],
    icon: '🏭'
  },
  'retail': {
    name: 'Retail & Customer Service',
    keywords: ['store manager', 'cashier', 'inventory specialist', 'customer service', 'visual merchandiser', 'retail associate', 'store supervisor', 'buyer', 'loss prevention'],
    icon: '🛍️'
  },
  'government': {
    name: 'Government & Public Service',
    keywords: ['civil servant', 'policy analyst', 'public administrator', 'social worker', 'urban planner', 'government clerk', 'public health inspector', 'city planner', 'federal agent'],
    icon: '🏛️'
  },
  'media': {
    name: 'Media & Communications',
    keywords: ['journalist', 'video editor', 'photographer', 'content writer', 'broadcaster', 'radio host', 'news anchor', 'producer', 'sound technician', 'camera operator'],
    icon: '📺'
  },
  'automotive': {
    name: 'Automotive Industry',
    keywords: ['automotive technician', 'car salesperson', 'parts specialist', 'service advisor', 'auto mechanic', 'body shop technician', 'car detailer', 'service manager'],
    icon: '🚗'
  },
  'agriculture': {
    name: 'Agriculture & Food',
    keywords: ['farmer', 'agricultural scientist', 'veterinarian', 'farm manager', 'food inspector', 'crop specialist', 'livestock manager', 'food scientist', 'agricultural engineer'],
    icon: '🌾'
  },
  'real-estate': {
    name: 'Real Estate & Property',
    keywords: ['real estate agent', 'property manager', 'appraiser', 'mortgage broker', 'real estate developer', 'leasing agent', 'property inspector', 'real estate analyst'],
    icon: '🏠'
  },
  'telecommunications': {
    name: 'Telecommunications',
    keywords: ['network engineer', 'telecom technician', 'call center agent', 'field technician', 'network administrator', 'telecom analyst', 'systems engineer', 'technical support'],
    icon: '📱'
  },
  'energy': {
    name: 'Energy & Utilities',
    keywords: ['power plant operator', 'utility worker', 'renewable energy technician', 'electrical lineman', 'energy analyst', 'solar installer', 'wind technician', 'gas technician'],
    icon: '⚡'
  },
  'non-profit': {
    name: 'Non-Profit & NGO',
    keywords: ['program coordinator', 'fundraiser', 'volunteer coordinator', 'community outreach', 'grant writer', 'social services', 'humanitarian worker', 'charity worker'],
    icon: '❤️'
  },
  'sports': {
    name: 'Sports & Recreation',
    keywords: ['personal trainer', 'coach', 'sports therapist', 'fitness instructor', 'recreation coordinator', 'athletic trainer', 'sports analyst', 'gym manager'],
    icon: '⚽'
  },
  'security': {
    name: 'Security & Safety',
    keywords: ['security guard', 'security officer', 'safety inspector', 'loss prevention', 'private investigator', 'emergency responder', 'safety coordinator', 'security analyst'],
    icon: '🛡️'
  },
  'human-resources': {
    name: 'Human Resources',
    keywords: ['HR manager', 'recruiter', 'talent acquisition', 'HR generalist', 'compensation analyst', 'training coordinator', 'employee relations', 'HR assistant'],
    icon: '👥'
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'detailed';
    const sector = searchParams.get('sector');

    // If specific sector requested
    if (sector && JOB_SECTORS[sector]) {
      return NextResponse.json({
        success: true,
        sector: {
          id: sector,
          ...JOB_SECTORS[sector]
        }
      });
    }

    // Return all sectors
    if (format === 'simple') {
      return NextResponse.json({
        success: true,
        sectors: Object.keys(JOB_SECTORS),
        count: Object.keys(JOB_SECTORS).length
      });
    }

    // Detailed format (default)
    const sectorsWithDetails = Object.entries(JOB_SECTORS).map(([key, value]) => ({
      id: key,
      ...value,
      jobCount: value.keywords.length // Could be replaced with actual job counts
    }));

    return NextResponse.json({
      success: true,
      sectors: sectorsWithDetails,
      count: sectorsWithDetails.length,
      totalKeywords: sectorsWithDetails.reduce((sum, sector) => sum + sector.jobCount, 0)
    });

  } catch (error) {
    console.error('Sectors API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sectors',
      sectors: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, description } = body;

    if (!jobTitle) {
      return NextResponse.json({
        success: false,
        error: 'Job title is required'
      }, { status: 400 });
    }

    // Determine sector based on job title and description
    const text = `${jobTitle} ${description || ''}`.toLowerCase();
    let matchedSector = 'general';
    let confidence = 0;

    for (const [sectorId, sectorData] of Object.entries(JOB_SECTORS)) {
      const matches = sectorData.keywords.filter(keyword => 
        text.includes(keyword.toLowerCase())
      );
      
      if (matches.length > confidence) {
        confidence = matches.length;
        matchedSector = sectorId;
      }
    }

    return NextResponse.json({
      success: true,
      sector: {
        id: matchedSector,
        ...JOB_SECTORS[matchedSector],
        confidence,
        matchedKeywords: JOB_SECTORS[matchedSector]?.keywords.filter(keyword => 
          text.includes(keyword.toLowerCase())
        ) || []
      }
    });

  } catch (error) {
    console.error('Sector Classification Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to classify job sector'
    }, { status: 500 });
  }
}
