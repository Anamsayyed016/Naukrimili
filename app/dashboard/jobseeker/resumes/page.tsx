"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Upload, 
  Download,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  FileUp,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface Resume {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  atsScore?: number;
  parsedData?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResumesResponse {
  success: boolean;
  data: {
    resumes: Resume[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function JobSeekerResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchResumes();
  }, [currentPage]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/resumes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }

      const data: ResumesResponse = await response.json();
      if (data.success) {
        setResumes(data.data.resumes);
        setPagination(data.data.pagination);
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

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Resume deleted successfully'
        });
        fetchResumes();
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resume',
        variant: 'destructive'
      });
    }
  };

  const handleSetActiveResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Resume set as active successfully'
        });
        fetchResumes();
      }
    } catch (error) {
      console.error('Error setting active resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to set active resume',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadResume = async (resumeId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/export?format=pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to download resume',
        variant: 'destructive'
      });
    }
  };

  const getAtsScoreBadge = (score?: number) => {
    if (!score) return <Badge variant="outline">No Score</Badge>;
    
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />{score}%</Badge>;
    } else if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />{score}%</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />{score}%</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && resumes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resume Management</h1>
          <p className="text-muted-foreground">Manage and organize your resumes</p>
        </div>
        <div className="flex gap-3">
          <Link href="/resumes/upload">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
          <Link href="/resumes/builder">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Build Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Resume</p>
                <p className="text-2xl font-bold">{resumes.filter(r => r.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg ATS Score</p>
                <p className="text-2xl font-bold">
                  {resumes.length > 0 
                    ? Math.round(resumes.reduce((acc, r) => acc + (r.atsScore || 0), 0) / resumes.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold">
                  {resumes.length > 0 
                    ? Math.max(...resumes.map(r => r.atsScore || 0))
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Resumes ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {resumes.length === 0 && !loading ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resumes Found</h3>
              <p className="text-gray-600 mb-6">
                Get started by uploading your first resume or building one from scratch
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/resumes/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                </Link>
                <Link href="/resumes/builder">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Build Resume
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {resumes.map((resume) => (
                <div key={resume.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {resume.fileName}
                        </h3>
                        {resume.isActive && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                        {getAtsScoreBadge(resume.atsScore)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <FileUp className="h-4 w-4" />
                          {formatFileSize(resume.fileSize)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Uploaded {formatDate(resume.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Updated {formatDate(resume.updatedAt)}
                        </span>
                      </div>

                      {resume.parsedData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          {resume.parsedData.fullName && (
                            <div>
                              <span className="font-medium">Name:</span> {resume.parsedData.fullName}
                            </div>
                          )}
                          {resume.parsedData.email && (
                            <div>
                              <span className="font-medium">Email:</span> {resume.parsedData.email}
                            </div>
                          )}
                          {resume.parsedData.phone && (
                            <div>
                              <span className="font-medium">Phone:</span> {resume.parsedData.phone}
                            </div>
                          )}
                          {resume.parsedData.location && (
                            <div>
                              <span className="font-medium">Location:</span> {resume.parsedData.location}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/resumes/${resume.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadResume(resume.id, resume.fileName)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      {!resume.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActiveResume(resume.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {pagination.totalPages} ({pagination.total} total resumes)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
