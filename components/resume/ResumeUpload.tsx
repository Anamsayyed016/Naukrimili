'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, Upload, X, AlertCircle, LogIn, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ProfileCompletionForm from './ProfileCompletionForm';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ResumeUploadProps {
	userId?: string;
	onComplete?: () => void;
}

export default function ResumeUpload({ userId, onComplete }: ResumeUploadProps) {
	const { data: session, status } = useSession();
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [resumeData, setResumeData] = useState<any>(null);
	const [resumeId, setResumeId] = useState<string | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);

	// Check if user is authenticated
	const isAuthenticated = status === 'authenticated';
	const isLoading = status === 'loading';

	// Show login prompt if not authenticated
	if (isLoading) {
		return (
			<div className="max-w-md mx-auto p-6">
				<Card className="text-center">
					<CardContent className="pt-6">
						<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<h2 className="text-xl font-semibold text-gray-900 mb-2">
							Loading...
						</h2>
						<p className="text-sm text-gray-600">
							Please wait while we check your authentication status.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="max-w-md mx-auto p-6">
				<Card className="text-center border-blue-200">
					<CardContent className="pt-6">
						<User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Login Required
						</h2>
						<p className="text-sm text-gray-600 mb-4">
							You need to be logged in to upload your resume and access your profile.
						</p>
						
						<div className="space-y-3">
							<Link href="/auth/login">
								<Button className="w-full" size="lg">
									<LogIn className="h-4 w-4 mr-2" />
									Login to Continue
								</Button>
							</Link>
							
							<Link href="/auth/register">
								<Button variant="outline" className="w-full">
									<FileText className="h-4 w-4 mr-2" />
									Create Account
								</Button>
							</Link>
						</div>
						
						<div className="mt-4 p-3 bg-blue-50 rounded-lg">
							<p className="text-xs text-blue-700">
								<strong>Why login?</strong> We need to know who you are to save your resume and show you personalized job recommendations.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	const onDrop = useCallback(async (acceptedFiles: File[]) => {
		if (acceptedFiles.length === 0) return;

		const file = acceptedFiles[0];
		setUploadedFile(file);
		setIsUploading(true);
		setUploadProgress(0);
		setShowForm(false);
		setUploadError(null); // Reset error state

		let progressInterval: NodeJS.Timeout;

		try {
			console.log('🚀 Starting resume upload process for user:', session?.user?.email);
			
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

			console.log('📤 Uploading resume to /api/resumes/upload...');
			const uploadResponse = await fetch('/api/resumes/upload', {
				method: 'POST',
				body: uploadFormData,
			});

			console.log('📥 Upload response status:', uploadResponse.status);
			console.log('📥 Upload response headers:', Object.fromEntries(uploadResponse.headers.entries()));

			if (!uploadResponse.ok) {
				const errorText = await uploadResponse.text();
				console.error('❌ Upload failed with status:', uploadResponse.status);
				console.error('❌ Error response:', errorText);
				
				let errorMessage = 'Resume upload failed';
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.error || errorData.message || errorMessage;
				} catch (e) {
					console.warn('Could not parse error response as JSON');
				}
				
				throw new Error(`Upload failed (${uploadResponse.status}): ${errorMessage}`);
			}

			const uploadResult = await uploadResponse.json();
			console.log('✅ Upload result:', uploadResult);
			
			if (!uploadResult.success) {
				throw new Error(uploadResult.error || 'Upload failed');
			}

			// Step 2: Analyze resume with AI for auto-fill
			const analysisFormData = new FormData();
			analysisFormData.append('resume', file);

			console.log('🧠 Analyzing resume with AI...');
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
					
					// Create basic profile data from file info and user session
					const basicData = {
						fullName: session?.user?.name || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
						email: session?.user?.email || '',
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
				
				// Create basic profile data from file info and user session
				const basicData = {
					fullName: session?.user?.name || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
					email: session?.user?.email || '',
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
			
			// Set error state for better user feedback
			const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
			setUploadError(errorMessage);
			
			toast({
				title: 'Upload Failed',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setIsUploading(false);
		}
	}, [session]);

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
		setUploadError(null);
	};

	const handleCloseForm = () => {
		setShowForm(false);
	};

	const handleRetryUpload = () => {
		setUploadError(null);
		setUploadedFile(null);
		setResumeData(null);
		setResumeId(null);
		setUploadProgress(0);
	};

	// Format resume data for better auto-fill
	const formatResumeData = (data: any) => {
		if (!data) return {};
		
		return {
			fullName: data.fullName || data.name || session?.user?.name || '',
			email: data.email || session?.user?.email || '',
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
						<div className="mt-2 p-2 bg-green-50 rounded-lg">
							<p className="text-xs text-green-700">
								<strong>Welcome back, {session?.user?.name}!</strong> Your resume has been uploaded and linked to your account.
							</p>
						</div>
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

	// Show upload error state
	if (uploadError) {
		return (
			<div className="max-w-md mx-auto p-6">
				<Card className="text-center border-red-200">
					<CardContent className="pt-6">
						<AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Upload Failed
						</h2>
						<p className="text-sm text-red-600 mb-4">
							{uploadError}
						</p>
						
						<div className="space-y-3">
							<Button 
								onClick={handleRetryUpload}
								className="w-full"
								size="lg"
							>
								<Upload className="h-4 w-4 mr-2" />
								Try Again
							</Button>
							
							<Button 
								variant="outline"
								onClick={handleRetryUpload}
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
								onClick={handleRetryUpload}
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

	// Show upload interface for authenticated users
	return (
		<div className="max-w-2xl mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center text-gray-900">
						Upload Your Resume
					</CardTitle>
					<p className="text-center text-gray-600 mt-2">
						Welcome back, <span className="font-semibold text-blue-600">{session?.user?.name}</span>!
					</p>
					<p className="text-center text-gray-600 mt-1">
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
						<div className="mt-2 p-2 bg-blue-50 rounded-lg">
							<p className="text-xs text-blue-700">
								<strong>Your data is secure:</strong> This resume will be linked to your account ({session?.user?.email}) and stored privately.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
