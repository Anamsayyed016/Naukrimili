'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
	User, 
	Briefcase, 
	GraduationCap, 
	Edit3, 
	Save,
	CheckCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProfileData {
	fullName: string;
	email: string;
	phone: string;
	location: string;
	jobTitle: string;
	skills: string[];
	education: string[];
	experience: string[];
	linkedin: string;
	portfolio: string;
	expectedSalary: string;
	preferredJobType: string;
}

interface Props {
	resumeId?: string | null;
	initialData?: Partial<ProfileData>;
	onComplete?: () => void;
	onClose?: () => void;
}

function ProfileCompletionForm({ 
	resumeId, 
	initialData = {}, 
	onComplete, 
	onClose 
}: Props) {
	const { data: session } = useSession();
	const [profileData, setProfileData] = useState({
		fullName: '',
		email: '',
		phone: '',
		location: '',
		jobTitle: '',
		skills: [] as string[],
		education: [] as string[],
		experience: [] as string[],
		linkedin: '',
		portfolio: '',
		expectedSalary: '',
		preferredJobType: '',
		...(initialData as any)
	});

	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [aiAccuracy, setAiAccuracy] = useState(85 as number);

	useEffect(() => {
		if (initialData) {
			setProfileData(prev => ({ ...(prev as any), ...(initialData as any) }));
		}
	}, [initialData]);

	const resolveUserId = (): string => {
		const uid = (session as any)?.user?.id;
		if (uid) return String(uid);
		if (typeof window !== 'undefined') {
			const existing = window.localStorage.getItem('anonUserId');
			if (existing) return existing;
			const generated = `guest-${Date.now()}`;
			window.localStorage.setItem('anonUserId', generated);
			return generated;
		}
		return 'guest-runtime';
	};

	const handleInputChange = (field: keyof ProfileData, value: any) => {
		setProfileData((prev: any) => ({ ...prev, [field]: value }));
	};

	const handleSkillAdd = (skill: string) => {
		if (skill.trim() && !(profileData.skills as string[]).includes(skill.trim())) {
			setProfileData((prev: any) => ({
				...prev,
				skills: [...(prev.skills as string[]), skill.trim()]
			}));
		}
	};

	const handleSkillRemove = (skillToRemove: string) => {
		setProfileData((prev: any) => ({
			...prev,
			skills: (prev.skills as string[]).filter((skill: string) => skill !== skillToRemove)
		}));
	};

	const handleEducationAdd = (education: string) => {
		if (education.trim() && !(profileData.education as string[]).includes(education.trim())) {
			setProfileData((prev: any) => ({
				...prev,
				education: [...(prev.education as string[]), education.trim()]
			}));
		}
	};

	const handleExperienceAdd = (experience: string) => {
		if (experience.trim() && !(profileData.experience as string[]).includes(experience.trim())) {
			setProfileData((prev: any) => ({
				...prev,
				experience: [...(prev.experience as string[]), experience.trim()]
			}));
		}
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		const userId = resolveUserId();
		try {
			const res = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'x-user-id': userId,
				},
				body: JSON.stringify(profileData),
			});

			const json = await res.json();
			if (!res.ok || !json.success) {
				throw new Error(json.error || 'Failed to update profile');
			}

			toast({
				title: 'Profile Updated Successfully!',
				description: 'Your profile has been saved and is now visible to employers.',
			});

			if (typeof window !== 'undefined') {
				window.location.href = '/profile';
			}
			if (onComplete) onComplete();
		} catch (error: any) {
			toast({
				title: 'Update Failed',
				description: error?.message || 'Please try again or contact support.',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const getAiAccuracyColor = (accuracy: number) => {
		if (accuracy >= 80) return 'text-green-600';
		if (accuracy >= 60) return 'text-yellow-600';
		return 'text-red-600';
	};

	return (
		<div className="space-y-6">
			{/* AI Analysis Summary */}
			<Card className="border-blue-200 bg-blue-50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-blue-900">
						<CheckCircle className="h-5 w-5" />
						AI Resume Analysis Summary
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className={`text-2xl font-bold ${getAiAccuracyColor(aiAccuracy)}`}>
								{aiAccuracy}%
							</div>
							<div className="text-sm text-blue-700">AI Confidence</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-900">
								{Object.keys(initialData).length}
							</div>
							<div className="text-sm text-blue-700">Fields Detected</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-900">
								{profileData.skills.length}
							</div>
							<div className="text-sm text-blue-700">Skills Found</div>
						</div>
					</div>
					
					<div className="mt-4 p-3 bg-white rounded-lg">
						<p className="text-sm text-blue-800">
							<strong>Note:</strong> AI has automatically filled your profile based on your resume. 
							Review and edit any information, or add missing details manually.
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Profile Form */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Complete Your Profile</CardTitle>
						<Button
							variant={isEditing ? 'default' : 'outline'}
							onClick={() => setIsEditing(!isEditing)}
							size="sm"
						>
							<Edit3 className="h-4 w-4 mr-2" />
							{isEditing ? 'View Mode' : 'Edit Mode'}
						</Button>
					</div>
				</CardHeader>
				
				<CardContent className="space-y-6">
					{/* Personal Information */}
					<div>
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<User className="h-5 w-5" />
							Personal Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="fullName">Full Name *</Label>
								<Input
									id="fullName"
									value={profileData.fullName}
									onChange={(e) => handleInputChange('fullName', e.target.value)}
									disabled={!isEditing}
									placeholder="Enter your full name"
								/>
							</div>
							<div>
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={profileData.email}
									onChange={(e) => handleInputChange('email', e.target.value)}
									disabled={!isEditing}
									placeholder="your.email@example.com"
								/>
							</div>
							<div>
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									value={profileData.phone}
									onChange={(e) => handleInputChange('phone', e.target.value)}
									disabled={!isEditing}
									placeholder="+91 98765 43210"
								/>
							</div>
							<div>
								<Label htmlFor="location">Location</Label>
								<Input
									id="location"
									value={profileData.location}
									onChange={(e) => handleInputChange('location', e.target.value)}
									disabled={!isEditing}
									placeholder="City, State"
								/>
							</div>
						</div>
					</div>

					<Separator />

					{/* Professional Information */}
					<div>
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<Briefcase className="h-5 w-5" />
							Professional Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="jobTitle">Current/Desired Job Title</Label>
								<Input
									id="jobTitle"
									value={profileData.jobTitle}
									onChange={(e) => handleInputChange('jobTitle', e.target.value)}
									disabled={!isEditing}
									placeholder="e.g., Senior Software Engineer"
								/>
							</div>
							<div>
								<Label htmlFor="expectedSalary">Expected Salary</Label>
								<Input
									id="expectedSalary"
									value={profileData.expectedSalary}
									onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
									disabled={!isEditing}
									placeholder="e.g., 15-25 LPA"
								/>
							</div>
						</div>
					</div>

					<Separator />

					{/* Skills */}
					<div>
						<h3 className="text-lg font-semibold mb-4">Skills</h3>
						<div className="space-y-3">
							<div className="flex flex-wrap gap-2">
								{(profileData.skills as string[]).map((skill, index) => (
									<span key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground bg-secondary">
										{skill}
										{isEditing && (
											<button
												onClick={() => handleSkillRemove(skill)}
												className="ml-2 text-red-500 hover:text-red-700"
											>
												×
											</button>
										)}
									</span>
								))}
							</div>
							{isEditing && (
								<div className="flex gap-2">
									<Input
										placeholder="Add a skill"
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												handleSkillAdd((e.target as HTMLInputElement).value);
												(e.target as HTMLInputElement).value = '';
											}
										}}
									/>
									<Button
										variant="outline"
										onClick={() => {
											const input = document.querySelector('input[placeholder="Add a skill"]') as HTMLInputElement;
											if (input) {
												handleSkillAdd(input.value);
												input.value = '';
											}
										}}
									>
										Add
									</Button>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Education */}
					<div>
						<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
							<GraduationCap className="h-5 w-5" />
							Education
						</h3>
						<div className="space-y-3">
							{profileData.education.map((edu, index) => (
								<div key={index} className="p-3 bg-gray-50 rounded-lg">
									{edu}
								</div>
							))}
							{isEditing && (
								<div className="flex gap-2">
									<Input
										placeholder="Add education details"
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												handleEducationAdd((e.target as HTMLInputElement).value);
												(e.target as HTMLInputElement).value = '';
											}
										}}
									/>
									<Button
										variant="outline"
										onClick={() => {
											const input = document.querySelector('input[placeholder="Add education details"]') as HTMLInputElement;
											if (input) {
												handleEducationAdd(input.value);
												input.value = '';
											}
										}}
									>
										Add
									</Button>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Experience */}
					<div>
						<h3 className="text-lg font-semibold mb-4">Work Experience</h3>
						<div className="space-y-3">
							{profileData.experience.map((exp, index) => (
								<div key={index} className="p-3 bg-gray-50 rounded-lg">
									{exp}
								</div>
							))}
							{isEditing && (
								<div className="flex gap-2">
									<Input
										placeholder="Add work experience"
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												handleExperienceAdd((e.target as HTMLInputElement).value);
												(e.target as HTMLInputElement).value = '';
											}
										}}
									/>
									<Button
										variant="outline"
										onClick={() => {
											const input = document.querySelector('input[placeholder="Add work experience"]') as HTMLInputElement;
											if (input) {
												handleExperienceAdd(input.value);
												input.value = '';
											}
										}}
									>
										Add
									</Button>
								</div>
							)}
						</div>
					</div>

					<Separator />

					{/* Links */}
					<div>
						<h3 className="text-lg font-semibold mb-4">Professional Links</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="linkedin">LinkedIn Profile</Label>
								<Input
									id="linkedin"
									value={profileData.linkedin}
									onChange={(e) => handleInputChange('linkedin', e.target.value)}
									disabled={!isEditing}
									placeholder="https://linkedin.com/in/yourprofile"
								/>
							</div>
							<div>
								<Label htmlFor="portfolio">Portfolio/Website</Label>
								<Input
									id="portfolio"
									value={profileData.portfolio}
									onChange={(e) => handleInputChange('portfolio', e.target.value)}
									disabled={!isEditing}
									placeholder="https://yourportfolio.com"
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-end gap-3">
				{onClose && (
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
				)}
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="min-w-[140px]"
				>
					{isSubmitting ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
							Saving...
						</>
					) : (
						<>
							<Save className="h-4 w-4 mr-2" />
							Save & View Profile
						</>
					)}
				</Button>
			</div>
		</div>
	);
}

export default ProfileCompletionForm;


