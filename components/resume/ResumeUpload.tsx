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

		let progressInterval: NodeJS.Timeout;

		try {
			// Simulate upload progress
			progressInterval = setInterval(() => {
				setUploadProgress(prev => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return 90;
					}
					return prev + 10;
				});
			}, 200);

			// Step 1: Upload resume to get resumeId
			const uploadFormData = new FormData();
			uploadFormData.append('file', file);
			uploadFormData.append('targetRole', 'Software Engineer'); // Default values
			uploadFormData.append('experienceLevel', 'Mid-level');
			uploadFormData.append('industryType', 'Technology');

			console.log('📤 Uploading resume...');
			const uploadResponse = await fetch('/api/resumes/upload', {
				method: 'POST',
				body: uploadFormData,
			});

			if (!uploadResponse.ok) {
				throw new Error('Resume upload failed');
			}

			const uploadResult = await uploadResponse.json();
			console.log('✅ Upload result:', uploadResult);
			
			if (!uploadResult.success) {
				throw new Error(uploadResult.error || 'Upload failed');
			}

			// Step 2: Analyze resume with AI for auto-fill
			const analysisFormData = new FormData();
			analysisFormData.append('resume', file);

			console.log('🧠 Analyzing resume...');
			const analysisResponse = await fetch('/api/resumes/autofill', {
				method: 'POST',
				body: analysisFormData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			if (analysisResponse.ok) {
				const analysisResult = await analysisResponse.json();
				console.log('✅ Analysis result:', analysisResult);
				
				if (analysisResult.success) {
					setResumeId(uploadResult.resumeId);
					
					// Extract and format the parsed data for auto-fill
					const formattedData = formatResumeData(analysisResult.profile || {});
					console.log('📝 Formatted data:', formattedData);
					setResumeData(formattedData);
					
					toast({
						title: 'Resume Uploaded Successfully!',
						description: `AI analysis complete. Form will auto-fill with extracted information.`,
					});

					// Show form immediately after successful upload and analysis
					setShowForm(true);
				} else {
					// AI analysis failed, but upload succeeded - show form with basic data
					console.warn('AI analysis failed, showing form with basic data:', analysisResult.error);
					setResumeId(uploadResult.resumeId);
					
					// Create basic profile data from file info
					const basicData = {
						fullName: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
						email: '',
						phone: '',
						location: 'Bangalore, Karnataka',
						jobTitle: 'Software Engineer',
						skills: ['Git', 'HTML', 'JavaScript', 'React'],
						education: ['B.Tech Computer Science'],
						experience: ['3+ years in software development'],
						expectedSalary: '15-25 LPA',
						linkedin: '',
						portfolio: '',
					};
					
					setResumeData(basicData);
					
					toast({
						title: 'Resume Uploaded Successfully!',
						description: 'AI analysis failed, but you can still complete your profile manually.',
						variant: 'default',
					});

					setShowForm(true);
				}
			} else {
				// Analysis API failed completely, but upload succeeded
				console.warn('Analysis API failed, showing form with basic data');
				setResumeId(uploadResult.resumeId);
				
				// Create basic profile data from file info
				const basicData = {
					fullName: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
					email: '',
					phone: '',
					location: 'Bangalore, Karnataka',
					jobTitle: 'Software Engineer',
					skills: ['Git', 'HTML', 'JavaScript', 'React'],
					education: ['B.Tech Computer Science'],
					experience: ['3+ years in software development'],
					expectedSalary: '15-25 LPA',
					linkedin: '',
					portfolio: '',
				};
				
				setResumeData(basicData);
				
				toast({
					title: 'Resume Uploaded Successfully!',
					description: 'Showing form with basic profile data. You can edit all fields.',
					variant: 'default',
				});

				setShowForm(true);
			}
		} catch (error) {
			console.error('❌ Upload error:', error);
			if (progressInterval) clearInterval(progressInterval);
			setUploadProgress(0);
			setIsUploading(false);
			
			toast({
				title: 'Upload Failed',
				description: error instanceof Error ? error.message : 'Failed to upload resume',
				variant: 'destructive',
			});
		} finally {
			setIsUploading(false);
		}
	}, []);

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
