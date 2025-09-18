"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AIJobPostingForm from '@/components/jobs/AIJobPostingForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Brain,
  Sparkles,
  Target,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CreateJobPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showIntro, setShowIntro] = useState(true);

  // Redirect if not authenticated or not an employer
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/employer/jobs/create');
    } else if (session && session.user.role !== 'employer') {
      router.push('/auth/role-selection');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading AI-powered job posting...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || (session && session.user.role !== 'employer')) {
    return null;
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl py-4 sm:py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">AI-Powered Job Posting</h1>
            </div>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
              Create compelling job postings with AI suggestions and reach the right candidates with location-based targeting
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">AI Suggestions</h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Get intelligent suggestions for job titles, descriptions, and requirements using advanced AI
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Location Targeting</h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Post jobs in specific cities, multiple locations, or within a radius to reach the right candidates
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="text-center p-4 sm:p-6 border-0 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Smart Optimization</h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Automatically optimize your job posting for better visibility and candidate attraction
                </p>
              </Card>
            </motion.div>
          </div>

          {/* Benefits List */}
          <Card className="mb-6 sm:mb-8 border-0 shadow-xl bg-white/95 backdrop-blur-sm rounded-2xl">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 text-center">
                Why Use AI-Powered Job Posting?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base">Better Job Descriptions</h4>
                      <p className="text-xs sm:text-sm text-slate-600">AI helps create compelling, ATS-friendly job descriptions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Location-Based Reach</h4>
                      <p className="text-sm text-slate-600">Target specific areas, cities, or radius-based searches</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Skill Optimization</h4>
                      <p className="text-sm text-slate-600">Get relevant skill suggestions based on job requirements</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Time Saving</h4>
                      <p className="text-sm text-slate-600">Reduce job posting time by 70% with AI assistance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Better Matches</h4>
                      <p className="text-sm text-slate-600">Attract more qualified candidates with optimized postings</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-900">Real-time Suggestions</h4>
                      <p className="text-sm text-slate-600">Get instant feedback and improvements as you type</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center space-y-4">
            <Button
              onClick={() => setShowIntro(false)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Sparkles className="h-6 w-6 mr-3" />
              Start AI-Powered Job Posting
              <ArrowRight className="h-6 w-6 ml-3" />
            </Button>
            
            <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
              <Link href="/employer/jobs" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Job Management
              </Link>
              <span>•</span>
              <Link href="/employer/dashboard" className="hover:text-blue-600 transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AIJobPostingForm />;
}