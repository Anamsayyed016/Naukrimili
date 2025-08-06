"use client";
import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import ResumeEditor from "./ResumeEditor";

export interface ResumeUploadFlowProps {
  onUploadComplete?: (data: Record<string, unknown>) => void;
  className?: string}

export default function ResumeUploadFlow({ onUploadComplete, className = "" }: ResumeUploadFlowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { uploadResume, loading, aiData, error: uploadError } = useResumeUpload();
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
        setUploadProgress(0)} else {
        setError("Please upload a PDF file");
        setFile(null)}
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Start progress animation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10})}, 200);

      await uploadResume(file);
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (onUploadComplete && aiData) {
        onUploadComplete(aiData)}

      // Show editor with parsed data
      if (aiData?.parsedResume) {
        setShowEditor(true)}
    } catch (err) {
      setError(uploadError || "Failed to upload resume. Please try again.")}
  };

  const getStatusColor = () => {
    if (error || uploadError) return "text-red-500";
    if (aiData) return "text-green-500";
    return "text-primary"};

  const getStatusIcon = () => {
    if (error || uploadError) return <AlertCircle className="w-8 h-8 text-red-500" />;
    if (aiData) return <CheckCircle className="w-8 h-8 text-green-500" />;
    return <Upload className="w-8 h-8 text-primary" />};

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {!showEditor ? (
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                {getStatusIcon()}
              </div>
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">Upload Your Resume</h3>
            <p className="text-sm text-muted-foreground">
              Upload your resume in PDF format or create one manually
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={loading}
            />

            {file && (
              <>
                <div className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </div>
                
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="h-2" />
                )}

                <Button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Upload Resume</>
                  )}
                </Button>
              </>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowEditor(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Create Resume Manually
            </Button>

            {(error || uploadError) && (
              <div className="p-3 rounded bg-red-50 text-red-600 text-sm">
                {error || uploadError}
              </div>
            )}

            {aiData && (
              <div className="p-3 rounded bg-green-50 text-green-600 text-sm">
                Resume uploaded successfully!
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditor(false)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
          </div>
          <ResumeEditor initialValues={aiData?.parsedResume || {}} />
        </div>
      )}
    </div>)} 