/**
 * Example usage of AdvancedResumeValidator component
 * 
 * This demonstrates how to integrate the Advanced Resume Validator
 * into your existing forms and workflows.
 */

'use client';

import React, { useState } from 'react';
import { AdvancedResumeValidator } from './AdvancedResumeValidator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export function AdvancedResumeValidatorExample() {
  const [resumeText, setResumeText] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [showValidator, setShowValidator] = useState(false);

  // Sample data for demonstration
  const sampleParserData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    skills: ['JavaScript', 'React', 'Node.js'],
    education: [
      {
        degree: 'Bachelor of Science',
        institution: 'University of Technology',
        year: '2020'
      }
    ],
    experience: [
      {
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        start_date: '2021',
        end_date: '2023',
        description: 'Developed web applications'
      }
    ]
  };

  const sampleGeminiData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    skills: ['JavaScript', 'Node.js', 'Python'],
    education: [
      {
        degree: 'B.S. Computer Science',
        institution: 'University of Technology',
        year: '2020'
      }
    ],
    experience: [
      {
        job_title: 'Senior Software Engineer',
        company: 'Tech Corp',
        start_date: '2021',
        end_date: 'present',
        description: 'Led development of web applications'
      }
    ]
  };

  const sampleResumeText = `
John Doe
Software Engineer
Email: john.doe@example.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2020
GPA: 3.8

EXPERIENCE
Senior Software Engineer
Tech Corp, 2021 - Present
• Led development of web applications using React and Node.js
• Implemented CI/CD pipelines
• Mentored junior developers

Software Developer Intern
StartupXYZ, 2020 - 2021
• Developed mobile applications using React Native
• Collaborated with design team

SKILLS
JavaScript, React, Node.js, Python, AWS, Docker, Git, Agile

PROJECTS
E-commerce Platform
• Built full-stack e-commerce solution
• Technologies: React, Node.js, MongoDB

Task Management App
• Created collaborative task management tool
• Technologies: Vue.js, Express, PostgreSQL

CERTIFICATIONS
AWS Certified Developer
Google Cloud Professional Developer
`;

  const handleValidationComplete = (result) => {
    setValidationResult(result);
    console.log('Validation completed:', result);
  };

  const loadSampleData = () => {
    setResumeText(sampleResumeText);
    setShowValidator(true);
  };

  const clearData = () => {
    setResumeText('');
    setValidationResult(null);
    setShowValidator(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Resume Validator Demo</CardTitle>
          <CardDescription>
            This example shows how to use the Advanced Resume Validator component
            with sample data to demonstrate the validation and merging capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={loadSampleData} variant="outline">
                Load Sample Data
              </Button>
              <Button onClick={clearData} variant="ghost">
                Clear Data
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume Text (Required)</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume text here or click 'Load Sample Data' to see a demonstration..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={6}
              />
            </div>

            {resumeText && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Resume text is ready for validation. The validator will use sample parser and Gemini data
                  along with your resume text to demonstrate the merging and validation process.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {showValidator && resumeText && (
        <AdvancedResumeValidator
          parserData={sampleParserData}
          geminiData={sampleGeminiData}
          originalText={resumeText}
          onValidationComplete={handleValidationComplete}
          autoValidate={true}
        />
      )}

      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Validation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 ${
                    validationResult.validation.isValid ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {validationResult.validation.isValid ? 'Valid' : 'Needs Attention'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>
                  <span className="ml-2">{validationResult.validation.confidence}%</span>
                </div>
                <div>
                  <span className="font-medium">Processing Time:</span>
                  <span className="ml-2">{validationResult.validation.processingTime}ms</span>
                </div>
                <div>
                  <span className="font-medium">Sources Used:</span>
                  <span className="ml-2">
                    {Object.entries(validationResult.metadata.sourcesUsed)
                      .filter(([_, used]) => used)
                      .map(([source]) => source)
                      .join(', ')
                    }
                  </span>
                </div>
              </div>

              {validationResult.validation.errors.length > 0 && (
                <div>
                  <span className="font-medium text-red-600">Errors:</span>
                  <ul className="list-disc list-inside mt-1">
                    {validationResult.validation.errors.map((error, index) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult.validation.warnings.length > 0 && (
                <div>
                  <span className="font-medium text-yellow-600">Warnings:</span>
                  <ul className="list-disc list-inside mt-1">
                    {validationResult.validation.warnings.map((warning, index) => (
                      <li key={index} className="text-yellow-600">{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Extracted Data Summary:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Name: {validationResult.data.name || 'Not found'}</div>
                  <div>Email: {validationResult.data.email || 'Not found'}</div>
                  <div>Phone: {validationResult.data.phone || 'Not found'}</div>
                  <div>Skills: {validationResult.data.skills.length} found</div>
                  <div>Education: {validationResult.data.education.length} entries</div>
                  <div>Experience: {validationResult.data.experience.length} entries</div>
                  <div>Projects: {validationResult.data.projects.length} found</div>
                  <div>Certifications: {validationResult.data.certifications.length} found</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdvancedResumeValidatorExample;
