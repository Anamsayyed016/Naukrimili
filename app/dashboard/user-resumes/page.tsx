'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Upload, 
  User, 
  Calendar,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

interface Resume {
  id: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  parsedData: any;
  atsScore: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  experience: string | null;
  education: string | null;
  profilePicture: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserResumesPage() {
  const { data: session, status } = useSession();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserData();
    }
  }, [session, status]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserProfile(data.user);
          setResumes(data.resumes);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteResume = async (resumeId: number) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setResumes(resumes.filter(r => r.id !== resumeId));
        toast({
          title: 'Success',
          description: 'Resume deleted successfully',
        });
      } else {
        throw new Error('Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resume',
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Login Required
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              You need to be logged in to view your resumes.
            </p>
            <Link href="/auth/login">
              <Button className="w-full">
                Login to Continue
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Resumes & Profile
        </h1>
        <p className="text-gray-600">
          Welcome back, <span className="font-semibold text-blue-600">{userProfile?.name || session?.user?.name}</span>! 
          Manage your resumes and profile information.
        </p>
      </div>

      {/* User Profile Summary */}
      {userProfile && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Role</p>
                <Badge variant={userProfile.role === 'admin' ? 'destructive' : 'default'}>
                  {userProfile.role}
                </Badge>
              </div>
              {userProfile.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{userProfile.phone}</p>
                </div>
              )}
              {userProfile.location && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-gray-900">{userProfile.location}</p>
                </div>
              )}
              {userProfile.skills && userProfile.skills.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(userProfile.skills) ? userProfile.skills : (typeof userProfile.skills === 'string' ? userProfile.skills.split(',').map(s => s.trim()).filter(s => s) : [])).map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumes Section */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">
          My Resumes ({resumes.length})
        </h2>
        <Link href="/resumes/upload">
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Upload New Resume
          </Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No resumes uploaded yet
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your first resume to get started with job applications.
            </p>
            <Link href="/resumes/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">
                      {resume.fileName.length > 30 
                        ? resume.fileName.substring(0, 30) + '...' 
                        : resume.fileName
                      }
                    </CardTitle>
                  </div>
                  <Badge variant={resume.isActive ? "default" : "secondary"}>
                    {resume.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{formatFileSize(resume.fileSize)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded {formatDate(resume.createdAt)}</span>
                  </div>

                  {resume.atsScore && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        ATS Score: {resume.atsScore}/100
                      </Badge>
                    </div>
                  )}

                  {resume.parsedData?.targetRole && (
                    <div className="text-sm">
                      <p className="text-gray-500">Target Role:</p>
                      <p className="font-medium">{resume.parsedData.targetRole}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteResume(resume.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <Upload className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Upload Resume</h3>
            <p className="text-sm text-gray-600 mb-3">
              Add a new resume to your profile
            </p>
            <Link href="/resumes/upload">
              <Button size="sm">Get Started</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <Edit className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Edit Profile</h3>
            <p className="text-sm text-gray-600 mb-3">
              Update your personal information
            </p>
            <Link href="/profile">
              <Button size="sm" variant="outline">Edit Now</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="text-center p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent>
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">View Jobs</h3>
            <p className="text-sm text-gray-600 mb-3">
              Browse available job opportunities
            </p>
            <Link href="/jobs">
              <Button size="sm" variant="outline">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
