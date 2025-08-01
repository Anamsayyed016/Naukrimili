"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, FileText, CheckCircle, AlertCircle } from "lucide-react";
import ResumeUploadFlow from "@/components/ResumeUploadFlow";
import { useToast } from "@/hooks/use-toast";

export default function ResumeUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadCompleted, setUploadCompleted] = useState(false);

  const handleUploadComplete = (data: any) => {
    setUploadCompleted(true);
    toast({
      title: "Success!",
      description: "Resume uploaded successfully.",
    });
    
    // Redirect to resumes page after a short delay
    setTimeout(() => {
      router.push("/resumes");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Upload Resume</h1>
            <p className="text-gray-600 mt-2">
              Upload your resume to get started with AI-powered job matching
            </p>
          </div>
        </div>

        {/* Upload Flow */}
        <Card className="bg-white/90 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="w-6 h-6 text-purple-500" />
              {uploadCompleted ? "Upload Complete" : "Upload Your Resume"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadCompleted ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Resume Uploaded Successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your resume has been processed and saved. You'll be redirected to your resumes page shortly.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.push("/resumes")}>
                    View All Resumes
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/jobs")}>
                    Browse Jobs
                  </Button>
                </div>
              </div>
            ) : (
              <ResumeUploadFlow onUploadComplete={handleUploadComplete} />
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        {!uploadCompleted && (
          <Card className="mt-8 bg-blue-50/90 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Upload Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Supported formats: PDF, DOC, DOCX (max 5MB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Make sure your resume includes contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>Include relevant skills and work experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>AI will extract and analyze your information automatically</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
