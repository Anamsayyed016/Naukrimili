#!/bin/bash
echo "🚀 Deploying Real Jobs Fix..."

# Step 1: Update app/api/jobs/route.ts - add deduplication function
echo "📝 Adding deduplication function to route.ts..."
sed -i '7a\\n/**\n * Remove duplicate jobs based on title, company, and location\n */\nfunction removeDuplicateJobs(jobs: any[]): any[] {\n  const seen = new Set<string>();\n  return jobs.filter(job => {\n    const key = `${job.title?.toLowerCase()}-${job.company?.toLowerCase()}-${job.location?.toLowerCase()}`;\n    if (seen.has(key)) {\n      console.log(`🔄 Removing duplicate: ${job.title} at ${job.company}`);\n      return false;\n    }\n    seen.add(key);\n    return true;\n  });\n}' /var/www/jobportal/app/api/jobs/route.ts

# Step 2: Replace the job combination line
echo "📝 Adding deduplication call..."
sed -i 's|jobs = \[\.\.\jobs, \.\.\.realExternalJobs\];|const combinedJobs = [...jobs, ...realExternalJobs];\n              jobs = removeDuplicateJobs(combinedJobs);|' /var/www/jobportal/app/api/jobs/route.ts

# Step 3: Remove sample job generation
echo "📝 Removing sample job generation..."
sed -i 's|console\.log(`🔧 No real jobs found.*|console.log(`⚠️ No real jobs found for query "${query}". Returning empty results (no fake/sample jobs).`);|' /var/www/jobportal/app/api/jobs/route.ts

echo "✅ Files updated! Now rebuilding..."
