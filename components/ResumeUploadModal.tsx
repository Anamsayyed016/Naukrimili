"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Brain,
  Star,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProfileCompletionForm from "@/components/ProfileCompletionForm";

interface ResumeData {
  id: string;
  filename: string;
  size: string;
  atsScore: number;
  skills: string[];
  experience: string[];
  education: string[];
  recommendations: string[];
  uploadedAt: string;
  status: string;
}

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (resumeData: any) => void;
}

export default function ResumeUploadModal({ isOpen, onClose, onUploadComplete }: ResumeUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [rawResumeData, setRawResumeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a PDF or Word document");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    setFile(selectedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setResumeData(null);
    setUploaded(false);
    
    try {
      const formData = new FormData();
      formData.append("resume", file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 10;
        });
      }, 200);

      // Make real API call
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Expected JSON, got:", text);
        throw new Error("Expected JSON, got: " + text);
      }
      console.log("API Response:", data);

      if (data.success && data.resume) {
        // Store the raw resume data for the profile form
        setRawResumeData(data.resume);
        
        // Process the real AI data for display
        const r = data.resume;
        const processedResumeData = {
          id: r.id,
          filename: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          atsScore: r.atsScore?.overall ?? 85,
          skills: r.aiData?.skills || [],
          experience: r.aiData?.experience?.map((exp: any) => exp.header || exp.description || exp) || [],
          education: r.aiData?.education?.map((edu: any) => edu.degree || edu) || [],
          recommendations: r.aiData?.recommendations || [],
          uploadedAt: r.createdAt,
          status: r.processing?.status || "completed",
        };
        
        setResumeData(processedResumeData);
        setUploaded(true);
        setUploading(false);
        
        if (onUploadComplete) {
          onUploadComplete(r);
        }
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Upload failed");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetModal = () => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploaded(false);
    setResumeData(null);
    setRawResumeData(null);
    setError(null);
    setDragActive(false);
    setFetching(false);
    setShowProfileForm(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upload Resume</h2>
                  <p className="text-sm text-gray-500">AI-powered resume analysis</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Content */}
            <div className="p-6">
              {showProfileForm ? (
            <ProfileCompletionForm resumeData={rawResumeData} />
              ) : !uploaded ? (
                <div className="space-y-6">
                  {/* Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {!file ? (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Drop your resume here
                          </h3>
                          <p className="text-gray-500 mb-4">
                            or click to browse files
                          </p>
                          <Button
                            onClick={() => document.getElementById('file-input')?.click()}
                            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                          >
                            Choose File
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Supports PDF, DOC, DOCX (Max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {file.name}
                          </h3>
                          <p className="text-gray-500 mb-4">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            onClick={() => setFile(null)}
                            variant="outline"
                            className="mr-2"
                          >
                            Change File
                          </Button>
                          <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                          >
                            {uploading ? 'Uploading...' : 'Upload & Analyze'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Upload Progress */}
                  {uploading && (
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Processing Resume...</span>
                            <span className="text-sm text-gray-500">{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Brain className="w-4 h-4" />
                            <span>AI is analyzing your skills and experience</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {/* Error Message */}
                  {error && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span>{error}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              ) : fetching ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                  <div className="text-lg text-gray-700">Analyzing your resume...</div>
                </div>
              ) : resumeData ? (
                <div className="space-y-6">
                  {/* Success Header */}
                  <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Resume Analysis Complete!</h3>
                    <p className="text-gray-500">Your resume has been successfully analyzed</p>
                  </div>
                  {/* File Info */}
                  <Card className="resume-card resume-file-info">
                    <CardContent className="flex flex-col md:flex-row gap-4 items-center justify-between p-6">
                      <div className="flex items-center gap-3">
                        <div className="resume-file-icon">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="resume-file-name">{resumeData.filename}</span>
                          <span className="resume-file-size block">{resumeData.size}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="resume-status-badge">{resumeData.status}</Badge>
                        <span className="text-resume-text-muted text-xs">{new Date(resumeData.uploadedAt).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
{/* ATS Score */}
                  <Card className="resume-card ats-score-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="ats-score-title">ATS Compatibility Score</h4>
                          <p className="ats-score-description">How well your resume passes through Applicant Tracking Systems</p>
                        </div>
                        <div className="text-center">
                          <div className="ats-score-value">{resumeData.atsScore}%</div>
                          <div className="flex items-center gap-1 ats-score-rating">
                            <Star className="w-4 h-4" />
                            <span>{resumeData.atsScore >= 80 ? "Excellent" : resumeData.atsScore >= 60 ? "Good" : "Needs Improvement"}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {/* Skills */}
                  <Card className="resume-card">
                    <CardHeader>
                      <CardTitle className="resume-section-header">
                        <Brain className="w-5 h-5" />
                        Skills Extracted
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {resumeData.skills.length === 0 ? <span className="text-resume-text-muted">No skills found.</span> : resumeData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="resume-skill-tag"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Experience */}
                  <Card className="resume-card">
                    <CardHeader>
                      <CardTitle className="resume-section-header">
                        <Brain className="w-5 h-5" />
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resumeData.experience.length === 0 ? <span className="text-resume-text-muted">No experience found.</span> : resumeData.experience.map((exp, index) => (
                          <div key={index} className="resume-experience-item">
                            <span className="resume-experience-description">{exp}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Education */}
                  <Card className="resume-card">
                    <CardHeader>
                      <CardTitle className="resume-section-header">
                        <Brain className="w-5 h-5" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resumeData.education.length === 0 ? <span className="text-resume-text-muted">No education found.</span> : resumeData.education.map((edu, index) => (
                          <div key={index} className="resume-education-item">
                            <span className="resume-education-description">{edu}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Recommendations */}
                  <Card className="resume-card">
                    <CardHeader>
                      <CardTitle className="resume-section-header">
                        <Brain className="w-5 h-5" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {resumeData.recommendations.length === 0 ? <span className="text-resume-text-muted">No recommendations found.</span> : resumeData.recommendations.map((rec, index) => (
                          <div key={index} className="resume-recommendation-item">
                            <span className="resume-recommendation-description">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700" onClick={resetModal}>
                      Upload Another
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700" 
                      onClick={() => setShowProfileForm(true)}
                    >
                      Continue to Profile Setup
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 