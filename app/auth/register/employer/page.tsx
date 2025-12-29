"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Building2, User, Phone, AlertCircle, Globe, Briefcase, MapPin, DollarSign, Users, Loader2, Mail, Lock, Calendar } from 'lucide-react';
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
  const { data: session, status } = useSession();

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

    if (!formData.companyName.trim()) {
      setError('Company name is required!');
      setLoading(false);
      return;
    }
    
    try {
      let response;
      
      if (isSetupMode) {
        response = await fetch('/api/employer/company-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
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
        response = await fetch('/api/auth/register/employer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone?.trim() || undefined,
            role: 'employer',
            companyName: formData.companyName.trim(),
            companyWebsite: formData.companyWebsite?.trim() || undefined,
            recruiterName: formData.recruiterName?.trim() || undefined,
            companyIndustry: formData.companyIndustry?.trim() || undefined,
            companySize: formData.companySize?.trim() || undefined,
            companyFounded: formData.companyFounded ? parseInt(formData.companyFounded) : null,
            requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean) : [],
            openings: formData.openings ? parseInt(formData.openings) : 1,
            salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
            salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : null,
            salaryCurrency: formData.salaryCurrency?.trim() || undefined,
            jobTitle: formData.jobTitle?.trim() || undefined,
            jobDescription: formData.jobDescription?.trim() || undefined,
            jobLocation: formData.jobLocation?.trim() || undefined,
            isRemote: formData.isRemote || false,
            isHybrid: formData.isHybrid || false
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        if (isSetupMode) {
          router.push('/dashboard/company');
        } else {
          try {
            const result = await signIn('credentials', {
              email: formData.email,
              password: formData.password,
              redirect: false,
            });
            
            if (result?.ok) {
              router.push('/dashboard/company');
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
          // Format validation errors properly
          const errorMessages = data.details.map((detail: { field?: string; message?: string }) => {
            if (typeof detail === 'string') {
              return detail;
            }
            return detail.message || `${detail.field || 'Field'}: Invalid value`;
          }).join(', ');
          setError(`Validation failed: ${errorMessages}`);
        } else if (data.message) {
          setError(data.message);
        } else {
          setError(data.error || (isSetupMode ? 'Profile update failed' : 'Registration failed'));
        }
      }
    } catch (error: any) {
      console.error(isSetupMode ? 'Profile update error:' : 'Registration error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(isSetupMode ? 'Profile update failed. Please try again.' : 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-0">
          <div className="p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                {isSetupMode ? 'Complete Your Company Profile' : 'Create Your Company Account'}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {isSetupMode 
                  ? 'Tell us about your company to start posting jobs and finding talent' 
                  : 'Post jobs and find the best talent for your company'
                }
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Recruiter Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Recruiter Information
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
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
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
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="john@company.com"
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
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Company Information
                </h3>
                
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Company Name *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="Your Company Ltd."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recruiterName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Recruiter/HR Name
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="recruiterName"
                      name="recruiterName"
                      type="text"
                      value={formData.recruiterName}
                      onChange={handleChange}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="HR Manager Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyWebsite" className="text-sm font-medium text-gray-700 mb-2 block">
                      Company Website
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyWebsite"
                        name="companyWebsite"
                        type="url"
                        value={formData.companyWebsite}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyIndustry" className="text-sm font-medium text-gray-700 mb-2 block">
                      Industry
                    </Label>
                    <select
                      id="companyIndustry"
                      name="companyIndustry"
                      value={formData.companyIndustry}
                      onChange={handleChange}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    <Label htmlFor="companySize" className="text-sm font-medium text-gray-700 mb-2 block">
                      Company Size
                    </Label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    <Label htmlFor="companyFounded" className="text-sm font-medium text-gray-700 mb-2 block">
                      Founded Year
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="companyFounded"
                        name="companyFounded"
                        type="number"
                        min="1800"
                        max={new Date().getFullYear()}
                        value={formData.companyFounded}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  Job Information (Optional)
                </h3>
                
                <div>
                  <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700 mb-2 block">
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="jobDescription" className="text-sm font-medium text-gray-700 mb-2 block">
                    Job Description
                  </Label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    rows={4}
                    value={formData.jobDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-sm resize-none"
                    placeholder="Brief description of the job role..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="jobLocation" className="text-sm font-medium text-gray-700 mb-2 block">
                      Job Location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="jobLocation"
                        name="jobLocation"
                        type="text"
                        value={formData.jobLocation}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="Mumbai, Bangalore, Remote"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="openings" className="text-sm font-medium text-gray-700 mb-2 block">
                      Number of Openings
                    </Label>
                    <Input
                      id="openings"
                      name="openings"
                      type="number"
                      min="1"
                      value={formData.openings}
                      onChange={handleChange}
                      className="h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requiredSkills" className="text-sm font-medium text-gray-700 mb-2 block">
                    Required Skills (comma-separated)
                  </Label>
                  <Input
                    id="requiredSkills"
                    name="requiredSkills"
                    type="text"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    className="h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="JavaScript, React, Node.js, Python"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salaryMin" className="text-sm font-medium text-gray-700 mb-2 block">
                      Min Salary (₹)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="salaryMin"
                        name="salaryMin"
                        type="number"
                        min="0"
                        value={formData.salaryMin}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="300000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salaryMax" className="text-sm font-medium text-gray-700 mb-2 block">
                      Max Salary (₹)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="salaryMax"
                        name="salaryMax"
                        type="number"
                        min="0"
                        value={formData.salaryMax}
                        onChange={handleChange}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                        placeholder="800000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salaryCurrency" className="text-sm font-medium text-gray-700 mb-2 block">
                      Currency
                    </Label>
                    <select
                      id="salaryCurrency"
                      name="salaryCurrency"
                      value={formData.salaryCurrency}
                      onChange={handleChange}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Work Type
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        name="isRemote"
                        checked={formData.isRemote}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Remote work</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
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
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-emerald-600" />
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
                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
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
                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
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
                className="w-full h-12 text-white rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center px-6 py-3 border-0"
                style={{ 
                  background: 'linear-gradient(to right, rgb(5 150 105), rgb(20 184 166))',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(4 120 87), rgb(15 118 110))';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(5 150 105), rgb(20 184 166))';
                  }
                }}
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
                <Link href="/auth/signin" className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                  Sign in
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Are you a job seeker?{' '}
                <Link href="/auth/register/jobseeker" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                  Create job seeker account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
