"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Plus,
  X,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  applicationDeadline: string;
  openings: string;
}

const steps = [
  { id: 1, title: 'Job Details', description: 'Title and description' },
  { id: 2, title: 'Requirements', description: 'Skills and experience' },
  { id: 3, title: 'Settings', description: 'Location and preferences' },
  { id: 4, title: 'Review', description: 'Review and publish' }
];

const jobTypes = [
  'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
];

const experienceLevels = [
  'Entry Level (0-2 years)',
  'Mid Level (3-5 years)', 
  'Senior Level (6-10 years)',
  'Lead (11-15 years)',
  'Executive (15+ years)'
];

const popularSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS',
  'Docker', 'Git', 'SQL', 'MongoDB', 'Express.js', 'Next.js',
  'Vue.js', 'Angular', 'Java', 'C++', 'PHP', 'Laravel'
];

export default function CreateJobPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: '',
    location: '',
    jobType: 'Full-time',
    experienceLevel: 'Entry Level (0-2 years)',
    salary: '',
    skills: [],
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    applicationDeadline: '',
    openings: '1'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/employer/jobs/create');
    }
  }, [status, router]);

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    if (value.endsWith(',')) {
      const skill = value.slice(0, -1).trim();
      if (skill && !formData.skills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        setSkillsInput('');
      }
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/employer/post-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          location: formData.location,
          jobType: formData.jobType.toLowerCase().replace('-', '_'),
          experienceLevel: formData.experienceLevel.toLowerCase().split(' ')[0],
          salary: formData.salary,
          skills: formData.skills,
          benefits: formData.benefits,
          isRemote: formData.isRemote,
          isHybrid: formData.isHybrid,
          isUrgent: formData.isUrgent,
          isFeatured: formData.isFeatured,
          applicationDeadline: formData.applicationDeadline,
          openings: parseInt(formData.openings)
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🚀 Job posted successfully! Your listing is now live and attracting candidates.', {
          description: 'Job seekers can now find and apply to your position.',
          duration: 5000,
        });
        
        // Redirect to jobs management
        setTimeout(() => {
          router.push('/employer/jobs');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to post job');
      }
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/employer/jobs" 
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Post a New Job</h1>
          <p className="text-gray-600 text-lg">Create an attractive job posting to find the perfect candidate</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${currentStep >= step.id 
                      ? 'bg-emerald-600 text-white shadow-lg' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {currentStep > step.id ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : step.id}
                  </div>
                  <div className="ml-2 sm:ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 ${currentStep > step.id ? 'bg-emerald-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <Briefcase className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                    <p className="text-gray-600">Tell us about the position</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                        Job Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Senior React Developer"
                        className="mt-1 h-12 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                        Job Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                        rows={6}
                        className="mt-1 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="benefits" className="text-sm font-semibold text-gray-700">
                        Benefits & Perks
                      </Label>
                      <Textarea
                        id="benefits"
                        value={formData.benefits}
                        onChange={(e) => handleInputChange('benefits', e.target.value)}
                        placeholder="List the benefits, perks, and what makes your company great to work for..."
                        rows={3}
                        className="mt-1 text-lg"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <Lightbulb className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Requirements & Skills</h2>
                    <p className="text-gray-600">What skills and experience are needed?</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="requirements" className="text-sm font-semibold text-gray-700">
                        Requirements *
                      </Label>
                      <Textarea
                        id="requirements"
                        value={formData.requirements}
                        onChange={(e) => handleInputChange('requirements', e.target.value)}
                        placeholder="List the key requirements, qualifications, and experience needed..."
                        rows={4}
                        className="mt-1 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="skills" className="text-sm font-semibold text-gray-700">
                        Required Skills *
                      </Label>
                      <Input
                        id="skills"
                        value={skillsInput}
                        onChange={(e) => handleSkillsChange(e.target.value)}
                        placeholder="Enter skills separated by commas (e.g., React, Node.js, AWS)"
                        className="mt-1 h-12 text-lg"
                      />
                      
                      {/* Popular Skills */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Popular skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {popularSkills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => addSkill(skill)}
                              className="px-3 py-1 text-xs bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-700 rounded-full transition-colors"
                            >
                              + {skill}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Selected Skills */}
                      {formData.skills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Selected skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              >
                                {skill}
                                <button
                                  type="button"
                                  onClick={() => removeSkill(skill)}
                                  className="ml-2 text-emerald-600 hover:text-emerald-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <MapPin className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Job Settings</h2>
                    <p className="text-gray-600">Location, type, and preferences</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="location" className="text-sm font-semibold text-gray-700">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                        className="mt-1 h-12 text-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="jobType" className="text-sm font-semibold text-gray-700">
                        Job Type
                      </Label>
                      <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experienceLevel" className="text-sm font-semibold text-gray-700">
                        Experience Level
                      </Label>
                      <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                        <SelectTrigger className="mt-1 h-12 text-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="salary" className="text-sm font-semibold text-gray-700">
                        Salary Range
                      </Label>
                      <Input
                        id="salary"
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="e.g., ₹8-15 LPA"
                        className="mt-1 h-12 text-lg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="openings" className="text-sm font-semibold text-gray-700">
                        Number of Openings
                      </Label>
                      <Input
                        id="openings"
                        type="number"
                        value={formData.openings}
                        onChange={(e) => handleInputChange('openings', e.target.value)}
                        placeholder="1"
                        min="1"
                        className="mt-1 h-12 text-lg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="deadline" className="text-sm font-semibold text-gray-700">
                        Application Deadline
                      </Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 h-12 text-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isRemote"
                        checked={formData.isRemote}
                        onCheckedChange={(checked) => handleInputChange('isRemote', !!checked)}
                      />
                      <Label htmlFor="isRemote" className="text-sm font-medium">
                        Remote work available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isHybrid"
                        checked={formData.isHybrid}
                        onCheckedChange={(checked) => handleInputChange('isHybrid', !!checked)}
                      />
                      <Label htmlFor="isHybrid" className="text-sm font-medium">
                        Hybrid work available
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isUrgent"
                        checked={formData.isUrgent}
                        onCheckedChange={(checked) => handleInputChange('isUrgent', !!checked)}
                      />
                      <Label htmlFor="isUrgent" className="text-sm font-medium">
                        Mark as urgent
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', !!checked)}
                      />
                      <Label htmlFor="isFeatured" className="text-sm font-medium">
                        Feature this job
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Review Your Job Posting</h2>
                    <p className="text-gray-600">Everything looks good? Let's publish your job!</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <Briefcase className="h-6 w-6 text-emerald-600 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl">{formData.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">{formData.jobType}</Badge>
                          <Badge variant="secondary">{formData.experienceLevel}</Badge>
                          {formData.isRemote && <Badge variant="secondary">Remote</Badge>}
                          {formData.isHybrid && <Badge variant="secondary">Hybrid</Badge>}
                          {formData.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                          {formData.isFeatured && <Badge className="bg-purple-100 text-purple-800">Featured</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{formData.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span>{formData.salary || 'Salary not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formData.openings} opening{formData.openings !== '1' ? 's' : ''}</span>
                      </div>
                      {formData.applicationDeadline && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Deadline: {new Date(formData.applicationDeadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                      <p className="text-gray-700 text-sm line-clamp-3">{formData.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Required Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-emerald-600 border-emerald-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-3"
              >
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Publish Job
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}