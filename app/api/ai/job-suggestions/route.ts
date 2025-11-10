import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI job suggestions endpoint called');
    
    const body = await request.json();
    const { type, field, value, context } = body;
    
    console.log('📋 Request params:', { type, field, valueLength: value?.length, context });

    if (!type || !field) {
      console.log('❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: "Type and field are required" },
        { status: 400 }
      );
    }

    if (!value || value.trim().length < 2) {
      console.log('❌ Value too short or empty');
      return NextResponse.json(
        { success: false, error: "Value must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!geminiApiKey) {
      console.log("⚠️ Gemini API key not found, falling back to static suggestions");
      return getStaticSuggestions(type, field, value, context);
    }

    try {
      console.log('🔑 Gemini API key found, initializing AI...');
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Generate AI suggestions using Gemini
      console.log('🎨 Generating AI suggestions...');
      const suggestions = await generateGeminiSuggestions(model, type, field, value, context);
      
      console.log('✅ AI suggestions generated:', suggestions?.length || 0, 'suggestions');
      
      return NextResponse.json({
        success: true,
        suggestions,
        confidence: 90,
        aiProvider: 'gemini'
      });

    } catch (geminiError) {
      console.error("❌ Gemini AI error:", geminiError);
      console.log("⚠️ Falling back to static suggestions");
      return getStaticSuggestions(type, field, value, context);
    }

  } catch (error) {
    console.error("❌ Error generating job suggestions:", error);
    console.error("Error details:", error instanceof Error ? error.message : 'Unknown error');
    
    // Return static suggestions as fallback instead of error
    return NextResponse.json({
      success: true,
      suggestions: ['Unable to generate suggestions. Please enter manually.'],
      confidence: 50,
      aiProvider: 'fallback'
    });
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
    console.error("Error generating Gemini content:", _error);
    throw _error;
  }
}

