import { NextRequest, NextResponse } from 'next/server';
import { HybridFormSuggestions } from '@/lib/hybrid-form-suggestions';

const hybridFormSuggestions = new HybridFormSuggestions();

// Helper: Generate dynamic job descriptions based on keywords
function generateDynamicDescriptions(userInput: string, context: any): string[] {
  const jobTitle = context?.jobTitle || userInput || 'professional';
  const companyName = context?.companyName || 'our company';
  const companyDesc = context?.companyDescription || 'We are a growing organization';
  
  return [
    `${companyDesc}. We are seeking a talented ${jobTitle} to join our team. You will play a key role in our operations and contribute to our success.`,
    `Join ${companyName} as a ${jobTitle}. We are looking for someone who is passionate, skilled, and ready to make an impact. You will work with a dynamic team on exciting projects.`,
    `We are hiring a ${jobTitle} to strengthen our team. You will be responsible for key initiatives, collaborate with cross-functional teams, and drive results.`,
    `${companyName} is expanding! As a ${jobTitle}, you will have the opportunity to work on challenging projects, develop your skills, and grow your career with us.`,
    `Looking for a ${jobTitle} who can bring fresh ideas and energy to our organization. You will be part of a supportive environment focused on innovation and excellence.`
  ];
}

// Helper: Generate dynamic requirements based on keywords
function generateDynamicRequirements(userInput: string, context: any): string[] {
  const jobTitle = context?.jobTitle || userInput || 'this position';
  const experienceLevel = context?.experienceLevel || 'Mid Level';
  const industry = context?.industry || 'the field';
  
  // Extract years from experience level
  const yearsMatch = experienceLevel.match(/(\d+)-(\d+)/);
  const minYears = yearsMatch ? yearsMatch[1] : '2';
  
  return [
    `Relevant degree or equivalent experience in ${industry}`,
    `${minYears}+ years of experience as a ${jobTitle} or similar role`,
    `Strong communication and interpersonal skills`,
    `Proven track record of delivering results in ${industry}`,
    `Ability to work independently and as part of a team`,
    `Problem-solving mindset with attention to detail`,
    `Familiarity with industry best practices and standards`,
    `Excellent organizational and time management skills`
  ];
}

// Helper: Generate dynamic skills based on job title keywords
function generateDynamicSkills(userInput: string, context: any): string[] {
  const input = (userInput || context?.jobTitle || '').toLowerCase();
  
  // BPO/Customer Service
  if (input.includes('bpo') || input.includes('customer service') || input.includes('call center')) {
    return ['Communication Skills', 'Customer Service', 'Problem Solving', 'CRM Software', 'Active Listening', 'Empathy', 'Multi-tasking', 'Conflict Resolution'];
  }
  // Teaching/Education
  if (input.includes('teacher') || input.includes('education') || input.includes('tutor')) {
    return ['Teaching', 'Curriculum Development', 'Student Assessment', 'Classroom Management', 'Communication', 'Subject Expertise', 'Educational Technology', 'Patience'];
  }
  // Marketing
  if (input.includes('marketing') || input.includes('digital') || input.includes('seo')) {
    return ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media', 'Google Analytics', 'Email Marketing', 'Campaign Management', 'Copywriting'];
  }
  // Sales
  if (input.includes('sales') || input.includes('business development')) {
    return ['Sales', 'Negotiation', 'Lead Generation', 'CRM', 'Client Relationship', 'Presentation Skills', 'Market Research', 'Closing Deals'];
  }
  // HR
  if (input.includes('hr') || input.includes('recruiter') || input.includes('talent')) {
    return ['Recruitment', 'Talent Acquisition', 'Interviewing', 'HR Policies', 'Employee Relations', 'Onboarding', 'Performance Management', 'HRIS'];
  }
  // Healthcare
  if (input.includes('doctor') || input.includes('nurse') || input.includes('medical')) {
    return ['Patient Care', 'Medical Knowledge', 'Clinical Skills', 'Diagnostics', 'Treatment Planning', 'Healthcare Compliance', 'EMR Systems', 'Bedside Manner'];
  }
  // Finance/Accounting
  if (input.includes('accountant') || input.includes('finance') || input.includes('audit')) {
    return ['Accounting', 'Financial Reporting', 'Taxation', 'Auditing', 'Excel', 'Tally', 'SAP', 'Budgeting', 'Financial Analysis'];
  }
  // Software/Tech (default)
  if (input.includes('software') || input.includes('developer') || input.includes('engineer')) {
    return ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL', 'MongoDB'];
  }
  
  // Generic skills
  return ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Leadership', 'Adaptability'];
}

