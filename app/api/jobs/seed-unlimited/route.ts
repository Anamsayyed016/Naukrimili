/**
 * Unlimited Job Seeding API
 * Seeds the database with comprehensive job data across all sectors
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(_request: NextRequest) {
  try {
    // Admin authentication required
    const auth = await requireAdminAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    console.log('🚀 Starting unlimited job seeding...');

    // Get or create a sample company
    let company = await prisma.company.findFirst({
      where: { name: 'Sample Company' }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Sample Company',
          description: 'A sample company for job portal',
          location: 'India',
          industry: 'Technology',
          size: '100-500',
          founded: 2020,
          isVerified: true,
          isActive: true,
          website: 'https://samplecompany.com'
        }
      });
      console.log('✅ Created sample company');
    }

    // Comprehensive job data across all sectors
    const unlimitedJobsData = [
      // Technology Sector
      {
        title: 'Senior Software Engineer',
        company: 'TechCorp Solutions',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'We are looking for a Senior Software Engineer to join our dynamic team. You will be responsible for designing, developing, and maintaining scalable web applications using modern technologies.',
        requirements: 'Bachelor\'s degree in Computer Science, 5+ years of experience in full-stack development, proficiency in JavaScript, React, Node.js, and cloud technologies.',
        salary: '₹12,00,000 - ₹18,00,000',
        salaryMin: 1200000,
        salaryMax: 1800000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['JavaScript', 'React', 'Node.js', 'AWS', 'MongoDB'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'tech-001'
      },
      {
        title: 'Data Scientist',
        company: 'DataInsights Inc',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Join our data science team to build machine learning models and extract insights from large datasets. Work on cutting-edge AI projects that impact millions of users.',
        requirements: 'Master\'s degree in Data Science or related field, 3+ years of experience in machine learning, proficiency in Python, R, SQL, and ML frameworks.',
        salary: '₹10,00,000 - ₹15,00,000',
        salaryMin: 1000000,
        salaryMax: 1500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'Pandas', 'SQL'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'tech-002'
      },
      {
        title: 'DevOps Engineer',
        company: 'CloudTech Systems',
        location: 'Pune, India',
        country: 'IN',
        description: 'We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Docker, Kubernetes, and automation tools.',
        requirements: 'Bachelor\'s degree in Computer Science, 4+ years of DevOps experience, expertise in AWS, Docker, Kubernetes, and infrastructure as code.',
        salary: '₹8,00,000 - ₹12,00,000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins'],
        isRemote: true,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'tech-003'
      },
      {
        title: 'Frontend Developer',
        company: 'WebCraft Studios',
        location: 'Chennai, India',
        country: 'IN',
        description: 'Create beautiful and responsive user interfaces using modern frontend technologies. You will work with React, TypeScript, and design systems.',
        requirements: 'Bachelor\'s degree in Computer Science, 3+ years of frontend development experience, proficiency in React, TypeScript, CSS, and design principles.',
        salary: '₹6,00,000 - ₹10,00,000',
        salaryMin: 600000,
        salaryMax: 1000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'UI/UX'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'tech-004'
      },
      {
        title: 'Backend Developer',
        company: 'ServerSide Solutions',
        location: 'Hyderabad, India',
        country: 'IN',
        description: 'Build robust and scalable backend services using Node.js, Python, and cloud technologies. You will work on APIs, databases, and microservices.',
        requirements: 'Bachelor\'s degree in Computer Science, 4+ years of backend development experience, proficiency in Node.js, Python, databases, and cloud platforms.',
        salary: '₹7,00,000 - ₹11,00,000',
        salaryMin: 700000,
        salaryMax: 1100000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Technology',
        source: 'manual',
        sourceId: 'tech-005'
      },

      // Healthcare Sector
      {
        title: 'Senior Doctor - Cardiology',
        company: 'Apollo Hospitals',
        location: 'Delhi, India',
        country: 'IN',
        description: 'We are seeking a Senior Cardiologist to join our prestigious cardiology department. You will diagnose and treat heart conditions, perform procedures, and mentor junior doctors.',
        requirements: 'MD in Cardiology, 8+ years of experience, board certification, expertise in interventional cardiology procedures.',
        salary: '₹25,00,000 - ₹40,00,000',
        salaryMin: 2500000,
        salaryMax: 4000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['Cardiology', 'Interventional Procedures', 'Patient Care', 'Medical Diagnosis'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Healthcare',
        source: 'manual',
        sourceId: 'health-001'
      },
      {
        title: 'Registered Nurse',
        company: 'Fortis Healthcare',
        location: 'Chennai, India',
        country: 'IN',
        description: 'Join our nursing team to provide compassionate patient care. You will work in various departments including ICU, emergency, and general wards.',
        requirements: 'B.Sc Nursing degree, valid nursing license, 2+ years of experience, excellent communication skills.',
        salary: '₹3,00,000 - ₹5,00,000',
        salaryMin: 300000,
        salaryMax: 500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Patient Care', 'Medical Procedures', 'Communication', 'Emergency Response'],
        isRemote: false,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Healthcare',
        source: 'manual',
        sourceId: 'health-002'
      },
      {
        title: 'Physiotherapist',
        company: 'Max Healthcare',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Help patients recover from injuries and improve their physical well-being. You will work with patients to develop treatment plans and monitor progress.',
        requirements: 'Bachelor\'s degree in Physiotherapy, valid license, 3+ years of experience, excellent interpersonal skills.',
        salary: '₹4,00,000 - ₹7,00,000',
        salaryMin: 400000,
        salaryMax: 700000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Physiotherapy', 'Rehabilitation', 'Patient Assessment', 'Treatment Planning'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Healthcare',
        source: 'manual',
        sourceId: 'health-003'
      },

      // Finance Sector
      {
        title: 'Investment Banking Analyst',
        company: 'Goldman Sachs',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Join our investment banking team to work on M&A transactions, IPOs, and capital market deals. You will work with top-tier clients and gain exposure to complex financial structures.',
        requirements: 'MBA from top-tier business school, 2+ years of investment banking experience, strong analytical skills, proficiency in financial modeling.',
        salary: '₹15,00,000 - ₹25,00,000',
        salaryMin: 1500000,
        salaryMax: 2500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Financial Modeling', 'M&A', 'Capital Markets', 'Excel', 'PowerPoint'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Finance',
        source: 'manual',
        sourceId: 'finance-001'
      },
      {
        title: 'Financial Advisor',
        company: 'HDFC Bank',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Help clients achieve their financial goals by providing investment advice, insurance solutions, and wealth management services.',
        requirements: 'Bachelor\'s degree in Finance, 3+ years of financial advisory experience, relevant certifications (CFA, CFP), excellent client relationship skills.',
        salary: '₹6,00,000 - ₹10,00,000',
        salaryMin: 600000,
        salaryMax: 1000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Financial Planning', 'Investment Advisory', 'Client Relations', 'Insurance'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Finance',
        source: 'manual',
        sourceId: 'finance-002'
      },

      // Education Sector
      {
        title: 'Professor - Computer Science',
        company: 'IIT Delhi',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Join our prestigious Computer Science department as a Professor. You will teach undergraduate and graduate courses, conduct research, and mentor students.',
        requirements: 'Ph.D. in Computer Science, 10+ years of teaching and research experience, strong publication record, expertise in AI/ML or systems.',
        salary: '₹18,00,000 - ₹30,00,000',
        salaryMin: 1800000,
        salaryMax: 3000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['Teaching', 'Research', 'Computer Science', 'AI/ML', 'Academic Writing'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Education',
        source: 'manual',
        sourceId: 'edu-001'
      },
      {
        title: 'High School Teacher - Mathematics',
        company: 'Delhi Public School',
        location: 'Delhi, India',
        country: 'IN',
        description: 'We are looking for a passionate Mathematics teacher to join our high school faculty. You will teach classes 9-12 and help students excel in mathematics.',
        requirements: 'Master\'s degree in Mathematics, B.Ed degree, 3+ years of teaching experience, excellent communication skills.',
        salary: '₹4,00,000 - ₹7,00,000',
        salaryMin: 400000,
        salaryMax: 700000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Mathematics', 'Teaching', 'Student Mentoring', 'Curriculum Development'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Education',
        source: 'manual',
        sourceId: 'edu-002'
      },

      // Marketing Sector
      {
        title: 'Digital Marketing Manager',
        company: 'Flipkart',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Lead our digital marketing initiatives across multiple channels. You will develop and execute marketing campaigns, manage budgets, and drive customer acquisition.',
        requirements: 'Bachelor\'s degree in Marketing, 5+ years of digital marketing experience, expertise in Google Ads, Facebook Ads, SEO, and analytics.',
        salary: '₹8,00,000 - ₹12,00,000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Digital Marketing', 'Google Ads', 'Facebook Ads', 'SEO', 'Analytics'],
        isRemote: true,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Marketing',
        source: 'manual',
        sourceId: 'marketing-001'
      },
      {
        title: 'Content Marketing Specialist',
        company: 'Zomato',
        location: 'Gurgaon, India',
        country: 'IN',
        description: 'Create compelling content that engages our audience and drives brand awareness. You will work on blog posts, social media content, and marketing materials.',
        requirements: 'Bachelor\'s degree in English/Journalism, 3+ years of content marketing experience, excellent writing skills, knowledge of SEO.',
        salary: '₹5,00,000 - ₹8,00,000',
        salaryMin: 500000,
        salaryMax: 800000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Content Writing', 'SEO', 'Social Media', 'Blogging', 'Creative Writing'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Marketing',
        source: 'manual',
        sourceId: 'marketing-002'
      },

      // Sales Sector
      {
        title: 'Sales Manager - Enterprise',
        company: 'Microsoft India',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Lead enterprise sales for our cloud solutions. You will manage key accounts, develop sales strategies, and drive revenue growth in the enterprise segment.',
        requirements: 'Bachelor\'s degree, 6+ years of enterprise sales experience, strong track record of meeting targets, excellent communication skills.',
        salary: '₹12,00,000 - ₹20,00,000',
        salaryMin: 1200000,
        salaryMax: 2000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['Enterprise Sales', 'Account Management', 'Cloud Solutions', 'Negotiation'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Sales',
        source: 'manual',
        sourceId: 'sales-001'
      },
      {
        title: 'Inside Sales Representative',
        company: 'Amazon India',
        location: 'Hyderabad, India',
        country: 'IN',
        description: 'Drive sales through phone and email outreach. You will qualify leads, conduct product demonstrations, and close deals with small to medium businesses.',
        requirements: 'Bachelor\'s degree, 2+ years of inside sales experience, excellent phone skills, CRM experience preferred.',
        salary: '₹4,00,000 - ₹7,00,000',
        salaryMin: 400000,
        salaryMax: 700000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'junior',
        skills: ['Inside Sales', 'Lead Qualification', 'CRM', 'Phone Sales'],
        isRemote: true,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Sales',
        source: 'manual',
        sourceId: 'sales-002'
      },

      // Engineering Sector
      {
        title: 'Mechanical Engineer',
        company: 'Tata Motors',
        location: 'Pune, India',
        country: 'IN',
        description: 'Design and develop automotive components and systems. You will work on vehicle design, testing, and manufacturing processes.',
        requirements: 'Bachelor\'s degree in Mechanical Engineering, 4+ years of automotive experience, proficiency in CAD software, knowledge of manufacturing processes.',
        salary: '₹6,00,000 - ₹10,00,000',
        salaryMin: 600000,
        salaryMax: 1000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Mechanical Design', 'CAD', 'Automotive', 'Manufacturing', 'Testing'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Engineering',
        source: 'manual',
        sourceId: 'eng-001'
      },
      {
        title: 'Civil Engineer',
        company: 'L&T Construction',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Work on large-scale infrastructure projects including roads, bridges, and buildings. You will oversee construction activities and ensure quality standards.',
        requirements: 'Bachelor\'s degree in Civil Engineering, 5+ years of construction experience, project management skills, knowledge of building codes.',
        salary: '₹7,00,000 - ₹12,00,000',
        salaryMin: 700000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Civil Engineering', 'Construction', 'Project Management', 'Building Codes'],
        isRemote: false,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Engineering',
        source: 'manual',
        sourceId: 'eng-002'
      },

      // Retail Sector
      {
        title: 'Store Manager',
        company: 'Reliance Retail',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Manage daily operations of our retail store. You will oversee staff, manage inventory, ensure customer satisfaction, and drive sales targets.',
        requirements: 'Bachelor\'s degree, 5+ years of retail management experience, strong leadership skills, customer service orientation.',
        salary: '₹5,00,000 - ₹8,00,000',
        salaryMin: 500000,
        salaryMax: 800000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Retail Management', 'Team Leadership', 'Inventory Management', 'Customer Service'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Retail',
        source: 'manual',
        sourceId: 'retail-001'
      },
      {
        title: 'Sales Associate',
        company: 'Shoppers Stop',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Provide excellent customer service and drive sales in our fashion retail store. You will assist customers, process transactions, and maintain store appearance.',
        requirements: 'High school diploma, 1+ years of retail experience, excellent communication skills, fashion sense preferred.',
        salary: '₹2,50,000 - ₹4,00,000',
        salaryMin: 250000,
        salaryMax: 400000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'entry',
        skills: ['Customer Service', 'Sales', 'Fashion', 'Communication'],
        isRemote: false,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Retail',
        source: 'manual',
        sourceId: 'retail-002'
      },

      // Hospitality Sector
      {
        title: 'Hotel Manager',
        company: 'Taj Hotels',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Oversee all aspects of hotel operations including guest services, staff management, and financial performance. Ensure exceptional guest experiences.',
        requirements: 'Bachelor\'s degree in Hospitality Management, 8+ years of hotel management experience, strong leadership skills, customer service excellence.',
        salary: '₹10,00,000 - ₹15,00,000',
        salaryMin: 1000000,
        salaryMax: 1500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['Hotel Management', 'Guest Services', 'Team Leadership', 'Financial Management'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Hospitality',
        source: 'manual',
        sourceId: 'hospitality-001'
      },
      {
        title: 'Chef de Cuisine',
        company: 'Oberoi Hotels',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Lead our kitchen operations and create innovative culinary experiences. You will manage kitchen staff, develop menus, and maintain food quality standards.',
        requirements: 'Culinary degree or equivalent experience, 6+ years of kitchen management experience, creativity in menu development, leadership skills.',
        salary: '₹6,00,000 - ₹10,00,000',
        salaryMin: 600000,
        salaryMax: 1000000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Culinary Arts', 'Kitchen Management', 'Menu Development', 'Team Leadership'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Hospitality',
        source: 'manual',
        sourceId: 'hospitality-002'
      },

      // Manufacturing Sector
      {
        title: 'Production Manager',
        company: 'Maruti Suzuki',
        location: 'Gurgaon, India',
        country: 'IN',
        description: 'Oversee manufacturing operations and ensure production targets are met. You will manage production schedules, quality control, and process improvements.',
        requirements: 'Bachelor\'s degree in Engineering, 6+ years of manufacturing experience, knowledge of lean manufacturing, strong analytical skills.',
        salary: '₹8,00,000 - ₹12,00,000',
        salaryMin: 800000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Production Management', 'Manufacturing', 'Quality Control', 'Lean Manufacturing'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Manufacturing',
        source: 'manual',
        sourceId: 'manufacturing-001'
      },
      {
        title: 'Quality Control Inspector',
        company: 'Bharat Electronics',
        location: 'Bangalore, India',
        country: 'IN',
        description: 'Ensure product quality by conducting inspections and tests. You will work with production teams to maintain quality standards and identify improvement opportunities.',
        requirements: 'Diploma in Engineering, 3+ years of QC experience, knowledge of quality standards, attention to detail.',
        salary: '₹3,00,000 - ₹5,00,000',
        salaryMin: 300000,
        salaryMax: 500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Quality Control', 'Inspection', 'Testing', 'Standards Compliance'],
        isRemote: false,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Manufacturing',
        source: 'manual',
        sourceId: 'manufacturing-002'
      },

      // Consulting Sector
      {
        title: 'Management Consultant',
        company: 'McKinsey & Company',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Work with top-tier clients to solve complex business problems. You will conduct analysis, develop strategies, and implement solutions across various industries.',
        requirements: 'MBA from top-tier business school, 3+ years of consulting experience, strong analytical skills, excellent communication abilities.',
        salary: '₹20,00,000 - ₹35,00,000',
        salaryMin: 2000000,
        salaryMax: 3500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'senior',
        skills: ['Strategy Consulting', 'Business Analysis', 'Problem Solving', 'Client Management'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Consulting',
        source: 'manual',
        sourceId: 'consulting-001'
      },
      {
        title: 'IT Consultant',
        company: 'Accenture',
        location: 'Pune, India',
        country: 'IN',
        description: 'Help clients implement technology solutions and digital transformations. You will work on system implementations, process improvements, and technology strategy.',
        requirements: 'Bachelor\'s degree in IT/Computer Science, 4+ years of IT consulting experience, knowledge of enterprise systems, project management skills.',
        salary: '₹8,00,000 - ₹14,00,000',
        salaryMin: 800000,
        salaryMax: 1400000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['IT Consulting', 'System Implementation', 'Digital Transformation', 'Project Management'],
        isRemote: true,
        isHybrid: true,
        isUrgent: false,
        isFeatured: false,
        sector: 'Consulting',
        source: 'manual',
        sourceId: 'consulting-002'
      },

      // Government Sector
      {
        title: 'IAS Officer',
        company: 'Government of India',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Serve the nation as an Indian Administrative Service officer. You will work on policy implementation, public administration, and governance at various levels.',
        requirements: 'Bachelor\'s degree, cleared UPSC Civil Services Examination, strong leadership qualities, commitment to public service.',
        salary: '₹6,00,000 - ₹12,00,000',
        salaryMin: 600000,
        salaryMax: 1200000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Public Administration', 'Policy Implementation', 'Leadership', 'Governance'],
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'Government',
        source: 'manual',
        sourceId: 'government-001'
      },
      {
        title: 'Police Inspector',
        company: 'Delhi Police',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Maintain law and order, investigate crimes, and ensure public safety. You will lead police operations and work with communities to prevent crime.',
        requirements: 'Bachelor\'s degree, cleared police recruitment examination, physical fitness, integrity and courage.',
        salary: '₹4,00,000 - ₹7,00,000',
        salaryMin: 400000,
        salaryMax: 700000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Law Enforcement', 'Investigation', 'Public Safety', 'Community Relations'],
        isRemote: false,
        isHybrid: false,
        isUrgent: true,
        isFeatured: false,
        sector: 'Government',
        source: 'manual',
        sourceId: 'government-002'
      },

      // Nonprofit Sector
      {
        title: 'Program Manager',
        company: 'Teach For India',
        location: 'Mumbai, India',
        country: 'IN',
        description: 'Lead educational programs that impact underprivileged children. You will manage program implementation, work with volunteers, and measure impact.',
        requirements: 'Master\'s degree in Education or related field, 5+ years of program management experience, passion for education, strong leadership skills.',
        salary: '₹5,00,000 - ₹8,00,000',
        salaryMin: 500000,
        salaryMax: 800000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Program Management', 'Education', 'Volunteer Management', 'Impact Measurement'],
        isRemote: false,
        isHybrid: true,
        isUrgent: false,
        isFeatured: true,
        sector: 'Nonprofit',
        source: 'manual',
        sourceId: 'nonprofit-001'
      },
      {
        title: 'Fundraising Coordinator',
        company: 'CRY - Child Rights and You',
        location: 'Delhi, India',
        country: 'IN',
        description: 'Develop and implement fundraising strategies to support our mission. You will work with donors, organize events, and create awareness campaigns.',
        requirements: 'Bachelor\'s degree, 3+ years of fundraising experience, excellent communication skills, passion for social causes.',
        salary: '₹3,00,000 - ₹5,00,000',
        salaryMin: 300000,
        salaryMax: 500000,
        salaryCurrency: 'INR',
        jobType: 'full-time',
        experienceLevel: 'mid',
        skills: ['Fundraising', 'Donor Relations', 'Event Management', 'Social Media'],
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        sector: 'Nonprofit',
        source: 'manual',
        sourceId: 'nonprofit-002'
      }
    ];

    // Create jobs
    let createdCount = 0;
    let skippedCount = 0;

    for (const jobData of unlimitedJobsData) {
      try {
        // Check if job already exists
        const existingJob = await prisma.job.findFirst({
          where: {
            title: jobData.title,
            company: jobData.company,
            location: jobData.location
          }
        });

        if (existingJob) {
          skippedCount++;
          continue;
        }

        // Create job
        await prisma.job.create({
          data: {
            ...jobData,
            companyId: company.id,
            createdBy: company.createdBy,
            skills: JSON.stringify(jobData.skills),
            requirements: JSON.stringify([jobData.requirements]),
            isActive: true,
            views: Math.floor(Math.random() * 1000),
            applicationsCount: Math.floor(Math.random() * 50),
            postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
            rawJson: {
              ...jobData,
              seededAt: new Date().toISOString(),
              isUnlimitedSeed: true
            }
          }
        });

        createdCount++;
        console.log(`✅ Created job: ${jobData.title} at ${jobData.company}`);

      } catch (_error) {
        console.error(`❌ Error creating job ${jobData.title}:`, error);
      }
    }

    const totalJobs = await prisma.job.count();

    console.log(`🎉 Unlimited job seeding completed!`);
    console.log(`📊 Created: ${createdCount} jobs`);
    console.log(`⏭️ Skipped: ${skippedCount} jobs (already exist)`);
    console.log(`📈 Total jobs in database: ${totalJobs}`);

    return NextResponse.json({
      success: true,
      message: 'Unlimited job seeding completed successfully',
      stats: {
        created: createdCount,
        skipped: skippedCount,
        total: totalJobs
      }
    });

  } catch (error: any) {
    console.error('❌ Error seeding unlimited jobs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed unlimited jobs',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Unlimited job seeding endpoint',
    usage: {
      method: 'POST',
      description: 'Seeds the database with comprehensive job data across all sectors',
      authentication: 'Admin required'
    }
  });
}
