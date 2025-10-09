#!/usr/bin/env node

/**
 * 🔗 JOB REDIRECT FIX SCRIPT
 * This script fixes the job redirect functionality to properly handle external jobs
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';

console.log('🔗 Starting Job Redirect Fix...');

// Fix the job detail page to handle external redirects properly
function fixJobDetailPage() {
  console.log('🔧 Fixing job detail page...');
  
  const jobDetailPath = 'app/jobs/[id]/page.tsx';
  if (fs.existsSync(jobDetailPath)) {
    let content = fs.readFileSync(jobDetailPath, 'utf8');
    
    // Enhanced external apply logic
    const enhancedApplyLogic = `  const handleExternalApply = () => {
    if (!job) {
      console.error('❌ Job data not available for external apply');
      return;
    }

    // Try multiple fallback URLs in order of preference
    const applyUrl = job.source_url || job.applyUrl || job.apply_url;
    
    if (!applyUrl) {
      console.error('❌ No apply URL found for job:', {
        id: job.id,
        title: job.title,
        source: job.source,
        source_url: job.source_url,
        applyUrl: job.applyUrl,
        apply_url: job.apply_url
      });
      
      // Show user-friendly error message
      alert('Application URL not available for this job. Please try again later or contact support.');
      return;
    }

    console.log('🌐 Opening external apply URL:', applyUrl);
    console.log('📊 Job details:', {
      id: job.id,
      title: job.title,
      source: job.source,
      isExternal: job.isExternal
    });
    
    // Open in new tab with proper security attributes
    window.open(applyUrl, '_blank', 'noopener,noreferrer');
    
    // Track the click for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'job_apply_click', {
        job_id: job.id,
        job_title: job.title,
        company: job.company,
        source: job.source
      });
    }
  };`;
    
    // Replace the existing handleExternalApply function
    content = content.replace(
      /const handleExternalApply = \(\) => \{[\s\S]*?\};/,
      enhancedApplyLogic
    );
    
    // Enhanced external job detection
    const enhancedDetection = `  // Enhanced logic to determine if job is external
  const isExternalJob = job.isExternal || 
                       job.source !== 'manual' || 
                       job.source !== 'sample' ||
                       (job.source_url || job.applyUrl || job.apply_url) !== null;`;
    
    content = content.replace(
      /\/\/ Enhanced logic to determine if job is external[\s\S]*?const isExternalJob = [^;]+;/,
      enhancedDetection
    );
    
    fs.writeFileSync(jobDetailPath, content);
    console.log('✅ Job detail page fixed for external redirects');
  }
}

// Fix the job API to properly handle external job URLs
function fixJobAPI() {
  console.log('🔧 Fixing job API for external URLs...');
  
  const jobAPIPath = 'app/api/jobs/[id]/route.ts';
  if (fs.existsSync(jobAPIPath)) {
    let content = fs.readFileSync(jobAPIPath, 'utf8');
    
    // Enhanced external job formatting
    const enhancedFormatting = `/**
 * Format external job with required fields and proper URLs
 */
function formatExternalJob(job: any, id: string, source: string) {
  return {
    ...job,
    id: id,
    isExternal: true,
    source: source,
    apply_url: null,                    // External jobs don't have internal apply URL
    source_url: job.source_url || job.applyUrl || job.redirect_url || job.url, // External source URL
    company: job.company || 'Company not specified',
    location: job.location || 'Location not specified',
    description: job.description || 'No description available',
    skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : []),
    isRemote: job.isRemote || false,
    isFeatured: job.isFeatured || false,
    createdAt: job.postedAt ? new Date(job.postedAt) : new Date(),
    // Ensure we have a valid redirect URL
    redirectUrl: job.source_url || job.applyUrl || job.redirect_url || job.url || '#'
  };
}`;
    
    // Replace the existing formatExternalJob function
    content = content.replace(
      /\/\*\*[\s\S]*?function formatExternalJob[\s\S]*?\}/,
      enhancedFormatting
    );
    
    fs.writeFileSync(jobAPIPath, content);
    console.log('✅ Job API fixed for external URLs');
  }
}

// Create a job redirect tracking component
function createRedirectTracker() {
  console.log('📊 Creating redirect tracker...');
  
  const trackerContent = `'use client';

import { useEffect } from 'react';

interface RedirectTrackerProps {
  jobId: string;
  jobTitle: string;
  company: string;
  source: string;
  redirectUrl: string;
}

