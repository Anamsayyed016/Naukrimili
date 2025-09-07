import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testJobsAPI() {
  try {
    console.log('🔍 Testing Jobs API and Database Connection...\n');

    // Test 1: Check database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Test 2: Check if there are any jobs
    console.log('2. Checking existing jobs...');
    const jobCount = await prisma.job.count();
    console.log(`📊 Total jobs in database: ${jobCount}\n`);

    if (jobCount === 0) {
      console.log('⚠️ No jobs found in database. Adding sample jobs...\n');
      
      // Add sample jobs
      const sampleJobs = [
        {
          title: 'Senior Software Developer',
          company: 'TechCorp Solutions',
          location: 'Bangalore, India',
          country: 'IN',
          description: 'We are looking for a Senior Software Developer to join our team. You will be responsible for developing high-quality software solutions.',
          requirements: 'Bachelor\'s degree in Computer Science, 5+ years of experience, proficiency in JavaScript, React, Node.js',
          salary: '800000 - 1200000',
          salaryMin: 800000,
          salaryMax: 1200000,
          salaryCurrency: 'INR',
          jobType: 'full-time',
          experienceLevel: 'senior',
          skills: 'JavaScript,React,Node.js,TypeScript,MongoDB',
          isRemote: false,
          isHybrid: true,
          isUrgent: false,
          isFeatured: true,
          isActive: true,
          sector: 'Technology',
          views: 0,
          applicationsCount: 0,
          source: 'manual',
          sourceId: 'sample-job-1'
        },
        {
          title: 'Frontend Developer',
          company: 'WebTech Inc',
          location: 'Mumbai, India',
          country: 'IN',
          description: 'Join our frontend team to build amazing user interfaces using React, Next.js, and modern web technologies.',
          requirements: '3+ years of frontend experience, React, HTML, CSS, JavaScript',
          salary: '600000 - 900000',
          salaryMin: 600000,
          salaryMax: 900000,
          salaryCurrency: 'INR',
          jobType: 'full-time',
          experienceLevel: 'mid',
          skills: 'React,Next.js,Tailwind CSS,JavaScript,HTML,CSS',
          isRemote: true,
          isHybrid: false,
          isUrgent: false,
          isFeatured: false,
          isActive: true,
          sector: 'Technology',
          views: 0,
          applicationsCount: 0,
          source: 'manual',
          sourceId: 'sample-job-2'
        },
        {
          title: 'DevOps Engineer',
          company: 'CloudTech Systems',
          location: 'Delhi, India',
          country: 'IN',
          description: 'We need a DevOps Engineer to help us scale our infrastructure and improve our deployment processes.',
          requirements: 'AWS, Docker, Kubernetes, CI/CD, Linux administration',
          salary: '700000 - 1100000',
          salaryMin: 700000,
          salaryMax: 1100000,
          salaryCurrency: 'INR',
          jobType: 'full-time',
          experienceLevel: 'mid',
          skills: 'AWS,Docker,Kubernetes,CI/CD,Linux,Terraform',
          isRemote: false,
          isHybrid: true,
          isUrgent: true,
          isFeatured: false,
          isActive: true,
          sector: 'Technology',
          views: 0,
          applicationsCount: 0,
          source: 'manual',
          sourceId: 'sample-job-3'
        },
        {
          title: 'Data Scientist',
          company: 'DataTech Analytics',
          location: 'Hyderabad, India',
          country: 'IN',
          description: 'Join our data science team to work on machine learning models and data analysis projects.',
          requirements: 'Master\'s degree in Data Science, Python, Machine Learning, Statistics',
          salary: '900000 - 1400000',
          salaryMin: 900000,
          salaryMax: 1400000,
          salaryCurrency: 'INR',
          jobType: 'full-time',
          experienceLevel: 'senior',
          skills: 'Python,Machine Learning,TensorFlow,Pandas,NumPy,SQL',
          isRemote: true,
          isHybrid: false,
          isUrgent: false,
          isFeatured: true,
          isActive: true,
          sector: 'Technology',
          views: 0,
          applicationsCount: 0,
          source: 'manual',
          sourceId: 'sample-job-4'
        },
        {
          title: 'Product Manager',
          company: 'ProductTech Corp',
          location: 'Pune, India',
          country: 'IN',
          description: 'Lead product development initiatives and work with cross-functional teams to deliver exceptional products.',
          requirements: 'MBA or equivalent, 4+ years product management experience, Agile methodologies',
          salary: '1000000 - 1500000',
          salaryMin: 1000000,
          salaryMax: 1500000,
          salaryCurrency: 'INR',
          jobType: 'full-time',
          experienceLevel: 'senior',
          skills: 'Product Management,Agile,Scrum,Analytics,User Research',
          isRemote: false,
          isHybrid: true,
          isUrgent: false,
          isFeatured: false,
          isActive: true,
          sector: 'Technology',
          views: 0,
          applicationsCount: 0,
          source: 'manual',
          sourceId: 'sample-job-5'
        }
      ];

      for (const jobData of sampleJobs) {
        const job = await prisma.job.create({
          data: jobData
        });
        console.log(`✅ Job created: ${job.title} at ${job.company}`);
      }
      
      console.log('\n🎉 Sample jobs added successfully!\n');
    }

    // Test 3: Fetch jobs using the same query as the API
    console.log('3. Testing jobs fetch (same as API)...');
    const jobs = await prisma.job.findMany({
      where: { isActive: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        companyRelation: {
          select: {
            name: true,
            logo: true,
            location: true,
            industry: true
          }
        }
      }
    });

    console.log(`📋 Found ${jobs.length} active jobs:`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company} (${job.location})`);
    });

    // Test 4: Test search functionality
    console.log('\n4. Testing search functionality...');
    const searchResults = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { title: { contains: 'developer', mode: 'insensitive' } },
          { company: { contains: 'developer', mode: 'insensitive' } },
          { description: { contains: 'developer', mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    console.log(`🔍 Search for "developer" returned ${searchResults.length} results:`);
    searchResults.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.company}`);
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Database Summary:');
    console.log(`- Total jobs: ${await prisma.job.count()}`);
    console.log(`- Active jobs: ${await prisma.job.count({ where: { isActive: true } })}`);
    console.log(`- Featured jobs: ${await prisma.job.count({ where: { isFeatured: true } })}`);
    console.log(`- Remote jobs: ${await prisma.job.count({ where: { isRemote: true } })}`);

  } catch (error) {
    console.error('❌ Error testing jobs API:', error);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n🔧 Database Configuration Issue:');
      console.log('The DATABASE_URL environment variable is not set.');
      console.log('Please create a .env.local file with:');
      console.log('DATABASE_URL="postgresql://username:password@localhost:5432/jobportal"');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testJobsAPI();
