'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, CheckCircle, AlertCircle, X, Plus, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';

interface Props {
	resumeId?: string | null;
	initialData?: any;
	onComplete?: () => void;
	onClose?: () => void;
}

export default function ProfileCompletionForm({ resumeId, initialData = {}, onComplete, onClose }: Props) {
	const { data: session } = useSession();
	const [profileData, setProfileData] = useState({
		fullName: initialData.fullName || initialData.name || '',
		email: initialData.email || '',
		phone: initialData.phone || '',
		location: initialData.location || '',
		jobTitle: initialData.jobTitle || '',
		skills: Array.isArray(initialData.skills) ? initialData.skills : [],
		education: Array.isArray(initialData.education) ? initialData.education : [],
		experience: Array.isArray(initialData.experience) ? initialData.experience : [],
		expectedSalary: initialData.expectedSalary || initialData.salary || '',
		linkedin: initialData.linkedin || '',
		portfolio: initialData.portfolio || '',
	});

	const [isEditing, setIsEditing] = useState(true); // Start in edit mode
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
	const [newSkill, setNewSkill] = useState('');

	// Auto-fill form when initialData changes
	useEffect(() => {
		if (initialData) {
			console.log('🔄 Updating form with initial data:', initialData);
			setProfileData({
				fullName: initialData.fullName || initialData.name || '',
				email: initialData.email || '',
				phone: initialData.phone || '',
				location: initialData.location || '',
				jobTitle: initialData.jobTitle || '',
				skills: Array.isArray(initialData.skills) ? initialData.skills : [],
				education: Array.isArray(initialData.education) ? initialData.education : [],
				experience: Array.isArray(initialData.experience) ? initialData.experience : [],
				expectedSalary: initialData.expectedSalary || initialData.salary || '',
				linkedin: initialData.linkedin || '',
				portfolio: initialData.portfolio || '',
			});
		}
	}, [initialData]);

	const handleInputChange = (field: string, value: string) => {
		console.log(`📝 Updating ${field}:`, value);
		setProfileData(prev => ({ ...prev, [field]: value }));
	};

	const addSkill = () => {
		if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
			setProfileData(prev => ({
				...prev,
				skills: [...prev.skills, newSkill.trim()]
			}));
			setNewSkill('');
			toast({
				title: 'Skill Added',
				description: `Added "${newSkill.trim()}" to your skills`,
			});
		}
	};

	const removeSkill = (skillToRemove: string) => {
		setProfileData(prev => ({
			...prev,
			skills: prev.skills.filter(skill => skill !== skillToRemove)
		}));
		toast({
			title: 'Skill Removed',
			description: `Removed "${skillToRemove}" from your skills`,
		});
	};

	const handleSubmit = async () => {
		if (!profileData.fullName || !profileData.email) {
			toast({
				title: 'Validation Error',
				description: 'Full name and email are required',
				variant: 'destructive',
			});
			return;
		}

		setIsSubmitting(true);
		setSaveStatus('saving');

		try {
			// Save to database via API
			const response = await fetch('/api/resumes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'create',
					data: {
						userId: session?.user?.id || 'temp', // Will be replaced with actual user ID from session
						fileName: 'profile',
						fileUrl: '',
						fileSize: 0,
						mimeType: 'application/json',
						parsedData: profileData,
						atsScore: 85, // Default ATS score
					}
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to save profile to database');
			}

			const result = await response.json();
			
			if (result.success) {
				setSaveStatus('success');
				toast({
					title: 'Profile Saved!',
					description: 'Your profile has been saved to the database successfully',
				});

				if (onComplete) {
					onComplete();
				}

				// Reset to idle after 2 seconds
				setTimeout(() => setSaveStatus('idle'), 2000);
			} else {
				throw new Error(result.error?.message || 'Failed to save profile');
			}
		} catch (error) {
			console.error('Save error:', error);
			setSaveStatus('error');
			toast({
				title: 'Save Failed',
				description: 'Failed to save profile to database. Please try again.',
				variant: 'destructive',
			});

			// Reset to idle after 3 seconds
			setTimeout(() => setSaveStatus('idle'), 3000);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getSaveButtonContent = () => {
		switch (saveStatus) {
			case 'saving':
				return (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
						Saving...
					</>
				);
			case 'success':
				return (
					<>
						<CheckCircle className="h-4 w-4 mr-2" />
						Saved!
					</>
				);
			case 'error':
				return (
					<>
						<AlertCircle className="h-4 w-4 mr-2" />
						Save Failed
					</>
				);
			default:
				return (
					<>
						<Save className="h-4 w-4 mr-2" />
						Save Profile
					</>
				);
		}
	};

	const getSaveButtonVariant = () => {
		switch (saveStatus) {
			case 'success':
				return 'default';
			case 'error':
				return 'destructive';
			default:
				return 'default';
		}
	};

	return (
		<div className="max-w-4xl mx-auto">
			<Card className="shadow-lg border-0">
				<CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 border-b">
					<CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
						<Star className="h-6 w-6 text-blue-600" />
						Complete Your Profile
					</CardTitle>
					{onClose && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-8 w-8 p-0 hover:bg-white/50"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-6 p-6">
					{/* Personal Information */}
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<Edit3 className="h-5 w-5 text-blue-600" />
							Personal Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
								<Input
									id="fullName"
									value={profileData.fullName}
									onChange={(e) => handleInputChange('fullName', e.target.value)}
									placeholder="Enter your full name"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
									required
								/>
							</div>
							<div>
								<Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
								<Input
									id="email"
									type="email"
									value={profileData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									placeholder="your.email@example.com"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
									required
								/>
							</div>
							<div>
								<Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
								<Input
									id="phone"
									value={profileData.phone}
									onChange={(e) => handleInputChange('phone', e.target.value)}
									placeholder="+91 98765 43210"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
								/>
							</div>
							<div>
								<Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
								<Input
									id="location"
									value={profileData.location}
									onChange={(e) => handleInputChange('location', e.target.value)}
									placeholder="City, State"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
								/>
							</div>
						</div>
					</div>

					{/* Professional Information */}
					<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<Edit3 className="h-5 w-5 text-green-600" />
							Professional Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="jobTitle" className="text-gray-700 font-medium">Job Title</Label>
								<Input
									id="jobTitle"
									value={profileData.jobTitle}
									onChange={(e) => handleInputChange('jobTitle', e.target.value)}
									placeholder="e.g., Senior Software Engineer"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
								/>
							</div>
							<div>
								<Label htmlFor="expectedSalary" className="text-gray-700 font-medium">Expected Salary</Label>
								<Input
									id="expectedSalary"
									value={profileData.expectedSalary}
									onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
									placeholder="e.g., 15-25 LPA"
									className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-green-500 focus:ring-green-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
								/>
							</div>
						</div>
					</div>

					{/* Skills - Enhanced UI */}
					<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<Star className="h-5 w-5 text-purple-600" />
							Skills & Expertise
						</h3>
						<div className="flex flex-wrap gap-3 mb-4">
							{profileData.skills.map((skill: string, index: number) => (
								<span key={index} className="inline-flex items-center rounded-full border-2 px-3 py-1.5 text-sm font-semibold text-purple-700 bg-purple-100 border-purple-300 hover:bg-purple-200 transition-colors">
									{skill}
									<button
										type="button"
										onClick={() => removeSkill(skill)}
										className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
						<div className="flex gap-3">
							<Input
								value={newSkill}
								onChange={(e) => setNewSkill(e.target.value)}
								placeholder="Add a skill (e.g., React, Python, Leadership)"
								className="flex-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200"
								onKeyPress={(e) => e.key === 'Enter' && addSkill()}
							/>
							<Button 
								type="button" 
								onClick={addSkill} 
								variant="outline" 
								size="sm"
								className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
							>
								<Plus className="h-4 w-4 mr-1" />
								Add
							</Button>
						</div>
						<p className="text-sm text-gray-600 mt-2">
							💡 Add relevant skills to improve your job matches
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-6 border-t border-gray-200">
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || saveStatus === 'saving'}
							variant={getSaveButtonVariant()}
							className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
							size="lg"
						>
							{getSaveButtonContent()}
						</Button>
						
						{onClose && (
							<Button
								variant="outline"
								onClick={onClose}
								className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
								size="lg"
							>
								Close
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
