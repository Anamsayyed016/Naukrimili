"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  Save,
  ArrowLeft,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface JobFormData {
  title: string;
  location: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  description: string;
  requirements: string;
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  sector: string;
  skills: string[];
  applicationDeadline: string;
}

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    location: '',
    country: 'IN',
    jobType: '',
    experienceLevel: '',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: '',
    skills: [],
    applicationDeadline: ''
  });

  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    fetchJob();
  }, [params.id]);

  const fetchJob = async () => {
    try {
      setFetching(true);
      const response = await fetch(`/api/employer/jobs/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }

      const data = await response.json();
      if (data.success) {
        const job = data.data;
        setFormData({
          title: job.title || '',
          location: job.location || '',
          country: job.country || 'IN',
          jobType: job.jobType || '',
          experienceLevel: job.experienceLevel || '',
          salary: job.salary || '',
          description: job.description || '',
          requirements: job.requirements?.[0] || '',
          benefits: job.benefits?.[0] || '',
          isRemote: job.isRemote || false,
          isHybrid: job.isHybrid || false,
          isUrgent: job.isUrgent || false,
          isFeatured: job.isFeatured || false,
          sector: job.sector || '',
          skills: Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()).filter(s => s) : []),
          applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
        });
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to fetch job details', {
        description: 'Please try refreshing the page or contact support if the issue persists.',
        duration: 5000,
      });
    } finally {
      setFetching(false);
    }
  };

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

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.title.trim()) {
      toast.error('Job title is required', {
        description: 'Please enter a job title to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Job description is required', {
        description: 'Please enter a job description to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Job location is required', {
        description: 'Please enter a job location to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.jobType) {
      toast.error('Please select a job type', {
        description: 'Job type is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.experienceLevel) {
      toast.error('Please select experience level', {
        description: 'Experience level is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (!formData.sector) {
      toast.error('Please select a sector', {
        description: 'Sector is required to continue.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    if (formData.skills.length === 0) {
      toast.error('Please add at least one required skill', {
        description: 'Skills are required to help candidates understand the job requirements.',
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/employer/jobs/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Job updated successfully!', {
          description: 'Your job posting has been updated and is now live.',
          duration: 5000,
        });
        router.push('/employer/jobs');
      } else {
        throw new Error(result.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const jobTypeOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Remote',
    'Hybrid',
    'Freelance'
  ];

  const experienceLevelOptions = [
    'Entry Level (0-2 years)',
    'Mid Level (3-5 years)',
    'Senior Level (6-10 years)',
    'Lead (11-15 years)',
    'Executive (15+ years)'
  ];

  const sectorOptions = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Marketing & Advertising',
    'Media & Entertainment',
    'Real Estate',
    'Consulting',
    'Transportation & Logistics',
    'Energy & Utilities',
    'Government & Public Sector',
    'Non-profit & NGO',
    'Food & Beverage',
    'Fashion & Apparel',
    'Automotive',
    'Construction & Engineering',
    'Legal Services',
    'Travel & Tourism',
    'Agriculture',
    'Telecommunications',
    'Other'
  ];

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/employer/jobs" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job</h1>
          <p className="text-gray-600">Update your job posting details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Senior React Developer"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">India</SelectItem>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="jobType">Job Type *</Label>
                      <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobTypeOptions.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase()}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experienceLevel">Experience Level *</Label>
                      <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevelOptions.map((level) => (
                            <SelectItem key={level} value={level.split(' ')[0].toLowerCase()}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="sector">Sector *</Label>
                      <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sector" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectorOptions.map((sector) => (
                            <SelectItem key={sector} value={sector.toLowerCase().replace(/\s+/g, '-')}>
                              {sector}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input
                      id="salary"
                      value={formData.salary}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      placeholder="e.g., 50000-80000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List the key requirements and qualifications..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="benefits">Benefits & Perks</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="List the benefits, perks, and what you offer..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="skills">Add Skills</Label>
                    <Input
                      id="skills"
                      value={skillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      placeholder="Type skills and press comma to add (e.g., React, Node.js,)"
                    />
                  </div>

                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Job Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRemote"
                      checked={formData.isRemote}
                      onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                    />
                    <Label htmlFor="isRemote">Remote Work</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isHybrid"
                      checked={formData.isHybrid}
                      onCheckedChange={(checked) => handleInputChange('isHybrid', checked)}
                    />
                    <Label htmlFor="isHybrid">Hybrid Work</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isUrgent"
                      checked={formData.isUrgent}
                      onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
                    />
                    <Label htmlFor="isUrgent">Urgent Hiring</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                    />
                    <Label htmlFor="isFeatured">Featured Job</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Application Deadline */}
              <Card>
                <CardHeader>
                  <CardTitle>Application Deadline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="applicationDeadline">Deadline</Label>
                    <Input
                      id="applicationDeadline"
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Updating...' : 'Update Job'}
                    </Button>
                    <Link href="/employer/jobs">
                      <Button variant="outline" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}