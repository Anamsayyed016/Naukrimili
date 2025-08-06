'use client';
"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Trash2, FileText, Loader2, Upload, User, CheckCircle } from "lucide-react";
import ProfileCompletionForm from "@/components/ProfileCompletionForm";
import ResumeUploadFlow from "@/components/ResumeUploadFlow";
import { useRouter } from "next/navigation";

interface Resume {
  id: string;
  filename: string;
  status: string;
  atsScore: number;
  tags: string[];
  visibility: string;
  uploadedAt: string;
}

export default function ResumeDashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [uploadedResumeData, setUploadedResumeData] = useState<any>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchResumes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/resumes");
        const data = await res.json();
        if (data.success) {
          setResumes(data.resumes);
        } else {
          setError("Failed to fetch resumes.");
        }
      } catch (err) {
        setError("Failed to fetch resumes.");
      } finally {
        setLoading(false);
      }
    }
    fetchResumes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setResumes((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("Failed to delete resume.");
      }
    } catch {
      alert("Failed to delete resume.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setUploadSuccess(false);
    setUploading(true);

    if (!file) {
      alert('Please select a file to upload.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadSuccess(true);
        setShowForm(true);
        setUploadedResumeId(data.resume.id);if (data.resume.aiData) {}
        setUploadedResumeData(data.resume); // Store full resume data with AI info
        setShowProfileForm(true); // Auto-show profile form
        setFile(null);
        // Refresh the resumes list
        const refreshRes = await fetch("/api/resumes");
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setResumes(refreshData.resumes);
        }
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (err) {
      alert('Error uploading resume.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setUploadSuccess(false);
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
          <Button
            onClick={() => router.push('/resumes/upload')}
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Resume
          </Button>
        </div>
        
        {/* Upload Form */}
        <Card className="mb-8 bg-white/90 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-purple-500" />
              Upload New Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResumeUploadFlow 
              onUploadComplete={(data) => {
                // Refresh the resumes list or handle the upload completion
                router.refresh();
              }}
            />
          </CardContent>
        </Card>
        
        {/* Success Message and Profile Completion Form */}
        {uploadSuccess && showForm && (
          <div className="mb-8 space-y-6">
            {/* Success Message */}
            <Card className="bg-green-50/90 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Resume Uploaded Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">
                  Your resume has been uploaded and is being processed. Now let's complete your profile with the extracted information:
                </p>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  onClick={() => setShowProfileForm(true)}
                >
                  <User className="w-4 h-4 mr-2" /> Complete Profile
                </Button>
              </CardContent>
            </Card>

            {/* Profile Completion Form */}
            {showProfileForm && (() => {return uploadedResumeData && uploadedResumeData.aiData;
            })() && (
              <ProfileCompletionForm resumeData={uploadedResumeData} />
            )}
            
            {/* Debug info when form is not showing */}
            {showProfileForm && (!uploadedResumeData || !uploadedResumeData.aiData) && (
              <Card className="bg-yellow-50/90 border-yellow-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-yellow-800">Debug Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-700">Profile form not showing because:</p>
                  <ul className="list-disc ml-4 text-yellow-700">
                    <li>uploadedResumeData exists: {!!uploadedResumeData ? 'Yes' : 'No'}</li>
                    <li>aiData exists: {!!uploadedResumeData?.aiData ? 'Yes' : 'No'}</li>
                    {uploadedResumeData?.aiData && (
                      <li>aiData keys: {Object.keys(uploadedResumeData.aiData).join(', ')}</li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Alternative Actions */}
            <Card className="bg-blue-50/90 border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-blue-800">Or choose another action:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => window.location.href = '/jobs'}
                  >
                    Browse Jobs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={resetForm}
                  >
                    Upload Another Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin w-8 h-8 text-purple-500" />
          </div>
        ) : error ? (
          <div className="text-center text-red-600 font-semibold">{error}</div>
        ) : resumes.length === 0 ? (
          <div className="text-center text-gray-500">No resumes uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {resumes.map((resume) => (
              <Card key={resume.id} className="bg-white/90 border-0 shadow-lg">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <FileText className="w-8 h-8 text-purple-500" />
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">{resume.filename}</CardTitle>
                    <div className="flex gap-2 items-center text-xs text-gray-500">
                      <span>{new Date(resume.uploadedAt).toLocaleDateString()}</span>
                      <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 px-2 py-0.5">{resume.status}</Badge>
                      <Badge className="bg-gradient-to-r from-green-400 to-blue-400 text-white border-0 px-2 py-0.5">ATS: {resume.atsScore ?? "-"}%</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pt-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {resume.tags?.map((tag) => (
                      <Badge key={tag} className="bg-gray-100 text-gray-700 border-0 px-2 py-0.5">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/resumes/${resume.id}`}><Eye className="w-4 h-4 mr-1" /> View</a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/resumes/${resume.id}/download`} target="_blank" rel="noopener noreferrer"><Download className="w-4 h-4 mr-1" /> Download</a>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(resume.id)}
                      disabled={deletingId === resume.id}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deletingId === resume.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
