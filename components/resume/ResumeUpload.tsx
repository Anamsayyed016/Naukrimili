"use client";

import React, { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCompletionForm from "@/components/ProfileCompletionForm";

interface ResumeUploadProps {
  isOpen?: boolean;
  onClose?: () => void;
  onUploadComplete?: (data: any) => void;
  showProfileForm?: boolean;
  standalone?: boolean;
}

interface ResumeData {
  id: string;
  filename: string;
  url: string;
  parsed_data?: any;
}

export default function ResumeUpload({ 
  isOpen = false, 
  onClose, 
  onUploadComplete,
  showProfileForm = false,
  standalone = false
}: ResumeUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setDragActive(false);
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploaded(false);
    setResumeData(null);
    setError(null);
    setShowForm(false);
  };

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
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
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

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
        credentials: 'include',
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
        throw new Error("Invalid server response");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setResumeData(data.data);
      setUploaded(true);
      
      toast({
        title: "Success",
        description: "Resume uploaded successfully!",
      });

      if (showProfileForm) {
        setShowForm(true);
      } else if (onUploadComplete) {
        onUploadComplete(data.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
      toast({
        title: "Error",
        description: err.message || "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    resetState();
    if (onClose) onClose();
  };

  const handleFormComplete = (formData: any) => {
    if (onUploadComplete) {
      onUploadComplete({ ...resumeData, profile: formData });
    }
    handleClose();
  };

  const UploadContent = () => (
    <div 
      className={`relative p-8 rounded-lg border-2 border-dashed transition-colors ${
        dragActive 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-300 hover:border-gray-400"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        onChange={handleFileInput}
        accept=".pdf,.doc,.docx"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="text-center">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">
          {file ? file.name : "Upload your resume"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop your resume here or click to browse
        </p>
        <p className="text-xs text-gray-400">
          Supported formats: PDF, DOC, DOCX (max 5MB)
        </p>
      </div>

      {file && !uploading && !uploaded && (
        <div className="mt-6 flex justify-center">
          <Button
            onClick={handleUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Upload Resume
          </Button>
        </div>
      )}

      {uploading && (
        <div className="mt-6 space-y-4">
          <Progress value={uploadProgress} />
          <p className="text-sm text-center text-gray-600">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {uploaded && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg flex items-center text-green-700">
          <CheckCircle className="w-5 h-5 mr-2" />
          <p className="text-sm">Resume uploaded successfully!</p>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="space-y-6">
      {showForm && resumeData ? (
        <ProfileCompletionForm
          resumeData={resumeData}
          onComplete={handleFormComplete}
          onClose={handleClose}
        />
      ) : (
        <UploadContent />
      )}
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Upload Resume</h2>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {content}
      </DialogContent>
    </Dialog>
  );
} 