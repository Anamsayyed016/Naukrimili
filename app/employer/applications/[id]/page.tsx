"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Download, 
  MessageSquare, 
  Star, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

interface ApplicationDetail {
  id: string;
  jobTitle: string;
  jobId: number;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantLocation: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  appliedAt: string;
  resumeUrl: string;
  coverLetter: string;
  experience: string;
  education: string;
  skills: string[];
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  lastUpdated: string;
  notes?: string;
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (applicationId) {
      fetchApplicationData();
    }
  }, [applicationId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data - implement API call later
      const mockApplication: ApplicationDetail = {
        id: applicationId as string,
        jobTitle: 'Senior React Developer',
        jobId: 1,
        applicantName: 'John Doe',
        applicantEmail: 'john.doe@example.com',
        applicantPhone: '+91 98765 43210',
        applicantLocation: 'Bangalore, India',
        status: 'submitted',
        appliedAt: new Date().toISOString(),
        resumeUrl: '/resumes/john-doe-resume.pdf',
        coverLetter: 'I am excited to apply for this Senior React Developer position at TechCorp India. With over 5 years of experience in React development, I have successfully delivered multiple web applications that have improved user experience and business outcomes.\n\nMy expertise includes React, TypeScript, Node.js, and modern web technologies. I have worked on projects ranging from e-commerce platforms to enterprise dashboards, always focusing on clean code, performance optimization, and user-centric design.\n\nI am particularly drawn to TechCorp India because of its innovative approach to technology and commitment to employee growth. I believe my skills and experience would be a valuable addition to your team.\n\nI am available for an interview at your convenience and look forward to discussing how I can contribute to your company\'s success.',
        experience: '5+ years',
        education: 'B.Tech in Computer Science from Bangalore Institute of Technology',
        skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Git', 'AWS', 'Docker', 'Jest'],
        portfolioUrl: 'https://johndoe.dev',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        githubUrl: 'https://github.com/johndoe',
        expectedSalary: '₹18L - ₹22L PA',
        noticePeriod: '30 days',
        lastUpdated: new Date().toISOString(),
        notes: 'Strong technical background, good communication skills. Consider for interview.'
      };

      setApplication(mockApplication);
      setNotes(mockApplication.notes || '');
    } catch (error) {
      console.error('Error fetching application data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    
    try {
      setSaving(true);
      
      // Implement status change logic
      console.log(`Changing status of application ${application.id} to ${newStatus}`);
      
      // Update local state
      setApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error changing application status:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;
    
    try {
      setSaving(true);
      
      // Implement notes saving logic
      console.log('Saving notes:', notes);
      
      // Update local state
      setApplication(prev => prev ? { ...prev, notes } : null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline">Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800">Reviewed</Badge>;
      case 'shortlisted':
        return <Badge className="bg-yellow-100 text-yellow-800">Shortlisted</Badge>;
      case 'interview':
        return <Badge className="bg-purple-100 text-purple-800">Interview</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Application not found</h3>
          <p className="text-gray-500 mb-6">The application you're looking for doesn't exist.</p>
          <Link href="/employer/applications">
            <Button>Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard allowedRoles={['employer']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <Link href="/employer/applications" className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Details</h1>
              <p className="text-gray-600">
                {application.applicantName} - {application.jobTitle}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/employer/applications?jobId=${application.jobId}`}>
                <Button variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
              </Link>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Application Status</span>
                  {getStatusBadge(application.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Change Status</label>
                    <Select 
                      value={application.status} 
                      onValueChange={handleStatusChange}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Applied Date</label>
                    <p className="text-sm text-gray-600">{formatDate(application.appliedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Candidate Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                    <p className="text-gray-900">{application.applicantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${application.applicantEmail}`} className="text-blue-600 hover:text-blue-800">
                        {application.applicantEmail}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${application.applicantPhone}`} className="text-blue-600 hover:text-blue-800">
                        {application.applicantPhone}
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{application.applicantLocation}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience</label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{application.experience}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Expected Salary</label>
                    <span className="text-gray-900">{application.expectedSalary || 'Not specified'}</span>
                  </div>
                </div>

                {application.noticePeriod && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notice Period</label>
                    <span className="text-gray-900">{application.noticePeriod}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cover Letter */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Letter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{application.coverLetter}</p>
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{application.education}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Shortlist Candidate
                </Button>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
                <Button variant="outline" className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Add to Favorites
                </Button>
                <Button variant="destructive" className="w-full">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
              </CardContent>
            </Card>

            {/* Resume & Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Resume
                </Button>
                {application.portfolioUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Portfolio
                    </a>
                  </Button>
                )}
                {application.linkedinUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View LinkedIn
                    </a>
                  </Button>
                )}
                {application.githubUrl && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={application.githubUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View GitHub
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes about this candidate..."
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                />
                <Button 
                  onClick={handleSaveNotes} 
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Application Submitted</p>
                      <p className="text-xs text-gray-500">{formatDate(application.appliedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Under Review</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Interview</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Decision</p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
