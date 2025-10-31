'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Building2,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

interface ApplicationDetail {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    profilePicture?: string;
    bio?: string;
    skills?: string[];
    experience?: string;
    education?: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description?: string;
    salary?: number;
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    jobType?: string;
    experienceLevel?: string;
  };
  resume?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    atsScore?: number;
  } | null;
  company?: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
    location?: string;
  } | null;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/applications/${applicationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "Application not found",
            description: "This application does not exist or has been deleted.",
            variant: "destructive",
          });
          router.push('/admin/applications');
          return;
        }
        throw new Error('Failed to fetch application');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setApplication(result.data);
      } else {
        throw new Error(result.error || 'Failed to load application');
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load application details",
        variant: "destructive",
      });
      router.push('/admin/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setApplication({ ...application, status: newStatus });
        toast({
          title: "Success",
          description: "Application status updated successfully",
        });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!application?.resume) return;
    
    try {
      const response = await fetch(`/api/admin/resumes/${application.resume.id}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download resume');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = application.resume.fileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Error",
        description: "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending', icon: Clock },
      reviewed: { variant: 'default' as const, label: 'Reviewed', icon: CheckCircle },
      shortlisted: { variant: 'default' as const, label: 'Shortlisted', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, label: 'Rejected', icon: XCircle },
      hired: { variant: 'default' as const, label: 'Hired', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Application not found</p>
            <Link href="/admin/applications">
              <Button>Back to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Dropdown positioning fix */}
      <style jsx global>{`
        [data-radix-select-content] {
          z-index: 10000 !important;
        }
        [data-radix-popper-content-wrapper] {
          z-index: 10000 !important;
        }
      `}</style>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/applications">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
              <p className="text-gray-600 mt-1">Review and manage this job application</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(application.status)}
              <Select
                value={application.status}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Applicant & Job Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {application.user.firstName && application.user.lastName
                      ? `${application.user.firstName} ${application.user.lastName}`
                      : application.user.email}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    {application.user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {application.user.email}
                      </div>
                    )}
                    {application.user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {application.user.phone}
                      </div>
                    )}
                    {application.user.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {application.user.location}
                      </div>
                    )}
                  </div>
                </div>

                {application.user.bio && (
                  <div>
                    <h4 className="font-medium mb-2">About</h4>
                    <p className="text-gray-600 text-sm">{application.user.bio}</p>
                  </div>
                )}

                {application.user.skills && application.user.skills.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {application.user.experience && (
                  <div>
                    <h4 className="font-medium mb-2">Experience</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{application.user.experience}</p>
                  </div>
                )}

                {application.user.education && (
                  <div>
                    <h4 className="font-medium mb-2">Education</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{application.user.education}</p>
                  </div>
                )}

                {application.resume && (
                  <div className="pt-4 border-t">
                    <Button onClick={handleDownloadResume} className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      {application.resume.fileName} 
                      {application.resume.fileSize && ` • ${(application.resume.fileSize / 1024).toFixed(2)} KB`}
                      {application.resume.atsScore && ` • ATS Score: ${application.resume.atsScore}%`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{application.job.title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {application.job.company}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {application.job.location}
                    </div>
                    {application.job.jobType && (
                      <Badge variant="outline">{application.job.jobType}</Badge>
                    )}
                    {application.job.experienceLevel && (
                      <Badge variant="outline">{application.job.experienceLevel}</Badge>
                    )}
                  </div>
                </div>

                {(application.job.salaryMin || application.job.salaryMax) && (
                  <div>
                    <h4 className="font-medium mb-1">Salary</h4>
                    <p className="text-gray-600">
                      {application.job.salaryCurrency || '₹'}
                      {application.job.salaryMin?.toLocaleString()}
                      {application.job.salaryMax && application.job.salaryMin !== application.job.salaryMax && (
                        <> - {application.job.salaryMax.toLocaleString()}</>
                      )}
                    </p>
                  </div>
                )}

                {application.job.description && (
                  <div>
                    <h4 className="font-medium mb-2">Job Description</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{application.job.description}</p>
                  </div>
                )}

                <Link href={`/jobs/${application.job.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Job Posting
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            {application.coverLetter && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 whitespace-pre-wrap">{application.coverLetter}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Application Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Applied On</p>
                  <p className="font-medium">
                    {new Date(application.appliedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Application ID</p>
                  <p className="font-mono text-sm text-gray-700">{application.id}</p>
                </div>

                {application.resume && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resume</p>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{application.resume.fileName}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.resume && (
                  <Button onClick={handleDownloadResume} className="w-full" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                )}
                <Link href={`/jobs/${application.job.id}`}>
                  <Button variant="outline" className="w-full">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Job
                  </Button>
                </Link>
                <Link href={`/admin/users/${application.user.id}`}>
                  <Button variant="outline" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    View Applicant Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

