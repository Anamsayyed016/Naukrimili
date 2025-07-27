import { NextResponse } from 'next/server';

// Tech Giants
const techGiants = [
  {
    id: 'google',
    name: 'Google',
    logo: 'https://logo.clearbit.com/google.com',
    industry: 'Technology',
    location: 'Bangalore, India',
    employees: '10,000+',
    openJobs: 45,
    rating: 4.8,
    description: 'Leading technology company focused on search, cloud computing, and AI.',
    benefits: ['Health Insurance', 'Stock Options', 'Free Meals', 'Flexible Hours'],
    techStack: ['Python', 'Java', 'Go', 'JavaScript', 'React'],
    category: 'tech-giants'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logo: 'https://logo.clearbit.com/microsoft.com',
    industry: 'Technology',
    location: 'Hyderabad, India',
    employees: '8,000+',
    openJobs: 32,
    rating: 4.7,
    description: 'Global technology company developing software, services, and solutions.',
    benefits: ['Health Insurance', 'Stock Purchase Plan', 'Learning Budget', 'Remote Work'],
    techStack: ['C#', '.NET', 'Azure', 'TypeScript', 'React'],
    category: 'tech-giants'
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://logo.clearbit.com/amazon.com',
    industry: 'E-commerce & Cloud',
    location: 'Mumbai, India',
    employees: '15,000+',
    openJobs: 67,
    rating: 4.5,
    description: 'World\'s largest online retailer and cloud computing platform.',
    benefits: ['Health Insurance', 'Stock Units', 'Career Development', 'Parental Leave'],
    techStack: ['Java', 'Python', 'AWS', 'React', 'Node.js'],
    category: 'tech-giants'
  },
  {
    id: 'meta',
    name: 'Meta (Facebook)',
    logo: 'https://logo.clearbit.com/meta.com',
    industry: 'Social Media',
    location: 'Bangalore, India',
    employees: '3,000+',
    openJobs: 28,
    rating: 4.6,
    description: 'Building the future of social connection and the metaverse.',
    benefits: ['Health Insurance', 'Stock Options', 'Wellness Programs', 'Free Transport'],
    techStack: ['React', 'Python', 'PHP', 'GraphQL', 'React Native'],
    category: 'tech-giants'
  }
];

// Indian Unicorns
const indianUnicorns = [
  {
    id: 'flipkart',
    name: 'Flipkart',
    logo: 'https://logo.clearbit.com/flipkart.com',
    industry: 'E-commerce',
    location: 'Bangalore, India',
    employees: '5,000+',
    openJobs: 38,
    rating: 4.3,
    description: 'India\'s leading e-commerce marketplace.',
    benefits: ['Health Insurance', 'ESOP', 'Learning Budget', 'Flexible Work'],
    techStack: ['Java', 'React', 'Node.js', 'Python', 'Kubernetes'],
    category: 'unicorns'
  },
  {
    id: 'paytm',
    name: 'Paytm',
    logo: 'https://logo.clearbit.com/paytm.com',
    industry: 'Fintech',
    location: 'Noida, India',
    employees: '4,000+',
    openJobs: 42,
    rating: 4.2,
    description: 'India\'s leading digital payments and financial services company.',
    benefits: ['Health Insurance', 'Stock Options', 'Performance Bonus', 'Gym Membership'],
    techStack: ['Java', 'Python', 'React', 'MongoDB', 'Redis'],
    category: 'unicorns'
  },
  {
    id: 'zomato',
    name: 'Zomato',
    logo: 'https://logo.clearbit.com/zomato.com',
    industry: 'Food Tech',
    location: 'Gurgaon, India',
    employees: '3,500+',
    openJobs: 35,
    rating: 4.1,
    description: 'Leading food delivery and restaurant discovery platform.',
    benefits: ['Health Insurance', 'Food Allowance', 'Stock Options', 'Work From Home'],
    techStack: ['Python', 'React', 'Node.js', 'PostgreSQL', 'Redis'],
    category: 'unicorns'
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    logo: 'https://logo.clearbit.com/swiggy.com',
    industry: 'Food Tech',
    location: 'Bangalore, India',
    employees: '4,500+',
    openJobs: 41,
    rating: 4.2,
    description: 'India\'s largest food ordering and delivery platform.',
    benefits: ['Health Insurance', 'Meal Vouchers', 'ESOP', 'Learning Budget'],
    techStack: ['Python', 'Java', 'React', 'Go', 'Kafka'],
    category: 'unicorns'
  }
];

