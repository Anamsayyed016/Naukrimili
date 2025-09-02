"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Star,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface ResumeStatus {
  hasResumes: boolean;
  resumeCount: number;
  latestResume: any;
  resumeHealth: any;
  recommendations: any;
}

export default function JobSeekerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    // Check for success message
    const message = searchParams.get('message');
    if (message === 'resume-built') {
      toast({
        title: 'Resume Built Successfully! 🎉',
        description: 'Your resume has been successfully created and saved.',
      });
      // Clean up URL
      router.replace('/dashboard/jobseeker');
    } else if (message === 'resume-uploaded') {
      toast({
        title: 'Resume Uploaded Successfully! 🎉',
        description: 'Your resume has been successfully uploaded and analyzed.',
      });
      // Clean up URL
      router.replace('/dashboard/jobseeker');
    }

    // Load resume status
    loadResumeStatus();
  }, [status, router, searchParams]);

  const loadResumeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/resumes/check');
      
      if (response.ok) {
        const result = await response.json();
        setResumeStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading resume status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your resume, track applications, and discover new opportunities
          </p>
        </div>

        {/* Resume Status Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resume Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumeStatus?.hasResumes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Current Resume</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">File:</span> {resumeStatus.latestResume.fileName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Last Updated:</span> {new Date(resumeStatus.latestResume.updatedAt).toLocaleDateString()}
                    </p>
                                         <p className="text-sm text-gray-600">
                       <span className="font-medium">Type:</span> Uploaded
                     </p>
                  </div>
                </div>
                
                {/* Health Metrics */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Health Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ATS Score</span>
                      <Badge variant={resumeStatus.resumeHealth.atsScore >= 80 ? 'default' : resumeStatus.resumeHealth.atsScore >= 60 ? 'secondary' : 'destructive'}>
                        {resumeStatus.resumeHealth.atsScore}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Completeness</span>
                      <Badge variant={resumeStatus.resumeHealth.completeness >= 80 ? 'default' : resumeStatus.resumeHealth.completeness >= 60 ? 'secondary' : 'destructive'}>
                        {resumeStatus.resumeHealth.completeness}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={resumeStatus.resumeHealth.needsUpdate ? 'destructive' : 'default'}>
                        {resumeStatus.resumeHealth.needsUpdate ? 'Needs Update' : 'Up to Date'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resume Found</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first resume to unlock job opportunities
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/resumes/upload">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                  </Link>
                  <Link href="/resumes/builder">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Build Resume
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/resumes/upload">
              <CardContent className="p-6 text-center">
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Upload Resume</h3>
                <p className="text-sm text-gray-600">
                  Upload your existing resume for AI analysis
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/resumes/builder">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Build Resume</h3>
                <p className="text-sm text-gray-600">
                  Create a professional resume from scratch
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/jobs">
              <CardContent className="p-6 text-center">
                <Briefcase className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Browse Jobs</h3>
                <p className="text-sm text-gray-600">
                  Find your next career opportunity
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumeStatus?.hasResumes ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      Resume Updated
                    </p>
                    <p className="text-xs text-green-600">
                      {resumeStatus.latestResume.fileName} was last updated on {new Date(resumeStatus.latestResume.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/resumes/${resumeStatus.latestResume.id}`}>
                    <Button variant="ghost" size="sm">
                      View <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity. Start by creating your resume!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
