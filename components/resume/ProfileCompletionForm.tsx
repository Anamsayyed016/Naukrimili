'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
	resumeId?: string | null;
	initialData?: any;
	onComplete?: () => void;
	onClose?: () => void;
}

export default function ProfileCompletionForm({ initialData = {}, onComplete, onClose }: Props) {
	const [profileData, setProfileData] = useState({
		fullName: initialData.fullName || initialData.name || '',
		email: initialData.email || '',
		phone: initialData.phone || '',
		location: initialData.location || '',
		jobTitle: initialData.jobTitle || '',
		skills: Array.isArray(initialData.skills) ? initialData.skills : [],
		education: Array.isArray(initialData.education) ? initialData.education : [],
		experience: Array.isArray(initialData.experience) ? initialData.experience : [],
		expectedSalary: initialData.salary || '',
	});

	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

	const handleInputChange = (field: string, value: string) => {
		setProfileData(prev => ({ ...prev, [field]: value }));
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
			// Save profile data to localStorage
			localStorage.setItem('userProfile', JSON.stringify(profileData));
			
			// Also save to a more specific key with timestamp
			const profileWithMeta = {
				...profileData,
				savedAt: new Date().toISOString(),
				resumeId: initialData.resumeId || null,
			};
			localStorage.setItem(`userProfile_${Date.now()}`, JSON.stringify(profileWithMeta));
			
			// Simulate API call delay for better UX
			await new Promise(resolve => setTimeout(resolve, 1000));
			
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
						Retry
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
		<div className="space-y-6">
			<Card className="bg-white shadow-lg">
				<CardHeader className="bg-gray-50 border-b">
					<div className="flex items-center justify-between">
						<CardTitle className="text-xl font-bold text-gray-900">Complete Your Profile</CardTitle>
						<Button
							variant={isEditing ? 'default' : 'outline'}
							onClick={() => setIsEditing(!isEditing)}
							size="sm"
							className={isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
						>
							<Edit3 className="h-4 w-4 mr-2" />
							{isEditing ? 'View Mode' : 'Edit Mode'}
						</Button>
					</div>
				</CardHeader>
				
				<CardContent className="space-y-6 p-6">
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
									disabled={!isEditing}
									placeholder="Enter your full name"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
								/>
							</div>
							<div>
								<Label htmlFor="email" className="text-gray-700 font-medium">Email *</Label>
								<Input
									id="email"
									type="email"
									value={profileData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									disabled={!isEditing}
									placeholder="your.email@example.com"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
								/>
							</div>
							<div>
								<Label htmlFor="phone" className="text-gray-700 font-medium">Phone</Label>
								<Input
									id="phone"
									value={profileData.phone}
									onChange={(e) => handleInputChange('phone', e.target.value)}
									disabled={!isEditing}
									placeholder="+91 98765 43210"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
								/>
							</div>
							<div>
								<Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
								<Input
									id="location"
									value={profileData.location}
									onChange={(e) => handleInputChange('location', e.target.value)}
									disabled={!isEditing}
									placeholder="City, State"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
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
									disabled={!isEditing}
									placeholder="e.g., Senior Software Engineer"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
								/>
							</div>
							<div>
								<Label htmlFor="expectedSalary" className="text-gray-700 font-medium">Expected Salary</Label>
								<Input
									id="expectedSalary"
									value={profileData.expectedSalary}
									onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
									disabled={!isEditing}
									placeholder="e.g., 15-25 LPA"
									className={`mt-1 ${!isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white text-gray-900'}`}
								/>
							</div>
						</div>
					</div>

					{/* Skills */}
					<div className="bg-gray-50 p-4 rounded-lg">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">Skills</h3>
						<div className="flex flex-wrap gap-2">
							{profileData.skills.map((skill: string, index: number) => (
								<span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-gray-700 bg-blue-100 border-blue-200">
									{skill}
								</span>
							))}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						{isEditing ? (
							<>
								<Button
									onClick={handleSubmit}
									disabled={isSubmitting || saveStatus === 'saving'}
									variant={getSaveButtonVariant()}
									className="flex-1"
								>
									{getSaveButtonContent()}
								</Button>
								<Button
									variant="outline"
									onClick={() => setIsEditing(false)}
									className="border-gray-300 text-gray-700 hover:bg-gray-50"
								>
									Cancel
								</Button>
							</>
						) : (
							<Button
								onClick={() => setIsEditing(true)}
								variant="outline"
								className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
							>
								<Edit3 className="h-4 w-4 mr-2" />
								Edit Profile
							</Button>
						)}
						
						{onClose && (
							<Button
								variant="outline"
								onClick={onClose}
								className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
