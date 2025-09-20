/**
 * Advanced Resume Validator Component
 * 
 * React component for integrating the advanced resume validator
 * into your existing job portal frontend without disruption.
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  Brain, 
  Shield,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Code
} from 'lucide-react';

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  address: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    job_title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
  projects: string[];
  certifications: string[];
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

interface ValidationResponse {
  success: boolean;
  message: string;
  data: ParsedResumeData;
  validation: ValidationResult;
  metadata: {
    sourcesUsed: {
      parser: boolean;
      gemini: boolean;
      originalText: boolean;
    };
    timestamp: string;
    userId: string;
  };
}

interface AdvancedResumeValidatorProps {
  onValidationComplete?: (result: ValidationResponse) => void;
  className?: string;
  parserData?: any;
  geminiData?: any;
  originalText?: string;
  autoValidate?: boolean;
}

export function AdvancedResumeValidator({ 
  onValidationComplete, 
  className = '',
  parserData: propParserData,
  geminiData: propGeminiData,
  originalText: propOriginalText,
  autoValidate = false
}: AdvancedResumeValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateResume = useCallback(async (
    parserData?: any,
    geminiData?: any,
    originalText?: string
  ) => {
    if (!originalText || originalText.trim().length < 10) {
      setError('Original resume text is required and must be at least 10 characters long');
      return;
    }

    setIsValidating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/resumes/advanced-validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parserData,
          geminiData,
          originalText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Validation failed with status ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Validation was unsuccessful');
      }

      setResult(data);
      onValidationComplete?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Validation failed: ${errorMessage}`);
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  }, [onValidationComplete]);

  // Auto-validate when props change
  useEffect(() => {
    if (autoValidate && propOriginalText) {
      validateResume(propParserData, propGeminiData, propOriginalText);
    }
  }, [autoValidate, propParserData, propGeminiData, propOriginalText, validateResume]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getValidationIcon = (isValid: boolean, confidence: number) => {
    if (isValid && confidence >= 80) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (isValid && confidence >= 60) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Resume Validator
          </CardTitle>
          <CardDescription>
            Validate and merge resume data from multiple sources with advanced error correction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Parser Data</span>
                </div>
                <p className="text-sm text-gray-600">PyResparser output (optional)</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Gemini AI</span>
                </div>
                <p className="text-sm text-gray-600">AI parsed output (optional)</p>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Original Text</span>
                </div>
                <p className="text-sm text-gray-600">Ground truth (required)</p>
              </Card>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This validator merges data from multiple sources, validates formats, 
                removes duplicates, and corrects errors using the original resume text as ground truth.
              </AlertDescription>
            </Alert>

            {/* Manual validation trigger */}
            {propOriginalText && (
              <div className="flex justify-center">
                <Button 
                  onClick={() => validateResume(propParserData, propGeminiData, propOriginalText)}
                  disabled={isValidating || !propOriginalText}
                  className="w-full md:w-auto"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Validate Resume Data
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              {propOriginalText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => validateResume(propParserData, propGeminiData, propOriginalText)}
                  disabled={isValidating}
                  className="ml-4"
                >
                  {isValidating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Retry'
                  )}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isValidating && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-lg font-medium">Validating Resume Data...</p>
              <p className="text-sm text-gray-600 mt-2">
                Merging data sources and performing quality checks
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Validation Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getValidationIcon(result.validation.isValid, result.validation.confidence)}
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence Score</span>
                  <span className={`font-bold ${getConfidenceColor(result.validation.confidence)}`}>
                    {result.validation.confidence}%
                  </span>
                </div>
                <Progress value={result.validation.confidence} className="h-2" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Processing Time:</span>
                    <span className="ml-2">{result.validation.processingTime}ms</span>
                  </div>
                  <div>
                    <span className="font-medium">Sources Used:</span>
                    <div className="flex gap-1 mt-1">
                      {result.metadata.sourcesUsed.parser && <Badge variant="outline">Parser</Badge>}
                      {result.metadata.sourcesUsed.gemini && <Badge variant="outline">Gemini</Badge>}
                      {result.metadata.sourcesUsed.originalText && <Badge variant="outline">Text</Badge>}
                    </div>
                  </div>
                </div>

                {result.validation.errors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-medium mb-2">Errors:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {result.validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {result.validation.warnings.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium mb-2">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {result.validation.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parsed Data */}
          <Card>
            <CardHeader>
              <CardTitle>Parsed Resume Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Name:</span>
                      <p className="text-sm text-gray-600">{result.data.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Email:</span>
                      <p className="text-sm text-gray-600">{result.data.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Phone:</span>
                      <p className="text-sm text-gray-600">{result.data.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Address:</span>
                      <p className="text-sm text-gray-600">{result.data.address || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Skills */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Skills ({result.data.skills.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.data.skills.length > 0 ? (
                      result.data.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No skills found</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Education */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education ({result.data.education.length})
                  </h4>
                  <div className="space-y-3">
                    {result.data.education.length > 0 ? (
                      result.data.education.map((edu, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{edu.degree}</div>
                          <div className="text-sm text-gray-600">{edu.institution}</div>
                          <div className="text-sm text-gray-500">{edu.year}</div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No education information found</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Experience */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Experience ({result.data.experience.length})
                  </h4>
                  <div className="space-y-3">
                    {result.data.experience.length > 0 ? (
                      result.data.experience.map((exp, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="font-medium">{exp.job_title}</div>
                          <div className="text-sm text-gray-600">{exp.company}</div>
                          <div className="text-sm text-gray-500">
                            {exp.start_date} - {exp.end_date}
                          </div>
                          {exp.description && (
                            <div className="text-sm mt-2">{exp.description}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No work experience found</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Projects */}
                {result.data.projects.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Projects ({result.data.projects.length})</h4>
                    <div className="space-y-2">
                      {result.data.projects.map((project, index) => (
                        <div key={index} className="p-2 border rounded">
                          <p className="text-sm">{project}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {result.data.certifications.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications ({result.data.certifications.length})
                    </h4>
                    <div className="space-y-2">
                      {result.data.certifications.map((cert, index) => (
                        <div key={index} className="p-2 border rounded">
                          <p className="text-sm">{cert}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Usage Example */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Example</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`// Example usage in your components
const validateResume = async (parserData, geminiData, originalText) => {
  const response = await fetch('/api/resumes/advanced-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parserData, geminiData, originalText })
  });
  return await response.json();
};

// Call the validator
const result = await validateResume(
  yourParserOutput,
  yourGeminiOutput, 
  yourResumeText
);`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdvancedResumeValidator;
