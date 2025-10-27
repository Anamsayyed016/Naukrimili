'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Briefcase, 
  CheckCircle, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  Target,
  Users,
  Globe,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface EmployerOnboardingCheckProps {
  children: React.ReactNode;
  requiredAction: 'company' | 'job' | 'none';
}

interface CompanyData {
  id: string;
  name: string;
  isVerified: boolean;
  hasCompleteProfile: boolean;
}

export default function EmployerOnboardingCheck({ 
  children, 
  requiredAction 
}: EmployerOnboardingCheckProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/employer/dashboard');
      return;
    }

    if (session?.user?.role !== 'employer') {
      router.push('/auth/role-selection');
      return;
    }

    checkCompanyStatus();
  }, [session, status, router]);

  const checkCompanyStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employer/company-profile');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Company status check response:', data);
        
        // API returns { success: true, data: {...company data...} }
        const company = data.success && data.data ? data.data : null;
        
        if (company && company.id) {
          setCompanyData({
            id: company.id,
            name: company.name,
            isVerified: company.isVerified || false,
            hasCompleteProfile: true
          });
          
          // Company exists - check verification status and required action
          if (requiredAction === 'job') {
            // Company exists, allow job posting but show verification status
            setShowOnboarding(false);
            
            // Show info message if company is not verified
            if (!company.isVerified) {
              toast.info('Company Profile is Pending Verification', {
                description: 'Your company profile is being reviewed. You can post jobs, but they may be limited until verification is complete.',
                duration: 8000,
              });
            }
          } else if (requiredAction === 'company') {
            // Company already exists, show onboarding as a reminder
            setShowOnboarding(false);
            // Don't redirect if they're trying to access company creation page
          }
        } else {
          // No company found
          setCompanyData(null);
          if (requiredAction === 'company' || requiredAction === 'job') {
            setShowOnboarding(true);
          }
        }
      } else if (response.status === 404) {
        // No company found
        setCompanyData(null);
        if (requiredAction === 'company' || requiredAction === 'job') {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Error checking company status:', error);
      // Allow form to proceed if API check fails
      setCompanyData(null);
      if (requiredAction === 'company' || requiredAction === 'job') {
        setShowOnboarding(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = () => {
    router.push('/employer/company/create');
  };

  const handleGoToDashboard = () => {
    router.push('/employer/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking your company profile...</p>
        </div>
      </div>
    );
  }

  // Show verification pending message if company exists but not verified
  const showVerificationPending = companyData && !companyData.isVerified && requiredAction === 'job';

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Welcome to NaukriMili
              </h1>
            </div>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Complete your employer profile to start posting jobs and finding the best talent
            </p>
          </div>

          {/* Onboarding Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Company Creation Step */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Step 1: Create Company Profile
                  </CardTitle>
                  <p className="text-slate-600 text-sm">
                    Set up your company information to establish credibility
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-slate-700">Company name and description</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-slate-700">Location and industry details</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-slate-700">Company size and founding year</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-slate-700">Company logo and branding</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateCompany}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Building2 className="h-5 w-5 mr-2" />
                    Create Company Profile
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Job Posting Step */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className={`h-full border-2 ${
                requiredAction === 'company' 
                  ? 'border-gray-200 bg-gray-50' 
                  : 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50'
              }`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    requiredAction === 'company' 
                      ? 'bg-gray-400' 
                      : 'bg-green-600'
                  }`}>
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Step 2: Post Your First Job
                  </CardTitle>
                  <p className="text-slate-600 text-sm">
                    {requiredAction === 'company' 
                      ? 'Complete company profile first' 
                      : 'Create compelling job postings with AI assistance'
                    }
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 ${
                      requiredAction === 'company' ? 'opacity-50' : ''
                    }`}>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        requiredAction === 'company' 
                          ? 'bg-gray-300' 
                          : 'bg-green-500'
                      }`}>
                        {requiredAction === 'company' ? (
                          <AlertCircle className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-700">AI-powered job descriptions</span>
                    </div>
                    <div className={`flex items-center gap-3 ${
                      requiredAction === 'company' ? 'opacity-50' : ''
                    }`}>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        requiredAction === 'company' 
                          ? 'bg-gray-300' 
                          : 'bg-green-500'
                      }`}>
                        {requiredAction === 'company' ? (
                          <AlertCircle className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-700">Location-based targeting</span>
                    </div>
                    <div className={`flex items-center gap-3 ${
                      requiredAction === 'company' ? 'opacity-50' : ''
                    }`}>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        requiredAction === 'company' 
                          ? 'bg-gray-300' 
                          : 'bg-green-500'
                      }`}>
                        {requiredAction === 'company' ? (
                          <AlertCircle className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-700">Skill optimization</span>
                    </div>
                    <div className={`flex items-center gap-3 ${
                      requiredAction === 'company' ? 'opacity-50' : ''
                    }`}>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                        requiredAction === 'company' 
                          ? 'bg-gray-300' 
                          : 'bg-green-500'
                      }`}>
                        {requiredAction === 'company' ? (
                          <AlertCircle className="h-3 w-3 text-white" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-slate-700">Real-time notifications</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => router.push('/employer/jobs/create')}
                    disabled={requiredAction === 'company'}
                    className={`w-full py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                      requiredAction === 'company'
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-xl'
                    }`}
                  >
                    <Briefcase className="h-5 w-5 mr-2" />
                    {requiredAction === 'company' ? 'Complete Company Profile First' : 'Post Your First Job'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Benefits Section */}
          <Card className="mb-8 border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                Why Complete Your Profile?
              </CardTitle>
              <p className="text-slate-600">
                A complete company profile helps you attract better candidates and build trust
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Better Matches</h3>
                  <p className="text-sm text-slate-600">
                    Attract qualified candidates who align with your company culture
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Increased Trust</h3>
                  <p className="text-sm text-slate-600">
                    Build credibility with detailed company information and branding
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">AI Optimization</h3>
                  <p className="text-sm text-slate-600">
                    Get AI-powered suggestions for better job postings and candidate matching
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleCreateCompany}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Building2 className="h-6 w-6 mr-3" />
              Start with Company Profile
              <ArrowRight className="h-6 w-6 ml-3" />
            </Button>
            
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
              <Button
                variant="ghost"
                onClick={handleGoToDashboard}
                className="hover:text-blue-600 transition-colors"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
