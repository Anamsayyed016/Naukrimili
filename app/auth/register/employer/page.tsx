"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Building2, User, Phone, AlertCircle, Globe, Briefcase, MapPin, DollarSign, Users, Loader2, Mail, Lock, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import PasswordStrengthField from '@/components/auth/PasswordStrengthField';
import AuthOptionalSection from '@/components/auth/AuthOptionalSection';
import RegistrationPageShell, { AuthFormSection } from '@/components/auth/RegistrationPageShell';
import { validatePassword, validatePasswordMatch } from '@/lib/auth/password-policy';
import '../../auth-registration.css';

const emeraldInput =
  'auth-register-input pl-10 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500';
const emeraldInputPlain =
  'auth-register-input focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500';
const emeraldSelect =
  'auth-register-select focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500';

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
    
    if (!isSetupMode) {
      const pwCheck = validatePassword(formData.password);
      if (!pwCheck.valid) {
        setError(pwCheck.error || 'Please choose a stronger password.');
        setLoading(false);
        return;
      }
      const matchCheck = validatePasswordMatch(formData.password, formData.confirmPassword);
      if (!matchCheck.valid) {
        setError(matchCheck.error || 'Passwords do not match.');
        setLoading(false);
        return;
      }
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
    <RegistrationPageShell
      variant="employer"
      title={isSetupMode ? 'Complete Your Company Profile' : 'Create Your Company Account'}
      subtitle={
        isSetupMode
          ? 'Finish your company profile to start hiring'
          : 'Recruiter email signup — under a minute'
      }
    >
      <form className="auth-register-form" onSubmit={handleSubmit}>
              <AuthFormSection title="Recruiter account" icon={User}>
                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="firstName" className="auth-register-label mb-2 block">
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
                        className={emeraldInput}
                        placeholder="John"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="auth-register-label mb-2 block">
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
                        className={emeraldInput}
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="email" className="auth-register-label mb-1.5 block">
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
                      className={emeraldInput}
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="phone" className="auth-register-label mb-1.5 block">
                    Phone (optional)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={emeraldInput}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </AuthFormSection>

              <AuthFormSection title="Company details" icon={Building2}>
                <div>
                  <Label htmlFor="companyName" className="auth-register-label mb-2 block">
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
                      className={emeraldInput}
                      placeholder="Your Company Ltd."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recruiterName" className="auth-register-label mb-2 block">
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
                      className={emeraldInput}
                      placeholder="HR Manager Name"
                    />
                  </div>
                </div>

                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="companyWebsite" className="auth-register-label mb-1.5 block">
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
                        className={emeraldInput}
                        placeholder="https://company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="companyIndustry" className="auth-register-label mb-2 block">
                      Industry
                    </Label>
                    <select
                      id="companyIndustry"
                      name="companyIndustry"
                      value={formData.companyIndustry}
                      onChange={handleChange}
                      className={emeraldSelect}
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

                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="companySize" className="auth-register-label mb-1.5 block">
                      Company Size
                    </Label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className={emeraldSelect}
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
                    <Label htmlFor="companyFounded" className="auth-register-label mb-2 block">
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
                        className={emeraldInput}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </div>
              </AuthFormSection>

              {!isSetupMode && (
                <AuthFormSection title="Password" icon={Lock}>
                  <PasswordStrengthField
                    password={formData.password}
                    confirmPassword={formData.confirmPassword}
                    onPasswordChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                    onConfirmChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
                    accent="emerald"
                    disabled={loading}
                  />
                </AuthFormSection>
              )}

              <AuthOptionalSection title="First job posting" icon={Briefcase} hint="Optional — add after signup">
                
                <div>
                  <Label htmlFor="jobTitle" className="auth-register-label mb-2 block">
                    Job Title
                  </Label>
                  <Input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className={emeraldInputPlain}
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="jobDescription" className="auth-register-label mb-2 block">
                    Job Description
                  </Label>
                  <textarea
                    id="jobDescription"
                    name="jobDescription"
                    rows={2}
                    value={formData.jobDescription}
                    onChange={handleChange}
                    className="auth-register-textarea w-full focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500"
                    placeholder="Brief description of the job role..."
                  />
                </div>

                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="jobLocation" className="auth-register-label mb-1.5 block">
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
                        className={emeraldInput}
                        placeholder="Mumbai, Bangalore, Remote"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="openings" className="auth-register-label mb-2 block">
                      Number of Openings
                    </Label>
                    <Input
                      id="openings"
                      name="openings"
                      type="number"
                      min="1"
                      value={formData.openings}
                      onChange={handleChange}
                      className={emeraldInputPlain}
                      placeholder="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="requiredSkills" className="auth-register-label mb-2 block">
                    Required Skills (comma-separated)
                  </Label>
                  <Input
                    id="requiredSkills"
                    name="requiredSkills"
                    type="text"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    className={emeraldInputPlain}
                    placeholder="JavaScript, React, Node.js, Python"
                  />
                </div>

                <div className="auth-register-field-grid auth-register-field-grid--2 auth-register-field-grid--3">
                  <div>
                    <Label htmlFor="salaryMin" className="auth-register-label mb-2 block">
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
                        className={emeraldInput}
                        placeholder="300000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salaryMax" className="auth-register-label mb-2 block">
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
                        className={emeraldInput}
                        placeholder="800000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salaryCurrency" className="auth-register-label mb-2 block">
                      Currency
                    </Label>
                    <select
                      id="salaryCurrency"
                      name="salaryCurrency"
                      value={formData.salaryCurrency}
                      onChange={handleChange}
                      className={emeraldSelect}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="auth-register-label mb-2 block">Work Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="auth-register-check">
                      <input
                        type="checkbox"
                        name="isRemote"
                        checked={formData.isRemote}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700">Remote work</span>
                    </label>
                    <label className="auth-register-check">
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
              </AuthOptionalSection>

              <div className="auth-register-cta">
                {error && (
                  <Alert className="border-red-200 bg-red-50 border-0 rounded-xl">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <button type="submit" disabled={loading} className="auth-register-submit">
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin shrink-0" aria-hidden />
                      <span>{isSetupMode ? 'Updating Profile...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <span>{isSetupMode ? 'Complete Profile' : 'Create Account'}</span>
                  )}
                </button>
              </div>
            </form>

      <div className="auth-register-footer space-y-2">
        <p>
          Already have an account? <Link href="/auth/signin">Sign in</Link>
        </p>
        <p>
          Are you a job seeker? <Link href="/auth/register/jobseeker">Create job seeker account</Link>
        </p>
      </div>
    </RegistrationPageShell>
  );
}
