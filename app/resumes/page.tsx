"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  Star,
  Calendar,
  BarChart3,
  Plus,
  Share,
  Edit
} from "lucide-react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useResumesApi, Resume } from "@/hooks/useResumesApi";
import ResumeUpload from "@/components/resume/ResumeUpload";

// Extended Resume interface for UI purposes
interface ExtendedResume extends Resume {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  atsScore?: number;
  isActive?: boolean;
  parsedData?: any;
}

export default function ResumesPage() {
  const { resumes, loading, error, fetchResumes, deleteResume } = useResumesApi();
  const [selectedResume, setSelectedResume] = useState<ExtendedResume | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleDelete = async (resumeId: string) => {
    await deleteResume(resumeId);
    setShowDeleteDialog(null);
  };

  const handleUploadComplete = () => {
    setShowUploadForm(false);
    fetchResumes(); // Refresh the list
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getATSScoreColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getATSScoreText = (score?: number) => {
    if (!score) return 'Not analyzed';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs improvement';
  };

  // Show upload form if requested
  if (showUploadForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
          <Button 
            variant="outline" 
            onClick={() => setShowUploadForm(false)}
          >
            Back to Resumes
          </Button>
        </div>
        <ResumeUpload onComplete={handleUploadComplete} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Resumes</h1>
            <p className="text-gray-600">Manage your resumes and track their performance</p>
          </div>
          <Button 
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Upload Resume
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{(resumes || []).length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(resumes || []).filter(r => (r as ExtendedResume).isActive ?? true).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg ATS Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(resumes || []).length > 0 
                      ? Math.round((resumes || []).reduce((acc, r) => acc + ((r as ExtendedResume).atsScore || 0), 0) / (resumes || []).length)
                      : 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(resumes || []).filter(r => {
                      if (!r.createdAt) return false;
                      const createdAt = new Date(r.createdAt);
                      const now = new Date();
                      return createdAt.getMonth() === now.getMonth() && 
                             createdAt.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumes Grid */}
        {(resumes || []).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume: ExtendedResume) => (
              <Card key={resume.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {resume.fileName || resume.name || 'Untitled Resume'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {resume.fileSize ? formatFileSize(resume.fileSize) : 'Unknown size'}
                        </p>
                      </div>
                    </div>
                    {(resume.isActive ?? true) && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* ATS Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ATS Score</span>
                      <Badge className={getATSScoreColor(resume.atsScore)}>
                        {resume.atsScore ? `${resume.atsScore}%` : 'N/A'} - {getATSScoreText(resume.atsScore)}
                      </Badge>
                    </div>

                    {/* Upload Date */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Uploaded</span>
                      <span className="text-sm text-gray-900">
                        {resume.createdAt ? new Date(resume.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{resume.fileName || resume.name || 'Resume'}</DialogTitle>
                          </DialogHeader>
                          <div className="aspect-[8.5/11] w-full">
                            <iframe
                              src={`/api/resumes/${resume.id}/view`}
                              className="w-full h-full border rounded"
                              title={resume.fileName || resume.name || 'Resume'}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/resumes/${resume.id}/download`} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>

                      <Dialog 
                        open={showDeleteDialog === resume.id} 
                        onOpenChange={(open) => setShowDeleteDialog(open ? String(resume.id) : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Resume</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-gray-600">
                              Are you sure you want to delete "{resume.fileName || resume.name || 'this resume'}"? This action cannot be undone.
                            </p>
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => setShowDeleteDialog(null)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => handleDelete(String(resume.id))}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Additional Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes yet</h3>
              <p className="text-gray-500 mb-6">
                Upload your first resume to get started with your job search
              </p>
              <Button 
                onClick={() => setShowUploadForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resume Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Optimize for ATS</h4>
                <p className="text-sm text-gray-600">
                  Use relevant keywords and standard formatting to improve your ATS score
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Keep it Updated</h4>
                <p className="text-sm text-gray-600">
                  Regularly update your resume with new skills and experiences
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Tailor for Jobs</h4>
                <p className="text-sm text-gray-600">
                  Customize your resume for each job application to increase success
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
    </AuthGuard>
  );
}
