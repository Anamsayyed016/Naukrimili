'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { User, MapPin, Briefcase, DollarSign, Target, ArrowRight, Sparkles } from 'lucide-react';

interface ShortProfileFormProps {
  onComplete: () => void;
  extractedData?: {
    name?: string;
    phone?: string;
    location?: string;
    skills?: string[];
    experience?: string;
  };
}

export default function ShortProfileForm({ onComplete, extractedData }: ShortProfileFormProps) {
  const [formData, setFormData] = useState({
    name: extractedData?.name || '',
    phone: extractedData?.phone || '',
    location: extractedData?.location || '',
    currentRole: '',
    experienceLevel: '',
    preferredLocation: extractedData?.location || '',
    salaryExpectation: '',
    jobType: 'Full-time'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      // Save to profile API
      const response = await fetch('/api/jobseeker/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
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
        throw new Error('Failed to save profile');
      }

      toast({
        title: '✅ Profile Saved!',
        description: 'Finding job recommendations for you...',
      });

      // Complete and redirect
      setTimeout(() => {
        onComplete();
      }, 1000);

    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Profile Skipped',
      description: 'You can complete your profile later from the dashboard.',
    });
    onComplete();
  };

  return (
    <Card className="max-w-3xl mx-auto shadow-2xl border-0 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Quick Profile Setup
              <Badge className="bg-blue-600 text-white text-xs">Step 2 of 3</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Help us find better job matches for you
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="h-11"
              />
            </div>
          </div>

          {/* Row 2: Current Location & Preferred Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Current Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Mumbai, India"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredLocation" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Preferred Job Location
              </Label>
              <Input
                id="preferredLocation"
                value={formData.preferredLocation}
                onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                placeholder="Bangalore, India"
                className="h-11"
              />
            </div>
          </div>

          {/* Row 3: Current Role & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentRole" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Current/Desired Role *
              </Label>
              <Input
                id="currentRole"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                placeholder="Software Developer"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceLevel" className="text-sm font-medium text-gray-700">
                Experience Level *
              </Label>
              <Select 
                value={formData.experienceLevel} 
                onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}
              >
                <SelectTrigger id="experienceLevel" className="h-11 bg-white">
                  <SelectValue placeholder="Select experience" />
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

          {/* Row 4: Job Type & Salary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobType" className="text-sm font-medium text-gray-700">
                Preferred Job Type
              </Label>
              <Select 
                value={formData.jobType} 
                onValueChange={(value) => setFormData({ ...formData, jobType: value })}
              >
                <SelectTrigger id="jobType" className="h-11 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-[10000]">
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Expected Salary (Annual)
              </Label>
              <Input
                id="salary"
                type="number"
                value={formData.salaryExpectation}
                onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                placeholder="500000"
                className="h-11"
              />
            </div>
          </div>

          {/* AI Extracted Info Banner */}
          {extractedData && (extractedData.name || extractedData.skills) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">AI Pre-filled Information</p>
                  <p className="text-xs text-green-700 mt-1">
                    We've automatically filled some fields from your resume. Please review and update as needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
              disabled={saving}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.name || !formData.currentRole || !formData.experienceLevel}
              className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg order-1 sm:order-2"
            >
              {saving ? (
                <>
                  <span className="animate-pulse">Saving...</span>
                </>
              ) : (
                <>
                  Continue to Job Matches
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <div className="h-2 w-2 rounded-full bg-gray-300"></div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

