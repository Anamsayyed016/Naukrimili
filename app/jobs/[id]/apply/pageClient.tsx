"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Upload, 
  CheckCircle, 
  Loader2,
  FileText,
  Star
} from "lucide-react";

interface ResumeProfile {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  skills: string[];
  education: string[];
  experience: string[];
}

interface JobApplicationForm {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  coverLetter: string;
  expectedSalary: string;
  availability: string;
  resume: File | null;
  resumeProfile: ResumeProfile | null;
}

export default function ApplyClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<JobApplicationForm>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    coverLetter: "",
    expectedSalary: "",
    availability: "Immediate",
    resume: null,
    resumeProfile: null
  });
  
  const [status, setStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [skillsMatch, setSkillsMatch] = useState<string[]>([]);

  // Mock job data - in real app, fetch from API
  const jobData = {
    title: "Software Engineer",
    company: "Tech Corp",
    location: "Mumbai, India",
    requiredSkills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
    salary: "₹8-15 LPA"
  };

  const handleInputChange = (field: keyof JobApplicationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResumeChange = async (file: File | null) => {
    setFormData(prev => ({ ...prev, resume: file }));
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload and analyze resume
      const formData = new FormData();
      formData.append('resume', file);
      
      const res = await fetch('/api/resumes/autofill', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.ok && data?.success && data?.profile) {
        const profile = data.profile;
        const analysis = data.analysis;
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          fullName: profile.fullName || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phone || prev.phone,
          location: profile.location || prev.location,
          resumeProfile: profile
        }));

        // Use enhanced AI analysis for ATS score and skills match
        if (analysis) {
          setAtsScore(analysis.atsScore);
          
          // Calculate skills match using enhanced analysis
          const matchedSkills = profile.skills.filter(skill => 
            jobData.requiredSkills.some(required => 
              required.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(required.toLowerCase())
            )
          );
          setSkillsMatch(matchedSkills);
        } else {
          // Fallback to basic calculation
          calculateATSAndSkills(profile, jobData.requiredSkills);
        }
        
        // Show success message
        setTimeout(() => {
          setUploadProgress(0);
          setIsUploading(false);
        }, 1000);

      } else {
        throw new Error(data?.error || 'Failed to analyze resume');
      }

    } catch (err: any) {
      console.error('Resume analysis failed:', err);
      setUploadProgress(0);
      setIsUploading(false);
      // Continue without auto-fill - user can fill manually
    }
  };

  const calculateATSAndSkills = (profile: ResumeProfile, requiredSkills: string[]) => {
    // Calculate ATS score based on completeness
    let score = 0;
    if (profile.fullName) score += 20;
    if (profile.email) score += 20;
    if (profile.phone) score += 15;
    if (profile.location) score += 15;
    if (profile.skills.length > 0) score += 20;
    if (profile.education.length > 0) score += 10;
    
    setAtsScore(score);

    // Calculate skills match
    const matchedSkills = profile.skills.filter(skill => 
      requiredSkills.some(required => 
        required.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(required.toLowerCase())
      )
    );
    setSkillsMatch(matchedSkills);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    
    try {
      const form = new FormData();
      form.append("fullName", formData.fullName);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("location", formData.location);
      form.append("coverLetter", formData.coverLetter);
      form.append("expectedSalary", formData.expectedSalary);
      form.append("availability", formData.availability);
      if (formData.resume) form.append("resume", formData.resume);
      form.append("jobId", jobId);
      
      const res = await fetch(`/api/applications`, { 
        method: "POST", 
        body: form 
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(data?.error || "Failed to apply");
      
      setStatus("Application submitted successfully!");
      setTimeout(() => router.push(`/jobs/${jobId}`), 1500);
      
    } catch (err: any) {
      setStatus(err?.message || "Failed to apply");
    }
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply to {jobData.title}</h1>
        <p className="text-gray-600">{jobData.company} • {jobData.location}</p>
        <p className="text-gray-600">Salary: {jobData.salary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Application Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Application Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Resume Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Resume Upload
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleResumeChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {isUploading ? (
                        <div className="space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                          <p className="text-sm text-gray-600">Analyzing resume...</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : formData.resume ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                          <p className="font-medium">{formData.resume.name}</p>
                          <p className="text-sm text-gray-600">Click to change</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="font-medium">Upload your resume</p>
                          <p className="text-sm text-gray-600">PDF, DOC, or DOCX (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Additional Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedSalary">Expected Salary</Label>
                      <Input
                        id="expectedSalary"
                        value={formData.expectedSalary}
                        onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                        placeholder="e.g., ₹10 LPA"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="availability">Availability</Label>
                      <select
                        id="availability"
                        value={formData.availability}
                        onChange={(e) => handleInputChange('availability', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Immediate">Immediate</option>
                        <option value="2 weeks">2 weeks</option>
                        <option value="1 month">1 month</option>
                        <option value="2 months">2 months</option>
                        <option value="3 months">3 months</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="coverLetter">Cover Letter</Label>
                    <Textarea
                      id="coverLetter"
                      value={formData.coverLetter}
                      onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                      placeholder="Tell us why you're interested in this position..."
                      rows={4}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Submit Application
                </Button>
                
                {status && (
                  <p className={`text-center text-sm ${
                    status.includes('successfully') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resume Analysis Sidebar */}
        <div className="space-y-6">
          {/* ATS Score */}
          {atsScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {atsScore}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        atsScore >= 80 ? 'bg-green-500' : 
                        atsScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${atsScore}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {atsScore >= 80 ? 'Excellent' : 
                     atsScore >= 60 ? 'Good' : 'Needs improvement'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Skills Match */}
          {skillsMatch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Skills Match
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Your resume matches {skillsMatch.length} of {jobData.requiredSkills.length} required skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skillsMatch.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resume Profile Preview */}
          {formData.resumeProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resume Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.resumeProfile.skills.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Skills</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.resumeProfile.skills.slice(0, 5).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.resumeProfile.experience.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Experience</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.resumeProfile.experience.length} positions found
                    </p>
                  </div>
                )}
                
                {formData.resumeProfile.education.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Education</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {formData.resumeProfile.education.length} degrees found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


