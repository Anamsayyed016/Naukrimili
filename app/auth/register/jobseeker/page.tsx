"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { User, Phone, AlertCircle, Briefcase, DollarSign, Loader2, Mail, Lock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import JobseekerPhoneVerification from '@/components/auth/JobseekerPhoneVerification';
import PasswordStrengthField from '@/components/auth/PasswordStrengthField';
import AuthOptionalSection from '@/components/auth/AuthOptionalSection';
import RegistrationPageShell, { AuthFormSection } from '@/components/auth/RegistrationPageShell';
import { OTP_AUTH_ENABLED_CLIENT } from '@/lib/auth/auth-features';
import { validateIndianMobile } from '@/lib/auth/phone-utils';
import { validatePassword, validatePasswordMatch } from '@/lib/auth/password-policy';
import { getJobseekerPostLoginRedirect } from '@/lib/resume-builder/jobseeker-entry-redirect';
import {
  clearWorkspacePreferenceCache,
  ensureWorkspacePreferenceOwnedBy,
} from '@/lib/preferences/workspace-preference';
import '../../auth-registration.css';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);
  
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

    if (!isSetupMode && formData.phone.trim()) {
      const phoneCheck = validateIndianMobile(formData.phone);
      if (!phoneCheck.valid) {
        setError(phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number.');
        setLoading(false);
        return;
      }
      if (OTP_AUTH_ENABLED_CLIENT && (!phoneVerified || !phoneVerificationToken)) {
        setError('Please verify your mobile number with OTP before registering.');
        setLoading(false);
        return;
      }
    }

    if (!isSetupMode && OTP_AUTH_ENABLED_CLIENT) {
      const phoneCheck = validateIndianMobile(formData.phone);
      if (!phoneCheck.valid) {
        setError('Mobile number is required for registration.');
        setLoading(false);
        return;
      }
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
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            password: formData.password,
            phone: formData.phone?.trim() || undefined,
            phoneVerificationToken: OTP_AUTH_ENABLED_CLIENT
              ? phoneVerificationToken || undefined
              : undefined,
            role: 'jobseeker',
            skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(Boolean) : [],
            experience: formData.experience?.trim() || undefined,
            education: formData.education?.trim() || undefined,
            locationPreference: formData.locationPreference?.trim() || undefined,
            salaryExpectation: formData.salaryExpectation ? parseInt(formData.salaryExpectation) : null,
            jobTypePreference: formData.jobTypePreference || [],
            remotePreference: formData.remotePreference || false
          }),
        });
      }

      const data = await response.json();

      if (data.success) {
        // CRITICAL: a brand-new jobseeker has no business inheriting any
        // workspace preference left over from another account on this device.
        // Wipe the local cache before we compute the post-signup destination
        // so the workspace selector is guaranteed to show (unless an active
        // resume-builder payment intent says otherwise — that always wins).
        clearWorkspacePreferenceCache();
        console.log('🧹 [Registration] Cleared local workspace cache for fresh signup');

        if (isSetupMode) {
          const ownerKey = formData.email || null;
          const target = getJobseekerPostLoginRedirect(ownerKey);
          console.log('🎯 [Registration] Setup-mode complete → routing to', target);
          router.push(target);
        } else {
          try {
            const result = await signIn('credentials', {
              email: formData.email,
              password: formData.password,
              redirect: false,
            });

            if (result?.ok) {
              // Try to read the freshly-issued session so we can stamp the
              // owner key onto any future preference write. Fall back to the
              // submitted email if the session fetch fails for any reason.
              let ownerKey: string | null = formData.email || null;
              try {
                const sessRes = await fetch('/api/auth/session');
                if (sessRes.ok) {
                  const sess = await sessRes.json();
                  const sessionUser = sess?.user as { id?: string; email?: string } | undefined;
                  ownerKey =
                    sessionUser?.id ||
                    sessionUser?.email ||
                    formData.email ||
                    null;
                  console.log('👤 [Registration] Owner key for post-signup redirect:', ownerKey);
                }
              } catch (sessionErr) {
                console.warn('[Registration] Session fetch failed, using email as owner key', sessionErr);
              }

              // Defence-in-depth: also wipe any pollution that might still
              // claim ownership for a different user.
              ensureWorkspacePreferenceOwnedBy(ownerKey);

              const target = getJobseekerPostLoginRedirect(ownerKey);
              console.log('🎯 [Registration] Auto-login OK → routing to', target);
              router.push(target);
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
      variant="jobseeker"
      title={isSetupMode ? 'Complete Your Job Seeker Profile' : 'Create Your Job Seeker Account'}
      subtitle={
        isSetupMode
          ? 'A few details help us personalize your job matches'
          : 'Email signup — takes about a minute'
      }
    >
            <form className="auth-register-form" onSubmit={handleSubmit}>
              <AuthFormSection title="Account details" icon={User}>
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
                        className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
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
                        className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
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
                      className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  {!isSetupMode && OTP_AUTH_ENABLED_CLIENT ? (
                    <JobseekerPhoneVerification
                      phone={formData.phone.replace(/\D/g, '').slice(0, 10)}
                      onPhoneChange={(value) => {
                        setFormData((prev) => ({ ...prev, phone: value }));
                        setPhoneVerified(false);
                        setPhoneVerificationToken(null);
                      }}
                      onVerified={(token, phone) => {
                        setPhoneVerificationToken(token);
                        setPhoneVerified(true);
                        setFormData((prev) => ({ ...prev, phone }));
                      }}
                      verified={phoneVerified}
                      disabled={loading}
                    />
                  ) : (
                    <>
                      <Label htmlFor="phone" className="auth-register-label mb-1.5 block">
                        Mobile {isSetupMode ? '' : '(optional)'}
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                          placeholder="10-digit mobile"
                        />
                      </div>
                    </>
                  )}
                </div>
              </AuthFormSection>

              {!isSetupMode && (
                <AuthFormSection title="Password" icon={Lock}>
                  <PasswordStrengthField
                    password={formData.password}
                    confirmPassword={formData.confirmPassword}
                    onPasswordChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                    onConfirmChange={(value) => setFormData((prev) => ({ ...prev, confirmPassword: value }))}
                    accent="blue"
                    disabled={loading}
                  />
                </AuthFormSection>
              )}

              <AuthOptionalSection title="Profile & job preferences" icon={Briefcase}>
                <div>
                  <Label htmlFor="skills" className="auth-register-label mb-1.5 block">
                    Skills (comma-separated)
                  </Label>
                  <Input
                    id="skills"
                    name="skills"
                    type="text"
                    value={formData.skills}
                    onChange={handleChange}
                    className="auth-register-input focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                    placeholder="JavaScript, React, Python"
                  />
                </div>
                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="experience" className="auth-register-label mb-1.5 block">
                      Experience
                    </Label>
                    <textarea
                      id="experience"
                      name="experience"
                      rows={2}
                      value={formData.experience}
                      onChange={handleChange}
                      className="auth-register-textarea w-full focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                      placeholder="Brief work summary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="education" className="auth-register-label mb-1.5 block">
                      Education
                    </Label>
                    <textarea
                      id="education"
                      name="education"
                      rows={2}
                      value={formData.education}
                      onChange={handleChange}
                      className="auth-register-textarea w-full focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                      placeholder="Degree, institute"
                    />
                  </div>
                </div>
                <div className="auth-register-field-grid auth-register-field-grid--2">
                  <div>
                    <Label htmlFor="locationPreference" className="auth-register-label mb-1.5 block">
                      Preferred location
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="locationPreference"
                        name="locationPreference"
                        type="text"
                        value={formData.locationPreference}
                        onChange={handleChange}
                        className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                        placeholder="City or Remote"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salaryExpectation" className="auth-register-label mb-1.5 block">
                      Expected salary (₹/year)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="salaryExpectation"
                        name="salaryExpectation"
                        type="number"
                        value={formData.salaryExpectation}
                        onChange={handleChange}
                        className="auth-register-input pl-10 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                        placeholder="500000"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="auth-register-label mb-1.5 block">Job types</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Full Time', 'Part Time', 'Contract', 'Internship'].map((jobType) => {
                      const jobTypeKey = jobType.toLowerCase().replace(' ', '-');
                      return (
                        <label key={jobTypeKey} className="auth-register-check">
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
                <label className="auth-register-check">
                  <input
                    type="checkbox"
                    id="remotePreference"
                    name="remotePreference"
                    checked={formData.remotePreference}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Open to remote work</span>
                </label>
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
          Are you an employer? <Link href="/auth/register/employer">Create company account</Link>
        </p>
      </div>
    </RegistrationPageShell>
  );
}
