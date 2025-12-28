"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, User, Phone, AlertCircle, FileText, MapPin, Briefcase, GraduationCap, DollarSign, Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';

export default function JobSeekerRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skills: '',
    experience: '',
    education: '',
    locationPreference: '',
    salaryExpectation: '',
    jobTypePreference: [] as string[],
    remotePreference: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Check if this is setup mode (coming from role selection)
  useEffect(() => {
    const setup = searchParams.get('setup');
    if (setup === 'true') {
      setIsSetupMode(true);
      if (session?.user) {
        setFormData(prev => ({
          ...prev,
          firstName: session.user.name?.split(' ')[0] || '',
          lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
          email: session.user.email || '',
        }));
      }
    }
  }, [searchParams, session]);

  useEffect(() => {
    if (isSetupMode && status === 'unauthenticated') {
      router.push('/auth/role-selection');
    }
  }, [isSetupMode, status, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleJobTypeChange = (jobType: string) => {
    setFormData(prev => ({
      ...prev,
      jobTypePreference: prev.jobTypePreference.includes(jobType)
        ? prev.jobTypePreference.filter(type => type !== jobType)
        : [...prev.jobTypePreference, jobType]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!isSetupMode && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      setLoading(false);
      return;
    }

    if (!isSetupMode && formData.password.length < 6) {
      setError('Password must be at least 6 characters long!');
      setLoading(false);
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required!');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required!');
      setLoading(false);
      return;
    }
    
    try {
      let response;
      
      if (isSetupMode) {
        response = await fetch('/api/jobseeker/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
            experience: formData.experience,
            education: formData.education,
            locationPreference: formData.locationPreference,
            salaryExpectation: formData.salaryExpectation ? parseInt(formData.salaryExpectation) : null,
            jobTypePreference: formData.jobTypePreference,
            remotePreference: formData.remotePreference
          }),
        });
      } else {
        response = await fetch('/api/auth/register/jobseeker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            role: 'jobseeker',
            skills: formData.skills.split(',').map(skill => skill.trim()).filter(Boolean),
            salaryExpectation: formData.salaryExpectation ? parseInt(formData.salaryExpectation) : null
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (isSetupMode) {
          router.push('/dashboard/jobseeker');
        } else {
          try {
            const result = await signIn('credentials', {
              email: formData.email,
              password: formData.password,
              redirect: false,
            });
            
            if (result?.ok) {
              router.push('/dashboard/jobseeker');
            } else {
              router.push('/auth/signin?registered=true');
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            router.push('/auth/signin?registered=true');
          }
        }
      } else {
        if (data.details && Array.isArray(data.details)) {
          setError(`Validation failed: ${data.details.join(', ')}`);
        } else {
          setError(data.error || (isSetupMode ? 'Profile update failed' : 'Registration failed'));
        }
      }
    } catch (_error) {
      console.error(isSetupMode ? 'Profile update error:' : 'Registration error:', _error);
      setError(isSetupMode ? 'Profile update failed. Please try again.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-0">
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
                {isSetupMode ? 'Complete Your Job Seeker Profile' : 'Create Your Job Seeker Account'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {isSetupMode 
                  ? 'Tell us about yourself to get personalized job recommendations' 
                  : 'Join thousands of professionals and find your dream job'
                }
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-2 block">
                      First Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Last Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  Professional Information
                </h3>
                
                <div>
                  <Label htmlFor="skills" className="text-sm font-medium text-gray-700 mb-2 block">
                    Skills (comma-separated)
                  </Label>
                  <Input
                    id="skills"
                    name="skills"
                    type="text"
                    value={formData.skills}
                    onChange={handleChange}
                    className="h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="JavaScript, React, Node.js, Python"
                  />
                </div>

                <div>
                  <Label htmlFor="experience" className="text-sm font-medium text-gray-700 mb-2 block">
                    Work Experience
                  </Label>
                  <textarea
                    id="experience"
                    name="experience"
                    rows={3}
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm resize-none"
                    placeholder="Brief description of your work experience..."
                  />
                </div>

                <div>
                  <Label htmlFor="education" className="text-sm font-medium text-gray-700 mb-2 block">
                    Education
                  </Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="education"
                      name="education"
                      rows={3}
                      value={formData.education}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-sm resize-none"
                      placeholder="Your educational background..."
                    />
                  </div>
                </div>
              </div>

              {/* Job Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Job Preferences
                </h3>
                
                <div>
                  <Label htmlFor="locationPreference" className="text-sm font-medium text-gray-700 mb-2 block">
                    Preferred Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="locationPreference"
                      name="locationPreference"
                      type="text"
                      value={formData.locationPreference}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="Mumbai, Bangalore, Remote"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="salaryExpectation" className="text-sm font-medium text-gray-700 mb-2 block">
                    Expected Salary (₹ per annum)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="salaryExpectation"
                      name="salaryExpectation"
                      type="number"
                      value={formData.salaryExpectation}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="500000"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preferred Job Types
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {['Full Time', 'Part Time', 'Contract', 'Internship'].map((jobType) => {
                      const jobTypeKey = jobType.toLowerCase().replace(' ', '-');
                      return (
                        <label key={jobTypeKey} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={formData.jobTypePreference.includes(jobTypeKey)}
                            onChange={() => handleJobTypeChange(jobTypeKey)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{jobType}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    id="remotePreference"
                    name="remotePreference"
                    checked={formData.remotePreference}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="remotePreference" className="text-sm text-gray-700 cursor-pointer">
                    Open to remote work
                  </Label>
                </div>
              </div>

              {/* Password - Only show in registration mode */}
              {!isSetupMode && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-blue-600" />
                    Security
                  </h3>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 block">
                      Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50 border-0 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {isSetupMode ? 'Updating Profile...' : 'Creating Account...'}
                  </>
                ) : (
                  isSetupMode ? 'Complete Profile' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Are you an employer?{' '}
                <Link href="/auth/register/employer" className="font-medium text-purple-600 hover:text-purple-700 transition-colors">
                  Create company account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