// IT Services
const itServices = [
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    logo: 'https://logo.clearbit.com/tcs.com',
    industry: 'IT Services',
    location: 'Mumbai, India',
    employees: '50,000+',
    openJobs: 125,
    rating: 4.0,
    description: 'India\'s largest IT services company with global presence.',
    benefits: ['Health Insurance', 'Provident Fund', 'Training Programs', 'Career Growth'],
    techStack: ['Java', '.NET', 'Python', 'React', 'Angular'],
    category: 'it-services'
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logo: 'https://logo.clearbit.com/infosys.com',
    industry: 'IT Services',
    location: 'Bangalore, India',
    employees: '45,000+',
    openJobs: 98,
    rating: 4.1,
    description: 'Global leader in next-generation digital services and consulting.',
    benefits: ['Health Insurance', 'Stock Purchase Plan', 'Learning Platform', 'Flexible Hours'],
    techStack: ['Java', 'Python', 'React', 'Angular', 'Cloud'],
    category: 'it-services'
  },
  {
    id: 'wipro',
    name: 'Wipro',
    logo: 'https://logo.clearbit.com/wipro.com',
    industry: 'IT Services',
    location: 'Bangalore, India',
    employees: '35,000+',
    openJobs: 87,
    rating: 3.9,
    description: 'Leading global information technology, consulting and business process services.',
    benefits: ['Health Insurance', 'Retirement Benefits', 'Skill Development', 'Work-Life Balance'],
    techStack: ['Java', '.NET', 'Python', 'React', 'Salesforce'],
    category: 'it-services'
  }
];

// Banking & Finance
const bankingFinance = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    logo: 'https://logo.clearbit.com/hdfcbank.com',
    industry: 'Banking',
    location: 'Mumbai, India',
    employees: '25,000+',
    openJobs: 65,
    rating: 4.2,
    description: 'India\'s largest private sector bank.',
    benefits: ['Health Insurance', 'Provident Fund', 'Performance Bonus', 'Medical Coverage'],
    techStack: ['Java', 'Oracle', 'Mainframe', 'React', 'Spring'],
    category: 'banking'
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    logo: 'https://logo.clearbit.com/icicibank.com',
    industry: 'Banking',
    location: 'Mumbai, India',
    employees: '20,000+',
    openJobs: 52,
    rating: 4.0,
    description: 'Leading private sector bank in India.',
    benefits: ['Health Insurance', 'Retirement Benefits', 'Education Support', 'Loan Benefits'],
    techStack: ['Java', '.NET', 'Oracle', 'Angular', 'Microservices'],
    category: 'banking'
  }
];

const allCompanies = [...techGiants, ...indianUnicorns, ...itServices, ...bankingFinance];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const industry = searchParams.get('industry');

  let filteredCompanies = allCompanies;

  if (category) {
    filteredCompanies = filteredCompanies.filter(company => company.category === category);
  }

  if (industry) {
    filteredCompanies = filteredCompanies.filter(company => 
      company.industry.toLowerCase().includes(industry.toLowerCase())
    );
  }

  return NextResponse.json({
    success: true,
    companies: filteredCompanies,
    total: filteredCompanies.length,
    categories: {
      'tech-giants': techGiants.length,
      'unicorns': indianUnicorns.length,
      'it-services': itServices.length,
      'banking': bankingFinance.length
    }
  });
}