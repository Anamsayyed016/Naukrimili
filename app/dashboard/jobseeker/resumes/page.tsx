"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Eye, 
  Download, 
  Trash2, 
  Edit, 
  Star,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  MoreHorizontal,
  BarChart3
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";
import ResumeViewStats from "@/components/resume/ResumeViewStats";

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  isActive: boolean;
  createdAt: string;
  atsScore: number;
  parsedData: any;
  applications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    job: {
      id: string;
      title: string;
      company: string;
    };
  }>;
  _count: {
    applications: number;
    views: number;
  };
}

interface ResumeStats {
  totalResumes: number;
  activeResumes: number;
}

export default function JobSeekerResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobseeker/resumes');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data = await response.json();
      if (data.success) {
        setResumes(data.data.resumes);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resumes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/jobseeker/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set active resume');
      }

      // Refresh resumes
      fetchResumes();
      toast({
        title: 'Success',
        description: 'Resume set as active',
      });
    } catch (error) {
      console.error('Error setting active resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active resume',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/jobseeker/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete resume');
      }

      // Refresh resumes
      fetchResumes();
      toast({
        title: 'Success',
        description: 'Resume deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete resume',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case 'reviewed': return <Badge className="bg-yellow-100 text-yellow-800">Reviewed</Badge>;
      case 'interview': return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>;
      case 'hired': return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
                <p className="text-gray-600 mt-2">Manage your resumes and track their performance</p>
              </div>
              <Link href="/resumes/upload">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Upload New Resume
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                      <p className="text-2xl font-bold">{stats.totalResumes}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Resume</p>
                      <p className="text-2xl font-bold text-green-600">{stats.activeResumes}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {resumes.reduce((sum, resume) => sum + resume._count.applications, 0)}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Resumes List */}
          <div className="space-y-6">
            {resumes && resumes.length > 0 ? (
              resumes.map((resume) => (
                <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-6 w-6 text-blue-500" />
                          <h3 className="text-xl font-semibold text-gray-900">{resume.fileName}</h3>
                          {resume.isActive && (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{formatFileSize(resume.fileSize)}</span>
                          </div>
                          {resume.atsScore > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              ATS Score: {resume.atsScore}%
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{resume._count.applications}</span>
                            <span>applications</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">{resume._count.views || 0}</span>
                            <span>views</span>
                          </div>
                        </div>

                        {/* Recent Applications */}
                        {resume.applications && resume.applications.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Applications</h4>
                            <div className="space-y-2">
                              {resume.applications.slice(0, 3).map((application) => (
                                <div key={application.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{application.job.title}</p>
                                    <p className="text-xs text-gray-600">{application.job.company}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(application.status)}
                                    <span className="text-xs text-gray-500">
                                      {new Date(application.appliedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/resumes/${resume.id}/view`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/api/resumes/${resume.id}/download`;
                            link.download = resume.fileName;
                            link.click();
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>

                        {!resume.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(resume.id)}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Set Active
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/api/resumes/${resume.id}/view`, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Resume
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteResume(resume.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Resume
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes uploaded</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your first resume to start applying for jobs
                  </p>
                  <Link href="/resumes/upload">
                    <Button className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Resume
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resume View Statistics */}
          {resumes && resumes.length > 0 && resumes[0] && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Resume View Analytics</h3>
              <div className="grid grid-cols-1 gap-6">
                <ResumeViewStats 
                  key={resumes[0].id} 
                  resumeId={resumes[0].id} 
                  resumeName={resumes[0].fileName}
                />
              </div>
              {resumes.length > 1 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    View statistics for all {resumes.length} resumes are available
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}