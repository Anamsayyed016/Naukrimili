'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, CheckCircle, AlertCircle, X, Plus, Star, Briefcase, GraduationCap, User } from 'lucide-react';
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
		// Add missing fields for comprehensive data
		summary: initialData.summary || '',
		projects: Array.isArray(initialData.projects) ? initialData.projects : [],
		certifications: Array.isArray(initialData.certifications) ? initialData.certifications : [],
		languages: Array.isArray(initialData.languages) ? initialData.languages : [],
		preferredJobType: initialData.preferredJobType || '',
	});

	const [isEditing, setIsEditing] = useState(true); // Start in edit mode
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
	const [newSkill, setNewSkill] = useState('');

	// Auto-fill form when initialData changes
	useEffect(() => {
		if (initialData && Object.keys(initialData).length > 0) {
			console.log('🔄 Updating form with initial data:', initialData);
			
			// Enhanced data mapping with fallbacks
			const mappedData = {
				fullName: initialData.fullName || initialData.name || '',
				email: initialData.email || '',
				phone: initialData.phone || '',
				location: initialData.location || '',
				jobTitle: initialData.jobTitle || initialData.summary?.split(' ').slice(0, 3).join(' ') || '',
				skills: Array.isArray(initialData.skills) ? initialData.skills : [],
				education: Array.isArray(initialData.education) ? initialData.education : [],
				experience: Array.isArray(initialData.experience) ? initialData.experience : [],
				expectedSalary: initialData.expectedSalary || initialData.salary || '',
				linkedin: initialData.linkedin || '',
				portfolio: initialData.portfolio || '',
				summary: initialData.summary || '',
				projects: Array.isArray(initialData.projects) ? initialData.projects : [],
				certifications: Array.isArray(initialData.certifications) ? initialData.certifications : [],
				languages: Array.isArray(initialData.languages) ? initialData.languages : [],
				preferredJobType: initialData.preferredJobType || '',
			};
			
			console.log('📝 Mapped form data:', mappedData);
			setProfileData(mappedData);
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
					title: '🎉 Successfully Uploaded Resume!',
					description: 'Your resume has been processed and profile saved successfully. Redirecting to dashboard...',
					duration: 3000,
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

					{/* Experience Section - NEW */}
					{profileData.experience && profileData.experience.length > 0 && (
						<div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
							<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
								<Briefcase className="h-5 w-5 text-orange-600" />
								Work Experience ({profileData.experience.length})
							</h3>
							<div className="space-y-4">
								{profileData.experience.map((exp: any, index: number) => (
									<div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-semibold text-gray-800">{exp.position}</h4>
											<span className="text-sm text-gray-600">{exp.company}</span>
										</div>
										<p className="text-sm text-gray-600 mb-2">{exp.location} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
										<p className="text-sm text-gray-700">{exp.description}</p>
										{exp.achievements && exp.achievements.length > 0 && (
											<ul className="mt-2 space-y-1">
												{exp.achievements.map((achievement: string, idx: number) => (
													<li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
														<span className="text-orange-500 mt-1">•</span>
														{achievement}
													</li>
												))}
											</ul>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Education Section - NEW */}
					{profileData.education && profileData.education.length > 0 && (
						<div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100">
							<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
								<GraduationCap className="h-5 w-5 text-indigo-600" />
								Education ({profileData.education.length})
							</h3>
							<div className="space-y-4">
								{profileData.education.map((edu: any, index: number) => (
									<div key={index} className="bg-white p-4 rounded-lg border border-indigo-200">
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-semibold text-gray-800">{edu.degree}</h4>
											<span className="text-sm text-gray-600">{edu.institution}</span>
										</div>
										<p className="text-sm text-gray-600 mb-2">{edu.field} • {edu.startDate} - {edu.endDate}</p>
										{edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
										{edu.description && <p className="text-sm text-gray-700">{edu.description}</p>}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Summary Section - NEW */}
					{profileData.summary && (
						<div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
							<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
								<User className="h-5 w-5 text-teal-600" />
								Professional Summary
							</h3>
							<div className="bg-white p-4 rounded-lg border border-teal-200">
								<p className="text-gray-700 leading-relaxed">{profileData.summary}</p>
							</div>
						</div>
					)}

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