function generatePrompt(type: string, field: string, value: string, context: any): string {
  const jobType = context?.jobType || 'Full-time';
  const experienceLevel = context?.experienceLevel || 'Mid Level';
  const industry = context?.industry || 'Technology';
  const department = context?.department || 'Engineering';

  // Map field types properly
  const mappedType = type === 'title' ? 'jobTitle' : type;

  switch (mappedType) {
    case 'jobTitle':
    case 'title':
      // Generate dynamic job titles based on keywords the user typed
      return `Generate 8 professional job titles based on the keywords "${value}". Consider variations, seniority levels, and related roles. Be specific to the technology/skill mentioned. For example, if input is "python", suggest "Python Developer", "Senior Python Engineer", "Python Backend Developer", etc. Return only the job titles, one per line, without numbering.`;
    
    case 'description':
      return `Generate a professional job description for a "${value}" position in ${industry} industry. Include key responsibilities, what the company does, and what makes this role exciting. Keep it concise (150-200 words). Return only the description text.`;
    
    case 'requirements':
      return `Generate 6-8 key requirements for a "${value}" position in ${industry} industry, ${experienceLevel} level. Include education, experience, technical skills, and soft skills. Return only the requirements, one per line, without numbering.`;
    
    case 'skills':
      return `Generate 8-10 essential technical and soft skills for a "${value}" position in ${industry} industry, ${experienceLevel} level. Focus on industry-relevant skills. Return only skill names, one per line, without numbering.`;
    
    case 'benefits':
      return `Generate 6-8 attractive benefits and perks for a ${industry} company offering a "${value}" position. Include both standard and industry-specific benefits. Return only the benefits, one per line, without numbering.`;
    
    default:
      return `Generate 5 professional suggestions based on "${value}" for "${field}" field in ${industry} industry. Be specific to the keywords and context. Return only the suggestions, one per line.`;
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

  // Map field types properly
  const mappedType = type === 'title' ? 'jobTitle' : type;

  switch (mappedType) {
    case 'jobTitle':
    case 'title':
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
  // Dynamic job title generation based on keywords in the input value
  const lowerValue = value.toLowerCase();
  const suggestions = new Set<string>();
  
  // Technology keywords mapping
  const techKeywords = {
    'python': ['Python Developer', 'Senior Python Developer', 'Python Backend Developer', 'Python Software Engineer', 'Python Data Engineer'],
    'javascript': ['JavaScript Developer', 'Senior JavaScript Developer', 'Full Stack JavaScript Developer', 'JS Engineer', 'Node.js Developer'],
    'react': ['React Developer', 'Senior React Developer', 'React Frontend Developer', 'React Native Developer', 'React Engineer'],
    'node': ['Node.js Developer', 'Senior Node.js Developer', 'Backend Node.js Developer', 'Node.js Architect', 'Full Stack Developer'],
    'java': ['Java Developer', 'Senior Java Developer', 'Java Backend Developer', 'Java Software Engineer', 'Java Architect'],
    'php': ['PHP Developer', 'Senior PHP Developer', 'PHP Backend Developer', 'Laravel Developer', 'PHP Engineer'],
    'sql': ['SQL Developer', 'Database Developer', 'Database Administrator', 'SQL Analyst', 'Data Engineer'],
    'aws': ['AWS Cloud Engineer', 'Senior AWS Developer', 'DevOps Engineer', 'Cloud Architect', 'AWS Solutions Architect'],
    'docker': ['DevOps Engineer', 'Senior DevOps Engineer', 'Infrastructure Engineer', 'DevOps Architect', 'Container Engineer'],
    'kubernetes': ['DevOps Engineer', 'Kubernetes Engineer', 'Cloud Infrastructure Engineer', 'Container Platform Engineer', 'K8s Engineer'],
    'data': ['Data Engineer', 'Data Scientist', 'Senior Data Engineer', 'Big Data Engineer', 'Data Analyst'],
    'machine learning': ['ML Engineer', 'Machine Learning Engineer', 'Senior ML Engineer', 'AI Engineer', 'Data Scientist'],
    'frontend': ['Frontend Developer', 'Senior Frontend Developer', 'UI Developer', 'React Developer', 'Angular Developer'],
    'backend': ['Backend Developer', 'Senior Backend Developer', 'Backend Engineer', 'API Developer', 'Server-Side Developer'],
    'full stack': ['Full Stack Developer', 'Senior Full Stack Developer', 'Full Stack Engineer', 'MERN Stack Developer', 'MEAN Stack Developer'],
    'mobile': ['Mobile Developer', 'Senior Mobile Developer', 'iOS Developer', 'Android Developer', 'React Native Developer'],
    'design': ['UI/UX Designer', 'Product Designer', 'Senior UX Designer', 'UI Designer', 'Design System Designer'],
    'security': ['Security Engineer', 'Cybersecurity Engineer', 'Application Security Engineer', 'Senior Security Engineer', 'Penetration Tester'],
    'devops': ['DevOps Engineer', 'Senior DevOps Engineer', 'DevOps Architect', 'Site Reliability Engineer', 'CI/CD Engineer']
  };
  
  // Check for keyword matches
  for (const [keyword, titles] of Object.entries(techKeywords)) {
    if (lowerValue.includes(keyword)) {
      titles.forEach(title => suggestions.add(title));
    }
  }
  
  // If no keyword matches, generate generic suggestions based on input
  if (suggestions.size === 0) {
    const capitalizedValue = value.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    suggestions.add(`${capitalizedValue} Developer`);
    suggestions.add(`Senior ${capitalizedValue} Developer`);
    suggestions.add(`${capitalizedValue} Engineer`);
    suggestions.add(`Senior ${capitalizedValue} Engineer`);
    suggestions.add(`${capitalizedValue} Specialist`);
  }
  
  // Add experience variations
  const baseSuggestions = Array.from(suggestions);
  const allSuggestions = [...baseSuggestions];
  
  // Add Junior/Senior variations for the first 3 suggestions
  baseSuggestions.slice(0, 3).forEach(title => {
    if (!title.toLowerCase().includes('senior') && !title.toLowerCase().includes('junior')) {
      allSuggestions.push(`Junior ${title}`);
      allSuggestions.push(`Senior ${title}`);
      allSuggestions.push(title.replace('Developer', 'Engineer'));
      allSuggestions.push(title.replace('Engineer', 'Developer'));
    }
  });
  
  return [...new Set(allSuggestions)].slice(0, 8);
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
