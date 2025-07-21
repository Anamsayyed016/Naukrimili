"use client";

import React, { useState } from "react";
import ResumeUploadModal from "./ResumeUploadModal";
import ProfileCompletionForm from "./ProfileCompletionForm";

interface ResumeUploadFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function ResumeUploadFlow({ isOpen, onClose, onComplete }: ResumeUploadFlowProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'form'>('upload');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);

  const handleUploadComplete = (resumeData: any) => {
    // Store the resume data and ID for the profile completion form
    setResumeData(resumeData);
    setResumeId(resumeData.id);
    setCurrentStep('form');
  };

  const handleFormComplete = () => {
    // Reset the flow
    setCurrentStep('upload');
    setResumeId(null);
    setResumeData(null);
    
    // Call the completion handler
    if (onComplete) {
      onComplete();
    } else {
      // Default behavior: redirect to dashboard
      window.location.href = '/dashboard';
    }
  };

  const handleClose = () => {
    // Reset the flow
    setCurrentStep('upload');
    setResumeId(null);
    setResumeData(null);
    onClose();
  };

  return (
    <>
      {currentStep === 'upload' && (
        <ResumeUploadModal
          isOpen={isOpen}
          onClose={handleClose}
          onUploadComplete={handleUploadComplete}
        />
      )}
      
      {currentStep === 'form' && resumeId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ProfileCompletionForm
                resumeData={resumeData}
                onComplete={handleFormComplete}
                onClose={handleClose}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
