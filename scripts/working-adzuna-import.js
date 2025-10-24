const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADZUNA_APP_ID = 'bdd02427';
const ADZUNA_APP_KEY = 'abf03277d13e4cb39b24bf236ad29299';

async function importAdzunaJobs() {
  console.log('🚀 Starting Adzuna Jobs Import...\n');

  const countries = [
    { code: 'in', name: 'India', location: 'Bangalore' },
    { code: 'us', name: 'USA', location: 'New York' },
    { code: 'gb', name: 'UK', location: 'London' }
  ];

  let totalImported = 0;

  for (const country of countries) {
    console.log(`📥 Importing from ${country.name} (${country.code.toUpperCase()})...`);
    
    try {
      // Test API first
      const testUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=5&where=${country.location}`;
      
      const response = await fetch(testUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API working - Found ${data.results?.length || 0} jobs`);
        
        // Import jobs
        const jobs = data.results || [];
        let countryImported = 0;
        
        for (const job of jobs) {
          try {
            await prisma.job.create({
              data: {
                source: 'adzuna',
                sourceId: `adzuna_${job.id}`,
                title: job.title || 'Software Developer',
                company: job.company?.display_name || 'Unknown Company',
                location: job.location?.display_name || country.location,
                country: country.code.toUpperCase(),
                description: job.description || 'Software development position',
                applyUrl: job.redirect_url,
                apply_url: job.redirect_url,
                source_url: job.redirect_url,
                postedAt: job.created ? new Date(job.created) : new Date(),
                salary: job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : null,
                salaryMin: job.salary_min,
                salaryMax: job.salary_max,
                salaryCurrency: country.code === 'in' ? 'INR' : country.code === 'us' ? 'USD' : 'GBP',
                jobType: 'full-time',
                experienceLevel: 'mid',
                skills: 'Software Development,Programming',
                isRemote: false,
                isHybrid: false,
                isUrgent: false,
                isFeatured: false,
                isActive: true,
                sector: 'Technology',
                views: 0,
                applicationsCount: 0,
                rawJson: JSON.stringify(job)
              }
            });
            
            countryImported++;
            totalImported++;
            console.log(`     ✅ ${job.title} at ${job.company?.display_name}`);
          } catch (error) {
            if (error.message.includes('Unique constraint')) {
              console.log(`     ⚠️ Job already exists: ${job.title}`);
            } else {
              console.log(`     ❌ Error creating job: ${error.message}`);
            }
          }
        }
        
        console.log(`   📊 Imported ${countryImported} jobs from ${country.name}`);
      } else {
        console.log(`   ❌ API failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Final summary
  const totalJobs = await prisma.job.count();
  const adzunaJobs = await prisma.job.count({ where: { source: 'adzuna' } });
  const jobsByCountry = await prisma.job.groupBy({
    by: ['country'],
    _count: { country: true }
  });

  console.log('🎉 Import Complete!');
  console.log(`📊 Summary:`);
  console.log(`   📥 Jobs imported this run: ${totalImported}`);
  console.log(`   🗄️ Total jobs in database: ${totalJobs}`);
  console.log(`   🔗 Adzuna jobs: ${adzunaJobs}`);
  console.log(`   🌍 Jobs by country:`);
  jobsByCountry.forEach(group => {
    console.log(`      ${group.country}: ${group._count.country} jobs`);
  });

  await prisma.$disconnect();
}

// Run the import
importAdzunaJobs().catch(console.error);
