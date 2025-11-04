'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BackButton } from '@/components/ui/back-button';
import { AlertCircle, Download, Eye, Trash2, Upload, FileText, Calendar, TrendingUp, CheckCircle2, X, ExternalLink } from 'lucide-react';
import { useResumesApi, Resume } from '@/hooks/useResumesApi';
import ResumeUpload from '@/components/resume/ResumeUpload';
import AuthGuard from '@/components/auth/AuthGuard';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface ExtendedResume extends Resume {
  id: string;
  filename: string;
  uploadedAt: string;
  size: number;
  atsScore?: number;
  skillsMatch?: string[];
  views?: number;
  downloads?: number;
  lastViewed?: string;
  isActive?: boolean;
  parsedData?: any;
}

export default function ResumesPage() {
  const searchParams = useSearchParams();
  const { resumes, loading, error, fetchResumes, deleteResume } = useResumesApi();
  const [selectedResume, setSelectedResume] = useState<ExtendedResume | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    // Check if redirected from upload page
    const uploaded = searchParams?.get('uploaded');
    if (uploaded === 'true') {
      setShowSuccessBanner(true);
      // Refresh resumes list after upload
      fetchResumes();
      // Auto-hide after 10 seconds
      setTimeout(() => setShowSuccessBanner(false), 10000);
    }
  }, [searchParams, fetchResumes]);

  const handleDelete = async (resumeId: string) => {
    try {
      await deleteResume(resumeId);
      setShowDeleteDialog(null);
      toast({
        title: '✅ Resume Deleted',
        description: 'Your resume has been deleted successfully.',
      });
      fetchResumes(); // Refresh list
    } catch (error) {
      toast({
        title: '❌ Delete Failed',
        description: 'Failed to delete resume. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUploadComplete = () => {
    setShowUploadForm(false);
    fetchResumes(); // Refresh the list
  };

  const handleViewResume = (resume: ExtendedResume) => {
    // Open resume in new tab
    window.open(`/api/resumes/${resume.id}/download`, '_blank');
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

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          {/* Back Button */}
          {!showUploadForm && (
            <div className="mb-4">
              <BackButton fallbackUrl="/dashboard/jobseeker" label="Back to Dashboard" />
            </div>
          )}

          {/* Upload Form State */}
          {showUploadForm && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Upload Resume
                </h1>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploadForm(false)}
                  className="w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Back to Resumes
                </Button>
              </div>
              <ResumeUpload onComplete={handleUploadComplete} />
            </>
          )}

          {/* Loading State */}
          {!showUploadForm && loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          )}

          {/* Error State */}
          {!showUploadForm && !loading && error && (
            <Alert className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          {!showUploadForm && !loading && !error && (
            <>
              {/* Success Banner */}
              {showSuccessBanner && (
                <Alert className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg animate-in slide-in-from-top duration-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 bg-green-100 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <AlertTitle className="text-green-900 font-bold text-lg mb-1">
                          🎉 Resume Uploaded Successfully!
                        </AlertTitle>
                        <AlertDescription className="text-green-700 space-y-2">
                          <p>Your resume has been analyzed with AI and is ready to use.</p>
                          <div className="flex flex-wrap gap-3 mt-3">
                            <Link href="/dashboard/jobseeker/profile">
                              <Button size="sm" variant="outline" className="border-green-300 hover:bg-green-100 text-green-700">
                                <FileText className="w-3 h-3 mr-2" />
                                Complete Profile
                              </Button>
                            </Link>
                            <Link href="/jobs">
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                <TrendingUp className="w-3 h-3 mr-2" />
                                Find Jobs
                              </Button>
                            </Link>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuccessBanner(false)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Alert>
              )}

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Resumes
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base mt-2">
                    Manage your resumes and track their performance
                  </p>
                </div>
                <Button 
                  onClick={() => setShowUploadForm(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </Button>
              </div>

              {/* Resumes Grid - Fully Responsive */}
              {resumes && resumes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {resumes.map((resume) => {
                    const extendedResume: ExtendedResume = {
                      ...resume,
                      id: String(resume.id || ''),
                      filename: resume.fileName || resume.name || 'resume.pdf',
                      uploadedAt: typeof resume.createdAt === 'string' 
                        ? resume.createdAt 
                        : resume.createdAt?.toISOString() || new Date().toISOString(),
                      size: resume.fileSize || 0,
                      views: 0,
                      downloads: 0,
                      isActive: resume.isActive !== undefined ? resume.isActive : true,
                      atsScore: resume.atsScore || undefined,
                      skillsMatch: resume.parsedData?.skills || []
                    };
                    return (
                    <Card key={extendedResume.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white rounded-xl overflow-hidden">
                      <CardHeader className="pb-3 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg truncate text-gray-900">
                                {extendedResume.filename}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(extendedResume.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={extendedResume.isActive ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                            {extendedResume.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {/* File Info */}
                        <div className="text-sm text-gray-600">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Size:</span>
                            <span>{formatFileSize(extendedResume.size)}</span>
                          </div>
                        </div>

                        {/* ATS Score */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">ATS Score</span>
                            <Badge className={getATSScoreColor(extendedResume.atsScore)}>
                              {extendedResume.atsScore || 'N/A'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            {getATSScoreText(extendedResume.atsScore)}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{extendedResume.views || 0} views</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{extendedResume.downloads || 0} downloads</span>
                          </div>
                        </div>

                        {/* Skills Match */}
                        {extendedResume.skillsMatch && extendedResume.skillsMatch.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-gray-700">Skills Match</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {extendedResume.skillsMatch.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {extendedResume.skillsMatch.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{extendedResume.skillsMatch.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions - Responsive */}
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 justify-center hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                            onClick={() => window.open(`/api/resumes/${extendedResume.id}/download`, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-2" />
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-all"
                            onClick={() => handleViewResume(extendedResume)}
                            title="View Resume"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
                            onClick={() => setShowDeleteDialog(extendedResume.id as string)}
                            title="Delete Resume"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    );
                  })}
                </div>
              ) : (
                /* Empty State - Responsive */
                <div className="text-center py-12 sm:py-16 lg:py-20">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">No resumes yet</h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base max-w-md mx-auto px-4">
                    Upload your first resume to get AI-powered analysis and job matches
                  </p>
                  <Button 
                    onClick={() => setShowUploadForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog - Dynamic */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Delete Resume</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete this resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(null)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
