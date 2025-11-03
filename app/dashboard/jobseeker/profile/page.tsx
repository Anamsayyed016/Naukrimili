"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Linkedin, 
  Github,
  Save,
  Edit,
  Upload,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Star
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import AuthGuard from "@/components/auth/AuthGuard";
import { toast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience?: string;
  education?: string;
  profilePicture?: string;
  locationPreference?: string;
  salaryExpectation?: number;
  jobTypePreference: string[];
  remotePreference: boolean;
  website?: string;
  linkedin?: string;
  github?: string;
  stats: {
    totalApplications: number;
    activeApplications: number;
    totalBookmarks: number;
    totalResumes: number;
    profileCompletion: number;
  };
}

export default function JobSeekerProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobseeker/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        // CRITICAL FIX: Ensure arrays are never null
        const profileData = {
          ...data.data,
          skills: data.data.skills || [],
          jobTypePreference: data.data.jobTypePreference || [],
          remotePreference: data.data.remotePreference || false
        };
        setProfile(profileData);
      }
    } catch (_error) {
      console.error('Error fetching profile:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        // CRITICAL FIX: Ensure arrays are never null after save
        const profileData = {
          ...data.data,
          skills: data.data.skills || [],
          jobTypePreference: data.data.jobTypePreference || [],
          remotePreference: data.data.remotePreference || false
        };
        setProfile(profileData);
        setEditing(false);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      }
    } catch (_error) {
      console.error('Error updating profile:', _error);
      toast({
        title: 'Error',
        description: _error instanceof Error ? _error.message : 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSkillsChange = (value: string) => {
    setSkillsInput(value);
    if (value.endsWith(',')) {
      const skill = value.slice(0, -1).trim();
      // CRITICAL FIX: Check if profile.skills is null/undefined
      if (skill && profile && profile.skills && !profile.skills.includes(skill)) {
        setProfile({
          ...profile,
          skills: [...profile.skills, skill]
        });
        setSkillsInput('');
      } else if (skill && profile && !profile.skills) {
        // Initialize skills array if null
        setProfile({
          ...profile,
          skills: [skill]
        });
        setSkillsInput('');
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (!profile || !profile.skills) return;
    setProfile({
      ...profile,
      skills: profile.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const toggleJobTypePreference = (jobType: string) => {
    if (!profile) return;
    // CRITICAL FIX: Check if jobTypePreference is null/undefined
    const currentPreferences = profile.jobTypePreference || [];
    const updated = currentPreferences.includes(jobType)
      ? currentPreferences.filter(type => type !== jobType)
      : [...currentPreferences, jobType];
    setProfile({ ...profile, jobTypePreference: updated });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
          <p className="text-gray-600">Unable to load your profile data</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['jobseeker']}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Management</h1>
                <p className="text-gray-600 mt-2">Manage your professional profile and preferences</p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {editing ? (
                  <>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditing(true)} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={profile.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!editing}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!editing}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.location || ''}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        disabled={!editing}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      disabled={!editing}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="skills">Add Skills</Label>
                    <Input
                      id="skills"
                      value={skillsInput}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      disabled={!editing}
                      placeholder="Type skills and press comma to add (e.g., React, Node.js,)"
                    />
                  </div>

                  {profile.skills && (Array.isArray(profile.skills) ? profile.skills : (typeof profile.skills === 'string' ? profile.skills.split(',').map(s => s.trim()).filter(s => s) : [])).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(profile.skills) ? profile.skills : (typeof profile.skills === 'string' ? profile.skills.split(',').map(s => s.trim()).filter(s => s) : [])).map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                          {editing && (
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-blue-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience & Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience & Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="experience">Work Experience</Label>
                    <Textarea
                      id="experience"
                      value={profile.experience || ''}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      disabled={!editing}
                      placeholder="Describe your work experience..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      value={profile.education || ''}
                      onChange={(e) => handleInputChange('education', e.target.value)}
                      disabled={!editing}
                      placeholder="Describe your educational background..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Job Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="locationPreference">Preferred Location</Label>
                    <Input
                      id="locationPreference"
                      value={profile.locationPreference || ''}
                      onChange={(e) => handleInputChange('locationPreference', e.target.value)}
                      disabled={!editing}
                      placeholder="Where would you like to work?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="salaryExpectation">Expected Salary (per year)</Label>
                    <Input
                      id="salaryExpectation"
                      type="number"
                      value={profile.salaryExpectation || ''}
                      onChange={(e) => handleInputChange('salaryExpectation', parseInt(e.target.value) || null)}
                      disabled={!editing}
                      placeholder="Enter expected salary"
                    />
                  </div>

                  <div>
                    <Label>Preferred Job Types</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {['full-time', 'part-time', 'contract', 'internship', 'remote', 'hybrid'].map((jobType) => (
                        <label key={jobType} className="flex items-center space-x-2">
                          <Checkbox
                            checked={(profile.jobTypePreference || []).includes(jobType)}
                            onCheckedChange={() => toggleJobTypePreference(jobType)}
                            disabled={!editing}
                          />
                          <span className="text-sm capitalize">{jobType.replace('-', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remotePreference"
                      checked={profile.remotePreference}
                      onCheckedChange={(checked) => handleInputChange('remotePreference', checked)}
                      disabled={!editing}
                    />
                    <Label htmlFor="remotePreference">Open to remote work</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Social Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!editing}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={profile.linkedin || ''}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      disabled={!editing}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <Label htmlFor="github">GitHub</Label>
                    <Input
                      id="github"
                      value={profile.github || ''}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      disabled={!editing}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profile Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Applications</span>
                    <span className="font-semibold">{profile.stats.totalApplications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Applications</span>
                    <span className="font-semibold text-green-600">{profile.stats.activeApplications}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Saved Jobs</span>
                    <span className="font-semibold">{profile.stats.totalBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Resumes</span>
                    <span className="font-semibold">{profile.stats.totalResumes}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion</span>
                        <span>{profile.stats.profileCompletion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${profile.stats.profileCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                    {profile.stats.profileCompletion < 100 && (
                      <p className="text-xs text-gray-600">
                        Complete your profile to get better job matches
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    View Applications
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Star className="h-4 w-4 mr-2" />
                    Saved Jobs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
