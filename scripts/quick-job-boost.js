#!/usr/bin/env node

/**
 * Quick Job Boost Script
 * Adds a large number of realistic jobs quickly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Realistic job data
const companies = [
  'TechCorp Solutions', 'InnovateLab', 'CodeCraft', 'DataFlow', 'CloudTech',
  'FinTech Pro', 'BankTech', 'InvestCorp', 'MoneyFlow', 'CapitalOne',
  'HealthTech', 'MedCare', 'BioTech', 'CarePlus', 'Wellness Corp',
  'EduTech Pro', 'LearnSmart', 'SkillUp', 'Academy Plus', 'Knowledge Hub',
  'Green Energy Corp', 'EcoTech', 'SolarPower', 'WindEnergy', 'CleanTech',
  'RetailMax', 'ShopSmart', 'MarketPlace', 'StoreFront', 'Commerce Hub',
  'MediaWorks', 'ContentLab', 'Creative Studio', 'Digital Agency', 'Brand Studio',
  'AutoTech', 'DriveSmart', 'CarConnect', 'Mobility Plus', 'Transport Hub'
];

const jobTitles = [
  'Software Developer', 'Senior Software Engineer', 'Full Stack Developer',
  'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist',
  'Machine Learning Engineer', 'UI/UX Designer', 'Product Manager',
  'Marketing Manager', 'Sales Executive', 'Business Analyst', 'Project Manager',
  'HR Specialist', 'Financial Analyst', 'Content Writer', 'Graphic Designer',
  'Quality Assurance Engineer', 'System Administrator', 'Network Engineer',
  'Mobile App Developer', 'Cloud Architect', 'Security Analyst', 'Database Administrator'
];

const locations = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad'
];

const sectors = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce',
  'Manufacturing', 'Consulting', 'Media', 'Real Estate', 'Automotive',
  'Energy', 'Telecommunications', 'Retail', 'Hospitality', 'Transportation'
];

const skills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes',
  'TypeScript', 'Angular', 'Vue.js', 'MongoDB', 'PostgreSQL', 'Redis',
  'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'Data Analysis',
  'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateJobDescription(title, company, sector) {
  const descriptions = [
    `Join our dynamic ${sector.toLowerCase()} team at ${company} as a ${title}. We're looking for a talented professional to help drive our innovative projects forward. You'll work in a collaborative environment with cutting-edge technology and have the opportunity to make a real impact.`,
    `We are seeking a skilled ${title} to join ${company} in the ${sector.toLowerCase()} sector. This role offers excellent growth opportunities and the chance to work with industry-leading professionals. You'll be responsible for developing innovative solutions and contributing to our company's success.`,
    `At ${company}, we're looking for an experienced ${title} to join our ${sector.toLowerCase()} division. This position offers the opportunity to work on exciting projects, collaborate with talented teams, and advance your career in a supportive environment.`
  ];
  return getRandomElement(descriptions);
}

function generateRequirements(title, sector) {
  const baseRequirements = [
    `Bachelor's degree in relevant field`,
    `2-5 years of experience in ${sector.toLowerCase()}`,
    `Strong problem-solving skills`,
    `Excellent communication skills`,
    `Ability to work in a team environment`
  ];
  
  const selectedSkills = getRandomElements(skills, 3);
  const skillRequirements = selectedSkills.map(skill => `Experience with ${skill}`);
  
  return [...baseRequirements, ...skillRequirements].join('\n');
}

function generateSalary(sector, experienceLevel) {
  const baseSalaries = {
    Technology: { junior: 400000, mid: 800000, senior: 1500000 },
    Finance: { junior: 350000, mid: 700000, senior: 1400000 },
    Healthcare: { junior: 300000, mid: 600000, senior: 1200000 },
    Education: { junior: 250000, mid: 500000, senior: 1000000 },
    'E-commerce': { junior: 300000, mid: 600000, senior: 1200000 }
  };
  
  const baseSalary = baseSalaries[sector]?.[experienceLevel] || baseSalaries.Technology[experienceLevel];
  const variation = 0.8 + Math.random() * 0.4; // ±20% variation
  const minSalary = Math.floor(baseSalary * variation);
  const maxSalary = Math.floor(minSalary * (1.2 + Math.random() * 0.3)); // 20-50% higher
  
  return {
    min: minSalary,
    max: maxSalary,
    formatted: `₹${minSalary.toLocaleString()}-${maxSalary.toLocaleString()}`
  };
}

function determineExperienceLevel(title) {
  const seniorKeywords = ['senior', 'lead', 'principal', 'staff', 'architect'];
  const juniorKeywords = ['junior', 'entry', 'graduate', 'associate'];
  
  const titleLower = title.toLowerCase();
  
  if (seniorKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'senior';
  }
  if (juniorKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'junior';
  }
  return 'mid';
}

async function createJobs(count = 1000) {
  console.log(`🚀 Creating ${count} realistic jobs...`);
  
  const jobs = [];
  const startTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    const company = getRandomElement(companies);
    const title = getRandomElement(jobTitles);
    const location = getRandomElement(locations);
    const sector = getRandomElement(sectors);
    const experienceLevel = determineExperienceLevel(title);
    const jobSkills = getRandomElements(skills, Math.floor(Math.random() * 5) + 3);
    const salary = generateSalary(sector, experienceLevel);
    
    // Add some remote/hybrid jobs
    const workType = Math.random();
    let finalLocation = location;
    let isRemote = false;
    let isHybrid = false;
    
    if (workType < 0.2) {
      finalLocation = `${location} (Remote)`;
      isRemote = true;
    } else if (workType < 0.3) {
      finalLocation = `${location} (Hybrid)`;
      isHybrid = true;
    }
    
    const job = {
      source: 'seeded',
      sourceId: `seeded_${Date.now()}_${i}`,
      title,
      company,
      location: finalLocation,
      country: 'IN',
      description: generateJobDescription(title, company, sector),
      requirements: generateRequirements(title, sector),
      apply_url: `/jobs/apply/${Date.now()}_${i}`,
      source_url: null,
      postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      salary: salary.formatted,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryCurrency: 'INR',
      jobType: Math.random() < 0.1 ? 'part-time' : 'full-time',
      experienceLevel,
      skills: jobSkills.join(','),
      isRemote,
      isHybrid,
      isUrgent: Math.random() < 0.1,
      isFeatured: Math.random() < 0.05,
      isActive: true,
      sector,
      views: Math.floor(Math.random() * 1000),
      applicationsCount: Math.floor(Math.random() * 50),
      rawJson: {
        seeded: true,
        batch: 'quick-boost',
        timestamp: Date.now()
      }
    };
    
    jobs.push(job);
    
    // Progress indicator
    if ((i + 1) % 100 === 0) {
      console.log(`📊 Created ${i + 1}/${count} jobs...`);
    }
  }
  
  console.log(`⏳ Inserting ${jobs.length} jobs into database...`);
  
  // Insert jobs in batches to avoid memory issues
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    try {
      await prisma.job.createMany({
        data: batch,
        skipDuplicates: true
      });
      inserted += batch.length;
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${inserted}/${jobs.length} jobs`);
    } catch (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`🎉 Successfully created ${inserted} jobs in ${(duration / 1000).toFixed(2)}s`);
  
  // Get final statistics
  const totalJobs = await prisma.job.count();
  const jobsBySector = await prisma.job.groupBy({
    by: ['sector'],
    _count: { id: true }
  });
  
  console.log(`📊 Database now has ${totalJobs} total jobs`);
  console.log(`📈 Jobs by sector:`);
  jobsBySector.forEach(sector => {
    console.log(`   ${sector.sector}: ${sector._count.id}`);
  });
}

async function main() {
  try {
    const count = process.argv[2] ? parseInt(process.argv[2]) : 1000;
    
    if (isNaN(count) || count <= 0) {
      console.error('❌ Please provide a valid number of jobs to create');
      process.exit(1);
    }
    
    console.log(`🎯 Target: Create ${count} jobs`);
    
    // Check current job count
    const currentCount = await prisma.job.count();
    console.log(`📊 Current jobs in database: ${currentCount}`);
    
    await createJobs(count);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
