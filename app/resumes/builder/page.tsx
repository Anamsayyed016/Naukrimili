"use client";

import { useState, useEffect, useCallback } from 'react';
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
  Trash2,
  Brain,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';
import { UnifiedResumeData, ResumeDataFactory, ResumeValidator } from '@/types/unified-resume';
import { AIResumeCoach, ResumeSuggestion, ATSAnalysis, ProfessionalCoaching } from '@/lib/ai-resume-coach';
import { ResumeTemplateManager, TemplateCustomization } from '@/lib/resume-templates';
import { ResumeExporter, ExportOptions } from '@/lib/resume-export';
import ModernResumeWizard from '@/components/resume/ModernResumeWizard';

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Helper functions for dynamic styling
function getFontClass(fontFamily: string): string {
  switch (fontFamily) {
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    default: return 'font-sans';
  }
}

function getColorClass(colorScheme: string, type: 'text' | 'bg' | 'border'): string {
  const colorMap: Record<string, Record<string, string>> = {
    blue: {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    green: {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    purple: {
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    red: {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    orange: {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    teal: {
      text: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-200'
    },
    pink: {
      text: 'text-pink-600',
      bg: 'bg-pink-50',
      border: 'border-pink-200'
    },
    gray: {
      text: 'text-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200'
    }
  };
  
  return colorMap[colorScheme]?.[type] || colorMap.blue[type];
}

// Remove old interface - using UnifiedResumeData from types

// Template system now handled by ResumeTemplateManager

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [resumeData, setResumeData] = useState<UnifiedResumeData>(ResumeDataFactory.createEmpty());
  const [selectedTemplate, setSelectedTemplate] = useState('modern-professional');
  const [customization, setCustomization] = useState<TemplateCustomization>({
    templateId: 'modern-professional',
    colorScheme: 'blue',
    fontFamily: 'sans',
    showProfilePhoto: false,
    spacing: 'standard'
  });
  
  // UI State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [showWizard, setShowWizard] = useState(true);
  const [isNewResume, setIsNewResume] = useState(true);
  
  // AI State
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [coachingSteps, setCoachingSteps] = useState<ProfessionalCoaching[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Coach instance
  const [aiCoach] = useState(() => new AIResumeCoach());

  // Load coaching steps and analyze resume
  useEffect(() => {
    const loadCoachingData = async () => {
      try {
        const steps = await aiCoach.getCoachingSteps(resumeData);
        setCoachingSteps(steps);
        
        const analysis = await aiCoach.analyzeATS(resumeData);
        setAtsAnalysis(analysis);
        setSuggestions(analysis.improvements);
      } catch (error) {
        console.error('Failed to load coaching data:', error);
      }
    };

    if (resumeData.personalInfo.fullName) {
      loadCoachingData();
    }
  }, [resumeData, aiCoach]);

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

  // Debounced AI analysis
  const debouncedAnalysis = useCallback(
    debounce(async (data: UnifiedResumeData) => {
      setIsAnalyzing(true);
      try {
        const analysis = await aiCoach.analyzeATS(data);
        setAtsAnalysis(analysis);
        setSuggestions(analysis.improvements);
      } catch (error) {
        console.error('AI analysis failed:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1000),
    [aiCoach]
  );

  // Trigger analysis when resume data changes
  useEffect(() => {
    if (resumeData.personalInfo.fullName) {
      debouncedAnalysis(resumeData);
    }
  }, [resumeData, debouncedAnalysis]);

  // Handle wizard completion
  const handleWizardComplete = async (wizardResumeData: UnifiedResumeData, templateId: string, wizardCustomization: any) => {
    try {
      // Generate AI-powered resume data based on selections
      const aiCoach = new AIResumeCoach();
      const enhancedResumeData = await aiCoach.generateResumeFromField(
        wizardCustomization.selectedField || 'Software Development',
        wizardCustomization.selectedKeywords || []
      );
      
      // Merge wizard data with AI-generated data
      const mergedResumeData = {
        ...wizardResumeData,
        ...enhancedResumeData,
        personalInfo: {
          ...wizardResumeData.personalInfo,
          ...enhancedResumeData.personalInfo
        }
      };
      
      setResumeData(mergedResumeData);
      setSelectedTemplate(templateId);
      setCustomization(wizardCustomization);
      setShowWizard(false);
      setIsNewResume(false);
      
      toast({
        title: "Resume Created!",
        description: "Your resume has been created with AI-optimized keywords. Start editing to customize it further.",
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      // Fallback to basic data
      setResumeData(wizardResumeData);
      setSelectedTemplate(templateId);
      setCustomization(wizardCustomization);
      setShowWizard(false);
      setIsNewResume(false);
    }
  };

  // Handle wizard close
  const handleWizardClose = () => {
    setShowWizard(false);
    setIsNewResume(false);
  };

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

  // Show wizard for new resumes
  if (isNewResume && showWizard) {
    return <ModernResumeWizard onComplete={handleWizardComplete} onClose={handleWizardClose} />;
  }

  const updatePersonalInfo = (field: keyof UnifiedResumeData['personalInfo'], value: string | boolean) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addEducation = () => {
    const newEducation = {
      id: ResumeDataFactory.createId(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
      location: '',
      isCurrent: false
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

  // Project handlers
  const addProject = () => {
    const newProject = {
      id: ResumeDataFactory.createId(),
      name: '',
      description: '',
      technologies: [],
      url: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      achievements: []
    };
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, newProject]
    }));
  };

  const updateProject = (id: string, field: string, value: string | string[]) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map(project => 
        project.id === id ? { ...project, [field]: value } : project
      )
    }));
  };

  const removeProject = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  // Certification handlers
  const addCertification = () => {
    const newCertification = {
      id: ResumeDataFactory.createId(),
      name: '',
      issuer: '',
      date: '',
      validUntil: '',
      credentialId: '',
      url: ''
    };
    setResumeData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCertification]
    }));
  };

  const updateCertification = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.map(cert => 
        cert.id === id ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(cert => cert.id !== id)
    }));
  };

  // Language handlers
  const addLanguage = () => {
    const newLanguage = {
      id: ResumeDataFactory.createId(),
      language: '',
      proficiency: 'conversational' as const,
      isNative: false
    };
    setResumeData(prev => ({
      ...prev,
      languages: [...prev.languages, newLanguage]
    }));
  };

  const updateLanguage = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      languages: prev.languages.map(lang => 
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const removeLanguage = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang.id !== id)
    }));
  };

  // Reference handlers
  const addReference = () => {
    const newReference = {
      id: ResumeDataFactory.createId(),
      name: '',
      position: '',
      company: '',
      email: '',
      phone: ''
    };
    setResumeData(prev => ({
      ...prev,
      references: [...prev.references, newReference]
    }));
  };

  const updateReference = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      references: prev.references.map(ref => 
        ref.id === id ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const removeReference = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      references: prev.references.filter(ref => ref.id !== id)
    }));
  };

  // ATS score now calculated by AI analysis

  const saveResume = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const score = atsAnalysis?.score || 0;
      
      const response = await fetch('/api/resumes/builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          builderData: resumeData,
          templateStyle: customization.templateId,
          colorScheme: customization.colorScheme,
          fontFamily: customization.fontFamily,
          atsScore: score,
          fileName: `${resumeData.personalInfo.fullName || 'Resume'}_${customization.templateId}`,
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

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      const exportOptions: ExportOptions = {
        format,
        templateId: selectedTemplate,
        customization,
        includePhoto: customization.showProfilePhoto,
        quality: 'high',
        filename: `${resumeData.personalInfo.fullName || 'Resume'}_${selectedTemplate}.${format}`
      };

      const result = format === 'pdf' 
        ? await ResumeExporter.exportToPDF(resumeData, exportOptions)
        : await ResumeExporter.exportToDOCX(resumeData, exportOptions);

      if (result.success && result.data) {
        ResumeExporter.downloadFile(result.data, result.filename);
        toast({
          title: 'Export Successful!',
          description: `Your resume has been exported as ${format.toUpperCase()}`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Builder</h1>
              <p className="text-gray-600">Create a professional, ATS-friendly resume with AI guidance</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => {
                  setShowWizard(true);
                  setIsNewResume(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Resume
              </Button>
              {atsAnalysis && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{atsAnalysis.score}/100</div>
                  <div className="text-sm text-gray-600">ATS Score</div>
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>
          </div>
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
                <Select value={customization.templateId} onValueChange={(value) => setCustomization(prev => ({ ...prev, templateId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ResumeTemplateManager.getAllTemplates().map(template => (
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
                <Select value={customization.colorScheme} onValueChange={(value) => setCustomization(prev => ({ ...prev, colorScheme: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ResumeTemplateManager.getTemplateById(customization.templateId)?.colorSchemes.map(scheme => (
                      <SelectItem key={scheme} value={scheme}>
                        {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <Select value={customization.fontFamily} onValueChange={(value) => setCustomization(prev => ({ ...prev, fontFamily: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ResumeTemplateManager.getTemplateById(customization.templateId)?.fontOptions.map(font => (
                      <SelectItem key={font} value={font}>
                        {font.charAt(0).toUpperCase() + font.slice(1)}
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
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="references">References</TabsTrigger>
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
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Projects
                      </span>
                      <Button onClick={addProject} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.projects.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No projects added yet. Click "Add Project" to get started.</p>
                      </div>
                    ) : (
                      resumeData.projects.map((project, index) => (
                        <Card key={project.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Project Name *
                                </label>
                                <Input
                                  value={project.name}
                                  onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                                  placeholder="E-commerce Website"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Technologies
                                </label>
                                <Input
                                  value={project.technologies.join(', ')}
                                  onChange={(e) => updateProject(project.id, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                                  placeholder="React, Node.js, MongoDB"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <Textarea
                                value={project.description}
                                onChange={(e) => updateProject(project.id, 'description', e.target.value)}
                                placeholder="Describe your project and your role..."
                                rows={3}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Project URL
                                </label>
                                <Input
                                  value={project.url}
                                  onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                                  placeholder="https://yourproject.com"
                                />
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeProject(project.id)}
                                  className="w-full"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Certifications */}
              <TabsContent value="certifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Certifications
                      </span>
                      <Button onClick={addCertification} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Certification
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.certifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No certifications added yet. Click "Add Certification" to get started.</p>
                      </div>
                    ) : (
                      resumeData.certifications.map((cert) => (
                        <Card key={cert.id} className="border-l-4 border-l-green-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Certification Name *
                                </label>
                                <Input
                                  value={cert.name}
                                  onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                                  placeholder="AWS Certified Solutions Architect"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Issuing Organization
                                </label>
                                <Input
                                  value={cert.issuer}
                                  onChange={(e) => updateCertification(cert.id, 'issuer', e.target.value)}
                                  placeholder="Amazon Web Services"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Issue Date
                                </label>
                                <Input
                                  type="date"
                                  value={cert.date}
                                  onChange={(e) => updateCertification(cert.id, 'date', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Expiry Date
                                </label>
                                <Input
                                  type="date"
                                  value={cert.validUntil}
                                  onChange={(e) => updateCertification(cert.id, 'validUntil', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credential ID
                              </label>
                              <Input
                                value={cert.credentialId}
                                onChange={(e) => updateCertification(cert.id, 'credentialId', e.target.value)}
                                placeholder="AWS-123456"
                              />
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeCertification(cert.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Languages */}
              <TabsContent value="languages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Languages
                      </span>
                      <Button onClick={addLanguage} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Language
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.languages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No languages added yet. Click "Add Language" to get started.</p>
                      </div>
                    ) : (
                      resumeData.languages.map((lang) => (
                        <Card key={lang.id} className="border-l-4 border-l-purple-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Language *
                                </label>
                                <Input
                                  value={lang.language}
                                  onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)}
                                  placeholder="Spanish"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Proficiency Level
                                </label>
                                <Select value={lang.proficiency} onValueChange={(value) => updateLanguage(lang.id, 'proficiency', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select proficiency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="basic">Basic</SelectItem>
                                    <SelectItem value="conversational">Conversational</SelectItem>
                                    <SelectItem value="fluent">Fluent</SelectItem>
                                    <SelectItem value="native">Native</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeLanguage(lang.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* References */}
              <TabsContent value="references" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        References
                      </span>
                      <Button onClick={addReference} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Reference
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {resumeData.references.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No references added yet. Click "Add Reference" to get started.</p>
                      </div>
                    ) : (
                      resumeData.references.map((ref) => (
                        <Card key={ref.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name *
                                </label>
                                <Input
                                  value={ref.name}
                                  onChange={(e) => updateReference(ref.id, 'name', e.target.value)}
                                  placeholder="John Smith"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Position
                                </label>
                                <Input
                                  value={ref.position}
                                  onChange={(e) => updateReference(ref.id, 'position', e.target.value)}
                                  placeholder="Senior Developer"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Company
                                </label>
                                <Input
                                  value={ref.company}
                                  onChange={(e) => updateReference(ref.id, 'company', e.target.value)}
                                  placeholder="Tech Corp"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email
                                </label>
                                <Input
                                  type="email"
                                  value={ref.email}
                                  onChange={(e) => updateReference(ref.id, 'email', e.target.value)}
                                  placeholder="john@techcorp.com"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                              </label>
                              <Input
                                value={ref.phone}
                                onChange={(e) => updateReference(ref.id, 'phone', e.target.value)}
                                placeholder="+1 (555) 123-4567"
                              />
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeReference(ref.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* AI Suggestions Panel */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Suggestions
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Brain className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing...</span>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start filling out your resume to get AI-powered suggestions!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((suggestion) => (
                      <Alert key={suggestion.id} className={`border-l-4 ${
                        suggestion.priority === 'high' ? 'border-l-red-500' :
                        suggestion.priority === 'medium' ? 'border-l-yellow-500' :
                        'border-l-green-500'
                      }`}>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{suggestion.title}</h4>
                              <Badge variant={
                                suggestion.priority === 'high' ? 'destructive' :
                                suggestion.priority === 'medium' ? 'default' : 'secondary'
                              }>
                                {suggestion.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                            <p className="text-sm font-medium">{suggestion.suggestion}</p>
                            {suggestion.example && (
                              <div className="bg-gray-50 p-3 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">Example:</p>
                                <p className="text-sm italic">{suggestion.example}</p>
                              </div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    ATS Score: {atsAnalysis?.score || 0}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 bg-white min-h-[600px]">
                  {/* Resume Preview Content */}
                  <div className={`space-y-6 ${getFontClass(customization.fontFamily)}`}>
                    {/* Header */}
                    <div className="text-center border-b pb-4">
                      <h1 className={`text-2xl font-bold ${getColorClass(customization.colorScheme, 'text')}`}>
                        {resumeData.personalInfo.fullName || 'Your Name'}
                      </h1>
                      <p className="text-gray-600">
                        {resumeData.personalInfo.email || 'email@example.com'}
                      </p>
                      <p className="text-gray-600">
                        {resumeData.personalInfo.phone && `${resumeData.personalInfo.phone} • `}
                        {resumeData.personalInfo.location || 'Location'}
                      </p>
                      {resumeData.personalInfo.linkedin && (
                        <p className="text-sm text-gray-500">
                          LinkedIn: {resumeData.personalInfo.linkedin}
                        </p>
                      )}
                    </div>

                    {/* Summary */}
                    {resumeData.personalInfo.summary && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-2`}>Summary</h2>
                        <p className="text-gray-700">{resumeData.personalInfo.summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {resumeData.experience.length > 0 && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Experience</h2>
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
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Education</h2>
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
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Skills</h2>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.skills.map((skill) => (
                            <Badge key={skill.id} variant="outline">
                              {skill.name} ({skill.level})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Projects */}
                    {resumeData.projects.length > 0 && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Projects</h2>
                        <div className="space-y-3">
                          {resumeData.projects.map((project) => (
                            <div key={project.id}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                                  {project.technologies && project.technologies.length > 0 && (
                                    <p className="text-sm text-gray-600">{project.technologies.join(', ')}</p>
                                  )}
                                </div>
                                {project.url && (
                                  <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                    View Project
                                  </a>
                                )}
                              </div>
                              {project.description && (
                                <p className="text-gray-700 mt-2 text-sm">{project.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certifications */}
                    {resumeData.certifications.length > 0 && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Certifications</h2>
                        <div className="space-y-3">
                          {resumeData.certifications.map((cert) => (
                            <div key={cert.id}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{cert.name}</h3>
                                  <p className="text-sm text-gray-600">{cert.issuer}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">{cert.date}</p>
                                  {cert.validUntil && (
                                    <p className="text-xs text-gray-400">Expires: {cert.validUntil}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {resumeData.languages.length > 0 && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>Languages</h2>
                        <div className="flex flex-wrap gap-2">
                          {resumeData.languages.map((lang) => (
                            <Badge key={lang.id} variant="secondary">
                              {lang.language} ({lang.proficiency})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {resumeData.references.length > 0 && (
                      <div>
                        <h2 className={`text-lg font-semibold ${getColorClass(customization.colorScheme, 'text')} mb-3`}>References</h2>
                        <div className="space-y-3">
                          {resumeData.references.map((ref) => (
                            <div key={ref.id}>
                              <h3 className="font-medium text-gray-900">{ref.name}</h3>
                              <p className="text-sm text-gray-600">{ref.position} at {ref.company}</p>
                              <p className="text-sm text-gray-500">{ref.email} • {ref.phone}</p>
                            </div>
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

        {/* AI Suggestions Panel */}
        {suggestions.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lightbulb className="w-5 h-5" />
                AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <Alert key={suggestion.id} className="border-blue-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{suggestion.title}</div>
                      <div className="text-sm text-gray-600">{suggestion.suggestion}</div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-6 right-6 flex gap-3">
          <Button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            variant="outline"
            size="lg"
            className="shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
          <Button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            variant="outline"
            size="lg"
            className="shadow-lg"
          >
            <FileText className="w-5 h-5 mr-2" />
            {isExporting ? 'Exporting...' : 'Download DOCX'}
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
