#!/bin/bash
set -e

echo "🔍 Debugging Apply Now button issue..."

# Check if we're in the right directory
if [ "$(pwd)" != "/var/www/jobportal" ]; then
    echo "❌ Wrong directory! Switching to /var/www/jobportal"
    cd /var/www/jobportal
fi

echo "📝 Creating debug script to check job data..."
cat > debug-job-data.js << 'DEBUG'
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
        isExternal: true,
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
        applyUrl: true
      }
    });
    
    console.log('\n🌐 External jobs:');
    console.log(JSON.stringify(externalJobs, null, 2));
    
  } catch (error) {
    console.error('❌ Error debugging job data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJobData();
DEBUG

echo "🔧 Running job data debug..."
node debug-job-data.js

echo "📝 Creating fix for Apply Now button..."
cat > fix-apply-button.js << 'FIX'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixApplyButton() {
  try {
    console.log('🔧 Fixing Apply Now button issues...');
    
    // Fix jobs that have applyUrl but no source_url
    const jobsToFix = await prisma.job.findMany({
      where: {
        source: { not: 'manual' },
        applyUrl: { not: null },
        source_url: null
      }
    });
    
    console.log(`📊 Found ${jobsToFix.length} jobs to fix`);
    
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
    
    console.log('✅ Apply button fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing apply button:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixApplyButton();
FIX

echo "🔧 Running apply button fix..."
node fix-apply-button.js

echo "📝 Updating job details page to handle missing source_url..."
cat > app/jobs/[id]/page.tsx << 'JOBPAGE'
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Users, 
  Star,
  Heart,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  description: string;
  requirements?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[] | string;
  isRemote?: boolean;
  isHybrid?: boolean;
  isUrgent?: boolean;
  isFeatured?: boolean;
  postedAt?: string;
  views?: number;
  applicationsCount?: number;
  source?: string;
  source_url?: string;
  apply_url?: string;
  applyUrl?: string;
  isExternal?: boolean;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
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
    if (!job || !session?.user?.id) {
      toast.error('Please log in to bookmark jobs');
      return;
    }

    try {
      const response = await fetch('/api/jobs/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
        toast.success(bookmarked ? 'Job removed from bookmarks' : 'Job bookmarked');
      }
    } catch (error) {
      console.error('Error bookmarking job:', error);
    }
  };

  const handleExternalApply = () => {
    if (!job) {
      toast.error('Job data not available');
      return;
    }

    // Try multiple fallback URLs
    const applyUrl = job.source_url || job.applyUrl || job.apply_url;
    
    if (!applyUrl) {
      toast.error('Application URL not available for this job');
      console.error('No apply URL found for job:', job);
      return;
    }

    console.log('🌐 Opening external apply URL:', applyUrl);
    window.open(applyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleInternalApply = () => {
    if (!job) {
      toast.error('Job data not available');
      return;
    }

    router.push(`/jobs/${job.id}/apply`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/jobs')}>
                Browse Other Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No job data available</p>
        </div>
      </div>
    );
  }

  // Determine if this is an external job - enhanced logic
  const isExternalJob = job.isExternal || 
                       job.source !== 'manual' || 
                       (job.source_url || job.applyUrl || job.apply_url) !== null;

  const skillsArray = Array.isArray(job.skills) ? job.skills : (job.skills ? [job.skills] : []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
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
                  <div className="space-y-6">
                    {/* Job Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.jobType && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.jobType}</span>
                        </div>
                      )}
                      
                      {job.experienceLevel && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{job.experienceLevel}</span>
                        </div>
                      )}
                      
                      {job.salary && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>{job.salary}</span>
                        </div>
                      )}
                      
                      {job.postedAt && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Description</h3>
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {job.description}
                      </div>
                    </div>

                    {/* Requirements */}
                    {job.requirements && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {job.requirements}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {skillsArray.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {skillsArray.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 p-6 pt-0">
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
                          This job is posted on {job.source === 'external' ? 'external platform' : job.source || 'external platform'}
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
                  {job.postedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Posted</span>
                      <span className="font-semibold">{new Date(job.postedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Similar Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Similar Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Similar jobs will be shown here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
JOBPAGE

echo "✅ Apply Now button debug and fix completed!"
echo "🔍 Check the debug output above for any issues"
echo "🔧 Run the deployment script to apply the fixes"
