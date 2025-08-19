'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProfileCompletionForm from './ProfileCompletionForm';

interface ResumeUploadProps {
	userId?: string;
	onComplete?: () => void;
}

export default function ResumeUpload({ userId, onComplete }: ResumeUploadProps) {
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [resumeData, setResumeData] = useState<any>(null);
	const [resumeId, setResumeId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		const file = acceptedFiles[0];
		setUploadedFile(file);
		setIsUploading(true);
		setUploadProgress(0);
		setShowForm(false); // Reset form state

		try {
			// Simulate upload progress
			const progressInterval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return 90;
					}
					return prev + 10;
				});
			}, 200);

			// Create FormData for upload
			const formData = new FormData();
			formData.append('resume', file);
			if (userId) {
				formData.append('userId', userId);
			}

			// Upload resume
			const response = await fetch('/api/upload/resume', {
				method: 'POST',
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			const result = await response.json();
			
			if (result.success) {
				setResumeId(result.resume.id);
				
				// Extract and format the parsed data for auto-fill
				const formattedData = formatResumeData(result.parsedData || result.resume.parsedData);
				setResumeData(formattedData);
				
				toast({
					title: 'Resume Uploaded Successfully!',
					description: `AI analysis complete. Form will auto-fill with extracted information.`,
				});

				// Show form immediately after successful upload
				setShowForm(true);

			} else {
				throw new Error(result.error || 'Upload failed');
			}

		} catch (error: any) {
			console.error('Upload error:', error);
			toast({
				title: 'Upload Failed',
				description: error.message || 'Failed to upload resume. Please try again.',
				variant: 'destructive',
			});
			setUploadedFile(null);
			setIsUploading(false);
			setUploadProgress(0);
		} finally {
			setIsUploading(false);
		}
	}, [userId]);

	const onDropRejected = useCallback((rejectedFiles: { file: File; errors: { code: string; message: string }[] }[]) => {
		toast({
			title: 'File Rejected',
			description: `File rejected: ${rejectedFiles[0]?.errors[0]?.message || 'Invalid file'}`,
			variant: 'destructive',
		});
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		onDropRejected,
		accept: {
			'application/pdf': ['.pdf'],
			'application/msword': ['.doc'],
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
		},
		multiple: false,
	});

	const handleFormComplete = () => {
		toast({
			title: 'Profile Completed!',
			description: 'Your profile has been saved successfully.',
		});
		
		if (onComplete) {
			onComplete();
		}
		
		// Reset component state
		setUploadedFile(null);
		setResumeData(null);
		setShowForm(false);
		setResumeId(null);
		setUploadProgress(0);
	};

	const handleCloseForm = () => {
		setShowForm(false);
	};

	// Format resume data for better auto-fill
	const formatResumeData = (data: any) => {
		if (!data) return {};
		
		return {
			fullName: data.fullName || data.name || '',
			email: data.email || '',
			phone: data.phone || '',
			location: data.location || '',
			jobTitle: data.jobTitle || data.title || '',
			skills: Array.isArray(data.skills) ? data.skills : [],
			education: Array.isArray(data.education) ? data.education : [],
			experience: Array.isArray(data.experience) ? data.experience : [],
			expectedSalary: data.expectedSalary || data.salary || '',
			linkedin: data.linkedin || '',
			portfolio: data.portfolio || '',
		};
	};

	// Show form with auto-filled data
	if (showForm && resumeData) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-6 w-6 text-green-600" />
							Complete Your Profile
						</CardTitle>
						<p className="text-sm text-gray-600 mt-2">
							AI has extracted information from your resume. Review and edit as needed.
						</p>
					</CardHeader>
					<CardContent>
						<div className="mb-6 p-4 bg-blue-50 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>Resume:</strong> {uploadedFile?.name}
							</p>
							<p className="text-sm text-blue-700 mt-1">
								All fields below are pre-filled from your resume. Edit any information that needs correction.
							</p>
						</div>
						
						<ProfileCompletionForm
							resumeId={resumeId}
							initialData={resumeData}
							onComplete={handleFormComplete}
							onClose={handleCloseForm}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show upload success message
	if (uploadedFile && !showForm && !isUploading) {
		return (
			<div className="max-w-md mx-auto p-6">
				<Card className="text-center">
					<CardContent className="pt-6">
						<CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Resume Uploaded Successfully!
						</h2>
						<p className="text-sm text-gray-600 mb-4">
							{uploadedFile.name}
						</p>
						
						<div className="space-y-3">
							<Button 
								onClick={() => setShowForm(true)}
								className="w-full"
								size="lg"
							>
								<FileText className="h-4 w-4 mr-2" />
								Complete Your Profile
							</Button>
							
							<Button 
								variant="outline"
								onClick={() => {
									setUploadedFile(null);
									setResumeData(null);
									setResumeId(null);
									setUploadProgress(0);
								}}
								className="w-full"
							>
								<X className="h-4 w-4 mr-2" />
								Upload Different File
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show upload progress
	if (isUploading) {
		return (
			<div className="max-w-md mx-auto p-6">
				<Card className="text-center">
					<CardContent className="pt-6">
						<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">
							{uploadProgress < 50 ? 'Uploading Resume...' : 'Analyzing Resume...'}
						</h2>
						<p className="text-sm text-gray-600 mb-4">
							{uploadProgress < 50 ? 'Please wait while we upload your file' : 'AI is extracting information from your resume'}
						</p>
						
						<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
							<div 
								className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
								style={{ width: `${uploadProgress}%` }}
							></div>
						</div>
						
						<p className="text-sm text-gray-500">
							{uploadProgress}% Complete
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show upload interface
	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center text-gray-900">
						Upload Your Resume
					</CardTitle>
					<p className="text-center text-gray-600 mt-2">
						Upload your resume and we'll automatically fill your profile
					</p>
				</CardHeader>
				<CardContent>
					<div
						{...getRootProps()}
						className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
							isDragActive
								? 'border-blue-400 bg-blue-50'
								: 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
						}`}
					>
						<input {...getInputProps()} />
						<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						
						{isDragActive ? (
							<p className="text-blue-600 font-medium">Drop your resume here</p>
						) : (
							<div>
								<p className="text-gray-600 mb-2">
									<span className="text-blue-600 hover:text-blue-700 font-medium">
										Click to upload
									</span>{' '}
									or drag and drop
								</p>
								<p className="text-sm text-gray-500">
									PDF, DOC, DOCX up to 10MB
								</p>
							</div>
						)}
					</div>
					
					<div className="mt-6 text-center">
						<p className="text-sm text-gray-500">
							Your resume will be analyzed by AI to automatically fill your profile
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
