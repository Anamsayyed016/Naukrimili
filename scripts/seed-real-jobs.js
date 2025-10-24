const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const realJobs = [
  {
    title: "Senior Software Engineer",
    company: "Google",
    location: "Bangalore, India",
    country: "IN",
    description: "Join Google's engineering team to build scalable systems and work on cutting-edge technology. We're looking for experienced engineers who can design and implement large-scale distributed systems.",
    requirements: JSON.stringify([
      "5+ years of software development experience",
      "Strong programming skills in Java, Python, or C++",
      "Experience with distributed systems",
      "Bachelor's degree in Computer Science or related field"
    ]),
    salary: "₹25,00,000 - ₹40,00,000",
    salaryMin: 2500000,
    salaryMax: 4000000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Senior Level (5+ years)",
    skills: JSON.stringify(["Java", "Python", "Distributed Systems", "Cloud Computing", "Machine Learning"]),
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: true,
    isActive: true,
    sector: "Technology",
    source: "manual",
    sourceId: "google-senior-engineer-2024",
    views: 0,
    applicationsCount: 0
  },
  {
    title: "Frontend Developer",
    company: "Microsoft",
    location: "Hyderabad, India",
    country: "IN",
    description: "Work on Microsoft's web applications and user interfaces. Join our team to create amazing user experiences using modern frontend technologies.",
    requirements: JSON.stringify([
      "3+ years of frontend development experience",
      "Expertise in React, TypeScript, and modern CSS",
      "Experience with responsive design",
      "Strong problem-solving skills"
    ]),
    salary: "₹15,00,000 - ₹25,00,000",
    salaryMin: 1500000,
    salaryMax: 2500000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Mid Level (3-5 years)",
    skills: JSON.stringify(["React", "TypeScript", "JavaScript", "CSS", "HTML", "Responsive Design"]),
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    isActive: true,
    sector: "Technology",
    source: "manual",
    sourceId: "microsoft-frontend-2024",
    views: 0,
    applicationsCount: 0
  },
  {
    title: "Data Scientist",
    company: "Amazon",
    location: "Mumbai, India",
    country: "IN",
    description: "Join Amazon's data science team to work on machine learning models and data analysis. Help us make data-driven decisions that impact millions of customers.",
    requirements: JSON.stringify([
      "4+ years of data science experience",
      "Strong background in statistics and machine learning",
      "Proficiency in Python, R, and SQL",
      "Experience with cloud platforms (AWS preferred)"
    ]),
    salary: "₹20,00,000 - ₹35,00,000",
    salaryMin: 2000000,
    salaryMax: 3500000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Senior Level (5+ years)",
    skills: JSON.stringify(["Python", "Machine Learning", "Statistics", "SQL", "AWS", "TensorFlow", "Pandas"]),
    isRemote: false,
    isHybrid: true,
    isUrgent: true,
    isFeatured: true,
    isActive: true,
    sector: "Technology",
    source: "manual",
    sourceId: "amazon-data-scientist-2024",
    views: 0,
    applicationsCount: 0
  },
  {
    title: "Product Manager",
    company: "Flipkart",
    location: "Delhi, India",
    country: "IN",
    description: "Lead product development for Flipkart's e-commerce platform. Work with cross-functional teams to deliver products that delight customers.",
    requirements: JSON.stringify([
      "5+ years of product management experience",
      "Strong analytical and problem-solving skills",
      "Experience with agile development methodologies",
      "MBA or equivalent experience preferred"
    ]),
    salary: "₹18,00,000 - ₹30,00,000",
    salaryMin: 1800000,
    salaryMax: 3000000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Senior Level (5+ years)",
    skills: JSON.stringify(["Product Management", "Analytics", "Agile", "User Research", "Strategy", "Leadership"]),
    isRemote: false,
    isHybrid: true,
    isUrgent: false,
    isFeatured: true,
    isActive: true,
    sector: "E-commerce",
    source: "manual",
    sourceId: "flipkart-product-manager-2024",
    views: 0,
    applicationsCount: 0
  },
  {
    title: "DevOps Engineer",
    company: "Netflix",
    location: "Remote",
    country: "IN",
    description: "Join Netflix's infrastructure team to build and maintain scalable cloud infrastructure. Work on systems that serve millions of users worldwide.",
    requirements: JSON.stringify([
      "4+ years of DevOps experience",
      "Expertise in AWS, Docker, and Kubernetes",
      "Experience with CI/CD pipelines",
      "Strong scripting skills (Python, Bash)"
    ]),
    salary: "₹22,00,000 - ₹38,00,000",
    salaryMin: 2200000,
    salaryMax: 3800000,
    salaryCurrency: "INR",
    jobType: "Full-time",
    experienceLevel: "Senior Level (5+ years)",
    skills: JSON.stringify(["AWS", "Docker", "Kubernetes", "CI/CD", "Python", "Bash", "Terraform"]),
    isRemote: true,
    isHybrid: false,
    isUrgent: false,
    isFeatured: true,
    isActive: true,
    sector: "Technology",
    source: "manual",
    sourceId: "netflix-devops-2024",
    views: 0,
    applicationsCount: 0
  }
];

async function seedRealJobs() {
  try {
    console.log('🌱 Seeding real jobs...');
    
    // Clear existing manual jobs first
    await prisma.job.deleteMany({
      where: { source: 'manual' }
    });
    
    console.log('✅ Cleared existing manual jobs');
    
    // Insert new real jobs
    for (const job of realJobs) {
      await prisma.job.create({
        data: job
      });
    }
    
    console.log(`✅ Successfully seeded ${realJobs.length} real jobs`);
    
    // Verify the jobs were created
    const count = await prisma.job.count({
      where: { source: 'manual' }
    });
    
    console.log(`📊 Total manual jobs in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error seeding jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRealJobs();