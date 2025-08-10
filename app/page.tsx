"use client";

import Link from 'next/link';
import { Brain, Shield, Zap, Search, MapPin, TrendingUp, Users, Building2, ArrowRight, Upload, FileText, User, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';

export default function HomePage() {
  const [uploadedResume, setUploadedResume] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload/resume', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUploadProgress(100);
          setUploadedResume(file);
          setTimeout(() => {
            setIsUploading(false);
          }, 500);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      alert('Failed to upload resume. Please try again.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      handleFileUpload(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center text-white">
              {/* Removed duplicate standalone brand logo/title to keep a single logo in navbar */}
              <div className="sr-only">
                {/* Accessible heading (kept for SEO/a11y, visually hidden) */}
                <h1>NaukriMili - AI Powered Job Portal</h1>
              </div>

              {/* Main Headline */}
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Find Your Dream Job
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-purple-400 bg-clip-text text-transparent">
                  with AI Power
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                Discover thousands of job opportunities across India with our intelligent 
                matching system. Your perfect career is just a search away.
              </p>

              {/* Search Section */}
              <div className="max-w-4xl mx-auto mb-12">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="Job title, skills, or company..."
                        className="w-full pl-12 pr-4 py-4 text-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-lg"
                      />
                    </div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        placeholder="City, state, or remote..."
                        className="w-full pl-12 pr-4 py-4 text-gray-900 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-lg"
                      />
                    </div>
                    <Link href="/jobs" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
                      🚀 Search Jobs
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-blue-300">50,000+</div>
                  <div className="text-blue-100">Active Jobs</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-blue-300">15,000+</div>
                  <div className="text-blue-100">Top Companies</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold text-blue-300">1M+</div>
                  <div className="text-blue-100">Job Seekers</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resume Upload Section */}
      <section className="py-16 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upload Your Resume & Get Discovered
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Upload your resume to unlock personalized job recommendations and get discovered by top employers
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {!uploadedResume && !isUploading ? (
              <div className="text-center">
                <div 
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-blue-300 rounded-xl p-12 hover:border-blue-400 transition-colors cursor-pointer group"
                >
                  <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your resume here</h3>
                  <p className="text-gray-600 mb-4">or click to browse files</p>
                  <div className="text-sm text-gray-500">
                    Supported formats: PDF, DOC, DOCX (Max 10MB)
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : isUploading ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Uploading Resume...</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-gray-600">{uploadProgress}% complete</p>
              </div>
            ) : (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Resume Uploaded Successfully!</h3>
                <div className="flex items-center justify-center text-gray-600 mb-6">
                  <FileText className="h-5 w-5 mr-2" />
                  <span>{uploadedResume?.name}</span>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={triggerFileSelect}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload New Resume
                  </button>
                  <Link
                    href="/profile"
                    className="border border-blue-600 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Login/Register Quick Access */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of professionals who found their dream jobs through NaukriMili
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h3>
                <p className="text-gray-600">Sign in to access your personalized job dashboard</p>
              </div>
              <div className="space-y-4">
                <Link
                  href="/auth/login"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors text-center block"
                >
                  Sign In
                </Link>
                <div className="text-center text-sm text-gray-500">
                  Access your saved jobs, applications, and more
                </div>
              </div>
            </div>

            {/* Register Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Join NaukriMili</h3>
                <p className="text-gray-600">Create your account and start your career journey</p>
              </div>
              <div className="space-y-4">
                <Link
                  href="/auth/register"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all text-center block"
                >
                  Create Account
                </Link>
                <div className="text-center text-sm text-gray-500">
                  Get AI-powered job recommendations
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI-Powered </span>
              Job Search?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of job hunting with our advanced AI technology 
              that understands your career goals and matches you with perfect opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* AI Matching */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 group-hover:border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart AI Matching</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our advanced AI analyzes your skills, experience, and preferences to find 
                  jobs that perfectly match your career aspirations and growth potential.
                </p>
              </div>
            </div>

            {/* Security */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 group-hover:border-green-200">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure & Private</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your personal information and job search activity are protected with 
                  enterprise-grade security. Search confidently and maintain your privacy.
                </p>
              </div>
            </div>

            {/* Fast Results */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100 group-hover:border-blue-200">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get instant job recommendations and real-time notifications for new 
                  opportunities. Never miss out on your dream job again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Trending Job Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore high-demand career opportunities across India's top industries
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'IT & Software', count: '25,000+', icon: '💻', color: 'from-blue-500 to-purple-600' },
              { name: 'Banking & Finance', count: '15,000+', icon: '💰', color: 'from-green-500 to-blue-600' },
              { name: 'Healthcare', count: '12,000+', icon: '🏥', color: 'from-red-500 to-pink-600' },
              { name: 'Sales & Marketing', count: '18,000+', icon: '📈', color: 'from-orange-500 to-red-600' },
              { name: 'Engineering', count: '20,000+', icon: '⚙️', color: 'from-gray-600 to-blue-600' },
              { name: 'Education', count: '8,000+', icon: '📚', color: 'from-purple-500 to-pink-600' },
              { name: 'Design & Creative', count: '6,000+', icon: '🎨', color: 'from-pink-500 to-purple-600' },
              { name: 'Human Resources', count: '7,000+', icon: '👥', color: 'from-indigo-500 to-blue-600' },
            ].map((category) => (
              <Link
                key={category.name}
                href={`/jobs?category=${category.name.toLowerCase()}`}
                className="group relative overflow-hidden bg-white rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative p-6 text-center">
                  <div className="text-4xl mb-4">{category.icon}</div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 text-sm">{category.count} jobs available</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Top Companies Hiring
            </h2>
            <p className="text-xl text-gray-600">
              Join industry leaders and grow your career with top employers
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
            {[
              { name: 'TechCorp India', logo: '🚀', openJobs: 25, industry: 'Technology' },
              { name: 'MarketPro Solutions', logo: '📈', openJobs: 15, industry: 'Marketing' },
              { name: 'Design Studio', logo: '🎨', openJobs: 8, industry: 'Design' },
              { name: 'FinTech Solutions', logo: '💰', openJobs: 20, industry: 'Finance' },
              { name: 'HealthTech', logo: '🏥', openJobs: 12, industry: 'Healthcare' },
              { name: 'EduTech', logo: '📚', openJobs: 16, industry: 'Education' },
              { name: 'Analytics Hub', logo: '📊', openJobs: 10, industry: 'Data Science' },
              { name: 'CloudTech', logo: '☁️', openJobs: 18, industry: 'Cloud Computing' },
              { name: 'StartupXYZ', logo: '💡', openJobs: 14, industry: 'Startup' },
              { name: 'GlobalTech', logo: '🌍', openJobs: 22, industry: 'Remote Work' },
              { name: 'AI Innovations', logo: '🤖', openJobs: 19, industry: 'Artificial Intelligence' },
              { name: 'GreenTech', logo: '🌱', openJobs: 11, industry: 'Sustainability' },
            ].map((company) => (
              <Link
                key={company.name}
                href={`/companies?company=${company.name.toLowerCase()}`}
                className="group bg-gray-50 hover:bg-blue-50 rounded-xl p-6 text-center transition-all hover:shadow-lg transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{company.logo}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 text-sm">
                  {company.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1">{company.industry}</p>
                <p className="text-xs text-blue-600 font-medium">{company.openJobs} open positions</p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/companies"
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              View All Companies
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured Job Opportunities
            </h2>
            <p className="text-xl text-gray-600">
              Discover exciting career opportunities from top companies
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[
              {
                title: 'Senior Software Engineer',
                company: 'TechCorp India',
                location: 'Bangalore',
                salary: '₹15-25 LPA',
                type: 'Full-time',
                isRemote: true,
                isUrgent: false,
                posted: '2 days ago'
              },
              {
                title: 'Product Manager',
                company: 'StartupXYZ',
                location: 'Mumbai',
                salary: '₹20-35 LPA',
                type: 'Full-time',
                isRemote: false,
                isUrgent: true,
                posted: '1 day ago'
              },
              {
                title: 'UI/UX Designer',
                company: 'Design Studio',
                location: 'Delhi',
                salary: '₹8-15 LPA',
                type: 'Full-time',
                isRemote: true,
                isUrgent: false,
                posted: '3 days ago'
              },
              {
                title: 'Data Scientist',
                company: 'Analytics Hub',
                location: 'Hyderabad',
                salary: '₹12-22 LPA',
                type: 'Full-time',
                isRemote: true,
                isUrgent: false,
                posted: '1 day ago'
              },
              {
                title: 'Digital Marketing Manager',
                company: 'MarketPro Solutions',
                location: 'Pune',
                salary: '₹10-18 LPA',
                type: 'Full-time',
                isRemote: false,
                isUrgent: true,
                posted: '2 days ago'
              },
              {
                title: 'DevOps Engineer',
                company: 'CloudTech',
                location: 'Chennai',
                salary: '₹14-25 LPA',
                type: 'Full-time',
                isRemote: true,
                isUrgent: false,
                posted: '1 day ago'
              }
            ].map((job, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-blue-600 font-semibold mb-1">{job.company}</p>
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{job.location}</span>
                      {job.isRemote && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Remote</span>}
                    </div>
                  </div>
                  {job.isUrgent && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Urgent
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-green-600 font-bold">{job.salary}</span>
                  <span className="text-gray-500 text-sm">{job.posted}</span>
                </div>
                
                <Link
                  href={`/jobs/${index + 1}`}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/jobs"
              className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              View All Jobs
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join millions of job seekers who have discovered their dream careers through 
            NaukriMili's AI-powered platform. Your next opportunity is waiting.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/jobs" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center">
              🔍 Start Job Search
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/auth/register" className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20 hover:border-white/40">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}