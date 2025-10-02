#!/bin/bash
set -e

echo "🔧 Fixing Apply Now Button Issues on Server..."

# Check if we're in the right directory
if [ "$(pwd)" != "/var/www/jobportal" ]; then
    echo "❌ Wrong directory! Switching to /var/www/jobportal"
    cd /var/www/jobportal
fi

echo "📝 Creating debug script to check job data..."
cat > debug-job-data.cjs << 'DEBUG'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugJobData() {
  try {
    console.log('🔍 Debugging job data...');
    
    // Get a sample of jobs to check their structure
    const jobs = await prisma.job.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        company: true,
        source: true,
        sourceId: true,
        source_url: true,
        apply_url: true,
        applyUrl: true,
        redirect_url: true,
        location: true,
        description: true
      }
    });
    
    console.log('📊 Sample jobs data:');
    console.log(JSON.stringify(jobs, null, 2));
    
    // Check for jobs with missing source_url
    const jobsWithoutSourceUrl = await prisma.job.count({
      where: {
        source: { not: 'manual' },
        source_url: null
      }
    });
    
    console.log(`\n⚠️  Jobs without source_url: ${jobsWithoutSourceUrl}`);
    
    // Check for external jobs
    const externalJobs = await prisma.job.findMany({
      where: {
        source: { not: 'manual' }
      },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        source_url: true,
        applyUrl: true,
        redirect_url: true
      }
    });
    
    console.log('\n🌐 External jobs:');
    console.log(JSON.stringify(externalJobs, null, 2));
    
    // Check for jobs with applyUrl but no source_url
    const jobsWithApplyUrl = await prisma.job.findMany({
      where: {
        source: { not: 'manual' },
        applyUrl: { not: null },
        source_url: null
      },
      take: 3,
      select: {
        id: true,
        title: true,
        source: true,
        applyUrl: true,
        source_url: true
      }
    });
    
    console.log('\n🔗 Jobs with applyUrl but no source_url:');
    console.log(JSON.stringify(jobsWithApplyUrl, null, 2));
    
    // Count jobs by source
    const jobsBySource = await prisma.job.groupBy({
      by: ['source'],
      _count: {
        id: true
      }
    });
    
    console.log('\n📊 Jobs by source:');
    console.log(JSON.stringify(jobsBySource, null, 2));
    
  } catch (error) {
    console.error('❌ Error debugging job data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJobData();
DEBUG

echo "🔧 Running job data debug..."
node debug-job-data.cjs

echo "📝 Creating fix for Apply Now button..."
cat > fix-apply-urls.cjs << 'FIX'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixApplyUrls() {
  try {
    console.log('🔧 Fixing Apply URL issues...');
    
    // Fix jobs that have applyUrl but no source_url
    const jobsToFix = await prisma.job.findMany({
      where: {
        source: { not: 'manual' },
        applyUrl: { not: null },
        source_url: null
      }
    });
    
    console.log(`📊 Found ${jobsToFix.length} jobs to fix (applyUrl -> source_url)`);
    
    for (const job of jobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source_url: job.applyUrl
        }
      });
      console.log(`✅ Fixed job ${job.id}: ${job.title}`);
    }
    
    // Fix jobs that are external but marked as manual
    const manualJobsToFix = await prisma.job.findMany({
      where: {
        source: 'manual',
        OR: [
          { source_url: { not: null } },
          { applyUrl: { not: null } }
        ]
      }
    });
    
    console.log(`📊 Found ${manualJobsToFix.length} manual jobs that should be external`);
    
    for (const job of manualJobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source: 'external',
          source_url: job.source_url || job.applyUrl
        }
      });
      console.log(`✅ Fixed manual job ${job.id}: ${job.title}`);
    }
    
    // Fix jobs that have redirect_url but no source_url
    const redirectJobsToFix = await prisma.job.findMany({
      where: {
        redirect_url: { not: null },
        source_url: null
      }
    });
    
    console.log(`📊 Found ${redirectJobsToFix.length} jobs with redirect_url to fix`);
    
    for (const job of redirectJobsToFix) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          source_url: job.redirect_url
        }
      });
      console.log(`✅ Fixed redirect job ${job.id}: ${job.title}`);
    }
    
    // Summary
    const totalFixed = jobsToFix.length + manualJobsToFix.length + redirectJobsToFix.length;
    console.log(`\n✅ Apply URL fixes completed! Total jobs fixed: ${totalFixed}`);
    
    // Show sample of fixed jobs
    const sampleFixedJobs = await prisma.job.findMany({
      where: {
        source_url: { not: null }
      },
      take: 5,
      select: {
        id: true,
        title: true,
        source: true,
        source_url: true,
        applyUrl: true
      }
    });
    
    console.log('\n📋 Sample of jobs with source_url:');
    console.log(JSON.stringify(sampleFixedJobs, null, 2));
    
  } catch (error) {
    console.error('❌ Error fixing apply URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApplyUrls();
FIX

echo "🔧 Running apply URL fix..."
node fix-apply-urls.cjs

echo "📝 Updating job details page with enhanced Apply Now button logic..."
cat > app/jobs/[id]/page.tsx << 'JOBPAGE'
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Clock, DollarSign, Heart, Bookmark, Star, Building2, Calendar, ArrowRight, Sparkles, Users, Eye, ExternalLink, Search } from "lucide-react";
import JobShare from "@/components/JobShare";

interface Job {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  location: string | null;
  country: string;
  description: string;
  applyUrl: string | null;
  apply_url: string | null;
  source_url: string | null;
  postedAt: string | null;
  salary: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string | null;
  views: number;
  applications: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  creator: any;
  source: string;
  isExternal: boolean;
  companyRelation?: {
    name: string;
    logo: string | null;
    location: string;
    industry: string;
    website: string | null;
  };
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const jobId = params.id as string;
      console.log('🔍 Fetching job with ID:', jobId);

      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          setError(errorData.details || 'Job not found');
        } else {
          setError('Failed to load job details');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setJob(data.data);
        console.log('✅ Job data loaded:', data.data);
      } else {
        setError(data.error || 'Failed to load job details');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!job) return;

    try {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Error bookmarking job:', error);
    }
  };

  const handleExternalApply = () => {
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
    
    window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInternalApply = () => {
    router.push(`/jobs/${job?.id}/apply`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Briefcase className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              {error || 'Job not found'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              The job you're looking for might have been removed or the URL might be incorrect.
            </p>
            <Button onClick={() => router.push('/jobs')}>
              <Search className="h-4 w-4 mr-2" />
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced logic to determine if job is external
  const isExternalJob = job.isExternal || 
                       job.source !== 'manual' || 
                       (job.source_url || job.applyUrl || job.apply_url) !== null;
  const skillsArray = Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-blue-600">
              Home
            </button>
            <span>/</span>
            <button onClick={() => router.push('/jobs')} className="hover:text-blue-600">
              Jobs
            </button>
            <span>/</span>
            <span className="text-gray-900">{job.title}</span>
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {job.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {job.isUrgent && (
                        <Badge className="bg-red-100 text-red-800">
                          Urgent
                        </Badge>
                      )}
                      {job.isRemote && (
                        <Badge className="bg-green-100 text-green-800">
                          Remote
                        </Badge>
                      )}
                      {job.isHybrid && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Hybrid
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {job.title}
                    </CardTitle>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{job.company}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBookmark}
                    className={`p-2 rounded-full transition-colors ${
                      bookmarked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Job Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {job.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Salary</p>
                        <p className="font-medium">{job.salary}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.jobType && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{job.jobType}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.experienceLevel && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="font-medium">{job.experienceLevel}</p>
                      </div>
                    </div>
                  )}
                  
                  {job.postedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-500">Posted</p>
                        <p className="font-medium">{new Date(job.postedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {(skillsArray || []).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Job Description</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {isExternalJob ? (
                    <div className="flex-1 space-y-4">
                      <Button 
                        onClick={handleExternalApply}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Apply on Company Website
                      </Button>
                      
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          This job is posted on {job.source === 'external' ? 'external platform' : job.source}
                        </p>
                        <p className="text-xs text-gray-500">
                          You'll be redirected to the company's official website
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleInternalApply}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      Apply Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">{job.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Applications</span>
                  <span className="font-semibold">{job.applicationsCount || 0}</span>
                </div>
                {job.sector && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sector</span>
                    <span className="font-semibold">{job.sector}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            {job.companyRelation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    {job.companyRelation.logo && (
                      <img 
                        src={job.companyRelation.logo} 
                        alt={job.companyRelation.name}
                        className="w-16 h-16 mx-auto mb-4 rounded-lg object-cover"
                      />
                    )}
                    <h4 className="font-semibold text-lg mb-2">{job.companyRelation.name}</h4>
                    <p className="text-gray-600 mb-2">{job.companyRelation.location}</p>
                    <p className="text-sm text-gray-500">{job.companyRelation.industry}</p>
                    {job.companyRelation.website && (
                      <a 
                        href={job.companyRelation.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Job */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share This Job</CardTitle>
              </CardHeader>
              <CardContent>
                <JobShare job={job} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
JOBPAGE

echo "🔄 Building application with Apply Now button fixes..."
export NODE_ENV=production
export NEXT_PUBLIC_BUILD_TIME=$(date +%s)000
export NEXT_PUBLIC_DEPLOYMENT_ID=$(date +%s)

npm run build

echo "🔄 Restarting PM2 application..."
pm2 stop jobportal 2>/dev/null || true
pm2 start ecosystem.config.cjs --name jobportal
pm2 save

sleep 5

echo "✅ Checking application status..."
pm2 list | grep jobportal

echo "🧹 Cleaning up temporary files..."
rm -f debug-job-data.cjs fix-apply-urls.cjs

echo "✅ Apply Now button fixes completed!"
echo "🔍 Check the debug output above for any issues"
echo "🌐 Visit your website to test the Apply Now button functionality"
