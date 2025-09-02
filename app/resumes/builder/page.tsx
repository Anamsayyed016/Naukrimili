"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Save, 
  Download, 
  Eye, 
  Palette, 
  FileText, 
  User, 
  GraduationCap, 
  Briefcase, 
  Award,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
    description: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    url: string;
  }>;
}

const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    summary: ''
  },
  education: [],
  experience: [],
  skills: [],
  projects: [],
  certifications: []
};

const templateStyles = [
  { id: 'modern', name: 'Modern', description: 'Clean and professional' },
  { id: 'classic', name: 'Classic', description: 'Traditional and formal' },
  { id: 'creative', name: 'Creative', description: 'Unique and eye-catching' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and focused' }
];

const colorSchemes = [
  { id: 'blue', name: 'Professional Blue', class: 'bg-blue-600' },
  { id: 'green', name: 'Success Green', class: 'bg-green-600' },
  { id: 'purple', name: 'Creative Purple', class: 'bg-purple-600' },
  { id: 'gray', name: 'Neutral Gray', class: 'bg-gray-600' }
];

const fontOptions = [
  { id: 'sans', name: 'Sans-serif' },
  { id: 'serif', name: 'Serif' },
  { id: 'mono', name: 'Monospace' }
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [selectedFont, setSelectedFont] = useState('sans');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [atsScore, setAtsScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    if (status === 'loading') return;
    
    // If user is not authenticated via either system, redirect to login
    if (status === 'unauthenticated' && !user) {
      router.push('/auth/login?redirect=/resumes/builder');
      return;
    }
    
    // If user is authenticated, allow access
    if (status === 'authenticated' || user) {
      setIsLoading(false);
    }
  }, [status, user, router]);

  // Show loading while checking authentication
  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (status === 'unauthenticated' && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the resume builder.</p>
          <Button onClick={() => router.push('/auth/login?redirect=/resumes/builder')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const updatePersonalInfo = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEducation]
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: []
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience]
    }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addSkill = () => {
    const newSkill = {
      id: Date.now().toString(),
      name: '',
      level: 'intermediate' as const
    };
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const updateSkill = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const removeSkill = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  const calculateATSScore = () => {
    let score = 0;
    
    // Personal info completeness
    if (resumeData.personalInfo.fullName) score += 10;
    if (resumeData.personalInfo.email) score += 10;
    if (resumeData.personalInfo.phone) score += 5;
    if (resumeData.personalInfo.location) score += 5;
    if (resumeData.personalInfo.summary) score += 10;
    
    // Experience
    score += resumeData.experience.length * 10;
    
    // Education
    score += resumeData.education.length * 5;
    
    // Skills
    score += resumeData.skills.length * 2;
    
    // Projects
    score += resumeData.projects.length * 5;
    
    return Math.min(score, 100);
  };

  const saveResume = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const score = calculateATSScore();
      setAtsScore(score);
      
      const response = await fetch('/api/resumes/builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          builderData: resumeData,
          templateStyle: selectedTemplate,
          colorScheme: selectedColor,
          fontFamily: selectedFont,
          atsScore: score,
          fileName: `${resumeData.personalInfo.fullName || 'Resume'}_${selectedTemplate}`,
          isBuilder: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Show success message
        toast({
          title: 'Resume Saved Successfully!',
          description: 'Your resume has been successfully built and saved!',
        });
        
        // Redirect to dashboard with success message
        setTimeout(() => {
          router.push('/dashboard?message=resume-built');
        }, 1500);
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = () => {
    // TODO: Implement PDF generation
    alert('PDF download feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
          <p className="text-gray-600">Create a professional, ATS-friendly resume</p>
        </div>

        {/* Template & Color Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Template & Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Style
                </label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateStyles.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Scheme
                </label>
                <Select value={selectedColor} onValueChange={setSelectedColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map(scheme => (
                      <SelectItem key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map(font => (
                      <SelectItem key={font.id} value={font.id}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Builder Form */}
          <div className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <Input
                          value={resumeData.personalInfo.fullName}
                          onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={resumeData.personalInfo.email}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <Input
                          value={resumeData.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <Input
                          value={resumeData.personalInfo.location}
                          onChange={(e) => updatePersonalInfo('location', e.target.value)}
                          placeholder="New York, NY"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn
                      </label>
                      <Input
                        value={resumeData.personalInfo.linkedin}
                        onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Professional Summary
                      </label>
                      <Textarea
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                        placeholder="Experienced software developer with 5+ years..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education */}
              <TabsContent value="education" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {resumeData.education.map((edu, index) => (
                        <div key={edu.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Education #{index + 1}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeEducation(edu.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Institution
                              </label>
                              <Input
                                value={edu.institution}
                                onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                placeholder="University Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Degree
                              </label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                placeholder="Bachelor's"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field of Study
                              </label>
                              <Input
                                value={edu.field}
                                onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                                placeholder="Computer Science"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <Input
                                type="month"
                                value={edu.startDate}
                                onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <Input
                                type="month"
                                value={edu.endDate}
                                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button onClick={addEducation} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Experience */}
              <TabsContent value="experience" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Work Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp, index) => (
                        <div key={exp.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Experience #{index + 1}</h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeExperience(exp.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company
                              </label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                placeholder="Company Name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position
                              </label>
                              <Input
                                value={exp.position}
                                onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                                placeholder="Software Engineer"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                              </label>
                              <Input
                                value={exp.location}
                                onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                                placeholder="New York, NY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <Input
                                type="month"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <Input
                                type="month"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <Textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                              placeholder="Describe your role and responsibilities..."
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                      <Button onClick={addExperience} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {resumeData.skills.map((skill, index) => (
                        <div key={skill.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <Input
                              value={skill.name}
                              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                              placeholder="Skill name"
                            />
                          </div>
                          <Select
                            value={skill.level}
                            onValueChange={(value) => updateSkill(skill.id, 'level', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSkill(skill.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button onClick={addSkill} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Skill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Projects */}
              <TabsContent value="projects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Project management coming soon!</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview */}
          <div className="sticky top-8">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Preview
                  </span>
                  <Badge variant="secondary">
                    ATS Score: {calculateATSScore()}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white min-h-[600px]">
                  {/* Resume Preview Content */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {resumeData.personalInfo.fullName || 'Your Name'}
                      </h1>
                      <p className="text-gray-600">
                        {resumeData.personalInfo.email || 'email@example.com'}
                      </p>
                      <p className="text-gray-600">
                        {resumeData.personalInfo.phone && `${resumeData.personalInfo.phone} • `}
                        {resumeData.personalInfo.location || 'Location'}
                      </p>
                    </div>

                    {/* Summary */}
                    {resumeData.personalInfo.summary && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
                        <p className="text-gray-700">{resumeData.personalInfo.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {resumeData.experience.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Experience</h2>
                        <div className="space-y-4">
                          {resumeData.experience.map((exp) => (
                            <div key={exp.id}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{exp.position}</h3>
                                  <p className="text-gray-600">{exp.company}</p>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                </p>
                              </div>
                              {exp.description && (
                                <p className="text-gray-700 mt-2">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {resumeData.education.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Education</h2>
                        <div className="space-y-3">
                          {resumeData.education.map((edu) => (
                            <div key={edu.id}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {edu.degree} in {edu.field}
                                  </h3>
                                  <p className="text-gray-600">{edu.institution}</p>
                                </div>
                                <p className="text-sm text-gray-500">
                                  {edu.startDate} - {edu.endDate}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {resumeData.skills.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill) => (
                            <Badge key={skill.id} variant="outline">
                              {skill.name} ({skill.level})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-6 right-6 flex gap-3">
          <Button
            onClick={downloadPDF}
            variant="outline"
            size="lg"
            className="shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download PDF
          </Button>
          <Button
            onClick={saveResume}
            disabled={isSaving}
            size="lg"
            className="shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save Resume'}
          </Button>
        </div>
      </div>
    </div>
  );
}
