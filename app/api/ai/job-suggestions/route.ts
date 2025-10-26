import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { type, field, value, context } = await request.json();

    if (!type || !field) {
      return NextResponse.json(
        { error: "Type and field are required" },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.log("Gemini API key not found, falling back to static suggestions");
      return getStaticSuggestions(type, field, value, context);
    }

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Generate AI suggestions using Gemini
      const suggestions = await generateGeminiSuggestions(model, type, field, value, context);
      
      return NextResponse.json({
        success: true,
        suggestions,
        confidence: 90,
        aiProvider: 'gemini'
      });

    } catch (geminiError) {
      console.error("Gemini AI error:", geminiError);
      console.log("Falling back to static suggestions");
      return getStaticSuggestions(type, field, value, context);
    }

  } catch (_error) {
    console.error("Error generating job suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

async function generateGeminiSuggestions(model: any, type: string, field: string, value: string, context: any): Promise<string[]> {
  const prompt = generatePrompt(type, field, value, context);
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the response to extract suggestions
    const suggestions = parseGeminiResponse(text);
    return suggestions;
  } catch (_error) {
    console.error("Error generating Gemini content:", error);
    throw error;
  }
}

function generatePrompt(type: string, field: string, value: string, context: any): string {
  const jobType = context?.jobType || 'Full-time';
  const experienceLevel = context?.experienceLevel || 'Mid Level';
  const industry = context?.industry || 'Technology';
  const department = context?.department || 'Engineering';

  switch (type) {
    case 'jobTitle':
      return `Generate 5 professional job titles for a ${experienceLevel} position in ${industry} industry, ${department} department. Current input: "${value}". Return only the job titles, one per line, without numbering or bullet points.`;
    
    case 'description':
      return `Generate a professional job description for a "${value}" position in ${industry} industry. Include key responsibilities, what the company does, and what makes this role exciting. Keep it concise (150-200 words). Return only the description text.`;
    
    case 'requirements':
      return `Generate 6-8 key requirements for a "${value}" position in ${industry} industry, ${experienceLevel} level. Include education, experience, technical skills, and soft skills. Return only the requirements, one per line, without numbering.`;
    
    case 'skills':
      return `Generate 8-10 essential technical and soft skills for a "${value}" position in ${industry} industry, ${experienceLevel} level. Focus on industry-relevant skills. Return only skill names, one per line, without numbering.`;
    
    case 'benefits':
      return `Generate 6-8 attractive benefits and perks for a ${industry} company offering a "${value}" position. Include both standard and industry-specific benefits. Return only the benefits, one per line, without numbering.`;
    
    default:
      return `Generate 5 professional suggestions for "${field}" field with value "${value}" in context of ${industry} industry. Return only the suggestions, one per line.`;
  }
}

function parseGeminiResponse(text: string): string[] {
  // Split by lines and clean up the response
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Remove numbered items
    .filter(line => !line.toLowerCase().includes('here are') && !line.toLowerCase().includes('suggestions:'))
    .slice(0, 10); // Limit to 10 suggestions
  
  return lines.length > 0 ? lines : ['No suggestions available'];
}

function getStaticSuggestions(type: string, field: string, value: string, context: any) {
  let suggestions = [];

  switch (type) {
    case 'jobTitle':
      suggestions = generateJobTitleSuggestions(field, value, context);
      break;
    case 'description':
      suggestions = generateDescriptionSuggestions(field, value, context);
      break;
    case 'requirements':
      suggestions = generateRequirementsSuggestions(field, value, context);
      break;
    case 'skills':
      suggestions = generateSkillsSuggestions(field, value, context);
      break;
    case 'benefits':
      suggestions = generateBenefitsSuggestions(field, value, context);
      break;
    case 'location':
      suggestions = generateLocationSuggestions(field, value, context);
      break;
    default:
      suggestions = generateGenericSuggestions(field, value, context);
  }

  return NextResponse.json({
    success: true,
    suggestions,
    confidence: 75,
    aiProvider: 'static'
  });
}

function generateJobTitleSuggestions(field: string, value: string, context: any): string[] {
  const industry = context?.industry || 'Technology';
  const experience = context?.experienceLevel || 'Mid Level';
  const department = context?.department || 'Engineering';

  const jobTitles = {
    'Technology': {
      'Engineering': [
        'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
        'Backend Developer', 'DevOps Engineer', 'Cloud Engineer', 'Security Engineer',
        'Machine Learning Engineer', 'Data Engineer', 'Solutions Architect',
        'Technical Lead', 'Engineering Manager', 'Principal Engineer'
      ],
      'Product': [
        'Product Manager', 'Senior Product Manager', 'Product Owner',
        'Technical Product Manager', 'Product Marketing Manager', 'Product Analyst'
      ],
      'Design': [
        'UI/UX Designer', 'Senior UX Designer', 'Product Designer',
        'Visual Designer', 'Design System Designer', 'UX Researcher'
      ],
      'Data': [
        'Data Scientist', 'Senior Data Scientist', 'Data Analyst',
        'Business Intelligence Analyst', 'ML Engineer', 'Data Engineer'
      ]
    },
    'Healthcare': {
      'Clinical': [
        'Registered Nurse', 'Senior Nurse', 'Nurse Practitioner',
        'Physician Assistant', 'Clinical Nurse Specialist', 'Nurse Manager'
      ],
      'Administrative': [
        'Healthcare Administrator', 'Medical Office Manager', 'Health Services Manager',
        'Patient Care Coordinator', 'Healthcare Operations Manager'
      ],
      'Technology': [
        'Healthcare IT Specialist', 'Medical Software Engineer', 'Health Informatics Specialist',
        'Clinical Systems Analyst', 'Healthcare Data Analyst'
      ]
    },
    'Finance': {
      'Banking': [
        'Financial Analyst', 'Senior Financial Analyst', 'Investment Analyst',
        'Credit Analyst', 'Risk Analyst', 'Compliance Officer'
      ],
      'Investment': [
        'Portfolio Manager', 'Investment Advisor', 'Wealth Manager',
        'Financial Planner', 'Securities Analyst', 'Trading Specialist'
      ],
      'Accounting': [
        'Senior Accountant', 'Financial Controller', 'Tax Specialist',
        'Audit Manager', 'Cost Accountant', 'Budget Analyst'
      ]
    },
    'Education': {
      'Teaching': [
        'Elementary School Teacher', 'High School Teacher', 'Special Education Teacher',
        'Curriculum Specialist', 'Instructional Designer', 'Academic Coordinator'
      ],
      'Administration': [
        'School Principal', 'Academic Dean', 'Student Affairs Coordinator',
        'Educational Administrator', 'Program Director', 'Academic Advisor'
      ]
    }
  };

  const industryJobs = jobTitles[industry] || jobTitles['Technology'];
  const departmentJobs = industryJobs[department] || industryJobs['Engineering'];
  
  // Filter based on experience level
  const filteredJobs = departmentJobs.filter(job => {
    if (experience === 'Entry Level' && job.toLowerCase().includes('senior')) return false;
    if (experience === 'Senior Level' && !job.toLowerCase().includes('senior') && !job.toLowerCase().includes('lead') && !job.toLowerCase().includes('manager')) return false;
    return true;
  });

  return filteredJobs.slice(0, 8);
}

function generateDescriptionSuggestions(field: string, value: string, context: any): string[] {
  const jobTitle = context?.title || 'Software Engineer';
  const industry = context?.industry || 'Technology';
  const companySize = context?.companySize || 'Medium';

  const descriptions = [
    `We are seeking a talented ${jobTitle} to join our dynamic team. You will be responsible for developing innovative solutions, collaborating with cross-functional teams, and contributing to our mission of delivering exceptional ${industry.toLowerCase()} services. This role offers excellent growth opportunities and the chance to work with cutting-edge technologies.`,
    
    `Join our growing ${industry} company as a ${jobTitle}. You will play a key role in driving our technical initiatives forward, working on challenging projects, and mentoring junior team members. We offer a collaborative environment, competitive compensation, and opportunities for professional development.`,
    
    `We're looking for an experienced ${jobTitle} to help us scale our platform and deliver outstanding results. You will work closely with product managers, designers, and other engineers to build robust, scalable solutions. This is an excellent opportunity to make a significant impact in a fast-growing ${industry} company.`,
    
    `Come be part of our innovative team as a ${jobTitle}. You will contribute to the development of our core products, participate in architectural decisions, and help shape our technical roadmap. We value creativity, collaboration, and continuous learning.`,
    
    `We are hiring a skilled ${jobTitle} to join our ${companySize.toLowerCase()} team. You will work on exciting projects that directly impact our customers, collaborate with talented colleagues, and have the opportunity to learn and grow in a supportive environment.`
  ];

  return descriptions;
}

function generateRequirementsSuggestions(field: string, value: string, context: any): string[] {
  const jobTitle = context?.title || 'Software Engineer';
  const experience = context?.experienceLevel || 'Mid Level';
  const industry = context?.industry || 'Technology';

  const baseRequirements = [
    'Bachelor\'s degree in Computer Science, Engineering, or related field',
    'Strong problem-solving and analytical skills',
    'Excellent communication and collaboration abilities',
    'Experience with agile development methodologies',
    'Strong attention to detail and commitment to quality',
    'Ability to work independently and as part of a team'
  ];

  const experienceRequirements = {
    'Entry Level': [
      '0-2 years of relevant experience',
      'Recent graduate or equivalent experience',
      'Strong foundation in programming fundamentals',
      'Eagerness to learn and grow'
    ],
    'Mid Level': [
      '3-5 years of relevant professional experience',
      'Proven track record of delivering quality solutions',
      'Experience mentoring junior team members',
      'Strong technical leadership skills'
    ],
    'Senior Level': [
      '6+ years of relevant professional experience',
      'Experience leading technical initiatives',
      'Strong architectural and design skills',
      'Proven ability to mentor and guide teams'
    ]
  };

  const industrySpecificRequirements = {
    'Technology': [
      'Experience with modern development frameworks',
      'Knowledge of software design patterns',
      'Understanding of database design and optimization',
      'Experience with version control systems (Git)'
    ],
    'Healthcare': [
      'Knowledge of healthcare regulations (HIPAA)',
      'Experience with healthcare IT systems',
      'Understanding of clinical workflows',
      'Certification in relevant healthcare technologies'
    ],
    'Finance': [
      'Knowledge of financial regulations',
      'Experience with financial software systems',
      'Understanding of risk management principles',
      'Relevant financial certifications preferred'
    ]
  };

  const specificReqs = industrySpecificRequirements[industry] || industrySpecificRequirements['Technology'];
  const expReqs = experienceRequirements[experience] || experienceRequirements['Mid Level'];

  return [...baseRequirements, ...expReqs, ...specificReqs];
}

function generateSkillsSuggestions(field: string, value: string, context: any): string[] {
  const jobTitle = context?.title || 'Software Engineer';
  const industry = context?.industry || 'Technology';

  const skillsByIndustry = {
    'Technology': {
      'Software Engineer': ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL', 'MongoDB'],
      'Frontend Developer': ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Webpack', 'Jest', 'Redux'],
      'Backend Developer': ['Python', 'Java', 'Node.js', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST API', 'Docker', 'Kubernetes'],
      'DevOps Engineer': ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Ansible', 'Linux', 'CI/CD', 'Monitoring', 'Infrastructure'],
      'Data Scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Jupyter']
    },
    'Healthcare': {
      'Nurse': ['Patient Care', 'Medical Records', 'HIPAA Compliance', 'CPR Certification', 'Medication Administration', 'Clinical Assessment'],
      'Healthcare IT': ['Electronic Health Records', 'Healthcare Analytics', 'HIPAA Compliance', 'HL7', 'FHIR', 'Medical Software']
    },
    'Finance': {
      'Financial Analyst': ['Excel', 'Financial Modeling', 'SQL', 'Risk Analysis', 'Investment Analysis', 'Financial Reporting', 'VBA', 'Power BI'],
      'Investment Advisor': ['Financial Planning', 'Portfolio Management', 'Risk Management', 'Investment Analysis', 'Client Relations', 'Compliance']
    }
  };

  const industrySkills = skillsByIndustry[industry] || skillsByIndustry['Technology'];
  const jobSkills = industrySkills[jobTitle] || industrySkills['Software Engineer'];

  return jobSkills;
}

function generateBenefitsSuggestions(field: string, value: string, context: any): string[] {
  const industry = context?.industry || 'Technology';
  const companySize = context?.companySize || 'Medium';

  const commonBenefits = [
    'Health Insurance',
    'Dental Insurance',
    'Vision Insurance',
    'Life Insurance',
    'Paid Time Off',
    'Professional Development',
    'Flexible Hours',
    'Remote Work Options'
  ];

  const industrySpecificBenefits = {
    'Technology': [
      'Stock Options',
      'Equipment Allowance',
      'Conference Attendance',
      'Learning Budget',
      'Gym Membership',
      'Free Meals'
    ],
    'Healthcare': [
      'Tuition Reimbursement',
      'Childcare Support',
      'Mental Health Support',
      'Wellness Programs',
      'Continuing Education'
    ],
    'Finance': [
      'Performance Bonuses',
      '401(k) Matching',
      'Transportation Allowance',
      'Client Entertainment Budget',
      'Professional Memberships'
    ]
  };

  const companySizeBenefits = {
    'Startup': [
      'Equity Participation',
      'Flexible Schedule',
      'Casual Dress Code',
      'Team Events'
    ],
    'Large': [
      'Pension Plan',
      'Employee Discounts',
      'Corporate Wellness',
      'Career Development Programs'
    ]
  };

  const specificBenefits = industrySpecificBenefits[industry] || industrySpecificBenefits['Technology'];
  const sizeBenefits = companySizeBenefits[companySize] || [];

  return [...commonBenefits, ...specificBenefits, ...sizeBenefits].slice(0, 12);
}

function generateLocationSuggestions(field: string, value: string, context: any): string[] {
  const country = context?.country || 'India';
  
  const locations = {
    'India': [
      'Bangalore, Karnataka',
      'Mumbai, Maharashtra',
      'Delhi, NCR',
      'Hyderabad, Telangana',
      'Pune, Maharashtra',
      'Chennai, Tamil Nadu',
      'Kolkata, West Bengal',
      'Ahmedabad, Gujarat',
      'Gurgaon, Haryana',
      'Noida, Uttar Pradesh'
    ],
    'USA': [
      'San Francisco, CA',
      'New York, NY',
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Chicago, IL',
      'Los Angeles, CA',
      'Denver, CO',
      'Miami, FL',
      'Portland, OR'
    ],
    'UK': [
      'London, England',
      'Manchester, England',
      'Birmingham, England',
      'Edinburgh, Scotland',
      'Glasgow, Scotland',
      'Leeds, England',
      'Liverpool, England',
      'Bristol, England'
    ]
  };

  return locations[country] || locations['India'];
}

function generateGenericSuggestions(field: string, value: string, context: any): string[] {
  return [
    'Option 1',
    'Option 2',
    'Option 3',
    'Option 4',
    'Option 5'
  ];
}
