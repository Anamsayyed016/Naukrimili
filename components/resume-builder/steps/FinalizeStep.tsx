'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, FileCode, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Template } from '@/lib/resume-builder/types';

interface FinalizeStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
  templateId: string;
  typeId: string;
  selectedColorId: string;
  template: Template | null;
  onSave?: () => void;
}

export default function FinalizeStep({
  formData,
  templateId,
  typeId,
  selectedColorId,
  template: _template,
  onSave,
}: FinalizeStepProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const [atsScore, setAtsScore] = useState(0);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | 'html' | null>(null);
  const [saving, setSaving] = useState(false);

  // Calculate ATS score
  useEffect(() => {
    const score = calculateATSScore(formData);
    setAtsScore(score);
  }, [formData]);

  const calculateATSScore = (data: Record<string, unknown>): number => {
    let score = 0;
    let maxScore = 100;

    // Personal Information (25 points)
    if (data.firstName || data.name) score += 5;
    if (data.email) score += 10;
    if (data.phone) score += 5;
    if (data.location) score += 5;

    // Professional Information (25 points)
    if (data.jobTitle || data.title) score += 10;
    if (data.summary || data.bio) score += 15;

    // Skills (15 points)
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      score += Math.min(15, data.skills.length * 2);
    }

    // Experience (20 points)
    if (Array.isArray(data.experience) && data.experience.length > 0) {
      score += Math.min(20, data.experience.length * 5);
    }

    // Education (10 points)
    if (Array.isArray(data.education) && data.education.length > 0) {
      score += Math.min(10, data.education.length * 5);
    }

    // Additional Sections (5 points)
    if (Array.isArray(data.projects) && data.projects.length > 0) score += 2;
    if (Array.isArray(data.certifications) && data.certifications.length > 0) score += 2;
    if (Array.isArray(data.languages) && data.languages.length > 0) score += 1;

    return Math.min(Math.round(score), maxScore);
  };

  const getATSScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getATSScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getRecommendations = (score: number): string[] => {
    const recommendations: string[] = [];
    const data = formData;

    if (!data.firstName && !data.name) recommendations.push('Add your full name');
    if (!data.email) recommendations.push('Add your email address');
    if (!data.phone) recommendations.push('Add your phone number');
    if (!data.jobTitle && !data.title) recommendations.push('Add your professional title');
    if (!data.summary && !data.bio) recommendations.push('Add a professional summary');
    if (!Array.isArray(data.skills) || data.skills.length === 0) {
      recommendations.push('Add at least 3-5 key skills');
    }
    if (!Array.isArray(data.experience) || data.experience.length === 0) {
      recommendations.push('Add your work experience');
    }
    if (!Array.isArray(data.education) || data.education.length === 0) {
      recommendations.push('Add your education');
    }

    return recommendations;
  };

  const handleSave = async () => {
    if (!session) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to save your resume.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    if (onSave) onSave();

    try {
      const response = await fetch('/api/resume-builder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          resumeType: typeId || 'standard',
          formData,
          colorScheme: selectedColorId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Resume saved successfully!',
          description: 'Your resume has been saved to your account.',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/pricing')}
            >
              View plans
            </Button>
          ),
        });
      } else {
        throw new Error(result.error || 'Failed to save resume');
      }
    } catch (error: unknown) {
      console.error('Error saving resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      toast({
        title: 'Error saving resume',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'html') => {
    setExporting(format);

    try {
      const response = await fetch(`/api/resume-builder/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          formData,
          selectedColorId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // If server-side export failed and fallback is suggested, try client-side
        if (error.fallback && format === 'pdf') {
          console.log('📄 Server-side PDF export unavailable, using client-side fallback...');
          await handleClientSidePDFExport();
          return;
        }
        
        throw new Error(error.error || 'Export failed');
      }

      // Handle different response types
      if (format === 'pdf') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${templateId}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else if (format === 'docx') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-${templateId}-${Date.now()}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // HTML - open in new window
        const html = await response.text();
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
        }
      }

      toast({
        title: 'Export successful!',
        description: `Your resume has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error: unknown) {
      console.error(`Error exporting ${format}:`, error);
      
      // Try client-side PDF export as final fallback
      if (format === 'pdf') {
        console.log('📄 Attempting client-side PDF export fallback...');
        try {
          await handleClientSidePDFExport();
          return;
        } catch (fallbackError: unknown) {
          console.error('Client-side PDF export also failed:', fallbackError);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      toast({
        title: `Export failed`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleClientSidePDFExport = async () => {
    try {
      // Use browser's print functionality for PDF export
      // This is the most reliable cross-browser method
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow popups to export PDF');
      }

      // Get the current preview iframe content
      const previewFrame = document.querySelector('iframe[title*="preview" i], iframe') as HTMLIFrameElement;
      
      if (previewFrame && previewFrame.contentDocument) {
        const iframeDoc = previewFrame.contentDocument;
        const htmlContent = iframeDoc.documentElement.outerHTML;
        
        printWindow.document.write(htmlContent);
        
        // Add print-specific styles to ensure graphics/colors are preserved
        const printStyles = printWindow.document.createElement('style');
        printStyles.textContent = `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
            }
            
            .resume-container {
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Ensure all background colors and images are printed */
            * {
              background-color: initial !important;
            }
            
            [style*="background"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Preserve borders and decorative elements */
            [style*="border"],
            [class*="border"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Ensure images are visible */
            img {
              display: block !important;
              max-width: 100% !important;
              height: auto !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Preserve SVG graphics */
            svg {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @page {
            size: letter;
            margin: 0.5in;
          }
        `;
        printWindow.document.head.appendChild(printStyles);
        printWindow.document.close();
        
        // Wait for content and images to load
        printWindow.onload = () => {
          // Additional wait for images and fonts
          setTimeout(() => {
            printWindow.print();
            toast({
              title: 'PDF Export Ready',
              description: 'Use your browser\'s print dialog to save as PDF. Make sure "Background graphics" is enabled.',
            });
          }, 1000);
        };
      } else {
        throw new Error('Could not access resume preview');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Client-side export failed: ${errorMessage}`);
    }
  };

  const recommendations = getRecommendations(atsScore);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finalize & Export</h2>
        <p className="text-sm text-gray-600">
          Review your resume, check your ATS score, and export in your preferred format.
        </p>
      </div>

      {/* ATS Score */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">ATS Compatibility Score</h3>
            <p className="text-sm text-gray-600">
              How well your resume will perform with Applicant Tracking Systems
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getATSScoreColor(atsScore)}`}>
              {atsScore}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {getATSScoreLabel(atsScore)}
            </div>
          </div>
        </div>
        <Progress value={atsScore} className="h-3 mb-4" />
        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</p>
            <ul className="space-y-1">
              {recommendations.slice(0, 5).map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Save Resume */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Resume</h3>
        <p className="text-sm text-gray-600 mb-4">
          Save your resume to your account to access it later and make edits.
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Resume
            </>
          )}
        </Button>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Resume</h3>
        <p className="text-sm text-gray-600 mb-6">
          Download your resume in your preferred format.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {exporting === 'pdf' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6" />
                <span>Export as PDF</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('docx')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {exporting === 'docx' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-6 h-6" />
                <span>Export as DOCX</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('html')}
            disabled={exporting !== null}
            className="flex flex-col items-center gap-2 h-auto py-4"
          >
            {exporting === 'html' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FileCode className="w-6 h-6" />
                <span>Export as HTML</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Completion Message */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Resume Complete!
            </h3>
            <p className="text-sm text-green-700">
              Your resume is ready to use. You can save it to your account or export it in your preferred format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