// DYNAMIC fallback suggestions based on user input keywords
function getFallbackSuggestions(field: string, _value: string, context?: any): string[] {
  const userInput = (_value || '').toLowerCase().trim();
  const companyDesc = (context?.companyDescription || '').toLowerCase();
  const industry = (context?.industry || '').toLowerCase();
  
  // DYNAMIC JOB TITLE SUGGESTIONS based on keywords
  if (field === 'title' && userInput) {
    // BPO/Call Center/Customer Service
    if (userInput.includes('bpo') || userInput.includes('call center') || userInput.includes('customer service') || userInput.includes('customer support')) {
      return [
        `BPO Team Leader`,
        `Customer Service Representative`,
        `Call Center Manager`,
        `BPO Operations Manager`,
        `Technical Support Specialist`,
        `Customer Success Manager`
      ];
    }
    // Teaching/Education
    if (userInput.includes('teacher') || userInput.includes('education') || userInput.includes('tutor') || userInput.includes('lecturer')) {
      return [
        `Primary Teacher`,
        `Secondary School Teacher`,
        `Subject Matter Expert`,
        `Online Tutor`,
        `Education Coordinator`,
        `Academic Instructor`
      ];
    }
    // Marketing/Digital
    if (userInput.includes('marketing') || userInput.includes('digital') || userInput.includes('seo') || userInput.includes('content')) {
      return [
        `Digital Marketing Manager`,
        `Marketing Executive`,
        `SEO Specialist`,
        `Content Marketing Lead`,
        `Social Media Manager`,
        `Brand Manager`
      ];
    }
    // Sales/BD
    if (userInput.includes('sales') || userInput.includes('business development') || userInput.includes('bd')) {
      return [
        `Sales Executive`,
        `Business Development Manager`,
        `Sales Manager`,
        `Account Manager`,
        `Sales Consultant`,
        `Regional Sales Head`
      ];
    }
    // HR/Recruitment
    if (userInput.includes('hr') || userInput.includes('recruiter') || userInput.includes('talent') || userInput.includes('human resource')) {
      return [
        `HR Manager`,
        `Talent Acquisition Specialist`,
        `Recruitment Consultant`,
        `HR Executive`,
        `People Operations Manager`,
        `HR Business Partner`
      ];
    }
    // Healthcare/Medical
    if (userInput.includes('doctor') || userInput.includes('nurse') || userInput.includes('medical') || userInput.includes('healthcare')) {
      return [
        `Medical Officer`,
        `General Physician`,
        `Registered Nurse`,
        `Healthcare Specialist`,
        `Medical Consultant`,
        `Clinical Coordinator`
      ];
    }
    // Finance/Accounting
    if (userInput.includes('accountant') || userInput.includes('finance') || userInput.includes('audit') || userInput.includes('tax')) {
      return [
        `Accountant`,
        `Finance Manager`,
        `Financial Analyst`,
        `Tax Consultant`,
        `Audit Executive`,
        `Senior Accountant`
      ];
    }
    // Software/Tech
    if (userInput.includes('software') || userInput.includes('developer') || userInput.includes('engineer') || userInput.includes('programmer') || userInput.includes('tech')) {
      return [
        `Software Engineer`,
        `Full Stack Developer`,
        `Senior Software Developer`,
        `Backend Engineer`,
        `Frontend Developer`,
        `Technical Lead`
      ];
    }
    // Generic dynamic suggestions based on user input
    return [
      `Senior ${userInput.charAt(0).toUpperCase() + userInput.slice(1)}`,
      `${userInput.charAt(0).toUpperCase() + userInput.slice(1)} Manager`,
      `${userInput.charAt(0).toUpperCase() + userInput.slice(1)} Executive`,
      `${userInput.charAt(0).toUpperCase() + userInput.slice(1)} Specialist`,
      `Lead ${userInput.charAt(0).toUpperCase() + userInput.slice(1)}`,
      `${userInput.charAt(0).toUpperCase() + userInput.slice(1)} Consultant`
    ];
  }
  
  // Generic fallback for non-title fields
  const fallbackSuggestions: { [key: string]: string[] } = {
    title: [
      'Senior Software Engineer',
      'Full Stack Developer',
      'Frontend Developer',
      'Backend Developer',
      'DevOps Engineer',
      'Data Scientist',
      'Machine Learning Engineer',
      'Product Manager',
      'UI/UX Designer',
      'Mobile App Developer',
      'Cloud Engineer',
      'Security Engineer',
      'Solutions Architect',
      'Technical Lead',
      'Engineering Manager'
    ],
    description: generateDynamicDescriptions(userInput, context),
    requirements: generateDynamicRequirements(userInput, context),
    bio: [
      'Experienced professional with strong technical skills and passion for delivering high-quality results.',
      'Results-driven expert with proven track record of success in dynamic environments.',
      'Passionate about innovation and continuous learning, with excellent problem-solving abilities.',
      'Detail-oriented professional with strong communication and collaboration skills.',
      'Motivated individual with expertise in modern technologies and best practices.'
    ],
    experience: [
      '0-1 years of hands-on experience in relevant field with strong foundation in core concepts.',
      '2-4 years of professional experience delivering successful projects and driving results.',
      '5-7 years of progressive experience with demonstrated leadership and technical expertise.',
      '8+ years of extensive experience in senior roles, leading teams and strategic initiatives.',
      'Multiple years of experience across diverse projects, technologies, and industries.'
    ],
    benefits: [
      'Competitive salary and performance bonuses',
      'Comprehensive health insurance coverage',
      'Flexible working hours and remote work options',
      'Professional development and training opportunities',
      'Stock options and equity participation',
      'Generous paid time off and vacation days',
      'Modern office environment with latest technology',
      'Team building activities and company events',
      'Mentorship programs and career growth opportunities',
      'Wellness programs and gym membership'
    ],
    // Dynamic skills based on context
    skills: generateDynamicSkills(userInput, context),
    jobTitle: [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
      'Backend Developer', 'DevOps Engineer', 'Data Scientist',
      'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
      'Mobile App Developer', 'Cloud Engineer', 'Security Engineer'
    ],
    location: [
      'Bangalore, India', 'Mumbai, India', 'Delhi, India',
      'Hyderabad, India', 'Pune, India', 'Chennai, India',
      'Kolkata, India', 'Ahmedabad, India', 'Gurgaon, India',
      'Noida, India', 'Remote', 'Hybrid'
    ],
    summary: [
      'Experienced software developer with strong technical skills and passion for creating innovative solutions.',
      'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.',
      'Passionate developer with excellent problem-solving abilities and strong communication skills.',
      'Detail-oriented software engineer with experience in full-stack development and agile methodologies.',
      'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.'
    ],
    expectedSalary: [
      '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', 
      '25-35 LPA', '35-50 LPA', '50+ LPA', 'Negotiable'
    ],
    preferredJobType: [
      'Full-time', 'Part-time', 'Contract', 'Freelance', 
      'Internship', 'Remote', 'Hybrid', 'On-site'
    ],
    linkedin: [
      'https://linkedin.com/in/yourname',
      'https://linkedin.com/in/yourusername',
      'https://www.linkedin.com/in/yourprofile'
    ],
    portfolio: [
      'https://yourname.dev',
      'https://yourname.github.io',
      'https://yourname.vercel.app',
      'https://yourname.netlify.app'
    ]
  };

  return fallbackSuggestions[field] || [
    'Add more details to get personalized suggestions',
    'Try typing at least 10 characters for AI suggestions',
    'Click the AI Enhance button for smart recommendations'
  ];
}

