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
function getFallbackSuggestions(field: string, _value: string, context?: Record<string, unknown>): string[] {
  const userInput = (_value || '').toLowerCase().trim();
  
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
    description: (() => {
      // Check if this is a project description
      if (context?.isProjectDescription) {
        const jobTitle = (context?.jobTitle || 'software developer').toLowerCase();
        const skills = context?.skills || [];
        const techStack = skills.slice(0, 3).join(', ') || 'modern technologies';
        
        return [
          `Developed a full-stack web application using ${techStack} with features like user authentication, data visualization, and real-time updates.`,
          `Built a responsive web application that ${userInput.includes('portal') ? 'connects job seekers with employers' : 'solves real-world problems'} using ${techStack}. Implemented RESTful APIs and modern UI/UX principles.`,
          `Created a scalable application using ${techStack} with focus on performance optimization and user experience. Includes features like data management, search functionality, and responsive design.`,
          `Designed and developed a ${jobTitle.includes('data') ? 'data analytics' : 'web'} application using ${techStack}. Features include dashboard, reporting, and integration with third-party services.`,
          `Built a production-ready application using ${techStack} with comprehensive testing, documentation, and deployment pipeline.`
        ];
      }
      // Regular work description
      return generateDynamicDescriptions(userInput, context);
    })(),
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
    company: (() => {
      const input = userInput;
      const companies = [
        'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Oracle',
        'IBM', 'Accenture', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Tech Mahindra',
        'HCL Technologies', 'Capgemini', 'Deloitte', 'PwC', 'EY', 'KPMG', 'JP Morgan',
        'Goldman Sachs', 'Morgan Stanley', 'Salesforce', 'SAP', 'VMware', 'Intel', 'NVIDIA'
      ];
      if (input && input.length > 2) {
        return companies.filter(c => c.toLowerCase().includes(input)).slice(0, 8);
      }
      return companies.slice(0, 10);
    })(),
    position: (() => {
      const input = userInput;
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || input.includes('python') || input.includes('java')) {
        const positions = [
          'Software Engineer', 'Full Stack Developer', 'Senior Software Developer',
          'Frontend Developer', 'Backend Engineer', 'Python Developer', 'Java Developer',
          'React Developer', 'Node.js Developer', 'DevOps Engineer'
        ];
        if (input && input.length > 2) {
          return positions.filter(p => p.toLowerCase().includes(input)).slice(0, 8);
        }
        return positions.slice(0, 8);
      }
      
      const positions = [
        'Software Engineer', 'Product Manager', 'Data Scientist', 'Business Analyst',
        'Project Manager', 'Marketing Manager', 'Sales Executive', 'HR Manager'
      ];
      if (input && input.length > 2) {
        return positions.filter(p => p.toLowerCase().includes(input)).slice(0, 8);
      }
      return positions.slice(0, 8);
    })(),
    project: (() => {
      const input = userInput;
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || input.includes('app') || input.includes('platform')) {
        const projects = [
          'E-Commerce Platform', 'Task Management Application', 'Social Media Dashboard',
          'Real-time Chat Application', 'Weather Forecast App', 'Blog Platform',
          'Project Management Tool', 'Expense Tracker App', 'Recipe Sharing Platform',
          'Online Learning Management System', 'Hospital Management System', 'Inventory Management System',
          'Restaurant Booking System', 'Fitness Tracking App', 'Music Streaming Platform',
          'Job Portal Application', 'E-Learning Platform', 'Healthcare Management System'
        ];
        if (input && input.length > 2) {
          return projects.filter(p => p.toLowerCase().includes(input) || input.includes(p.toLowerCase().split(' ')[0])).slice(0, 8);
        }
        return projects.slice(0, 8);
      }
      
      return [
        'Portfolio Website', 'Business Management System', 'Data Analysis Tool',
        'Content Management System', 'Customer Relationship Management', 'Employee Management System'
      ];
    })(),
    summary: (() => {
      const jobTitle = (context?.jobTitle || '').toLowerCase();
      const userInput = (_value || '').toLowerCase();
      const experienceLevel = context?.experienceLevel || 'mid';
      const skills = context?.skills || [];
      const topSkills = skills.slice(0, 3).join(', ');
      
      // Teaching/Education - Comprehensive professional summaries
      if (jobTitle.includes('teacher') || jobTitle.includes('educator') || jobTitle.includes('tutor') || userInput.includes('teacher')) {
        return [
          `Dedicated and passionate educator with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive experience in' : 'proven expertise in'} teaching methodologies and curriculum development. Committed to fostering student success through innovative instructional approaches and creating engaging learning environments. ${experienceLevel === 'senior' ? 'Demonstrated leadership in educational program development and mentoring fellow educators.' : 'Strong ability to adapt teaching methods to diverse learning styles and individual student needs.'} Excellent communication skills and passion for inspiring lifelong learning in students.`,
          `Experienced teacher with ${experienceLevel === 'entry' ? 'a solid foundation in' : experienceLevel === 'senior' ? 'over a decade of' : 'proven track record of'} creating dynamic and inclusive classroom environments that promote academic excellence. ${experienceLevel === 'senior' ? 'Led curriculum development initiatives and mentored junior faculty members.' : 'Skilled in developing and implementing student-centered instructional strategies.'} Strong expertise in assessment design, differentiated instruction, and educational technology integration. Passionate about student growth and committed to continuous professional development.`,
          `Results-oriented educator with ${experienceLevel === 'entry' ? 'a strong academic background and' : experienceLevel === 'senior' ? 'extensive' : 'demonstrated'} expertise in curriculum development and student-centered instructional approaches. ${experienceLevel === 'senior' ? 'Successfully managed educational programs and collaborated with stakeholders to enhance learning outcomes.' : 'Proven ability to design and deliver engaging lessons that cater to diverse learning needs.'} Excellent classroom management skills and ability to build positive relationships with students, parents, and colleagues. Committed to fostering critical thinking and preparing students for future success.`
        ];
      }
      
      // Software/Tech - Comprehensive professional summaries
      if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer') || jobTitle.includes('software')) {
        const skillContext = topSkills ? `Proficient in ${topSkills} and` : 'Skilled in';
        return [
          `${experienceLevel === 'entry' ? 'Motivated' : experienceLevel === 'senior' ? 'Accomplished' : 'Experienced'} software ${jobTitle.includes('engineer') ? 'engineer' : 'developer'} with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive expertise in' : 'proven proficiency in'} modern technologies and software development best practices. ${skillContext} ${topSkills ? 'other cutting-edge technologies' : 'various programming languages and frameworks'}, with a passion for creating scalable, efficient, and innovative solutions. ${experienceLevel === 'senior' ? 'Led cross-functional teams in delivering complex projects and mentored junior developers.' : 'Strong problem-solving abilities and commitment to writing clean, maintainable code.'} Excellent collaboration skills and ability to work effectively in agile environments.`,
          `Results-driven ${experienceLevel === 'entry' ? 'emerging' : experienceLevel === 'senior' ? 'senior' : ''} software professional with ${experienceLevel === 'entry' ? 'a solid academic background and' : experienceLevel === 'senior' ? 'a proven track record of' : 'demonstrated expertise in'} full-stack development and delivering high-quality software solutions. ${topSkills ? `Specialized in ${topSkills}` : 'Proficient in multiple programming languages and frameworks'}, with experience in building robust applications that meet business requirements. ${experienceLevel === 'senior' ? 'Successfully architected and implemented enterprise-level systems, improving performance and scalability.' : 'Strong analytical thinking and ability to translate complex requirements into efficient code.'} Committed to continuous learning and staying current with industry trends and best practices.`,
          `Passionate ${jobTitle.includes('engineer') ? 'engineer' : 'developer'} with ${experienceLevel === 'entry' ? 'strong technical skills and' : experienceLevel === 'senior' ? 'extensive experience in' : 'excellent problem-solving abilities and'} expertise in ${topSkills || 'software development'}. ${experienceLevel === 'senior' ? 'Led multiple successful projects from conception to deployment, collaborating with stakeholders and technical teams.' : 'Proven ability to design and implement efficient solutions while maintaining code quality and following best practices.'} Strong foundation in computer science principles, with experience in agile methodologies and version control systems. ${experienceLevel === 'senior' ? 'Mentored team members and contributed to technical decision-making processes.' : 'Excellent communication skills and ability to work collaboratively in fast-paced environments.'} Dedicated to writing clean, maintainable code and continuously improving technical skills.`
        ];
      }
      
      // Generic professional summaries - Comprehensive
      const professionalTitle = context?.jobTitle || 'professional';
      return [
        `${experienceLevel === 'entry' ? 'Motivated' : experienceLevel === 'senior' ? 'Accomplished' : 'Experienced'} ${professionalTitle} with ${experienceLevel === 'entry' ? 'a strong foundation in' : experienceLevel === 'senior' ? 'extensive expertise in' : 'proven proficiency in'} ${topSkills || 'relevant field'}. ${experienceLevel === 'senior' ? 'Demonstrated leadership in driving strategic initiatives and delivering exceptional results across multiple projects.' : 'Strong analytical and problem-solving skills with a track record of successfully completing complex tasks.'} ${topSkills ? `Specialized knowledge in ${topSkills}` : 'Comprehensive understanding of industry best practices'}, combined with excellent communication and collaboration abilities. ${experienceLevel === 'senior' ? 'Mentored team members and contributed to organizational growth.' : 'Committed to continuous learning and professional development.'} Passionate about delivering high-quality work and exceeding expectations.`,
        `Results-driven ${professionalTitle} with ${experienceLevel === 'entry' ? 'a solid academic background and' : experienceLevel === 'senior' ? 'a proven track record of' : 'demonstrated expertise in'} ${topSkills || 'relevant domain'}. ${experienceLevel === 'senior' ? 'Successfully led cross-functional teams and managed complex projects from inception to completion.' : 'Strong ability to analyze situations, identify opportunities, and implement effective solutions.'} ${topSkills ? `Proficient in ${topSkills}` : 'Skilled in various tools and methodologies'}, with experience in ${experienceLevel === 'senior' ? 'strategic planning and execution' : 'meeting deadlines and managing priorities'}. ${experienceLevel === 'senior' ? 'Built strong relationships with stakeholders and contributed to business growth.' : 'Excellent attention to detail and commitment to quality.'} Adaptable and eager to take on new challenges in dynamic environments.`,
        `Dedicated ${professionalTitle} with ${experienceLevel === 'entry' ? 'strong foundational knowledge and' : experienceLevel === 'senior' ? 'extensive experience in' : 'proven ability in'} ${topSkills || 'relevant field'}. ${experienceLevel === 'senior' ? 'Led initiatives that resulted in measurable improvements and organizational success.' : 'Demonstrated success in managing multiple projects and delivering results under tight deadlines.'} ${topSkills ? `Expertise in ${topSkills}` : 'Comprehensive skill set'} combined with strong analytical thinking and attention to detail. ${experienceLevel === 'senior' ? 'Mentored colleagues and contributed to team development and knowledge sharing.' : 'Excellent interpersonal skills and ability to work effectively both independently and as part of a team.'} Committed to excellence and continuous improvement in all professional endeavors.`
      ];
    })(),
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
      hasExperience: !!context.experience,
      jobTitle: context.jobTitle || '',
      experienceLevel: context.experienceLevel || '',
      isProjectDescription: context.isProjectDescription || false
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
      // For summary field, return up to 8 suggestions; for others, return up to 5
      suggestions: result.suggestions.slice(0, field === 'summary' ? 8 : 5),
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
      // For summary field, return up to 8 suggestions; for others, return up to 5
      suggestions: fallbackSuggestions.slice(0, field === 'summary' ? 8 : 5),
      confidence: 30,
      aiProvider: 'fallback-dynamic'
    });
  }
}