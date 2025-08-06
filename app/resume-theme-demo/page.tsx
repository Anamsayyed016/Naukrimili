'use client';
import React from 'react';
import ResumeDisplayProfessional from "@/components/ResumeDisplayProfessional";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Eye } from 'lucide-react';
import Link from 'next/link';

// Import the professional theme CSS
import '../../styles/resume-professional-theme.css';

/**
 * This is a demo page that showcases the new professional resume theme
 * It displays a sample resume with the new color scheme
 */
const ResumeThemeDemoPage = () => {
  // Sample resume data for demonstration
  const sampleResumeData = {
    fileName: 'ANAM SAYYED_Software Engineer (Remote)_20250709.pdf',
    fileSize: '0.01 MB',
    uploadDate: '7/17/2025, 3:57:45 AM',
    atsScore: 85,
    skills: [
      'JavaScript',
      'React',
      'Node.js',
      'Python',
      'SQL',
      'TypeScript',
      'AWS',
      'MongoDB'
    ],
    experience: [
      'Led a team of 5 developers to build scalable web applications using React and Node.js',
      'Developed and maintained React/Node.js applications with focus on performance',
      'Implemented CI/CD pipelines using GitHub Actions and AWS CodePipeline',
      'Optimized database queries resulting in 40% improvement in application response time',
      'Collaborated with UX designers to implement responsive and accessible user interfaces'
    ],
    education: [
      'Master of Science in Computer Science, Stanford University, 2023',
      'Bachelor of Engineering in Information Technology, MIT, 2021'
    ],
    recommendations: [
      'Excellent problem-solving skills and team leadership',
      'Strong communication and collaboration abilities',
      'Proactive in learning new technologies and implementing best practices'
    ]
  };

  // Create a version of the same data for the "before" view
  // This is just for demonstration purposes
  const sampleResumeDataBefore = { ...sampleResumeData };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/resumes">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Resumes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Resume Theme Demo</h1>
      </div>

      <div className="mb-8 max-w-3xl">
        <p className="text-gray-700 mb-4">
          This page demonstrates the new professional color scheme for resume displays. 
          The design replaces the yellow-based color scheme with a more professional 
          palette of navy blue, slate gray, and light gray while maintaining ATS compatibility.
        </p>
        <div className="flex gap-4">
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Download Resume
          </Button>
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            View Original
          </Button>
        </div>
      </div>

      <Tabs defaultValue="after" className="max-w-5xl">
        <TabsList className="mb-4">
          <TabsTrigger value="before">Before (Yellow Theme)</TabsTrigger>
          <TabsTrigger value="after">After (Professional Theme)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="before" className="p-6 bg-yellow-50 rounded-lg">
          {/* This is a simplified representation of the "before" state with yellow styling */}
          <div className="space-y-6">
            {/* File Info Card - Before */}
            <div className="bg-yellow-300 p-4 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-400 p-2 rounded-full">
                    <Eye className="w-6 h-6 text-yellow-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">{sampleResumeDataBefore.fileName}</h3>
                    <p className="text-yellow-800">{sampleResumeDataBefore.fileSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800">{sampleResumeDataBefore.uploadDate}</span>
                  <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* ATS Score Card - Before */}
            <div className="bg-yellow-200 p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-yellow-900 mb-1">ATS Compatibility Score</h4>
                  <p className="text-yellow-800">How well your resume passes through Applicant Tracking Systems</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-700">{sampleResumeDataBefore.atsScore}%</div>
                  <div className="flex items-center gap-1 text-sm text-yellow-800">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card - Before */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                  <div className="bg-yellow-200 p-1 rounded-full">
                    <Brain className="w-5 h-5 text-yellow-700" />
                  </div>
                  Skills Extracted
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {sampleResumeDataBefore.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Work Experience Card - Before */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                  <div className="bg-yellow-200 p-1 rounded-full">
                    <Briefcase className="w-5 h-5 text-yellow-700" />
                  </div>
                  Work Experience
                </h3>
              </div>
              <div className="space-y-3">
                {sampleResumeDataBefore.experience.map((exp, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-yellow-900">{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="after">
          {/* This is the new professional theme */}
          <ResumeDisplayProfessional resumeData={sampleResumeData} />
        </TabsContent>
      </Tabs>

      <div className="mt-12 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>
            The new design uses a professional color palette of navy blue (#2c3e50), 
            slate gray (#f0f4f8), and light gray (#e2e8f0).
          </li>
          <li>
            All text remains dark on light backgrounds for optimal readability and ATS compatibility.
          </li>
          <li>
            The design maintains a clean, minimalist approach with subtle color accents for visual hierarchy.
          </li>
          <li>
            Implementation is achieved through CSS variables and component-specific classes, 
            making it easy to apply consistently across the application.
          </li>
          <li>
            For full implementation details, refer to the RESUME_THEME_IMPLEMENTATION_GUIDE.md file.
          </li>
        </ul>
      </div>
    </div>)};

// Star and Brain components for the "before" tab
const Star = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04Z" />
  </svg>
);

const Briefcase = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export default ResumeThemeDemoPage;