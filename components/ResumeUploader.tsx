import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface ResumeData {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
    linkedin: string | null;
    github: string | null;
  };
  work_experience: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string | null;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    field_of_study: string | null;
    graduation_year: string;
  }>;
  technical_skills: string[];
  soft_skills: string[];
  certifications: string[];
  total_experience_years: number;
  summary: string;
  recommendations: string[];
}

export function ResumeUploader() {
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const fileSize = file.size / (1024 * 1024); // Convert to MB

    // Client-side validation
    if (fileSize > 5) {
      toast({
        title: "Error",
        description: "File size too large. Maximum size is 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.match(/^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
      toast({
        title: "Error",
        description: "Invalid file type. Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await res.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Server response was not JSON');
      }

      if (!res.ok || !data.success) {
        console.error('Upload failed:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        throw new Error(data.message || `Upload failed with status ${res.status}`);
      }

      toast({
        title: "Success",
        description: "Resume uploaded successfully!",
      });

      // Log success for debugging
      console.log("Upload successful:", data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-4">Upload Resume</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload your resume and we'll automatically fill out your profile
          </p>
          <Input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            disabled={loading}
            className="mb-4"
          />
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
              Analyzing resume...
            </div>
          )}
        </div>

        {resumeData && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Name</label>
                  <p className="mt-1">{resumeData.personal_info.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <p className="mt-1">{resumeData.personal_info.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <p className="mt-1">{resumeData.personal_info.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium">Location</label>
                  <p className="mt-1">
                    {resumeData.personal_info.location.city}, {resumeData.personal_info.location.state}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Work Experience</h3>
              {resumeData.work_experience.map((exp, index) => (
                <div key={index} className="mb-4 p-4 border rounded">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{exp.title}</h4>
                    <span className="text-sm text-gray-600">
                      {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                    </span>
                  </div>
                  <p className="text-gray-700">{exp.company}</p>
                  <p className="mt-2 text-sm">{exp.description}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resumeData.technical_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Education</h3>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-medium">{edu.degree}</h4>
                  <p>{edu.institution}</p>
                  <p className="text-sm text-gray-600">
                    {edu.field_of_study} • {edu.graduation_year}
                  </p>
                </div>
              ))}
            </div>

            <Button className="w-full">Save Profile</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
