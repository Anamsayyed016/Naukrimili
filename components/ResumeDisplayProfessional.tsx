import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, Star, FileText, Calendar, Briefcase, GraduationCap } from 'lucide-react';

// Import the professional theme CSS
// Note: You would need to import this in your _app.js or layout.tsx
// import '../styles/resume-professional-theme.css';

interface ResumeData {
  fileName: string;
  fileSize: string;
  uploadDate: string;
  atsScore: number;
  skills: string[];
  experience: string[];
  education: string[];
  recommendations?: string[]}

interface ResumeDisplayProps {
  resumeData: ResumeData}

/**
 * Professional Resume Display Component
 * 
 * This component demonstrates the implementation of the professional color scheme
 * for displaying resume information. It replaces the yellow backgrounds with
 * a more professional navy blue, slate gray, and light gray color palette.
 */
const ResumeDisplayProfessional: React.FC<ResumeDisplayProps> = ({ resumeData }) => {
  return (
    <div className="space-y-6">
      {/* File Information Card */}
      <Card className="resume-card resume-file-info">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="resume-file-icon">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="resume-file-name">{resumeData.fileName}</h3>
                <p className="resume-file-meta">{resumeData.fileSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-resume-text-muted" />
              <span className="resume-file-date">{resumeData.uploadDate}</span>
              <Badge className="resume-status-badge">Completed</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ATS Score Card */}
      <Card className="resume-card ats-score-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="ats-score-title">ATS Compatibility Score</h4>
              <p className="ats-score-description">How well your resume passes through Applicant Tracking Systems</p>
            </div>
            <div className="text-center">
              <div className="ats-score-value">{resumeData.atsScore}%</div>
              <div className="flex items-center gap-1 ats-score-rating">
                <Star className="w-4 h-4" />
                <span>
                  {resumeData.atsScore >= 80 
                    ? "Excellent" 
                    : resumeData.atsScore >= 60 
                      ? "Good" 
                      : "Needs Improvement"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Card */}
      <Card className="resume-card">
        <CardHeader>
          <CardTitle className="resume-section-header">
            <Brain className="w-5 h-5" />
            Skills Extracted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {resumeData.skills.length === 0 ? (
              <span className="text-resume-text-muted">No skills found.</span>
            ) : (
              resumeData.skills.map((skill, index) => (
                <span key={index} className="resume-skill-tag">
                  {skill}
                </span>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience Card */}
      <Card className="resume-card">
        <CardHeader>
          <CardTitle className="resume-section-header">
            <Briefcase className="w-5 h-5" />
            Work Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resumeData.experience.length === 0 ? (
              <span className="text-resume-text-muted">No experience found.</span>
            ) : (
              resumeData.experience.map((exp, index) => (
                <div key={index} className="resume-experience-item">
                  <span className="resume-experience-description">{exp}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Education Card */}
      <Card className="resume-card">
        <CardHeader>
          <CardTitle className="resume-section-header">
            <GraduationCap className="w-5 h-5" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resumeData.education.length === 0 ? (
              <span className="text-resume-text-muted">No education found.</span>
            ) : (
              resumeData.education.map((edu, index) => (
                <div key={index} className="resume-education-item">
                  <span className="resume-education-description">{edu}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations Card (if available) */}
      {resumeData.recommendations && resumeData.recommendations.length > 0 && (
        <Card className="resume-card">
          <CardHeader>
            <CardTitle className="resume-section-header">
              <Star className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resumeData.recommendations.map((rec, index) => (
                <div key={index} className="resume-recommendation-item">
                  <span className="resume-recommendation-description">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>)};

export default ResumeDisplayProfessional;