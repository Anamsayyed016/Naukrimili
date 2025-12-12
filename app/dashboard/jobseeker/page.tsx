"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  Building2, 
  Eye,
  Bookmark,
  FileText,
  User,
  ArrowRight,
  Upload,
  Heart,
  DollarSign,
  Target,
  CheckCircle,
  Edit,
  TrendingUp,
  Sparkles,
  Filter
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AuthGuard from "@/components/auth/AuthGuard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  totalBookmarks: number;
  totalResumes: number;
  profileCompletion: number;
}

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
  createdAt: string;
  description?: string;
}

export default function JobSeekerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Smart wizard state for mobile - guides user through steps
  const [currentWizardStep, setCurrentWizardStep] = useState<'resume' | 'profile' | 'recommendations'>('resume');
  
  // Client-side filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Client-side filtering logic
  useEffect(() => {
    if (recommendations.length === 0) {
      setFilteredJobs([]);
      return;
    }

    let filtered = [...recommendations];

    // Role filter - Check title and description
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(roleFilter.toLowerCase()) ||
        job.description?.toLowerCase().includes(roleFilter.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter && locationFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
        (job.isRemote && locationFilter.toLowerCase() === 'remote')
      );
    }

    // Experience filter - Check job type or title
    if (experienceFilter && experienceFilter !== 'all') {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(experienceFilter.toLowerCase()) ||
        job.jobType?.toLowerCase().includes(experienceFilter.toLowerCase())
      );
    }

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore);

    setFilteredJobs(filtered);
  }, [recommendations, roleFilter, locationFilter, experienceFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile with stats
      const profileResponse = await fetch('/api/jobseeker/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          setStats(profileData.data.stats);
          
          // Smart wizard: Determine which step user should be on
          const stats = profileData.data.stats;
          if (stats.totalResumes === 0) {
            setCurrentWizardStep('resume');
          } else if (stats.profileCompletion < 80) {
            setCurrentWizardStep('profile');
          } else {
            setCurrentWizardStep('recommendations');
          }
        }
      }

      // Only fetch recommendations if user is ready (has resume + profile complete)
      if (stats && stats.totalResumes > 0 && stats.profileCompletion >= 50) {
        try {
          const recommendationsResponse = await fetch('/api/jobseeker/recommendations?limit=20&algorithm=hybrid');
          if (recommendationsResponse.ok) {
            const recommendationsData = await recommendationsResponse.json();
            if (recommendationsData.success) {
              setRecommendations(recommendationsData.data.jobs);
              setFilteredJobs(recommendationsData.data.jobs);
            }
          }
        } catch (recError) {
          console.error('Error fetching recommendations:', recError);
          // Don't block the UI if recommendations fail
        }
      }
    } catch (_error) {
      console.error('Error fetching dashboard data:', _error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setRoleFilter('all');
    setLocationFilter('all');
    setExperienceFilter('all');
  };

  // Determine if we should show wizard mode (mobile) or full view (desktop)
  const shouldShowWizard = stats !== null && (stats.totalResumes === 0 || stats.profileCompletion < 80);

  // Don't show full-screen loading, render dashboard skeleton instead

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Simple Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {(session?.user as any)?.firstName || session?.user?.name || 'Job Seeker'}! 👋
            </h1>
            <p className="text-gray-600">
              Your personalized job search dashboard
            </p>
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading your dashboard...</span>
              </div>
            )}
          </div>

          {/* Smart Mobile Wizard - Only show on mobile when setup incomplete */}
          {shouldShowWizard && (
            <div className="block lg:hidden mb-8">
              <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
                <CardContent className="p-6">
                  {/* Step Indicator */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentWizardStep === 'resume' ? 'bg-blue-600 text-white' : stats?.totalResumes > 0 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {stats?.totalResumes > 0 ? '✓' : '1'}
                      </div>
                      <div className={`w-12 h-1 ${stats?.totalResumes > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentWizardStep === 'profile' ? 'bg-purple-600 text-white' : stats && stats.profileCompletion >= 80 ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        {stats && stats.profileCompletion >= 80 ? '✓' : '2'}
                      </div>
                      <div className={`w-12 h-1 ${stats && stats.profileCompletion >= 80 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentWizardStep === 'recommendations' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                      }`}>
                        3
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Upload Resume */}
                  {currentWizardStep === 'resume' && (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <Upload className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 1: Upload Your Resume</h2>
                      <p className="text-gray-600 mb-6">
                        Start by uploading your resume. Our AI will analyze it and extract your skills, experience, and qualifications automatically.
                      </p>
                      <Link href="/resumes/upload">
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg text-lg px-8 py-6">
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Resume Now
                        </Button>
                      </Link>
                      <p className="text-sm text-gray-500 mt-4">
                        Supported formats: PDF, DOC, DOCX
                      </p>
                    </div>
                  )}

                  {/* Step 2: Complete Profile */}
                  {currentWizardStep === 'profile' && (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">Step 2: Complete Your Profile</h2>
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${stats?.profileCompletion || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{stats?.profileCompletion || 0}% Complete</p>
                      </div>
                      <p className="text-gray-600 mb-6">
                        Add your skills, preferences, and job requirements to get personalized job recommendations.
                      </p>
                      <Link href="/dashboard/jobseeker/profile">
                        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg text-lg px-8 py-6">
                          <Edit className="h-5 w-5 mr-2" />
                          Complete Profile Now
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Step 3: View Recommendations */}
                  {currentWizardStep === 'recommendations' && (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">🎉 You're All Set!</h2>
                      <p className="text-gray-600 mb-6">
                        Your profile is ready! Scroll down to see personalized job recommendations based on your resume and preferences.
                      </p>
                      <Button 
                        size="lg" 
                        onClick={() => {
                          const recommendationsSection = document.getElementById('recommendations-section');
                          recommendationsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg text-lg px-8 py-6"
                      >
                        <TrendingUp className="h-5 w-5 mr-2" />
                        View Job Recommendations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* B) Quick Actions - Only show on desktop or when wizard complete */}
          <div className={`mb-8 ${shouldShowWizard ? 'hidden lg:block' : 'block'}`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Upload Resume */}
              <Link href="/resumes/upload" className="block">
                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Upload Resume</h3>
                    <p className="text-sm text-gray-600">AI-powered analysis</p>
                  </CardContent>
                </Card>
              </Link>

              {/* Edit Profile */}
              <Link href="/dashboard/jobseeker/profile" className="block">
                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-purple-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:from-purple-200 group-hover:to-purple-300 transition-all">
                      <Edit className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">Edit Profile</h3>
                    <p className="text-sm text-gray-600">Update your details</p>
                  </CardContent>
                </Card>
              </Link>

              {/* View All Jobs */}
              <Link href="/jobs" className="block">
                <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-green-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:from-green-200 group-hover:to-green-300 transition-all">
                      <Search className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">View Jobs</h3>
                    <p className="text-sm text-gray-600">Browse all openings</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* C) Recommended Jobs - Only show when user is ready */}
          {(!shouldShowWizard || currentWizardStep === 'recommendations') && (
            <Card id="recommendations-section" className="border-0 shadow-lg scroll-mt-8">
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Recommended Jobs
                  {filteredJobs.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 text-sm">
                      {filteredJobs.length} matches
                    </Badge>
                  )}
                </CardTitle>
              </div>

              {/* Client-Side Filters - Instant Updates */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Filter by:</span>
                  {(roleFilter !== 'all' || locationFilter !== 'all' || experienceFilter !== 'all') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Role Filter */}
                  <div>
                    <Input
                      placeholder="Filter by role (e.g., Developer)"
                      value={roleFilter === 'all' ? '' : roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value || 'all')}
                      className="h-10"
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <Input
                      placeholder="Filter by location (e.g., Mumbai)"
                      value={locationFilter === 'all' ? '' : locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value || 'all')}
                      className="h-10"
                    />
                  </div>

                  {/* Experience Filter */}
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger id="experienceFilter" className="h-10 bg-white">
                      <SelectValue placeholder="Experience level" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[10000]">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Jobs List - Clean & Minimal */}
              {filteredJobs.length > 0 ? (
                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div 
                      key={job.id} 
                      className="group border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 bg-white"
                    >
                      {/* Job Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                              {job.title}
                            </h3>
                            {job.matchScore >= 70 && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                                {job.matchScore}% Match
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            {job.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          <span>{job.location}</span>
                          {job.isRemote && (
                            <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">
                              Remote
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="h-4 w-4 text-purple-500" />
                          <span>{job.jobType}</span>
                        </div>
                        {job.salary && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                            <DollarSign className="h-4 w-4" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      {/* Match Reasons */}
                      {job.matchReasons && job.matchReasons.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-900 mb-2">Why this matches you:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.matchReasons.map((reason, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link 
                          href={`/jobs/${job.id}`}
                          onClick={() => {
                            // PRESERVE NAVIGATION STATE: Save that we came from dashboard
                            if (typeof window !== 'undefined') {
                              sessionStorage.setItem('jobDetailsSource', '/dashboard/jobseeker');
                            }
                          }}
                          className="flex-1"
                        >
                          <Button 
                            variant="outline" 
                            className="w-full border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job.id}/apply`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                            Apply Now
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State - Guide User */
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {stats?.totalResumes === 0 
                      ? 'Upload Your Resume to Get Started' 
                      : stats?.profileCompletion < 50
                      ? 'Complete Your Profile for Better Matches'
                      : 'No Matches Found'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {stats?.totalResumes === 0 
                      ? 'Upload your resume and we\'ll use AI to find the perfect jobs for you based on your skills and experience.'
                      : stats?.profileCompletion < 50
                      ? 'Add your skills, experience, and preferences to get personalized job recommendations.'
                      : 'Try adjusting your filters or update your profile to see more opportunities.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {stats?.totalResumes === 0 ? (
                      <Link href="/resumes/upload">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-8">
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Resume
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href="/dashboard/jobseeker/profile">
                          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg px-8">
                            <User className="h-5 w-5 mr-2" />
                            Complete Profile
                          </Button>
                        </Link>
                        <Link href="/jobs">
                          <Button variant="outline" className="px-8">
                            <Search className="h-5 w-5 mr-2" />
                            Browse All Jobs
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          )}

          {/* Small Stats Summary at Bottom - Only show when recommendations visible */}
          {stats && (!shouldShowWizard || currentWizardStep === 'recommendations') && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <Link href="/dashboard/jobseeker/applications">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalApplications}</p>
                    <p className="text-xs text-gray-600">Applications</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/jobseeker/applications">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.activeApplications}</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/jobseeker/bookmarks">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{stats.totalBookmarks}</p>
                    <p className="text-xs text-gray-600">Saved Jobs</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/resumes">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{stats.totalResumes}</p>
                    <p className="text-xs text-gray-600">Resumes</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
