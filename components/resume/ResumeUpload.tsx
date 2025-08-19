'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import ProfileCompletionForm from './ProfileCompletionForm';
import { useSession } from 'next-auth/react';

interface ResumeUploadProps {
	userId?: string;
	onComplete?: () => void;
}

function ResumeUpload({ userId, onComplete }: ResumeUploadProps) {
	const { status } = useSession();
	const [uploadedFile, setUploadedFile] = useState(null as File | null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [resumeData, setResumeData] = useState(null as unknown);
	const [showForm, setShowForm] = useState(false);
	const [resumeId, setResumeId] = useState(null as string | null);

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		const file = acceptedFiles[0];
		setUploadedFile(file);
		setIsUploading(true);
		setUploadProgress(0);

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
				setResumeData(result.resume);
				
				// Show success message briefly, then show the form
				toast({
					title: 'Resume Uploaded Successfully!',
					description: `Resume uploaded: ${file.name}`,
				});

				// Wait 1.2 seconds then show the form
				setTimeout(() => {
					setShowForm(true);
				}, 1200);

			} else {
				throw new Error(result.error || 'Upload failed');
			}

		} catch (error: unknown) {
			console.error('Upload error:', error);
			toast({
				title: 'Upload Failed',
				description: error instanceof Error ? error.message : 'Please try again',
				variant: 'destructive',
			});
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
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
		if (onComplete) {
			onComplete();
		}
		// Reset the component state
		setUploadedFile(null);
		setResumeData(null);
		setShowForm(false);
		setResumeId(null);
	};

	const handleManualEdit = () => {
		setShowForm(true);
	};

	const handleViewProfile = () => {
		if (status === 'authenticated') {
			window.location.href = '/profile';
			return;
		}
		// Not signed in → open the form so user can complete manually now
		setShowForm(true);
	};

	if (showForm && resumeData) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-6 w-6 text-green-600" />
							AI Resume Analysis Complete
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-6 p-4 bg-blue-50 rounded-lg">
							<p className="text-sm text-blue-800">
								<strong>Resume:</strong> {uploadedFile?.name}
							</p>
							<p className="text-sm text-blue-700 mt-1">
								AI has extracted your information. Review and edit as needed, or fill in missing details manually.
							</p>
						</div>
						
						<ProfileCompletionForm
							resumeId={resumeId}
							initialData={resumeData}
							onComplete={handleFormComplete}
							onClose={() => setShowForm(false)}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (uploadedFile && !showForm) {
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
								onClick={handleManualEdit}
								className="w-full"
								size="lg"
							>
								<FileText className="h-4 w-4 mr-2" />
								Complete Your Profile
							</Button>
							
							<Button 
								variant="outline"
								onClick={handleViewProfile}
								className="w-full"
							>
								View Profile
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold text-gray-900">
						Upload Your Resume
					</CardTitle>
					<p className="text-gray-600">
						Upload your resume and let AI automatically fill your profile, or edit manually
					</p>
				</CardHeader>
				
				<CardContent>
					<div
						{...getRootProps()}
						className={`
							border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
							${isDragActive 
								? 'border-blue-500 bg-blue-50' 
								: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
							}
						`}
					>
						<input {...getInputProps()} />
						
						{isUploading ? (
							<div className="space-y-4">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
								<div>
									<p className="text-lg font-medium text-gray-900 mb-2">
										Analyzing Resume...
									</p>
									<Progress value={uploadProgress} className="w-full" />
									<p className="text-sm text-gray-500 mt-2">
										{uploadProgress < 50 ? 'Uploading...' : 
										 uploadProgress < 90 ? 'Processing...' : 'Finalizing...'}
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-4">
								<Upload className="h-12 w-12 text-gray-400 mx-auto" />
								<div>
									<p className="text-lg font-medium text-gray-900">
										{isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
									</p>
									<p className="text-gray-500">or click to browse</p>
								</div>
								<p className="text-sm text-gray-400">
									Supports PDF, DOC, DOCX (Max 10MB)
								</p>
							</div>
						)}
					</div>

					{!isUploading && (
						<div className="mt-6 text-center">
							<p className="text-sm text-gray-600 mb-4">
								Our AI will automatically extract your information and fill your profile
							</p>
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<CheckCircle className="h-4 w-4 text-green-600" />
									Auto-fill profile
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<CheckCircle className="h-4 w-4 text-green-600" />
									Manual editing
								</div>
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<CheckCircle className="h-4 w-4 text-green-600" />
									Instant results
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default ResumeUpload;
