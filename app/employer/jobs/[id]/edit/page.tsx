"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Briefcase, 
  MapPin, 
  Save,
  ArrowLeft,
  Trash2,
  Eye
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface JobFormData {
  id: number;
  title: string;
  company: string;
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
  status: 'active' | 'inactive' | 'draft' | 'expired';
}

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    id: 0,
    title: '',
    company: '',
    location: '',
    country: 'IN',
    jobType: 'full-time',
    experienceLevel: 'entry',
    salary: '',
    description: '',
    requirements: '',
    benefits: '',
    isRemote: false,
    isHybrid: false,
    isUrgent: false,
    isFeatured: false,
    sector: 'technology',
    skills: [],
    applicationDeadline: '',
    status: 'draft'
  });

  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data - implement API call later
      const mockJob: JobFormData = {
        id: parseInt(jobId as string),
        title: 'Senior React Developer',
        company: 'TechCorp India',
        location: 'Bangalore, India',
        country: 'IN',
        jobType: 'full-time',
        experienceLevel: 'senior',
        salary: '₹12L - ₹25L PA',
        description: 'We are looking for a Senior React Developer to join our team and help build innovative web applications.',
        requirements: '5+ years of experience with React, TypeScript, and modern web technologies. Strong problem-solving skills and team collaboration.',
        benefits: 'Competitive salary, health insurance, flexible work hours, remote work options, professional development',
        isRemote: true,
        isHybrid: false,
        isUrgent: false,
        isFeatured: true,
        sector: 'technology',
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Git'],
        applicationDeadline: '2024-12-31',
        status: 'active'
      };

      setFormData(mockJob);
      setSkillsInput('');
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
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
    setSaving(true);

    try {
      // For now, just log the data - implement API call later
      // Job update logged
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to job management page
      router.push('/employer/jobs');
    } catch (error) {
      console.error('Error updating job:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      // Implement delete logic
              // Job deletion logged
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to job management page
      router.push('/employer/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/employer/jobs" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Job Management
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job</h1>
              <p className="text-gray-600">Update your job posting: {formData.title}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/jobs/${jobId}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Job
                </Button>
              </Link>
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Job
              </Button>
            </div>
          </div>
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
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Your company name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector">Industry Sector</Label>
                      <Select value={formData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full Time</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level</SelectItem>
                          <SelectItem value="mid">Mid Level</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        value={formData.salary}
                        onChange={(e) => handleInputChange('salary', e.target.value)}
                        placeholder="e.g., ₹8L - ₹15L PA"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isRemote"
                        checked={formData.isRemote}
                        onCheckedChange={(checked) => handleInputChange('isRemote', !!checked)}
                      />
                      <Label htmlFor="isRemote">Remote Work Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isHybrid"
                        checked={formData.isHybrid}
                        onCheckedChange={(checked) => handleInputChange('isHybrid', !!checked)}
                      />
                      <Label htmlFor="isHybrid">Hybrid Work Available</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description & Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide a detailed description of the role, responsibilities, and what the candidate will be doing..."
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements & Qualifications</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="List the required skills, experience, education, and qualifications..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="benefits">Benefits & Perks</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => handleInputChange('benefits', e.target.value)}
                      placeholder="Describe the benefits, perks, and advantages of working at your company..."
                      rows={3}
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
                    <Label htmlFor="skills">Add Skills (separate with commas)</Label>
                    <Input
                      id="skills"
                      value={skillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      placeholder="e.g., React, TypeScript, Node.js"
                    />
                  </div>
                  
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
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
                  <div>
                    <Label htmlFor="status">Job Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isUrgent"
                        checked={formData.isUrgent}
                        onCheckedChange={(checked) => handleInputChange('isUrgent', !!checked)}
                      />
                      <Label htmlFor="isUrgent">Mark as Urgent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', !!checked)}
                      />
                      <Label htmlFor="isFeatured">Feature this job</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating Job...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Update Job
                      </div>
                    )}
                  </Button>
                  
                  <Link href="/employer/jobs">
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Job Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{formData.title}</h4>
                    <p className="text-sm text-gray-600">{formData.company}</p>
                    <p className="text-sm text-gray-600">{formData.location}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{formData.jobType}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{formData.experienceLevel}</span>
                    {formData.isRemote && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Remote</span>
                    )}
                  </div>
                  {formData.salary && (
                    <p className="text-sm text-gray-600">💰 {formData.salary}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
