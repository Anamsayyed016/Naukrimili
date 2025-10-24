const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ADZUNA_APP_ID = 'bdd02427';
const ADZUNA_APP_KEY = 'abf03277d13e4cb39b24bf236ad29299';

const countries = [
  { code: 'in', name: 'India', location: 'Bangalore' },
  { code: 'us', name: 'USA', location: 'New York' },
  { code: 'gb', name: 'UK', location: 'London' }
];

async function importAdzunaJobs() {
  console.log('🚀 Importing Adzuna Jobs...\n');

  try {
    let totalImported = 0;

    for (const country of countries) {
      console.log(`📥 Importing from ${country.name}...`);
      
      try {
        const apiUrl = `https://api.adzuna.com/v1/api/jobs/${country.code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=software developer&results_per_page=10&where=${country.location}`;
        
        const response = await fetch(apiUrl);
        
        if (response.ok) {
          const data = await response.json();
          const jobs = data.results || [];
          
          let countryImported = 0;
          for (const job of jobs) {
            try {
              await prisma.job.create({
                data: {
                  source: 'adzuna',
                  sourceId: `adzuna_${job.id}`,
                  title: job.title || 'Untitled Position',
                  company: job.company?.display_name || 'Unknown Company',
                  location: job.location?.display_name || country.location,
                  country: country.code.toUpperCase(),
                  description: job.description || '',
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
                  skills: 'Software Development',
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
            } catch (error) {
              if (!error.message.includes('Unique constraint')) {
                console.log(`     ⚠️ Error: ${error.message}`);
              }
            }
          }
          
          console.log(`   ✅ Imported ${countryImported} jobs from ${country.name}`);
        } else {
          console.log(`   ❌ Failed: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Check final count
    const totalJobs = await prisma.job.count();
    const adzunaJobs = await prisma.job.count({ where: { source: 'adzuna' } });

    console.log(`\n📊 Final Results:`);
    console.log(`   📥 Total imported: ${totalImported}`);
    console.log(`   🗄️ Total jobs in DB: ${totalJobs}`);
    console.log(`   🔗 Adzuna jobs: ${adzunaJobs}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAdzunaJobs();
