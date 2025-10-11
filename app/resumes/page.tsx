'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Download, Eye, Trash2, Upload, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useResumesApi, Resume } from '@/hooks/useResumesApi';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

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
  const { resumes, loading, error, fetchResumes, deleteResume } = useResumesApi();
  const [selectedResume, setSelectedResume] = useState<ExtendedResume | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []); // Removed fetchResumes to prevent infinite loop

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

  // Single return statement with conditional rendering to avoid hooks rule violation
  return (
    <AuthGuard>
      <div className="container mx-auto p-6">
        {/* Upload Form State */}
        {showUploadForm && (
          <>
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
          </>
        )}

        {/* Loading State */}
        {!showUploadForm && loading && (
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
                <Upload className="w-4 h-4" />
                Upload Resume
              </Button>
            </div>

            {/* Resumes Grid */}
            {resumes && resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resumes.map((resume) => {
                  const extendedResume: ExtendedResume = {
                    ...resume,
                    filename: resume.name || 'Unknown',
                    uploadedAt: resume.createdAt || new Date().toISOString(),
                    size: 0, // Default size
                    views: 0,
                    downloads: 0,
                    isActive: true
                  };
                  return (
                  <Card key={extendedResume.id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{extendedResume.filename}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(extendedResume.uploadedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant={extendedResume.isActive ? "default" : "secondary"}>
                          {extendedResume.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* File Info */}
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{formatFileSize(extendedResume.size)}</span>
                        </div>
                      </div>

                      {/* ATS Score */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">ATS Score</span>
                          <Badge className={getATSScoreColor(extendedResume.atsScore)}>
                            {extendedResume.atsScore || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {getATSScoreText(extendedResume.atsScore)}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-400" />
                          <span>{extendedResume.views || 0} views</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-gray-400" />
                          <span>{extendedResume.downloads || 0} downloads</span>
                        </div>
                      </div>

                      {/* Skills Match */}
                      {extendedResume.skillsMatch && extendedResume.skillsMatch.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium">Skills Match</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open(`/api/resumes/${extendedResume.id}/download`, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedResume(extendedResume)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setShowDeleteDialog(extendedResume.id as string)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No resumes yet</h3>
                <p className="text-gray-600 mb-6">Upload your first resume to get started</p>
                <Button onClick={() => setShowUploadForm(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => showDeleteDialog && handleDelete(showDeleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}