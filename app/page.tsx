"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ResumeUploadModal from "@/components/ResumeUploadModal";
import LivingFooter from "@/components/LivingFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, Briefcase, Building2, User, Upload } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <section className="w-full bg-[#F8FAFC] py-12 md:py-20" style={{ fontFamily: 'Inter' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 px-4">
          {/* Left: Main Content */}
          <div className="flex-1 md:w-3/5 flex flex-col justify-center gap-8">
            {session ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={session.user?.image || "/placeholder-user.jpg"} 
                    alt={session.user?.name || "User avatar"} 
                    className="w-16 h-16 rounded-full border-2 border-purple-300" 
                  />
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">Welcome back, {session.user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-lg text-gray-600">Ready to find your next opportunity?</p>
                  </div>
                </div>
                <p className="text-lg text-gray-700 mb-6">Continue your job search with personalized AI recommendations based on your profile and preferences.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard">
                    <button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:scale-105 transition text-base">Go to Dashboard</button>
                  </Link>
                  <Link href="/jobs">
                    <button className="bg-white border border-purple-300 text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-50 transition text-base">Browse Jobs</button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-5xl font-bold text-gray-900 mb-4">Find Your Dream Job with FutureJobs</h1>
                <p className="text-lg text-gray-700 mb-6">AI-powered job matching, resume analysis, and career tools for job seekers and employers.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/login">
                    <button className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:scale-105 transition text-base">Get Started</button>
                  </Link>
                  <Link href="/jobs">
                    <button className="bg-white border border-purple-300 text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-purple-50 transition text-base">Browse Jobs</button>
                  </Link>
                </div>
              </>
            )}
          </div>
          {/* Right: Illustration or CTA */}
          <div className="flex-1 md:w-2/5 flex flex-col gap-6 items-center md:items-stretch justify-center">
            <div className="w-full h-64 bg-gradient-to-br from-purple-200 to-cyan-200 rounded-2xl flex items-center justify-center shadow-inner">
              <span className="text-7xl">🚀</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Features Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Sparkles className="w-5 h-5 text-indigo-600" /> AI-Powered Matching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Get job recommendations tailored to your skills, experience, and preferences using advanced AI algorithms.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Verified Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Browse jobs from top-rated, verified employers. All companies are screened for authenticity and quality.</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-violet-50/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <Upload className="w-5 h-5 text-violet-600" /> 1-Click Resume Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">Upload your resume and let our AI parse your skills, experience, and suggest the best jobs instantly.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Resume Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Upload Your Resume in Seconds</h2>
            <p className="text-lg text-slate-600 mb-6">Our AI instantly analyzes your resume, extracts your skills, and matches you to the best jobs. Get an ATS score and personalized feedback.</p>
            <button 
              onClick={() => setIsResumeModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 text-base flex items-center gap-2"
            >
              <Upload className="w-5 h-5" /> Upload Resume
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-6 flex items-center gap-4">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 px-4 py-2 shadow-md">
                  ATS Score
                </Badge>
                <span className="text-lg font-semibold text-slate-800">85%</span>
                <span className="text-slate-500">(Sample Resume)</span>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-white to-emerald-50/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-6 flex items-center gap-4">
                <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 px-4 py-2 shadow-md">
                  Skills Extracted
                </Badge>
                <span className="text-slate-800">React, Node.js, Python, UI/UX, SQL</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Features Section */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-4">
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-6 flex items-center gap-4">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 px-4 py-2 shadow-md">
                  Top Companies
                </Badge>
                <span className="text-lg font-semibold text-slate-800">500+ Verified Employers</span>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-white to-amber-50/30 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="py-6 flex items-center gap-4">
                <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0 px-4 py-2 shadow-md">
                  Fast Hiring
                </Badge>
                <span className="text-slate-800">Avg. 7 days to offer</span>
              </CardContent>
            </Card>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4 text-slate-800">For Employers & Recruiters</h2>
            <p className="text-lg text-slate-600 mb-6">Post jobs, manage applications, and discover top talent with our AI-powered sourcing tools. All for free.</p>
            <Link href="/employer/signup">
              <button className="bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Post a Job
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo/CTA Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-slate-800">See FutureJobs in Action</h2>
          <p className="text-lg text-slate-600 mb-8">Experience the power of AI-driven job search and recruitment. Try our demo or sign up to get started.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/jobs">
                <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 text-base flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> Live Job Search
                </button>
              </Link>
              <Link href="/serpapi-demo">
                <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all duration-300 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> SerpApi Demo
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-white border border-slate-300 text-slate-700 font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-slate-50 transition-all duration-300 text-base flex items-center gap-2">
                  <User className="w-5 h-5" /> Sign Up Free
                </button>
              </Link>
            </div>
        </div>
      </section>

      {/* Footer */}

      {/* Resume Upload Modal */}
      <ResumeUploadModal 
        isOpen={isResumeModalOpen} 
        onClose={() => setIsResumeModalOpen(false)} 
      />
    </main>
  );
} 