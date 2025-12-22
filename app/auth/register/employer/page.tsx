"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Building2, User, Phone, AlertCircle, Globe, Briefcase, MapPin, DollarSign, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';

export default function EmployerRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    recruiterName: '',
    companyWebsite: '',
    companyIndustry: '',
    companySize: '',
    companyFounded: '',
    jobTitle: '',
    jobDescription: '',
    jobLocation: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'INR',
    requiredSkills: '',
    openings: '1',
    isRemote: false,
    isHybrid: false
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

  // Only redirect if in setup mode and not authenticated
  // Normal registration doesn't require authentication
  useEffect(() => {
    if (isSetupMode && status === 'unauthenticated') {
      router.push('/auth/role-selection');
    }
    // If not in setup mode, allow registration without authentication
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

    if (!formData.companyName.trim()) {
      setError('Company name is required!');
      setLoading(false);
      return;
    }
    
    try {
      let response;
      
      if (isSetupMode) {
        // In setup mode, update existing user profile
        response = await fetch('/api/employer/company-profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            companyName: formData.companyName,
            recruiterName: formData.recruiterName,
            companyWebsite: formData.companyWebsite,
            companyIndustry: formData.companyIndustry,
            companySize: formData.companySize,
            companyFounded: formData.companyFounded ? parseInt(formData.companyFounded) : null
          }),
        });
      } else {
        // Normal registration flow
        response = await fetch('/api/auth/register/employer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            role: 'employer', // Set role directly during registration
            requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
            openings: parseInt(formData.openings) || 1,
            salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
            salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
            companyFounded: formData.companyFounded ? parseInt(formData.companyFounded) : null
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (isSetupMode) {
          // Profile updated successfully, redirect to dashboard
          router.push('/dashboard/company');
        } else {
          // User registered successfully - auto-login and redirect to role-selection
          try {
            const result = await signIn('credentials', {
              email: formData.email,
              password: formData.password,
              redirect: false,
            });
            
            if (result?.ok) {
              // Redirect directly to employer dashboard
              router.push('/dashboard/company');
            } else {
              // Fallback: redirect to signin with success message
              router.push('/auth/signin?registered=true');
            }
          } catch (loginError) {
            console.error('Auto-login failed:', loginError);
            // Fallback: redirect to signin
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
      console.error(isSetupMode ? 'Profile update error:' : 'Registration error:', error);
      setError(isSetupMode ? 'Profile update failed. Please try again.' : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSetupMode ? 'Complete Your Company Profile' : 'Create Your Company Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSetupMode 
              ? 'Tell us about your company to start posting jobs and finding talent' 
              : 'Post jobs and find the best talent for your company'
            }
          </p>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Recruiter Information</h3>
              
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="john@company.com"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="+91 98765 43210"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Company Information</h3>
              
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Your Company Ltd."
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="recruiterName" className="block text-sm font-medium text-gray-700 mb-1">
                  Recruiter/HR Name
                </label>
                <input
                  id="recruiterName"
                  name="recruiterName"
                  type="text"
                  value={formData.recruiterName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="HR Manager Name"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Website
                  </label>
                  <input
                    id="companyWebsite"
                    name="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="https://company.com"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="companyIndustry" className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    id="companyIndustry"
                    name="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  >
                    <option value="">Select Size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="companyFounded" className="block text-sm font-medium text-gray-700 mb-1">
                    Founded Year
                  </label>
                  <input
                    id="companyFounded"
                    name="companyFounded"
                    type="number"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={formData.companyFounded}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="2020"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Job Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Job Information</h3>
              
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  name="jobTitle"
                  type="text"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Software Engineer"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description
                </label>
                <textarea
                  id="jobDescription"
                  name="jobDescription"
                  rows={4}
                  value={formData.jobDescription}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Brief description of the job role..."
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Location
                  </label>
                  <input
                    id="jobLocation"
                    name="jobLocation"
                    type="text"
                    value={formData.jobLocation}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Mumbai, Bangalore, Remote"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="openings" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Openings
                  </label>
                  <input
                    id="openings"
                    name="openings"
                    type="number"
                    min="1"
                    value={formData.openings}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="1"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 mb-1">
                  Required Skills (comma-separated)
                </label>
                <input
                  id="requiredSkills"
                  name="requiredSkills"
                  type="text"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="JavaScript, React, Node.js, Python"
                  style={{
                    backgroundColor: 'white',
                    color: '#111827'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Salary (₹)
                  </label>
                  <input
                    id="salaryMin"
                    name="salaryMin"
                    type="number"
                    min="0"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="300000"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Salary (₹)
                  </label>
                  <input
                    id="salaryMax"
                    name="salaryMax"
                    type="number"
                    min="0"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                    placeholder="800000"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="salaryCurrency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    id="salaryCurrency"
                    name="salaryCurrency"
                    value={formData.salaryCurrency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900"
                    style={{
                      backgroundColor: 'white',
                      color: '#111827'
                    }}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isRemote"
                      checked={formData.isRemote}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Remote work</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="isHybrid"
                      checked={formData.isHybrid}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Hybrid work</span>
                  </label>
                </div>
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading 
                ? (isSetupMode ? 'Updating Profile...' : 'Creating Account...') 
                : (isSetupMode ? 'Complete Profile' : 'Create Company Account')
              }
            </button>
          </form>

          {/* Google OAuth removed - using manual registration only */}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-emerald-600 hover:text-emerald-500">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Are you a job seeker?{' '}
              <Link href="/auth/register/jobseeker" className="font-medium text-blue-600 hover:text-blue-500">
                Create job seeker account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
