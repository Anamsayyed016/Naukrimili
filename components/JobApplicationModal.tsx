'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export default function JobApplicationModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName
}: JobApplicationModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        resume: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, simulate a successful application
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted successfully. We'll notify you of any updates.",
        variant: "default"
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
        setIsSubmitted(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          coverLetter: '',
          resume: null
        });
      }, 2000);

    } catch (error) {
      toast({
        title: "Application Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Application Submitted!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500">
              We'll review your application and get back to you soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="coverLetter">Cover Letter</Label>
            <Textarea
              id="coverLetter"
              value={formData.coverLetter}
              onChange={(e) => handleInputChange('coverLetter', e.target.value)}
              placeholder="Tell us why you're interested in this position..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="resume">Resume/CV</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX (Max 5MB)
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.fullName || !formData.email}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