export function RedirectTracker({ jobId, jobTitle, company, source, redirectUrl }: RedirectTrackerProps) {
  useEffect(() => {
    // Track redirect for analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'job_redirect', {
        job_id: jobId,
        job_title: jobTitle,
        company: company,
        source: source,
        redirect_url: redirectUrl
      });
    }
    
    // Track for internal analytics
    fetch('/api/analytics/job-redirect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobId,
        jobTitle,
        company,
        source,
        redirectUrl,
        timestamp: new Date().toISOString()
      })
    }).catch(error => {
      console.warn('Failed to track redirect:', error);
    });
  }, [jobId, jobTitle, company, source, redirectUrl]);

  return null;
}`;

  const dir = 'components/analytics';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'RedirectTracker.tsx'), trackerContent);
  console.log('✅ Redirect tracker component created');
}

// Create analytics endpoint for tracking redirects
function createAnalyticsEndpoint() {
  console.log('📈 Creating analytics endpoint...');
  
  const analyticsContent = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log the redirect for analytics
    console.log('📊 Job Redirect:', {
      jobId: data.jobId,
      jobTitle: data.jobTitle,
      company: data.company,
      source: data.source,
      redirectUrl: data.redirectUrl,
      timestamp: data.timestamp,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });
    
    // Here you could save to database, send to analytics service, etc.
    // For now, we'll just log it
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}`;

  const dir = 'app/api/analytics/job-redirect';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dir, 'route.ts'), analyticsContent);
  console.log('✅ Analytics endpoint created at /api/analytics/job-redirect');
}

// Fix the providers to ensure proper URL handling
function fixProviders() {
  console.log('🔧 Fixing providers for proper URL handling...');
  
  const providersPath = 'lib/jobs/providers.ts';
  if (fs.existsSync(providersPath)) {
    let content = fs.readFileSync(providersPath, 'utf8');
    
    // Ensure all providers set proper source_url
    content = content.replace(
      /source_url: r\.redirect_url \|\| r\.url,/g,
      'source_url: r.redirect_url || r.url || r.apply_url || r.link,'
    );
    
    // Ensure apply_url is null for external jobs
    content = content.replace(
      /apply_url: null,/g,
      'apply_url: null, // External jobs redirect to source'
    );
    
    fs.writeFileSync(providersPath, content);
    console.log('✅ Providers fixed for proper URL handling');
  }
}

// Create a test script for redirects
function createRedirectTestScript() {
  console.log('🧪 Creating redirect test script...');
  
  const testContent = `#!/usr/bin/env node

/**
 * Test script for job redirects
 */


async function testJobRedirects() {
  console.log('🧪 Testing Job Redirects...');
  
  try {
    // Test job import to get external jobs
    const importResponse = await axios.post('http://localhost:3000/api/jobs/import-live', {
      query: 'software developer',
      location: 'Bangalore',
      country: 'IN'
    });
    
    const jobs = importResponse.data.jobs;
    console.log(\`📥 Imported \${jobs.length} jobs\`);
    
    // Test each job's redirect URL
    for (const job of jobs.slice(0, 5)) { // Test first 5 jobs
      console.log(\`\\n🔍 Testing job: \${job.title} at \${job.company}\`);
      console.log(\`   Source: \${job.source}\`);
      console.log(\`   Source URL: \${job.source_url}\`);
      console.log(\`   Apply URL: \${job.applyUrl}\`);
      
      // Test if the job API returns proper redirect info
      try {
        const jobResponse = await axios.get(\`http://localhost:3000/api/jobs/\${job.sourceId}\`);
        const jobData = jobResponse.data.data;
        
        console.log(\`   ✅ Job API Response:\`);
        console.log(\`      ID: \${jobData.id}\`);
        console.log(\`      Is External: \${jobData.isExternal}\`);
        console.log(\`      Source URL: \${jobData.source_url}\`);
        console.log(\`      Apply URL: \${jobData.apply_url}\`);
        
        // Test if redirect URL is accessible
        if (jobData.source_url && jobData.source_url !== '#') {
          try {
            const redirectResponse = await axios.head(jobData.source_url, { timeout: 5000 });
            console.log(\`      ✅ Redirect URL accessible: \${redirectResponse.status}\`);
          } catch (error) {
            console.log(\`      ⚠️ Redirect URL not accessible: \${error.message}\`);
          }
        }
        
      } catch (error) {
        console.log(\`   ❌ Job API Error: \${error.message}\`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJobRedirects();`;

  fs.writeFileSync('test-job-redirects.js', testContent);
  console.log('✅ Redirect test script created: test-job-redirects.js');
}

// Main execution
async function main() {
  try {
    fixJobDetailPage();
    fixJobAPI();
    createRedirectTracker();
    createAnalyticsEndpoint();
    fixProviders();
    createRedirectTestScript();
    
    console.log('\\n🎉 Job Redirect Fix Complete!');
    console.log('\\n📋 Next Steps:');
    console.log('1. Restart your application: pm2 restart jobportal');
    console.log('2. Test redirects: node test-job-redirects.js');
    console.log('3. Import external jobs: curl -X POST http://localhost:3000/api/jobs/import-live -H "Content-Type: application/json" -d \'{"query":"software developer","location":"Bangalore"}\'');
    console.log('4. Test a job redirect: Visit https://naukrimili.com/jobs/[external-job-id]');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

main();
