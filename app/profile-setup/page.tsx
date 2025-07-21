"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, User, FileText } from "lucide-react";
import ProfileStepper from "@/components/ProfileStepper";
import ResumeUploadFlow from "@/components/ResumeUploadFlow";

export default function ProfileSetupPage() {
  const [showResumeUpload, setShowResumeUpload] = useState(false);
  const [showProfileStepper, setShowProfileStepper] = useState(false);

  const handleResumeUploadComplete = () => {
    setShowResumeUpload(false);
    // Redirect to dashboard or show success message
    window.location.href = '/dashboard';
  };

  const handleProfileStepperComplete = () => {
    setShowProfileStepper(false);
    // Redirect to dashboard or show success message  
    window.location.href = '/dashboard';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
      {!showProfileStepper ? (
        <Card className="max-w-2xl w-full mx-4 bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Profile
            </CardTitle>
            <p className="text-gray-600">
              Choose how you'd like to set up your profile
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Resume Option */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-400">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Upload Resume
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Let AI extract information from your resume and automatically fill your profile
                  </p>
                  <Button 
                    onClick={() => setShowResumeUpload(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Upload Resume
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Form Option */}
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-400">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Manual Entry
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Fill out your profile information manually step by step
                  </p>
                  <Button 
                    onClick={() => setShowProfileStepper(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Fill Manually
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProfileStepper onComplete={handleProfileStepperComplete} />
      )}

      {/* Resume Upload Flow */}
      <ResumeUploadFlow
        isOpen={showResumeUpload}
        onClose={() => setShowResumeUpload(false)}
        onComplete={handleResumeUploadComplete}
      />
    </main>
  );
}
