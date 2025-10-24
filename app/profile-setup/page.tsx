"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase,
  GraduationCap,
  Award,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  
  // Professional Information
  currentTitle: string;
  experience: string;
  skills: string[];
  
  // Education
  education: string;
  
  // Preferences
  jobTypes: string[];
  salaryExpectation: string;
  remotePreference: string;
}

export default function ProfileSetupPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    location: '',
    bio: '',
    currentTitle: '',
    experience: '',
    skills: [],
    education: '',
    jobTypes: [],
    salaryExpectation: '',
    remotePreference: 'hybrid'
  });

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const skillsSuggestions = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++',
    'HTML/CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
    'Git', 'Agile', 'Scrum', 'Project Management', 'UI/UX Design', 'Data Analysis'
  ];

  const jobTypeOptions = [
    'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote'
  ];

  useEffect(() => {
    // Load existing profile data if available
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const profile = await response.json();
          if (profile) {
            setFormData(prev => ({
              ...prev,
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              phone: profile.phone || '',
              location: profile.location || '',
              bio: profile.bio || '',
              skills: profile.skills || [],
              experience: profile.experience || '',
              education: profile.education || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const toggleJobType = (jobType: string) => {
    setFormData(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(jobType)
        ? prev.jobTypes.filter(t => t !== jobType)
        : [...prev.jobTypes, jobType]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard/jobseeker');
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email;
      case 2:
        return formData.currentTitle && formData.experience;
      case 3:
        return formData.skills.length > 0;
      case 4:
        return formData.jobTypes.length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with the basics about you</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Briefcase className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Professional Background</h2>
              <p className="text-gray-600">Share your work experience and current role</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Job Title *
              </label>
              <Input
                value={formData.currentTitle}
                onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                placeholder="e.g., Software Engineer, Marketing Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Experience *
              </label>
              <Textarea
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                placeholder="Describe your work experience, key achievements, and responsibilities..."
                rows={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education
              </label>
              <Textarea
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                placeholder="Your educational background, degrees, certifications..."
                rows={4}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Award className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Skills & Expertise</h2>
              <p className="text-gray-600">What skills do you bring to the table?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Skills *
              </label>
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-3">Suggested skills (click to add):</p>
                <div className="flex flex-wrap gap-2">
                  {skillsSuggestions
                    .filter(skill => !formData.skills.includes(skill))
                    .map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => addSkill(skill)}
                      >
                        {skill} +
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Job Preferences</h2>
              <p className="text-gray-600">What type of opportunities are you looking for?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Types *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {jobTypeOptions.map((jobType) => (
                  <Button
                    key={jobType}
                    variant={formData.jobTypes.includes(jobType) ? "default" : "outline"}
                    onClick={() => toggleJobType(jobType)}
                    className="h-12"
                  >
                    {jobType}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Salary Expectation
              </label>
              <Input
                value={formData.salaryExpectation}
                onChange={(e) => handleInputChange('salaryExpectation', e.target.value)}
                placeholder="e.g., $60,000 - $80,000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remote Work Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['remote', 'hybrid', 'onsite'].map((pref) => (
                  <Button
                    key={pref}
                    variant={formData.remotePreference === pref ? "default" : "outline"}
                    onClick={() => handleInputChange('remotePreference', pref)}
                    className="h-12 capitalize"
                  >
                    {pref}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Help employers find you by completing your profile</p>
          </div>

          {/* Progress */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {Math.round(progressPercentage)}% Complete
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceedToNext()}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceedToNext() || loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? 'Saving...' : 'Complete Profile'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
