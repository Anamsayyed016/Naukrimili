"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, MapPin, Calendar, FileText, Download, Edit, Save, X, Upload, CheckCircle, LogOut } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  experience: string;
  skills: string[];
  resume?: {
    filename: string;
    filepath: string;
    uploadedAt: string;
  };
  joinedAt: string;
}

function ProfilePageContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication - only on client side
    if (typeof window === 'undefined') return;
    
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    setIsAuthenticated(true);

    // Fetch user profile from API
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setProfile(data.profile);
            setEditForm(data.profile);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Save profile to API
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const handleCancel = () => {
    setEditForm(profile || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your profile.</p>
          <Link
            href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors">
              ← Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={handleLogout}
              className="flex items-center text-red-600 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.name.charAt(0)}
              </div>
              <div className="ml-6">
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-blue-300 focus:border-blue-600 outline-none bg-transparent"
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                )}
                <div className="flex items-center text-gray-600 mt-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-600">
              <Mail className="h-5 w-5 mr-3 text-blue-600" />
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 focus:border-blue-600 outline-none"
                />
              ) : (
                <span>{profile.email}</span>
              )}
            </div>
            <div className="flex items-center text-gray-600">
              <Phone className="h-5 w-5 mr-3 text-blue-600" />
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 focus:border-blue-600 outline-none"
                />
              ) : (
                <span>{profile.phone}</span>
              )}
            </div>
            <div className="flex items-center text-gray-600">
              <MapPin className="h-5 w-5 mr-3 text-blue-600" />
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 focus:border-blue-600 outline-none"
                />
              ) : (
                <span>{profile.location}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* About Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
            {isEditing ? (
              <textarea
                value={editForm.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-600 outline-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
            )}

            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.experience || ''}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1 focus:border-blue-600 outline-none"
                  placeholder="e.g., 5+ years"
                />
              ) : (
                <span className="text-gray-600">{profile.experience}</span>
              )}
            </div>
          </div>

          {/* Skills & Resume Section */}
          <div className="space-y-8">
            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Skills</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.skills?.join(', ') || ''}
                  onChange={(e) => handleInputChange('skills', e.target.value.split(', ').filter(skill => skill.trim()))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-600 outline-none"
                  placeholder="Enter skills separated by commas"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Resume */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Resume</h3>
              {profile.resume ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="font-semibold text-gray-900">{profile.resume.filename}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded {new Date(profile.resume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      <button className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Replace
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No resume uploaded yet</p>
                  <Link
                    href="/"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center">
          <div className="flex gap-4 justify-center">
            <Link
              href="/jobs"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Browse Jobs
            </Link>
            <Link
              href="/companies"
              className="border border-blue-600 text-blue-600 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              Explore Companies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ErrorBoundary>
      <ProfilePageContent />
    </ErrorBoundary>
  );
}
