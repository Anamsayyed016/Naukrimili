import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, MapPin, Phone, Mail, Briefcase, GraduationCap, Award, Globe } from "lucide-react";

interface ProfileCompletionFormProps {
  resumeData: Record<string, unknown>;
  onComplete?: () => void;
  onClose?: () => void;
}

export default function ProfileCompletionForm({ resumeData, onComplete, onClose }: ProfileCompletionFormProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Debug loggingif (resumeData && resumeData.aiData) {
      setData(resumeData.aiData);
      setFormData(resumeData.aiData);
      setLoading(false);
    } else if (resumeData && resumeData.structured_data) {
      // Handle case where data is directly in structured_data
      setData(resumeData.structured_data);
      setFormData(resumeData.structured_data);
      setLoading(false);
    } else {
      console.error('ProfileCompletionForm - Missing or invalid resume data:', { resumeData });
      setError("No resume data provided");
      setLoading(false);
    }
  }, [resumeData]);

  const handleInputChange = (section: string, field: string, value: Record<string, unknown>) => {
    setFormData((prev: Record<string, unknown>) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSaved(true);
      if (onComplete) onComplete();
    } catch (error) {
      alert("Error saving profile.");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Card className="bg-green-50 border-0 shadow-lg">
        <CardContent className="py-12 text-center">
          <div className="text-2xl font-bold text-green-700 mb-2">Profile updated successfully!</div>
          <Button onClick={() => window.location.href = "/jobseeker/profile"}>Close</Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white/90 border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-purple-500 mr-2" />
          <span className="text-gray-600">Loading AI-extracted data...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50/90 border-red-200 shadow-lg">
        <CardContent className="py-8">
          <div className="text-center text-red-600 font-semibold">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.personal_info) {
    return (
      <Card className="bg-muted/90 border-muted shadow-lg">
        <CardContent className="py-8">
          <div className="text-center text-primary font-semibold">
            AI processing is still in progress. Please wait a moment and try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="w-6 h-6 text-purple-500" />
          Complete Your Profile
        </CardTitle>
        <p className="text-gray-600 mt-2">Review and edit the information extracted from your resume</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                <Input
                  type="text"
                  defaultValue={data.personal_info?.full_name || data.personal_info?.name || ''}
                  placeholder="Enter your full name"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input
                  type="email"
                  defaultValue={data.personal_info?.email || ''}
                  placeholder="Enter your email"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Input
                  type="tel"
                  defaultValue={data.personal_info?.phone || ''}
                  placeholder="Enter your phone number"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" /> Location
                </Label>
                <Input
                  type="text"
                  defaultValue={data.personal_info?.location || ''}
                  placeholder="City, State"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4" /> LinkedIn
                </Label>
                <Input
                  type="url"
                  defaultValue={data.personal_info?.linkedin || ''}
                  placeholder="LinkedIn profile URL"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4" /> GitHub
                </Label>
                <Input
                  type="url"
                  defaultValue={data.personal_info?.github || ''}
                  placeholder="GitHub profile URL"
                  className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4" /> Skills
              </Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
              <Textarea
                defaultValue={data.skills?.join(', ') || ''}
                placeholder="Enter your skills separated by commas"
                className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                rows={4}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="experience" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                <Briefcase className="w-4 h-4" /> Work Experience
              </Label>
              {data.experience?.map((exp: Record<string, unknown>, index: number) => (
                <Card key={index} className="p-4 border-l-4 border-purple-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input
                      type="text"
                      defaultValue={exp.header || exp.title || ''}
                      placeholder="Job Title at Company"
                      className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <Textarea
                    defaultValue={exp.description?.join('\n') || exp.description || ''}
                    placeholder="Job description and key achievements"
                    className="transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="education" className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                <GraduationCap className="w-4 h-4" /> Education
              </Label>
              {data.education?.map((edu: Record<string, unknown>, index: number) => (
                <Card key={index} className="p-4 border-l-4 border-blue-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      defaultValue={edu.degree || ''}
                      placeholder="Degree"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                      type="text"
                      defaultValue={edu.institution || ''}
                      placeholder="Institution"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                      type="text"
                      defaultValue={edu.graduation_year || ''}
                      placeholder="Graduation Year"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                    <Input
                      type="text"
                      defaultValue={edu.gpa || ''}
                      placeholder="GPA (optional)"
                      className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                window.location.href = '/dashboard';
              }
            }}
          >
            Skip for Now
          </Button>
          <Button 
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...</>
            ) : (
              <>Save Profile</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

