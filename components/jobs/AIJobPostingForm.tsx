'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, ArrowRight, CheckCircle, Sparkles, ArrowLeft, X, Users, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  openings: string;
}

const steps = [
  { id: 1, title: 'Details', description: 'Job information' },
  { id: 2, title: 'Requirements', description: 'Skills & experience' },
  { id: 3, title: 'Location', description: 'Job location' },
  { id: 4, title: 'Review', description: 'Review & publish' }
];

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];
const experienceLevels = ['Entry Level (0-2 years)', 'Mid Level (3-5 years)', 'Senior Level (6-10 years)', 'Lead (11-15 years)', 'Executive (15+ years)'];
const popularSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL', 'MongoDB'];
const locations = ['Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR', 'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'];

export default function AIJobPostingForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    country: 'India',
    jobType: 'Full-time',
    experienceLevel: 'Mid Level (3-5 years)',
    salary: '',
    skills: [],
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    openings: '1'
  });

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.trim() !== '' && formData.description.trim() !== '';
      case 2:
        return formData.requirements.trim() !== '' && formData.skills.length > 0;
      case 3:
        return formData.location.trim() !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    } else {
      toast.error('Please fill all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const clearFormData = () => {
    if (confirm('Are you sure you want to clear all form data?')) {
      setFormData({
        title: '',
        description: '',
        requirements: '',
        location: '',
        country: 'India',
        jobType: 'Full-time',
        experienceLevel: 'Mid Level (3-5 years)',
        salary: '',
        skills: [],
        benefits: '',
        isRemote: false,
        isHybrid: false,
        isUrgent: false,
        isFeatured: false,
        openings: '1'
      });
      setCurrentStep(1);
      toast.success('Form cleared');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        country: 'IN',
        jobType: formData.jobType.toLowerCase().replace('-', '_'),
        experienceLevel: formData.experienceLevel.toLowerCase().split(' ')[0],
        salary: formData.salary,
        skills: formData.skills,
        benefits: formData.benefits,
        isRemote: formData.isRemote,
        isHybrid: formData.isHybrid,
        isUrgent: formData.isUrgent,
        isFeatured: formData.isFeatured,
        openings: parseInt(formData.openings),
        currencyCode: 'INR',
        currencySymbol: '₹'
      };

      const response = await fetch('/api/employer/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🎉 Job posted successfully!');
        router.push('/employer/dashboard');
      } else {
        toast.error(data.error || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Post a Job</h1>
          </div>
          <p className="text-slate-600 text-sm sm:text-base">
            Create a job posting to find the perfect candidates
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-slate-300 text-slate-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-2 font-medium ${currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block h-0.5 flex-1 mx-2 ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <Card className="shadow-xl bg-white rounded-2xl border border-slate-200">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Job Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Job Title *
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Job Description *
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Job Type
                    </Label>
                    <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Number of Openings
                    </Label>
                    <Input
                      type="number"
                      value={formData.openings}
                      onChange={(e) => handleInputChange('openings', e.target.value)}
                      min="1"
                      className="h-12"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 2: Requirements */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Requirements *
                    </Label>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List the key requirements and qualifications..."
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-3 block">
                      Required Skills *
                    </Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="px-3 py-1">
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSkills.filter(skill => !formData.skills.includes(skill)).map((skill) => (
                        <Button
                          key={skill}
                          variant="outline"
                          size="sm"
                          onClick={() => addSkill(skill)}
                          className="h-8"
                        >
                          + {skill}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Experience Level
                    </Label>
                    <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Salary (Optional)
                    </Label>
                    <Input
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder="e.g., ₹50,000 - ₹70,000"
                      className="h-12"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Location */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Location *
                    </Label>
                    <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote"
                        checked={formData.isRemote}
                        onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                      />
                      <Label htmlFor="remote" className="font-normal cursor-pointer">
                        Remote Work
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hybrid"
                        checked={formData.isHybrid}
                        onCheckedChange={(checked) => handleInputChange('isHybrid', checked)}
                      />
                      <Label htmlFor="hybrid" className="font-normal cursor-pointer">
                        Hybrid Work
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold text-slate-900 mb-2 block">
                      Benefits (Optional)
                    </Label>
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="List the benefits you offer..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="urgent"
                        checked={formData.isUrgent}
                        onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
                      />
                      <Label htmlFor="urgent" className="font-normal cursor-pointer">
                        Urgent Hiring
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                      />
                      <Label htmlFor="featured" className="font-normal cursor-pointer">
                        Feature this job posting (increases visibility)
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        {formData.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                        <p className="text-slate-600 text-sm">{formData.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-2">Requirements</h4>
                        <p className="text-slate-600 text-sm">{formData.requirements}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-600">Location:</span>
                          <p className="text-slate-800">{formData.location}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Type:</span>
                          <p className="text-slate-800">{formData.jobType}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Experience:</span>
                          <p className="text-slate-800">{formData.experienceLevel}</p>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Openings:</span>
                          <p className="text-slate-800">{formData.openings}</p>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-slate-600">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {formData.skills.map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={clearFormData}
                  className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="w-full sm:w-auto"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Publish Job
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
