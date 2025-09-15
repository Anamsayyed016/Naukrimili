"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, User, Phone, AlertCircle, FileText, MapPin, Briefcase, GraduationCap, DollarSign } from 'lucide-react';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useAuth } from '@/hooks/useAuth';
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
  // const { login } = useAuth(); // Removed - using NextAuth instead
  const { data: session, status } = useSession();

  // Check if this is setup mode (coming from role selection)
  useEffect(() => {
    const setup = searchParams.get('setup');
    if (setup === 'true') {
      setIsSetupMode(true);
      // Pre-fill with session data if available
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

  // Redirect if not authenticated in setup mode
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
    
    // Basic validation
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
        // In setup mode, update existing user profile
        response = await fetch('/api/jobseeker/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
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
        // Normal registration flow
        response = await fetch('/api/auth/register/jobseeker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          // Profile updated successfully, redirect to dashboard
          router.push('/dashboard/jobseeker');
        } else {
          // User registered successfully - NextAuth will handle session
          
          // Redirect to jobseeker dashboard
          router.push('/dashboard/jobseeker');
        }
      } else {
        if (data.details && Array.isArray(data.details)) {
          setError(`Validation failed: ${data.details.join(', ')}`);
        } else {
          setError(data.error || (isSetupMode ? 'Profile update failed' : 'Registration failed'));
        }
      }
    } catch (error) {
      console.error(isSetupMode ? 'Profile update error:' : 'Registration error:', error);
      setError(isSetupMode ? 'Profile update failed. Please try again.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSetupMode ? 'Complete Your Job Seeker Profile' : 'Create Your Job Seeker Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSetupMode 
              ? 'Tell us about yourself to get personalized job recommendations' 
              : 'Join thousands of professionals and find your dream job'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="John"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Doe"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="john@example.com"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="+91 98765 43210"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
              
              <div>
                <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma-separated)
                </label>
                <input
                  id="skills"
                  name="skills"
                  type="text"
                  value={formData.skills}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="JavaScript, React, Node.js, Python"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Work Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  rows={3}
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Brief description of your work experience..."
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                  Education
                </label>
                <textarea
                  id="education"
                  name="education"
                  rows={3}
                  value={formData.education}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Your educational background..."
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            {/* Job Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Preferences</h3>
              
              <div>
                <label htmlFor="locationPreference" className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Location
                </label>
                <input
                  id="locationPreference"
                  name="locationPreference"
                  type="text"
                  value={formData.locationPreference}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Mumbai, Bangalore, Remote"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="salaryExpectation" className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Salary (₹ per annum)
                </label>
                <input
                  id="salaryExpectation"
                  name="salaryExpectation"
                  type="number"
                  value={formData.salaryExpectation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="500000"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Job Types
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['full-time', 'part-time', 'contract', 'internship'].map((jobType) => (
                    <label key={jobType} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="jobTypePreference"
                        checked={formData.jobTypePreference.includes(jobType)}
                        onChange={() => handleJobTypeChange(jobType)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{jobType.replace('-', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remotePreference"
                  name="remotePreference"
                  checked={formData.remotePreference}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remotePreference" className="text-sm text-gray-700">
                  Open to remote work
                </label>
              </div>
            </div>

            {/* Password - Only show in registration mode */}
            {!isSetupMode && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Security</h3>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                      placeholder="••••••••"
                      style={{
                        backgroundColor: 'white',
                        color: '#111827',
                        WebkitTextFillColor: '#111827'
                      }}
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
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                      placeholder="••••••••"
                      style={{
                        backgroundColor: 'white',
                        color: '#111827',
                        WebkitTextFillColor: '#111827'
                      }}
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading 
                ? (isSetupMode ? 'Updating Profile...' : 'Creating Account...') 
                : (isSetupMode ? 'Complete Profile' : 'Create Job Seeker Account')
              }
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <OAuthButtons callbackUrl="/resumes/upload" />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Are you an employer?{' '}
              <Link href="/auth/register/employer" className="font-medium text-emerald-600 hover:text-emerald-500">
                Create company account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
