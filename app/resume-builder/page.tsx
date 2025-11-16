'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Save, RefreshCw, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import AuthGuard from '@/components/auth/AuthGuard';
import StepFlow, { Step } from './components/StepFlow';
import TemplateSelector from './components/TemplateSelector';
import ExperienceLevelSelector from './components/ExperienceLevelSelector';
import ResumeForm from './components/ResumeForm';
import LivePreview from './components/LivePreview';
import ATSOptimizationPanel from './components/ATSOptimizationPanel';
import { ResumeBuilderData, TemplateStyle, ExperienceLevel, ResumeBuilderDataSchema } from './types';
import { PDFGenerator } from './utils/pdfGenerator';

const STEPS = [
  { id: 'experience' as Step, label: 'Experience', description: 'Select experience level' },
  { id: 'template' as Step, label: 'Template', description: 'Choose a template' },
  { id: 'form' as Step, label: 'Details', description: 'Fill in your information' },
  { id: 'preview' as Step, label: 'Preview', description: 'Review your resume' },
  { id: 'download' as Step, label: 'Download', description: 'Download PDF' },
];

export default function ResumeBuilderPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('experience');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Initialize resume data
  const [resumeData, setResumeData] = useState<ResumeBuilderData>(() => ({
    personalInfo: {
      fullName: '',
      email: session?.user?.email || '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      jobTitle: '',
      summary: '',
      profilePhoto: '',
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    internships: [],
    template: {
      style: 'modern',
      colorScheme: 'blue',
    },
    experienceLevel: undefined,
    metadata: {
      atsScore: 0,
      completeness: 0,
    },
    sectionOrder: [
      'personalInfo',
      'skills',
      'experience',
      'education',
      'projects',
      'certifications',
      'languages',
      'achievements',
      'internships',
    ],
  }));

  // Auto-fill from profile
  const handleAutoFill = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const user = data.user;
          setResumeData(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
              email: user.email || prev.personalInfo.email,
              phone: user.phone || prev.personalInfo.phone,
              location: user.location || prev.personalInfo.location,
              jobTitle: user.currentRole || prev.personalInfo.jobTitle || '',
              summary: user.bio || prev.personalInfo.summary,
            },
            skills: Array.isArray(user.skills) 
              ? user.skills.map((s: string) => ({ id: `${Date.now()}-${Math.random()}`, name: s, level: 'intermediate' as const }))
              : typeof user.skills === 'string' && user.skills
              ? JSON.parse(user.skills || '[]').map((s: string) => ({ id: `${Date.now()}-${Math.random()}`, name: s, level: 'intermediate' as const }))
              : prev.skills,
            experience: Array.isArray(user.experience)
              ? user.experience.map((exp: any) => ({
                  id: `${Date.now()}-${Math.random()}`,
                  company: exp.company || '',
                  position: exp.position || '',
                  location: exp.location || '',
                  startDate: exp.startDate || '',
                  endDate: exp.endDate || '',
                  current: exp.current || false,
                  description: exp.description || '',
                  achievements: [],
                  technologies: [],
                }))
              : prev.experience,
            education: Array.isArray(user.education)
              ? user.education.map((edu: any) => ({
                  id: `${Date.now()}-${Math.random()}`,
                  institution: edu.institution || '',
                  degree: edu.degree || '',
                  field: edu.field || '',
                  startDate: edu.startDate || '',
                  endDate: edu.endDate || '',
                  gpa: edu.gpa || '',
                  description: edu.description || '',
                  isCurrent: edu.isCurrent || false,
                }))
              : prev.education,
          }));
          
          toast({
            title: 'Profile data loaded',
            description: 'Your profile information has been auto-filled.',
          });
        }
      }
    } catch (error) {
      console.error('Error auto-filling from profile:', error);
      toast({
        title: 'Auto-fill failed',
        description: 'Could not load profile data. Please fill manually.',
        variant: 'destructive',
      });
    }
  };

  // Save resume
  const handleSave = async () => {
    setSaving(true);
    try {
      const validation = ResumeBuilderDataSchema.safeParse(resumeData);
      if (!validation.success) {
        toast({
          title: 'Validation error',
          description: 'Please fill all required fields.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/resumes/builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: validation.data,
          template: resumeData.template.style,
          experienceLevel: resumeData.experienceLevel,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Resume saved',
          description: 'Your resume has been saved successfully.',
        });
      } else {
        throw new Error('Failed to save resume');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await PDFGenerator.downloadPDF(
        resumeData,
        resumeData.template.style,
        `${resumeData.personalInfo.fullName || 'resume'}-${resumeData.template.style}.pdf`
      );
      toast({
        title: 'PDF downloaded',
        description: 'Your resume has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  // Validate step before proceeding
  const canProceed = () => {
    switch (currentStep) {
      case 'experience':
        return !!resumeData.experienceLevel;
      case 'template':
        return !!resumeData.template.style;
      case 'form':
        return (
          !!resumeData.personalInfo.fullName &&
          !!resumeData.personalInfo.email &&
          !!resumeData.personalInfo.summary
        );
      case 'preview':
        return true;
      case 'download':
        return true;
      default:
        return false;
    }
  };

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 max-w-[1600px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resume Builder</h1>
                <p className="text-sm sm:text-base text-gray-600">Create your professional resume in minutes</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleAutoFill}
                className="flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Auto-fill from Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 md:gap-6 lg:gap-6 xl:gap-7">
            {/* Main Content Area */}
            <div className={currentStep === 'template' ? 'lg:col-span-12' : 'lg:col-span-8'}>
              <StepFlow
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                steps={STEPS}
                canGoNext={canProceed()}
              >
                {currentStep === 'experience' && (
                  <ExperienceLevelSelector
                    selectedLevel={resumeData.experienceLevel || 'mid'}
                    onLevelSelect={(level) =>
                      setResumeData(prev => ({ ...prev, experienceLevel: level }))
                    }
                  />
                )}

                {currentStep === 'template' && (
                  <TemplateSelector
                    selectedTemplate={resumeData.template.style}
                    selectedColorScheme={resumeData.template.colorScheme}
                    onTemplateSelect={(template) =>
                      setResumeData(prev => ({
                        ...prev,
                        template: { ...prev.template, style: template },
                      }))
                    }
                    onColorSchemeChange={(color) =>
                      setResumeData(prev => ({
                        ...prev,
                        template: { ...prev.template, colorScheme: color },
                      }))
                    }
                    experienceLevel={resumeData.experienceLevel}
                  />
                )}

                {currentStep === 'form' && (
                  <ResumeForm
                    data={resumeData}
                    onDataChange={setResumeData}
                  />
                )}

                {currentStep === 'preview' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">Preview</h2>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep('form')}
                      >
                        Edit Details
                      </Button>
                    </div>
                    <LivePreview data={resumeData} />
                  </div>
                )}

                {currentStep === 'download' && (
                  <div className="space-y-6 text-center py-12">
                    <div className="max-w-md mx-auto">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Download!</h2>
                      <p className="text-gray-600 mb-6">
                        Your resume is ready. Download it as a PDF and start applying for jobs.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                          size="lg"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="flex items-center gap-2"
                        >
                          {downloading ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              Download PDF
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={handleSave}
                          disabled={saving}
                          className="flex items-center gap-2"
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Save Resume
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </StepFlow>
            </div>

            {/* Sidebar - Preview & ATS - Only show in form step */}
            {currentStep === 'form' && (
              <div className="lg:col-span-4 space-y-6">
                {/* Live Preview (sticky) */}
                <div className="sticky top-24">
                  <Card className="shadow-lg border-2 border-blue-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Live</span>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-auto bg-white shadow-inner" style={{ maxHeight: '600px' }}>
                        <div className="p-2">
                          <LivePreview data={resumeData} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ATS Optimization Panel */}
                <ATSOptimizationPanel data={resumeData} />
              </div>
            )}
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoFill}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Auto-fill
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
