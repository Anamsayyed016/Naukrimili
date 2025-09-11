'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit3, Save, CheckCircle, AlertCircle, X, Plus, Star, Briefcase, GraduationCap, User, Sparkles, Lightbulb, TrendingUp } from 'lucide-react';
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
	
	// AI Suggestions State
	const [suggestions, setSuggestions] = useState<{ [key: string]: string[] }>({});
	const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
	const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: string]: boolean }>({});
	const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
		
		// Trigger AI suggestions for relevant fields
		if (['skills', 'jobTitle', 'location', 'summary', 'expectedSalary'].includes(field)) {
			debounceSuggestions(field, value);
		}
	};

	// Debounced AI suggestions
	const debounceSuggestions = (field: string, value: string) => {
		if (suggestionTimeoutRef.current) {
			clearTimeout(suggestionTimeoutRef.current);
		}
		
		suggestionTimeoutRef.current = setTimeout(() => {
			if (value.length > 2) {
				fetchAISuggestions(field, value);
			}
		}, 500);
	};

	// Fetch AI suggestions
	const fetchAISuggestions = async (field: string, value: string) => {
		setLoadingSuggestions(prev => ({ ...prev, [field]: true }));
		
		try {
			console.log(`🔮 Fetching AI suggestions for ${field}: ${value}`);
			
			const response = await fetch('/api/ai/form-suggestions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({
					field,
					value,
					context: {
						skills: profileData.skills,
						jobTitle: profileData.jobTitle,
						location: profileData.location,
						experience: profileData.experience,
						education: profileData.education
					}
				})
			});

			if (response.ok) {
				const result = await response.json();
				console.log(`✅ AI suggestions response:`, result);
				
				if (result.success && result.suggestions && result.suggestions.length > 0) {
					setSuggestions(prev => ({ ...prev, [field]: result.suggestions }));
					setShowSuggestions(prev => ({ ...prev, [field]: true }));
					
					// Show success toast
					toast({
						title: 'AI Suggestions Ready',
						description: `Found ${result.suggestions.length} suggestions for ${field}`,
					});
				} else {
					console.warn(`⚠️ No suggestions received for ${field}`);
					toast({
						title: 'No Suggestions',
						description: `No AI suggestions available for ${field}`,
						variant: 'destructive'
					});
				}
			} else {
				console.error(`❌ API error: ${response.status} ${response.statusText}`);
				const errorData = await response.json();
				console.error('Error details:', errorData);
				
				toast({
					title: 'Suggestion Error',
					description: 'Failed to load AI suggestions. Using fallback options.',
					variant: 'destructive'
				});
			}
		} catch (error) {
			console.error('Failed to fetch AI suggestions:', error);
			toast({
				title: 'Connection Error',
				description: 'Unable to connect to suggestion service. Please try again.',
				variant: 'destructive'
			});
		} finally {
			setLoadingSuggestions(prev => ({ ...prev, [field]: false }));
		}
	};

	// Apply suggestion
	const applySuggestion = (field: string, suggestion: string) => {
		if (field === 'skills') {
			if (!profileData.skills.includes(suggestion)) {
				setProfileData(prev => ({
					...prev,
					skills: [...prev.skills, suggestion]
				}));
				toast({
					title: 'Skill Added',
					description: `Added "${suggestion}" to your skills`,
				});
			}
		} else {
			setProfileData(prev => ({ ...prev, [field]: suggestion }));
		}
		setShowSuggestions(prev => ({ ...prev, [field]: false }));
	};

	// AI-Powered Input Component
	const AIPoweredInput = ({ field, label, placeholder, type = "text", required = false, className = "" }: {
		field: string;
		label: string;
		placeholder: string;
		type?: string;
		required?: boolean;
		className?: string;
	}) => {
		const fieldSuggestions = suggestions[field] || [];
		const showFieldSuggestions = showSuggestions[field] || false;
		const loading = loadingSuggestions[field] || false;

		return (
			<div className="relative">
				<Label htmlFor={field} className="text-gray-700 font-medium">{label} {required && '*'}</Label>
				<div className="relative">
					<Input
						id={field}
						type={type}
						value={profileData[field as keyof typeof profileData] as string}
						onChange={(e) => handleInputChange(field, e.target.value)}
						placeholder={placeholder}
						className={`mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200 ${className}`}
						required={required}
						onFocus={() => {
							if (fieldSuggestions.length > 0) {
								setShowSuggestions(prev => ({ ...prev, [field]: true }));
							}
						}}
						onBlur={() => {
							setTimeout(() => {
								setShowSuggestions(prev => ({ ...prev, [field]: false }));
							}, 200);
						}}
					/>
					{loading && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
						</div>
					)}
					{!loading && fieldSuggestions.length > 0 && (
						<button
							type="button"
							onClick={() => setShowSuggestions(prev => ({ ...prev, [field]: !prev[field] }))}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
						>
							<Sparkles className="h-4 w-4" />
						</button>
					)}
				</div>
				
				{/* AI Suggestions Dropdown */}
				{showFieldSuggestions && fieldSuggestions.length > 0 && (
					<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
						<div className="p-2 border-b border-gray-200 bg-blue-50">
							<div className="flex items-center gap-2 text-sm text-blue-700">
								<Lightbulb className="h-4 w-4" />
								AI Suggestions
							</div>
						</div>
						{fieldSuggestions.map((suggestion, index) => (
							<button
								key={index}
								type="button"
								onClick={() => applySuggestion(field, suggestion)}
								className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-100 last:border-b-0"
							>
								<div className="flex items-center gap-2">
									<TrendingUp className="h-3 w-3 text-blue-500" />
									{suggestion}
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		);
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
				credentials: 'include',
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
							<AIPoweredInput
								field="fullName"
								label="Full Name"
								placeholder="Enter your full name"
								required={true}
							/>
							<AIPoweredInput
								field="email"
								label="Email"
								placeholder="your.email@example.com"
								type="email"
								required={true}
							/>
							<AIPoweredInput
								field="phone"
								label="Phone"
								placeholder="+91 98765 43210"
							/>
							<AIPoweredInput
								field="location"
								label="Location"
								placeholder="City, State"
							/>
						</div>
					</div>

					{/* Professional Information */}
					<div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<Edit3 className="h-5 w-5 text-green-600" />
							Professional Information
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<AIPoweredInput
								field="jobTitle"
								label="Job Title"
								placeholder="e.g., Senior Software Engineer"
								className="focus:border-green-500 focus:ring-green-500"
							/>
							<AIPoweredInput
								field="expectedSalary"
								label="Expected Salary"
								placeholder="e.g., 15-25 LPA"
								className="focus:border-green-500 focus:ring-green-500"
							/>
						</div>
					</div>

					{/* Skills - Enhanced UI with AI */}
					<div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<Star className="h-5 w-5 text-purple-600" />
							Skills & Expertise
							{loadingSuggestions.skills && (
								<div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
							)}
						</h3>
						
						{/* Current Skills */}
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

						{/* AI Skill Suggestions */}
						{suggestions.skills && suggestions.skills.length > 0 && (
							<div className="mb-4 p-3 bg-white rounded-lg border border-purple-200">
								<div className="flex items-center gap-2 mb-2">
									<Sparkles className="h-4 w-4 text-purple-600" />
									<span className="text-sm font-medium text-purple-700">AI Suggested Skills</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{suggestions.skills.map((skill, index) => (
										<button
											key={index}
											type="button"
											onClick={() => applySuggestion('skills', skill)}
											className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-300 transition-colors"
										>
											<Plus className="h-3 w-3" />
											{skill}
										</button>
									))}
								</div>
							</div>
						)}

						{/* Add New Skill */}
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
						<p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
							<Lightbulb className="h-3 w-3" />
							Add relevant skills to improve your job matches. AI will suggest related skills as you type!
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

					{/* Summary Section - Enhanced with AI */}
					<div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-100">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
							<User className="h-5 w-5 text-teal-600" />
							Professional Summary
							{loadingSuggestions.summary && (
								<div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
							)}
						</h3>
						
						{/* AI Summary Suggestions */}
						{suggestions.summary && suggestions.summary.length > 0 && (
							<div className="mb-4 p-3 bg-white rounded-lg border border-teal-200">
								<div className="flex items-center gap-2 mb-2">
									<Sparkles className="h-4 w-4 text-teal-600" />
									<span className="text-sm font-medium text-teal-700">AI Suggested Summaries</span>
								</div>
								<div className="space-y-2">
									{suggestions.summary.map((summary, index) => (
										<button
											key={index}
											type="button"
											onClick={() => applySuggestion('summary', summary)}
											className="w-full p-3 text-left text-sm text-gray-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 hover:border-teal-300 transition-colors"
										>
											<div className="flex items-start gap-2">
												<TrendingUp className="h-3 w-3 text-teal-500 mt-0.5 flex-shrink-0" />
												<span>{summary}</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						<div className="relative">
							<textarea
								value={profileData.summary}
								onChange={(e) => handleInputChange('summary', e.target.value)}
								placeholder="Write a compelling professional summary that highlights your key strengths and experience..."
								className="w-full h-32 p-3 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-teal-500 focus:ring-teal-500 focus:ring-2 focus:ring-opacity-50 hover:border-gray-400 transition-all duration-200 rounded-lg resize-none"
							/>
							{loadingSuggestions.summary && (
								<div className="absolute right-3 top-3">
									<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
								</div>
							)}
						</div>
						<p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
							<Lightbulb className="h-3 w-3" />
							AI will suggest professional summaries based on your skills and experience!
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting || saveStatus === 'saving'}
							variant={getSaveButtonVariant()}
							className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
							size="lg"
						>
							{getSaveButtonContent()}
						</Button>
						
						{onClose && (
							<Button
								variant="outline"
								onClick={onClose}
								className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3 transition-all duration-200"
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
