'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, CheckCircle, AlertCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
	resumeId?: string | null;
	initialData?: any;
	onComplete?: () => void;
	onClose?: () => void;
}

export default function ProfileCompletionForm({ resumeId, initialData = {}, onComplete, onClose }: Props) {
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
		setProfileData(prev => ({ ...prev, [field]: value }));
	};

	const addSkill = () => {
		if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
			setProfileData(prev => ({
				...prev,
				skills: [...prev.skills, newSkill.trim()]
			}));
			setNewSkill('');
		}
	};

	const removeSkill = (skillToRemove: string) => {
		setProfileData(prev => ({
			...prev,
			skills: prev.skills.filter(skill => skill !== skillToRemove)
		}));
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
			// Save to API if resumeId exists
			if (resumeId) {
				const response = await fetch(`/api/resumes/${resumeId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(profileData),
				});

				if (!response.ok) {
					throw new Error('Failed to save to server');
				}
			}

			// Save profile data to localStorage as backup
			localStorage.setItem('userProfile', JSON.stringify(profileData));
			
			// Save with timestamp
			const profileWithMeta = {
				...profileData,
				savedAt: new Date().toISOString(),
				resumeId: resumeId || null,
			};
			localStorage.setItem(`userProfile_${Date.now()}`, JSON.stringify(profileWithMeta));
			
			setSaveStatus('success');
			
			toast({
				title: 'Profile Saved Successfully!',
				description: 'Your profile has been updated and saved.',
			});

			// Auto-close success message after 2 seconds
			setTimeout(() => {
				setSaveStatus('idle');
				if (onComplete) onComplete();
			}, 2000);

		} catch (err) {
			console.error('Save error:', err);
			setSaveStatus('error');
			
			toast({
				title: 'Save Failed',
				description: 'Failed to save profile. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const getSaveButtonContent = () => {
		switch (saveStatus) {
			case 'saving':
				return (
					<>
						<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-2xl font-bold text-gray-900">
						Complete Your Profile
					</CardTitle>
					{onClose && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Personal Information */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name *</Label>
								<Input
									id="fullName"
									value={profileData.fullName}
									onChange={(e) => handleInputChange('fullName', e.target.value)}
									placeholder="Enter your full name"
									className="mt-1"
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
									className="mt-1"
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
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
								<Input
									id="location"
									value={profileData.location}
									onChange={(e) => handleInputChange('location', e.target.value)}
									placeholder="City, State"
									className="mt-1"
								/>
							</div>
						</div>
					</div>

					{/* Professional Information */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">Professional Information</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="jobTitle" className="text-gray-700 font-medium">Job Title</Label>
								<Input
									id="jobTitle"
									value={profileData.jobTitle}
									onChange={(e) => handleInputChange('jobTitle', e.target.value)}
									placeholder="e.g., Senior Software Engineer"
									className="mt-1"
								/>
							</div>
							<div>
								<Label htmlFor="expectedSalary" className="text-gray-700 font-medium">Expected Salary</Label>
								<Input
									id="expectedSalary"
									value={profileData.expectedSalary}
									onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
									placeholder="e.g., 15-25 LPA"
									className="mt-1"
								/>
							</div>
						</div>
					</div>

					{/* Skills */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">Skills</h3>
						<div className="flex flex-wrap gap-2 mb-3">
							{profileData.skills.map((skill: string, index: number) => (
								<span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-700 bg-blue-100 border-blue-200">
									{skill}
									<button
										type="button"
										onClick={() => removeSkill(skill)}
										className="ml-1 text-blue-600 hover:text-blue-800"
									>
										<X className="h-3 w-3" />
									</button>
								</span>
							))}
						</div>
						<div className="flex gap-2">
							<Input
								value={newSkill}
								onChange={(e) => setNewSkill(e.target.value)}
								placeholder="Add a skill"
								className="flex-1"
								onKeyPress={(e) => e.key === 'Enter' && addSkill()}
							/>
							<Button type="button" onClick={addSkill} variant="outline" size="sm">
								Add
							</Button>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4 border-t">
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || saveStatus === 'saving'}
							variant={getSaveButtonVariant()}
							className="flex-1"
							size="lg"
						>
							{getSaveButtonContent()}
						</Button>
						
						{onClose && (
							<Button
								variant="outline"
								onClick={onClose}
								className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
