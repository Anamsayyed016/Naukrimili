"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Download, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface ApplicationDetail {
  id: string;
  jobTitle: string;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantLocation: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  appliedAt: string;
  resumeUrl: string;
  resumeId?: string;
  coverLetter: string;
  experience: string;
  education: string;
  skills: string[] | string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  lastUpdated: string;
  notes?: string;
  isFavorite?: boolean;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      
      // Fetch real application data from API
      const response = await fetch(`/api/employer/applications/${applicationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch application data');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch application data');
      }

      const apiApplication = result.data;
      
      // Parse application data from JSON if it exists
      let applicationData: any = {};
      if (apiApplication.applicationData) {
        try {
          applicationData = typeof apiApplication.applicationData === 'string' 
            ? JSON.parse(apiApplication.applicationData) 
            : apiApplication.applicationData;
        } catch (e) {
          console.warn('Failed to parse application data:', e);
        }
      }

      // Transform API data to component format
      const transformedApplication: ApplicationDetail = {
        id: apiApplication.id,
        jobTitle: apiApplication.job.title,
        jobId: parseInt(apiApplication.job.id),
        applicantName: apiApplication.user.firstName && apiApplication.user.lastName 
          ? `${apiApplication.user.firstName} ${apiApplication.user.lastName}` 
          : apiApplication.user.firstName || apiApplication.user.email || 'Unknown',
        applicantEmail: apiApplication.user.email,
        applicantPhone: apiApplication.user.phone || applicationData.phone || 'Not provided',
        applicantLocation: apiApplication.user.location || applicationData.location || 'Not provided',
        status: apiApplication.status,
        appliedAt: apiApplication.appliedAt,
        resumeUrl: apiApplication.resume?.fileUrl || applicationData.resumeUrl || null,
        resumeId: apiApplication.resume?.id || null,
        coverLetter: apiApplication.coverLetter || applicationData.coverLetter || 'No cover letter provided',
        experience: apiApplication.user.experience || applicationData.experience || 'Not specified',
        education: apiApplication.user.education || applicationData.education || 'Not specified',
        skills: apiApplication.user.skills ? 
          (typeof apiApplication.user.skills === 'string' ? 
            JSON.parse(apiApplication.user.skills) : 
            apiApplication.user.skills) : 
          (applicationData.skills ? 
            (typeof applicationData.skills === 'string' ? 
              applicationData.skills.split(',').map(s => s.trim()) : 
              applicationData.skills) : 
            []),
        portfolioUrl: applicationData.portfolioUrl || null,
        linkedinUrl: applicationData.linkedinUrl || null,
        githubUrl: applicationData.githubUrl || null,
        expectedSalary: applicationData.expectedSalary || 'Not specified',
        noticePeriod: applicationData.noticePeriod || 'Not specified',
        lastUpdated: apiApplication.updatedAt,
        notes: apiApplication.notes || '',
        isFavorite: apiApplication.isFavorite || false
      };

      setApplication(transformedApplication);
      setNotes(transformedApplication.notes || '');
    } catch (error) {
      console.error('Error fetching application data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch application data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    
    try {
      setSaving(true);
      
      // Call API to update application status
      const response = await fetch(`/api/employer/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: notes 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update application status');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
      
    } catch (error) {
      console.error('Error changing application status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update application status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;
    
    try {
      setSaving(true);
      
      // Call API to save notes
      const response = await fetch(`/api/employer/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          notes: notes,
          status: application.status 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to save notes');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, notes } : null);
      
    } catch (error) {
      console.error('Error saving notes:', error);
      setError(error instanceof Error ? error.message : 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!application?.resumeId) {
      console.error('No resume ID available for download');
      return;
    }
    
    try {
      // Call the employer resume download API using the stored resume ID
      const response = await fetch(`/api/employer/resumes/${application.resumeId}/download`);
      
      if (!response.ok) {
        throw new Error('Failed to download resume');
      }

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `resume-${application.applicantName.replace(/\s+/g, '-')}.pdf`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to download resume');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>;
      case 'shortlisted':
        return <Badge className="bg-yellow-100 text-yellow-800">Shortlisted</Badge>;
      case 'interview':
        return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Quick Actions Handlers
  const handleShortlistCandidate = async () => {
    if (!application) return;
    
    setActionLoading('shortlist');
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'shortlisted',
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to shortlist candidate');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to shortlist candidate');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, status: 'shortlisted' } : null);
      
    } catch (error) {
      console.error('Error shortlisting candidate:', error);
      setError(error instanceof Error ? error.message : 'Failed to shortlist candidate');
    } finally {
      setActionLoading(null);
    }
  };

  const handleScheduleInterview = async () => {
    if (!application) return;
    
    setActionLoading('interview');
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'interview',
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to schedule interview');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to schedule interview');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, status: 'interview' } : null);
      
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to schedule interview');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToFavorites = async () => {
    if (!application) return;
    
    setActionLoading('favorite');
    try {
      const response = await fetch('/api/employer/applications/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          applicationId: applicationId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to favorites');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add to favorites');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, isFavorite: true } : null);
      
    } catch (error) {
      console.error('Error adding to favorites:', error);
      setError(error instanceof Error ? error.message : 'Failed to add to favorites');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromFavorites = async () => {
    if (!application) return;
    
    setActionLoading('unfavorite');
    try {
      const response = await fetch(`/api/employer/applications/favorites?applicationId=${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove from favorites');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, isFavorite: false } : null);
      
    } catch (error) {
      console.error('Error removing from favorites:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove from favorites');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectApplication = async () => {
    if (!application) return;
    
    setActionLoading('reject');
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject application');
      }
      
      // Update local state
      setApplication(prev => prev ? { ...prev, status: 'rejected' } : null);
      
    } catch (error) {
      console.error('Error rejecting application:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject application');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Application</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchApplicationData}>Retry</Button>
            <Link href="/employer/applications">
              <Button variant="outline">Back to Applications</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Application not found</h3>
          <p className="text-gray-500 mb-6">The application you're looking for doesn't exist.</p>
          <Link href="/employer/applications">
            <Button>Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/employer/applications" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Details</h1>
              <p className="text-gray-600">
                {application.applicantName} - {application.jobTitle}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/employer/applications?jobId=${application.jobId}`}>
                <Button variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
              </Link>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Application Status</span>
                  {getStatusBadge(application.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Change Status</label>
                    <Select 
                      value={application.status} 
                      onValueChange={handleStatusChange}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Applied Date</label>
                    <p className="text-sm text-gray-600">{formatDate(application.appliedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                    <p className="text-gray-900">{application.applicantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${application.applicantEmail}`} className="text-blue-600 hover:text-blue-800">
                        {application.applicantEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${application.applicantPhone}`} className="text-blue-600 hover:text-blue-800">
                        {application.applicantPhone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{application.applicantLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{application.experience}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Expected Salary</label>
                    <span className="text-gray-900">{application.expectedSalary || 'Not specified'}</span>
                  </div>
                </div>

                {application.noticePeriod && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notice Period</label>
                    <span className="text-gray-900">{application.noticePeriod}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    let skillsArray: string[] = [];
                    const skills = application.skills;
                    if (Array.isArray(skills)) {
                      skillsArray = skills;
                    } else if (typeof skills === 'string' && skills) {
                      skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
                    }
                    return skillsArray.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{application.coverLetter}</p>
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{application.education}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application?.status !== 'shortlisted' && application?.status !== 'hired' && application?.status !== 'rejected' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleShortlistCandidate}
                    disabled={actionLoading === 'shortlist'}
                  >
                    {actionLoading === 'shortlist' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Shortlist Candidate
                  </Button>
                )}
                
                {application?.status === 'shortlisted' && (
                  <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Shortlisted
                  </div>
                )}
                
                {application?.status === 'shortlisted' && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleScheduleInterview}
                    disabled={actionLoading === 'interview'}
                  >
                    {actionLoading === 'interview' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Schedule Interview
                  </Button>
                )}
                
                {application?.status === 'interview' && (
                  <div className="w-full bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-center">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Interview Scheduled
                  </div>
                )}
                
                {application?.status === 'hired' && (
                  <div className="w-full bg-green-100 text-green-800 px-4 py-2 rounded-lg text-center">
                    <CheckCircle className="h-4 w-4 inline mr-2" />
                    Hired
                  </div>
                )}
                
                {application?.status === 'rejected' && (
                  <div className="w-full bg-red-100 text-red-800 px-4 py-2 rounded-lg text-center">
                    <XCircle className="h-4 w-4 inline mr-2" />
                    Rejected
                  </div>
                )}
                
                {application?.isFavorite ? (
                  <Button 
                    variant="outline" 
                    className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    onClick={handleRemoveFromFavorites}
                    disabled={actionLoading === 'unfavorite'}
                  >
                    {actionLoading === 'unfavorite' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                    ) : (
                      <Star className="h-4 w-4 mr-2 fill-current" />
                    )}
                    Remove from Favorites
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleAddToFavorites}
                    disabled={actionLoading === 'favorite'}
                  >
                    {actionLoading === 'favorite' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    ) : (
                      <Star className="h-4 w-4 mr-2" />
                    )}
                    Add to Favorites
                  </Button>
                )}
                
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleRejectApplication}
                  disabled={actionLoading === 'reject' || application?.status === 'rejected'}
                >
                  {actionLoading === 'reject' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  {application?.status === 'rejected' ? 'Application Rejected' : 'Reject Application'}
                </Button>
              </CardContent>
            </Card>

            {/* Resume & Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.resumeUrl && application.resumeId ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleDownloadResume()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Resume
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    No Resume Available
                  </Button>
                )}
                {application.portfolioUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Portfolio
                    </a>
                  </Button>
                )}
                {application.linkedinUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View LinkedIn
                    </a>
                  </Button>
                )}
                {application.githubUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.githubUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View GitHub
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this candidate..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />
                <Button 
                  onClick={handleSaveNotes} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Application Submitted</p>
                      <p className="text-xs text-gray-500">{formatDate(application.appliedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Under Review</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Interview</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Decision</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
