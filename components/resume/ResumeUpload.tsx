'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle, Brain, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface ResumeUploadProps {
  onComplete?: (data?: Record<string, unknown>) => void;
}

export default function ResumeUpload({ onComplete }: ResumeUploadProps) {
  const { data: session, status } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setAnalyzing(true);
      setError(null);

      console.log('🔄 Processing resume with AI...');
      
      toast({
        title: 'AI Processing Started',
        description: 'Analyzing your resume with AI. This may take a few seconds...',
      });
      
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('📤 Sending file to server...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const response = await fetch('/api/resumes/ultimate-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });
      
      console.log('📥 Server response status:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (_parseError) {
          // If response is not JSON, use status text
          errorData = { error: `Server error: ${response.status} ${response.statusText}` };
        }
        
        console.error('❌ Server error response:', errorData);
        
        // Handle specific error codes with enhanced error messages
        if (response.status === 413) {
          throw new Error('File size exceeds maximum limit of 10MB. Please upload a smaller file.');
        } else if (response.status === 401) {
          throw new Error('Please log in to upload your resume.');
        } else if (response.status === 400) {
          // Enhanced error handling for PDF extraction issues
          const errorMessage = errorData.error || 'Invalid file. Please upload PDF, DOC, DOCX, or TXT files.';
          const suggestions = errorData.suggestions || [];
          const hint = errorData.hint || '';
          
          // Build detailed error message
          let fullMessage = errorMessage;
          if (hint) {
            fullMessage += `\n\n${hint}`;
          }
          if (suggestions && suggestions.length > 0) {
            fullMessage += '\n' + suggestions.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n');
          }
          
          throw new Error(fullMessage);
        } else {
          throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('🎉 Resume uploaded and saved successfully!');
        console.log('📊 Resume ID:', result.resumeId);
        console.log('🤖 AI Provider:', result.aiProvider || 'unknown');
        console.log('✅ AI Success:', result.aiSuccess);
        console.log('🎯 Job recommendations:', result.recommendations?.length || 0);
        console.log('📄 Extracted data:', result.extractedData || result.profile);
        console.log('📊 Extraction details:', {
          fullName: result.profile?.fullName || result.extractedData?.fullName || 'MISSING',
          email: result.profile?.email || result.extractedData?.email || 'MISSING',
          phone: result.profile?.phone || result.extractedData?.phone || 'MISSING',
          skillsCount: result.profile?.skills?.length || result.extractedData?.skills?.length || 0,
          experienceCount: result.profile?.experience?.length || result.extractedData?.experience?.length || 0,
          educationCount: result.profile?.education?.length || result.extractedData?.education?.length || 0
        });
        
        // CRITICAL DEBUG: Check if arrays are actually populated
        const extractedData = result.extractedData || result.profile;
        console.log('🔍 CRITICAL: Checking array contents:');
        console.log('   - Skills array:', extractedData?.skills);
        console.log('   - Is skills array?', Array.isArray(extractedData?.skills));
        console.log('   - Experience array:', extractedData?.experience);
        console.log('   - Is experience array?', Array.isArray(extractedData?.experience));
        console.log('   - Education array:', extractedData?.education);
        console.log('   - Is education array?', Array.isArray(extractedData?.education));
        
        if (extractedData?.experience?.length > 0) {
          console.log('   - First experience entry:', JSON.stringify(extractedData.experience[0], null, 2));
        } else {
          console.error('   ❌ EXPERIENCE ARRAY IS EMPTY!');
        }
        
        if (extractedData?.education?.length > 0) {
          console.log('   - First education entry:', JSON.stringify(extractedData.education[0], null, 2));
        } else {
          console.error('   ❌ EDUCATION ARRAY IS EMPTY!');
        }
        
        if (extractedData?.skills?.length > 0) {
          console.log('   - Skills list:', extractedData.skills.slice(0, 10));
        } else {
          console.error('   ❌ SKILLS ARRAY IS EMPTY!');
        }
        
        toast({
          title: '✅ Resume Uploaded Successfully!',
          description: `Your resume has been analyzed and saved. ${result.recommendations?.length || 0} job matches found!`,
          duration: 3000,
        });

        // Reset form
        setFile(null);
        
        // Pass extracted data back to parent (support both extractedData and profile for compatibility)
        if (onComplete) {
          onComplete({
            extractedData: result.extractedData || result.profile,
            resumeId: result.resumeId,
            recommendations: result.recommendations,
            fileName: file.name,
            aiProvider: result.aiProvider,
            debug: result.debug
          });
        }
      } else {
        throw new Error(result.error || 'Failed to analyze resume');
      }
    } catch (err: unknown) {
      console.error('❌ Upload error:', err);
      const errorObj = err instanceof Error ? err : { message: 'Unknown error', stack: undefined, name: undefined };
      console.error('❌ Error details:', {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name
      });
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (errorObj.message) {
        errorMessage = errorObj.message;
      } else if (err instanceof TypeError && err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">Please sign in to upload your resume.</p>
        <Button asChild>
          <a href="/auth/signin">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Professional Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 hover:border-blue-400 transition-colors bg-gradient-to-br from-gray-50 to-blue-50/30">
        <input
          type="file"
          id="resume-upload"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label
          htmlFor="resume-upload"
          className="cursor-pointer flex flex-col items-center space-y-4"
        >
          <div className="p-6 bg-white rounded-full shadow-lg border-2 border-gray-200 hover:border-blue-400 transition-colors">
            <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600" />
          </div>
          <div className="text-center w-full px-2">
            <p className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 break-words px-2">
              {file ? (
                <span className="block truncate max-w-full" title={file.name}>
                  {file.name}
                </span>
              ) : (
                'Drop your resume here or click to browse'
              )}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 break-words">
              Supports PDF, DOC, DOCX files • Maximum 10MB
            </p>
          </div>
        </label>
      </div>

      {/* File Preview */}
      {file && !uploading && !analyzing && (
        <div className="p-4 sm:p-6 bg-white border-2 border-gray-200 rounded-xl shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate break-words" title={file.name}>
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Processing State */}
      {(uploading || analyzing) && (
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl shadow-lg animate-pulse">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-white rounded-full">
              <Brain className="h-12 w-12 text-blue-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                AI Analyzing Your Resume...
              </h3>
              <p className="text-sm text-gray-600 max-w-md">
                Our AI is extracting your information, calculating ATS score, and finding job matches. This usually takes 5-10 seconds.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Processing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {!uploading && !analyzing && (
        <div className="flex justify-center">
          <Button
            onClick={handleUpload}
            disabled={!file}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 min-w-[250px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload & Analyze Resume
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 sm:p-6 bg-red-50 border-2 border-red-200 rounded-xl shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 mb-1">Upload Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Features Info */}
      {!uploading && !analyzing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Brain className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">AI Analysis</h3>
            <p className="text-xs text-gray-600">Smart data extraction</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-green-50 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">ATS Score</h3>
            <p className="text-xs text-gray-600">Optimization tips</p>
          </div>
          <div className="text-center p-4 sm:p-6 bg-purple-50 rounded-xl border border-purple-200 hover:shadow-lg transition-shadow">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">Auto-Save</h3>
            <p className="text-xs text-gray-600">Instant profile update</p>
          </div>
        </div>
      )}
    </div>
  );
}
