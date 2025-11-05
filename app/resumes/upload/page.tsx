'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ResumeUpload from '@/components/resume/ResumeUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, FileText, Sparkles, TrendingUp, CheckCircle, User, MapPin, 
  Briefcase, DollarSign, Target, ArrowRight, Eye, Building2, Heart, Loader2, Search
} from 'lucide-react';
import Link from 'next/link';

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salary?: string;
  isRemote: boolean;
  matchScore: number;
  matchReasons: string[];
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Flow states
  const [currentStep, setCurrentStep] = useState<'upload' | 'profile' | 'recommendations'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    currentRole: '',
    experienceLevel: '',
    preferredLocation: '',
    salaryExpectation: '',
    jobType: 'Full-time'
  });
  const [saving, setSaving] = useState(false);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/resumes/upload');
    } else if (session && session.user.role !== 'jobseeker') {
      router.push('/auth/role-selection');
    }
  }, [status, session, router]);

  // Step 1: Resume Upload Complete
  const handleUploadComplete = (data?: any) => {
    if (data?.extractedData) {
      // Pre-fill form from extracted data
      setFormData(prev => ({
        ...prev,
        firstName: data.extractedData.name?.split(' ')[0] || '',
        lastName: data.extractedData.name?.split(' ').slice(1).join(' ') || '',
        phone: data.extractedData.phone || '',
        location: data.extractedData.location || '',
        preferredLocation: data.extractedData.location || ''
      }));
      setExtractedData(data.extractedData);
    }
    
    toast({
      title: '✅ Resume Uploaded!',
      description: 'Now complete your profile to get job matches...',
    });
    
    setCurrentStep('profile');
  };

  // Step 2: Profile Form Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Save profile
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          location: formData.location,
          locationPreference: formData.preferredLocation,
          salaryExpectation: formData.salaryExpectation ? parseInt(formData.salaryExpectation) : undefined,
          jobTypePreference: [formData.jobType],
          experience: formData.experienceLevel,
          bio: `${formData.currentRole} with ${formData.experienceLevel} experience`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      toast({
        title: '✅ Profile Saved!',
        description: 'Loading job recommendations...',
      });

      // Move to recommendations step
      setCurrentStep('recommendations');
      fetchRecommendations();

    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Fetch job recommendations
  const fetchRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await fetch('/api/jobseeker/recommendations?limit=10&algorithm=hybrid');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecommendations(data.data.jobs);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {currentStep === 'upload' && 'Upload Your Resume'}
                {currentStep === 'profile' && 'Complete Your Profile'}
                {currentStep === 'recommendations' && 'Your Job Matches'}
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                {currentStep === 'upload' && 'AI-powered resume analysis'}
                {currentStep === 'profile' && 'Just a few details to find perfect matches'}
                {currentStep === 'recommendations' && 'Jobs matched to your profile'}
              </p>
            </div>
            {currentStep === 'upload' && (
              <Link href="/dashboard/jobseeker">
                <Button variant="outline" className="hidden sm:inline-flex">
                  <FileText className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-2 w-2 rounded-full ${currentStep === 'upload' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <div className={`h-2 w-2 rounded-full ${currentStep === 'profile' ? 'bg-blue-500' : currentStep === 'recommendations' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className={`h-2 w-2 rounded-full ${currentStep === 'recommendations' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* STEP 1: Resume Upload */}
        {currentStep === 'upload' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
            <Card className="shadow-2xl border-0">
              <CardContent className="p-8 lg:p-12">
                <ResumeUpload onComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2: Single Dynamic Profile Form */}
        {currentStep === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
            <Card className="shadow-2xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      Complete Your Profile
                      <Badge className="bg-blue-600 text-white">Step 2 of 3</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Help us find the perfect jobs for you
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name *
                      </Label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                        required
                        className="h-11 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Last Name</Label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                        className="h-11 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Phone Number</Label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                        className="h-11 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Current Location
                      </Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Mumbai, India"
                        className="h-11 bg-white"
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        What role are you looking for? *
                      </Label>
                      <Input
                        value={formData.currentRole}
                        onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                        placeholder="e.g., Software Developer"
                        required
                        className="h-11 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Experience Level *</Label>
                      <Select 
                        value={formData.experienceLevel} 
                        onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
                      >
                        <SelectTrigger className="h-11 bg-white">
                          <SelectValue placeholder="Select your experience" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[10000]">
                          <SelectItem value="0-1 years">Entry Level (0-1 years)</SelectItem>
                          <SelectItem value="1-3 years">Junior (1-3 years)</SelectItem>
                          <SelectItem value="3-5 years">Mid Level (3-5 years)</SelectItem>
                          <SelectItem value="5-8 years">Senior (5-8 years)</SelectItem>
                          <SelectItem value="8+ years">Lead/Expert (8+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Preferred Location
                      </Label>
                      <Input
                        value={formData.preferredLocation}
                        onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                        placeholder="Bangalore, India"
                        className="h-11 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Expected Salary (Annual)
                      </Label>
                      <Input
                        type="number"
                        value={formData.salaryExpectation}
                        onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                        placeholder="500000"
                        className="h-11 bg-white"
                      />
                    </div>
                  </div>

                  {/* AI Pre-fill Banner */}
                  {extractedData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900">AI extracted your information</p>
                          <p className="text-xs text-green-700 mt-1">Review and update any details before continuing</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/jobseeker')}
                      className="w-full sm:w-auto order-2 sm:order-1"
                    >
                      Skip for Now
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !formData.firstName || !formData.currentRole || !formData.experienceLevel}
                      className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg order-1 sm:order-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Get Job Recommendations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Job Recommendations (Same Page) */}
        {currentStep === 'recommendations' && (
          <div className="animate-in slide-in-from-right duration-500">
            <Card className="shadow-xl border-0 mb-6">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        Profile Complete!
                        <Badge className="bg-green-600 text-white">Step 3 of 3</Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Here are {recommendations.length} jobs matched to your profile
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/jobseeker">
                    <Button variant="outline">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>

            {/* Recommendations List */}
            {loadingRecommendations ? (
              <div className="text-center py-16">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-gray-600">Finding perfect jobs for you...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((job) => (
                  <Card key={job.id} className="group hover:shadow-2xl hover:border-blue-300 transition-all duration-300 border-2">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                              {job.title}
                            </h3>
                            {job.matchScore >= 70 && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                                {job.matchScore}% Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="hover:bg-red-50 hover:text-red-600">
                          <Heart className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          {job.location}
                          {job.isRemote && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Remote
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-purple-500" />
                          {job.jobType}
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-2 font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            {job.salary}
                          </div>
                        )}
                      </div>

                      {job.matchReasons && job.matchReasons.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-900 mb-2">Why this matches:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.matchReasons.map((reason, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-white text-blue-700">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href={`/jobs/${job.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/apply`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                            Apply Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <CardContent>
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No matches found yet</h3>
                  <p className="text-gray-600 mb-6">
                    We'll find jobs that match your profile soon. Meanwhile, browse all jobs.
                  </p>
                  <Link href="/jobs">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Search className="h-4 w-4 mr-2" />
                      Browse All Jobs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