export async function POST(request: NextRequest) {
  let field = 'skills';
  let _value = '';
  let context = {};

  try {
    const requestData = await request.json();
    field = requestData.field || 'skills';
    // CRITICAL FIX: Frontend sends 'value', not '_value'
    _value = requestData.value || requestData._value || '';
    context = requestData.context || {};

    console.log(`📨 AI Suggestions API called - Field: ${field}, Value length: ${_value?.length || 0}, Has context: ${!!context}`);

    // CRITICAL FIX: Only field is required, value can be empty for suggestions
    if (!field) {
      console.error('❌ Missing required field parameter');
      return NextResponse.json({
        success: false,
        error: 'Field is required'
      }, { status: 400 });
    }

    console.log(`🔮 Generating suggestions for field: ${field}, value: "${_value?.substring(0, 50) || 'empty'}..."`);
    console.log(`📋 Context received:`, { 
      hasSkills: context.skills?.length > 0, 
      hasLocation: !!context.location,
      hasExperience: !!context.experience 
    });

    // Generate suggestions using hybrid AI
    let result;
    try {
      console.log(`🤖 Calling hybrid AI for field: ${field}...`);
      result = await hybridFormSuggestions.generateSuggestions(field, _value, context);
      console.log(`✅ AI Generated ${result.suggestions.length} suggestions using ${result.aiProvider}`);
      console.log(`📝 First suggestion preview: "${result.suggestions[0]?.substring(0, 100)}..."`);
    } catch (aiError) {
      console.warn('⚠️ AI generation failed, using fallback:', aiError);
      console.log(`🔄 Calling getFallbackSuggestions for field: ${field}`);
      // Use fallback if AI fails
      const fallbackSuggestions = getFallbackSuggestions(field, _value, context);
      console.log(`✅ Fallback returned ${fallbackSuggestions.length} suggestions`);
      result = {
        suggestions: fallbackSuggestions,
        confidence: 30,
        aiProvider: 'fallback-dynamic'
      };
    }

    console.log(`📤 Returning ${result.suggestions.length} suggestions to frontend (provider: ${result.aiProvider})`);

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions.slice(0, 3), // Only return top 3 suggestions
      confidence: result.confidence,
      aiProvider: result.aiProvider
    });

  } catch (_error) {
    console.error('❌ AI form suggestions error:', _error);
    
    // Enhanced fallback when AI fails - NOW WITH CONTEXT!
    const fallbackSuggestions = getFallbackSuggestions(field, _value, context);
    
    console.log(`📤 Returning ${fallbackSuggestions.length} fallback suggestions`);
    
    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions.slice(0, 3), // Only return top 3
      confidence: 30,
      aiProvider: 'fallback-dynamic'
    });
  }
}