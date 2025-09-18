'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Plus,
  X,
  Lightbulb,
  Bot,
  Globe,
  Target,
  Zap,
  Brain,
  Map,
  Users,
  Building2,
  FileText,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getSmartLocation, getMobileGeolocationOptions, isMobileDevice } from '@/lib/mobile-geolocation';

interface JobFormData {
  title: string;
  description: string;
  requirements: string;
  location: string;
  city: string;
  state: string;
  country: string;
  jobType: string;
  experienceLevel: string;
  salary: string;
  skills: string[];
  benefits: string;
  isRemote: boolean;
  isHybrid: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  applicationDeadline: string;
  openings: string;
  // Location-based fields
  locationType: 'single' | 'multiple' | 'radius';
  multipleLocations: string[];
  radiusDistance: number;
  radiusCenter: string;
}

interface AISuggestion {
  field: string;
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

interface LocationOption {
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates: { lat: number; lng: number };
  jobCount: number;
}

const steps = [
  { id: 1, title: 'Job Details', description: 'Title and description with AI suggestions' },
  { id: 2, title: 'Requirements', description: 'Skills and experience with AI optimization' },
  { id: 3, title: 'Location & Reach', description: 'Location targeting and distance options' },
  { id: 4, title: 'Review & Publish', description: 'AI-enhanced review and publish' }
];

const jobTypes = [
  'Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'
];

const experienceLevels = [
  'Entry Level (0-2 years)',
  'Mid Level (3-5 years)', 
  'Senior Level (6-10 years)',
  'Lead (11-15 years)',
  'Executive (15+ years)'
];

const popularSkills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS',
  'Docker', 'Git', 'SQL', 'MongoDB', 'Express.js', 'Next.js',
  'Vue.js', 'Angular', 'Java', 'C++', 'PHP', 'Laravel'
];

const popularLocations: LocationOption[] = [
  { name: 'Mumbai, Maharashtra, India', city: 'Mumbai', state: 'Maharashtra', country: 'India', coordinates: { lat: 19.0760, lng: 72.8777 }, jobCount: 1250 },
  { name: 'Bangalore, Karnataka, India', city: 'Bangalore', state: 'Karnataka', country: 'India', coordinates: { lat: 12.9716, lng: 77.5946 }, jobCount: 2100 },
  { name: 'Delhi, NCR, India', city: 'Delhi', state: 'NCR', country: 'India', coordinates: { lat: 28.7041, lng: 77.1025 }, jobCount: 1800 },
  { name: 'Hyderabad, Telangana, India', city: 'Hyderabad', state: 'Telangana', country: 'India', coordinates: { lat: 17.3850, lng: 78.4867 }, jobCount: 950 },
  { name: 'Pune, Maharashtra, India', city: 'Pune', state: 'Maharashtra', country: 'India', coordinates: { lat: 18.5204, lng: 73.8567 }, jobCount: 800 },
  { name: 'Chennai, Tamil Nadu, India', city: 'Chennai', state: 'Tamil Nadu', country: 'India', coordinates: { lat: 13.0827, lng: 80.2707 }, jobCount: 700 },
  { name: 'New York, NY, USA', city: 'New York', state: 'NY', country: 'USA', coordinates: { lat: 40.7128, lng: -74.0060 }, jobCount: 3200 },
  { name: 'San Francisco, CA, USA', city: 'San Francisco', state: 'CA', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, jobCount: 2800 },
  { name: 'London, UK', city: 'London', state: 'England', country: 'UK', coordinates: { lat: 51.5074, lng: -0.1278 }, jobCount: 1900 },
  { name: 'Dubai, UAE', city: 'Dubai', state: 'Dubai', country: 'UAE', coordinates: { lat: 25.2048, lng: 55.2708 }, jobCount: 1100 }
];

export default function AIJobPostingForm() {
  // Initialize form data from localStorage or default values
  const getInitialFormData = (): JobFormData => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobPostingFormData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('Restored form data from localStorage:', parsed);
          return parsed;
        } catch (error) {
          console.error('Error parsing saved form data:', error);
        }
      }
    }
    return {
      title: '',
      description: '',
      requirements: '',
      location: '',
      city: '',
      state: '',
      country: 'IN',
      jobType: 'Full-time',
      experienceLevel: 'Entry Level (0-2 years)',
      salary: '',
      skills: [],
      benefits: '',
      isRemote: false,
      isHybrid: false,
      isUrgent: false,
      isFeatured: false,
      applicationDeadline: '',
      openings: '1',
      locationType: 'single',
      multipleLocations: [],
      radiusDistance: 25,
      radiusCenter: ''
    };
  };

  // Initialize current step from sessionStorage or default
  const getInitialStep = (): number => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('jobPostingCurrentStep');
      if (saved) {
        const step = parseInt(saved, 10);
        console.log('Restored current step from sessionStorage:', step);
        return step;
      }
    }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationOption[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldSuggestions, setFieldSuggestions] = useState<{[key: string]: AISuggestion}>({});
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState<JobFormData>(getInitialFormData);

  // Instant fallback suggestions for professional feel
  const getInstantSuggestions = (field: string, value: string): AISuggestion => {
    const instantSuggestions: { [key: string]: string[] } = {
      title: [
        'Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer',
        'Backend Developer', 'DevOps Engineer', 'Data Scientist',
        'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
        'Mobile App Developer', 'Cloud Engineer', 'Security Engineer'
      ],
      description: [
        'We are looking for a passionate and skilled developer to join our dynamic team. You will be responsible for developing high-quality software solutions and collaborating with cross-functional teams.',
        'Join our innovative company as we build cutting-edge products. You will work on challenging projects, contribute to architectural decisions, and mentor junior developers.',
        'We seek a talented professional to drive our technical initiatives forward. You will be involved in the full software development lifecycle and work with modern technologies.',
        'Come be part of our growing team and help us scale our platform. You will work on exciting projects, learn new technologies, and make a real impact on our product.'
      ],
      requirements: [
        'Bachelor\'s degree in Computer Science or related field', '3+ years of experience in software development',
        'Strong problem-solving and analytical skills', 'Excellent communication and teamwork abilities',
        'Experience with modern development practices and tools', 'Knowledge of software design patterns and best practices',
        'Ability to work in an agile development environment', 'Strong attention to detail and code quality'
      ],
      benefits: [
        'Competitive salary and performance bonuses', 'Comprehensive health insurance coverage',
        'Flexible working hours and remote work options', 'Professional development and training opportunities',
        'Stock options and equity participation', 'Generous paid time off and vacation days',
        'Modern office environment with latest technology', 'Team building activities and company events'
      ],
      skills: [
        'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS',
        'Docker', 'Git', 'SQL', 'MongoDB', 'Express.js', 'Next.js',
        'Vue.js', 'Angular', 'Java', 'C++', 'PHP', 'Laravel'
      ]
    };

    const suggestions = instantSuggestions[field] || [];
    const filteredSuggestions = suggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(suggestion.toLowerCase())
    ).slice(0, 5);

    return {
      field,
      suggestions: filteredSuggestions.length > 0 ? filteredSuggestions : suggestions.slice(0, 5),
      confidence: 85,
      reasoning: 'Instant suggestions for professional experience'
    };
  };

  // AI-powered suggestions with instant fallback
  const getAISuggestions = useCallback(async (field: string, value: string) => {
    if (!value.trim() || value.length < 2) {
      setFieldSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[field];
        return newSuggestions;
      });
      setActiveField(null);
      return;
    }
    
    // Show instant suggestions immediately for professional feel
    const instantSuggestion = getInstantSuggestions(field, value);
    setFieldSuggestions(prev => ({
      ...prev,
      [field]: instantSuggestion
    }));
    setActiveField(field);
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/form-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field,
          value,
          context: {
            jobType: formData.jobType,
            experienceLevel: formData.experienceLevel,
            industry: 'Technology',
            skills: formData.skills
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        const suggestion: AISuggestion = {
          field,
          suggestions: data.suggestions,
          confidence: data.confidence,
          reasoning: `AI confidence: ${data.confidence}%`
        };
        
        // Update with AI suggestions (replace instant ones)
        setFieldSuggestions(prev => ({
          ...prev,
          [field]: suggestion
        }));
        
        setActiveField(field);
      }
    } catch (error) {
      console.error('AI suggestions error:', error);
      // Keep instant suggestions if AI fails
    } finally {
      setAiLoading(false);
    }
  }, [formData.jobType, formData.experienceLevel, formData.skills]);

  // Debounced input handler for real-time suggestions
  const handleInputChangeWithSuggestions = useCallback((field: keyof JobFormData, value: any) => {
    console.log('Input change:', { field, value });
    
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Form data updated:', updated);
      return updated;
    });
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout for AI suggestions - INSTANT for professional feel
    if (['title', 'description', 'requirements', 'benefits', 'skills'].includes(field) && typeof value === 'string') {
      const timeout = setTimeout(() => {
        console.log('Triggering AI suggestions for:', field, value);
        getAISuggestions(field, value);
      }, 150); // 150ms delay for instant professional feel
      
      setTypingTimeout(timeout);
    }
  }, [getAISuggestions, typingTimeout]);

  // Detect current location
  const detectCurrentLocation = useCallback(async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      console.log('🚀 Starting location detection for job posting...');
      
      // Use mobile-optimized geolocation
      const isMobile = isMobileDevice();
      const options = getMobileGeolocationOptions();
      
      if (isMobile) {
        console.log('📱 Using mobile-optimized geolocation...');
      }
      
      const result = await getSmartLocation(options);
      
      if (result.success) {
        if (result.coordinates) {
          // Set the location in the form
          const locationName = result.city && result.country 
            ? `${result.city}, ${result.state || ''}, ${result.country}`.replace(/,\s*,/g, ',').replace(/,$/, '')
            : 'Current Location';
          
          setFormData(prev => ({
            ...prev,
            location: locationName,
            city: result.city || '',
            state: result.state || '',
            country: result.country || 'IN'
          }));
          
          setLocationInput(locationName);
          console.log('✅ Location detected for job posting:', result);
          
          // Show success message
          toast.success(`Location detected: ${result.city || 'Unknown City'}`, {
            description: `Using ${result.source === 'gps' ? 'GPS' : 'IP-based'} location detection`,
            duration: 3000,
          });
        } else {
          throw new Error('No coordinates received');
        }
      } else {
        throw new Error(result.error || 'Location detection failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Location detection failed';
      setLocationError(errorMessage);
      console.error('❌ Location detection failed:', error);
      
      // Show error message
      toast.error('Location detection failed', {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Location suggestions
  const getLocationSuggestions = useCallback((query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }
    
    const filtered = popularLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.state.toLowerCase().includes(query.toLowerCase())
    );
    setLocationSuggestions(filtered.slice(0, 5));
  }, []);

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    console.log('Manual input change:', { field, value });
    handleInputChangeWithSuggestions(field, value);
  };

  const handleSkillsChange = (value: string) => {
    console.log('Skills input change:', value);
    setSkillsInput(value);
    
    // Add skill when comma is pressed
    if (value.endsWith(',')) {
      const skill = value.slice(0, -1).trim();
      if (skill && !formData.skills.includes(skill)) {
        console.log('Adding skill:', skill);
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        setSkillsInput('');
        toast.success(`Added skill: ${skill}`);
      }
    }
    
    // Trigger AI suggestions for skills with debouncing
    if (value.length > 2) {
      // Clear existing timeout for skills
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        console.log('Triggering AI suggestions for skills:', value);
        getAISuggestions('skills', value);
      }, 150); // 150ms delay for instant professional feel
      
      setTypingTimeout(timeout);
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const applyAISuggestion = (field: string, suggestion: string) => {
    console.log('Applying AI suggestion:', { field, suggestion });
    
    // Apply the suggestion to form data
    setFormData(prev => {
      const updated = { ...prev, [field]: suggestion };
      console.log('Updated form data:', updated);
      return updated;
    });
    
    // Clear the suggestions for this field
    setFieldSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      console.log('Cleared suggestions for field:', field);
      return newSuggestions;
    });
    
    // Clear active field
    setActiveField(null);
    
    // Show success message
    toast.success(`AI suggestion applied to ${field}!`);
  };

  const dismissFieldSuggestions = (field: string) => {
    setFieldSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      return newSuggestions;
    });
    setActiveField(null);
  };

  // Persist form data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobPostingFormData', JSON.stringify(formData));
      console.log('Saved form data to localStorage:', formData);
    }
  }, [formData]);

  // Persist current step to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jobPostingCurrentStep', currentStep.toString());
      console.log('Saved current step to sessionStorage:', currentStep);
    }
  }, [currentStep]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  const nextStep = () => {
    console.log('Next step clicked. Current step:', currentStep);
    console.log('Form data before validation:', formData);
    
    const isValid = validateStep(currentStep);
    console.log('Step validation result:', isValid);
    
    if (!isValid) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }
    
    if (currentStep < steps.length) {
      console.log('Moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
      toast.success('Step completed! Moving to next step.');
    }
  };

  // Function to clear form data and start fresh
  const clearFormData = () => {
    const resetFormData: JobFormData = {
      title: '', description: '', requirements: '', location: '', city: '', state: '', country: 'IN',
      jobType: 'Full-time', experienceLevel: 'Entry Level (0-2 years)', salary: '', skills: [], benefits: '',
      isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, applicationDeadline: '', openings: '1',
      locationType: 'single' as const, multipleLocations: [], radiusDistance: 25, radiusCenter: ''
    };
    setFormData(resetFormData);
    setCurrentStep(1);
    setSkillsInput('');
    setLocationInput('');
    setFieldSuggestions({});
    setActiveField(null);
    
    // Clear localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jobPostingFormData');
      sessionStorage.removeItem('jobPostingCurrentStep');
      console.log('Form data cleared and persistence removed');
    }
    
    toast.success('Form cleared! Starting fresh.');
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step: number): boolean => {
    console.log('Validating step:', step, 'Form data:', formData);
    
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = formData.title.trim() !== '' && formData.description.trim() !== '';
        console.log('Step 1 validation:', { 
          title: formData.title.trim(), 
          description: formData.description.trim(), 
          isValid 
        });
        break;
      case 2:
        isValid = formData.requirements.trim() !== '' && formData.skills.length > 0;
        console.log('Step 2 validation:', { 
          requirements: formData.requirements.trim(), 
          skills: formData.skills.length, 
          isValid 
        });
        break;
      case 3:
        isValid = formData.location.trim() !== '';
        console.log('Step 3 validation:', { 
          location: formData.location.trim(), 
          isValid 
        });
        break;
      case 4:
        isValid = true;
        break;
      default:
        isValid = false;
    }
    
    console.log('Step validation result:', isValid);
    return isValid;
  };

  const handleSubmit = async () => {
    console.log('🚀 Starting job submission process...');
    console.log('Form data:', formData);
    
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      console.log('❌ Validation failed');
      toast.error('Please complete all required fields');
      return;
    }

    console.log('✅ Validation passed, proceeding with submission...');
    setLoading(true);
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        jobType: formData.jobType.toLowerCase().replace('-', '_'),
        experienceLevel: formData.experienceLevel.toLowerCase().split(' ')[0],
        salary: formData.salary,
        skills: formData.skills,
        benefits: formData.benefits,
        isRemote: formData.isRemote,
        isHybrid: formData.isHybrid,
        isUrgent: formData.isUrgent,
        isFeatured: formData.isFeatured,
        applicationDeadline: formData.applicationDeadline,
        openings: parseInt(formData.openings),
        locationType: formData.locationType,
        multipleLocations: formData.multipleLocations,
        radiusDistance: formData.radiusDistance,
        radiusCenter: formData.radiusCenter
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await fetch('/api/employer/post-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        toast.success('🚀 Job posted successfully! Your AI-optimized listing is now live.', {
          description: 'Job seekers can now find and apply to your position with enhanced visibility.',
          duration: 5000,
        });
        // Reset form and clear persistence
        const resetFormData: JobFormData = {
          title: '', description: '', requirements: '', location: '', city: '', state: '', country: 'IN',
          jobType: 'Full-time', experienceLevel: 'Entry Level (0-2 years)', salary: '', skills: [], benefits: '',
          isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, applicationDeadline: '', openings: '1',
          locationType: 'single' as const, multipleLocations: [], radiusDistance: 25, radiusCenter: ''
        };
        setFormData(resetFormData);
        setCurrentStep(1);
        
        // Clear localStorage and sessionStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jobPostingFormData');
          sessionStorage.removeItem('jobPostingCurrentStep');
          console.log('Cleared form persistence after successful submission');
        }
      } else {
        toast.error(data.error || 'Failed to post job');
      }
    } catch (error) {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 max-w-6xl py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">AI-Powered Job Posting</h1>
          </div>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto px-4">
            Create compelling job postings with AI suggestions and reach the right candidates with location-based targeting
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center w-full sm:w-auto">
                <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-slate-300 text-slate-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-2 sm:ml-3 flex-1 sm:flex-none">
                  <p className={`text-xs sm:text-sm font-medium ${
                    currentStep >= step.id ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= step.id ? 'text-slate-600' : 'text-slate-400'
                  } hidden sm:block`}>
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>


        {/* Main Form */}
        <Card className="shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-10">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6 sm:mb-8">
                    <div className="inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-4">
                      <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                        <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Job Details</h2>
                    </div>
                    <p className="text-slate-600 text-base sm:text-lg px-4">Tell us about the position with AI-powered suggestions</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                          <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 w-full">
                          <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Job Title *</span>
                          {fieldSuggestions.title && (
                            <Badge variant="default" className="ml-2 sm:ml-4 text-xs sm:text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm px-2 sm:px-3 py-1">
                              ✨ AI suggestions available
                            </Badge>
                          )}
                        </div>
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="e.g., Senior Software Engineer"
                          className="text-base sm:text-lg h-12 sm:h-16 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 pr-12 bg-white text-slate-900 font-medium"
                        />
                        {aiLoading && activeField === 'title' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {fieldSuggestions.title && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-2xl backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-blue-900">AI Suggestions</span>
                                <div className="text-xs text-blue-600">
                                  {fieldSuggestions.title.confidence}% confidence
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissFieldSuggestions('title')}
                              className="h-6 w-6 p-0 hover:bg-red-100 rounded-full"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {fieldSuggestions.title.suggestions.slice(0, 5).map((suggestion, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('title', suggestion)}
                                  className="w-full text-left justify-start h-auto p-3 sm:p-4 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 group border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl"
                                >
                                  <div className="flex items-start sm:items-center gap-3 w-full">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Click to apply this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <Label className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <span>Job Description *</span>
                          {fieldSuggestions.description && (
                            <Badge variant="default" className="ml-3 text-xs bg-green-100 text-green-800 border-green-200">
                              ✨ AI suggestions available
                            </Badge>
                          )}
                        </div>
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={6}
                          placeholder="Describe the role, responsibilities, and what makes this opportunity special..."
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-12 text-base bg-white text-slate-900"
                        />
                        {aiLoading && activeField === 'description' && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {fieldSuggestions.description && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-2xl backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-blue-900">AI Suggestions</span>
                                <div className="text-xs text-blue-600">
                                  {fieldSuggestions.description.confidence}% confidence
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissFieldSuggestions('description')}
                              className="h-6 w-6 p-0 hover:bg-red-100 rounded-full"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {fieldSuggestions.description.suggestions.slice(0, 5).map((suggestion, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('description', suggestion)}
                                  className="w-full text-left justify-start h-auto p-3 sm:p-4 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 group border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl"
                                >
                                  <div className="flex items-start sm:items-center gap-3 w-full">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Click to apply this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          Job Type
                        </Label>
                        <Select value={formData.jobType} onValueChange={(value) => handleInputChange('jobType', value)}>
                          <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {jobTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          Experience Level
                        </Label>
                        <Select value={formData.experienceLevel} onValueChange={(value) => handleInputChange('experienceLevel', value)}>
                          <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceLevels.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Requirements & Skills</h2>
                    <p className="text-slate-600">Define what you're looking for with AI optimization</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <span>Requirements *</span>
                          {fieldSuggestions.requirements && (
                            <Badge variant="default" className="ml-3 text-xs bg-green-100 text-green-800 border-green-200">
                              ✨ AI suggestions available
                            </Badge>
                          )}
                        </div>
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={formData.requirements}
                          onChange={(e) => handleInputChange('requirements', e.target.value)}
                          rows={4}
                          placeholder="List the key requirements, qualifications, and experience needed..."
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-12 text-base bg-white text-slate-900"
                        />
                        {aiLoading && activeField === 'requirements' && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {fieldSuggestions.requirements && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-2xl backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-blue-900">AI Suggestions</span>
                                <div className="text-xs text-blue-600">
                                  {fieldSuggestions.requirements.confidence}% confidence
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissFieldSuggestions('requirements')}
                              className="h-6 w-6 p-0 hover:bg-red-100 rounded-full"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {fieldSuggestions.requirements.suggestions.slice(0, 5).map((suggestion, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('requirements', suggestion)}
                                  className="w-full text-left justify-start h-auto p-3 sm:p-4 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 group border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl"
                                >
                                  <div className="flex items-start sm:items-center gap-3 w-full">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Click to apply this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div>
                      <Label className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <span>Skills *</span>
                          {fieldSuggestions.skills && (
                            <Badge variant="default" className="ml-3 text-xs bg-green-100 text-green-800 border-green-200">
                              ✨ AI suggestions available
                            </Badge>
                          )}
                        </div>
                      </Label>
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            value={skillsInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSkillsInput(value);
                              // Trigger AI suggestions for skills
                              if (value.length > 2) {
                                getAISuggestions('skills', value);
                              }
                            }}
                            placeholder="Type skills and press comma to add..."
                            className="h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white text-slate-900"
                          />
                          {aiLoading && activeField === 'skills' && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* AI Suggestions for Skills */}
                        {fieldSuggestions.skills && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-2xl backdrop-blur-sm"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-300 rounded-full">
                                  <Lightbulb className="h-4 w-4 text-blue-800" />
                                </div>
                                <span className="text-sm font-semibold text-slate-900">AI Skills Suggestions</span>
                                <div className="text-xs text-blue-600">
                                  {fieldSuggestions.skills.confidence}% confidence
                                </div>
                              </div>
                              <button
                                onClick={() => dismissFieldSuggestions('skills')}
                                className="p-1 hover:bg-blue-300 rounded-full transition-colors"
                              >
                                <X className="h-4 w-4 text-slate-600" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {fieldSuggestions.skills.suggestions.slice(0, 8).map((suggestion, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Add skill to the skills array
                                      if (!formData.skills.includes(suggestion)) {
                                        setFormData(prev => ({ 
                                          ...prev, 
                                          skills: [...prev.skills, suggestion] 
                                        }));
                                        setFieldSuggestions(prev => {
                                          const newSuggestions = { ...prev };
                                          delete newSuggestions.skills;
                                          return newSuggestions;
                                        });
                                        setActiveField(null);
                                        toast.success(`Added skill: ${suggestion}`);
                                      }
                                    }}
                                    className="w-full text-left justify-start h-auto p-3 sm:p-4 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 group border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl"
                                  >
                                    <div className="flex items-start sm:items-center gap-3 w-full">
                                      <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                        <Zap className="h-4 w-4 text-blue-800" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                          {suggestion}
                                        </span>
                                        <span className="text-xs text-slate-700 font-medium">
                                          Click to add this skill
                                        </span>
                                      </div>
                                      <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                        #{idx + 1}
                                      </div>
                                    </div>
                                  </Button>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                        
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {skill}
                              <button
                                onClick={() => removeSkill(skill)}
                                className="ml-2 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="text-sm text-slate-500">
                          Popular skills: {popularSkills.slice(0, 8).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Sparkles className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <span>Benefits & Perks</span>
                          {fieldSuggestions.benefits && (
                            <Badge variant="default" className="ml-3 text-xs bg-green-100 text-green-800 border-green-200">
                              ✨ AI suggestions available
                            </Badge>
                          )}
                        </div>
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={formData.benefits}
                          onChange={(e) => handleInputChange('benefits', e.target.value)}
                          rows={3}
                          placeholder="What benefits and perks do you offer? (health insurance, flexible hours, etc.)"
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-12 text-base bg-white text-slate-900"
                        />
                        {aiLoading && activeField === 'benefits' && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                      {fieldSuggestions.benefits && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -10 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-2xl shadow-2xl backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-100 rounded-full flex-shrink-0">
                                <Bot className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-semibold text-blue-900">AI Suggestions</span>
                                <div className="text-xs text-blue-600">
                                  {fieldSuggestions.benefits.confidence}% confidence
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissFieldSuggestions('benefits')}
                              className="h-6 w-6 p-0 hover:bg-red-100 rounded-full"
                            >
                              <X className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {fieldSuggestions.benefits.suggestions.slice(0, 5).map((suggestion, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAISuggestion('benefits', suggestion)}
                                  className="w-full text-left justify-start h-auto p-3 sm:p-4 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all duration-300 group border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl"
                                >
                                  <div className="flex items-start sm:items-center gap-3 w-full">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Click to apply this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Location & Reach</h2>
                    <p className="text-slate-600">Define where you want to hire and how far to reach</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Map className="h-5 w-5 text-blue-600" />
                        Location Targeting
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                        <Button
                          variant={formData.locationType === 'single' ? 'default' : 'outline'}
                          onClick={() => handleInputChange('locationType', 'single')}
                          className="h-10 sm:h-12 text-xs sm:text-sm"
                        >
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Single Location
                        </Button>
                        <Button
                          variant={formData.locationType === 'multiple' ? 'default' : 'outline'}
                          onClick={() => handleInputChange('locationType', 'multiple')}
                          className="h-10 sm:h-12 text-xs sm:text-sm"
                        >
                          <Globe className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Multiple Cities
                        </Button>
                        <Button
                          variant={formData.locationType === 'radius' ? 'default' : 'outline'}
                          onClick={() => handleInputChange('locationType', 'radius')}
                          className="h-10 sm:h-12 text-xs sm:text-sm"
                        >
                          <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Radius Search
                        </Button>
                      </div>
                    </div>

                    {formData.locationType === 'single' && (
                      <div>
                        <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          Job Location *
                        </Label>
                        <div className="relative">
                          <Input
                            value={locationInput}
                            onChange={(e) => {
                              setLocationInput(e.target.value);
                              getLocationSuggestions(e.target.value);
                            }}
                            placeholder="Search for a city or location..."
                            className="h-12 pr-20 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={detectCurrentLocation}
                            disabled={locationLoading}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs"
                          >
                            {locationLoading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            ) : (
                              <Navigation className="h-3 w-3" />
                            )}
                          </Button>
                          {locationSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 mt-1">
                              {locationSuggestions.map((location, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setLocationInput(location.name);
                                    setFormData(prev => ({
                                      ...prev,
                                      location: location.name,
                                      city: location.city,
                                      state: location.state,
                                      country: location.country
                                    }));
                                    setLocationSuggestions([]);
                                  }}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                >
                                  <div className="font-medium">{location.name}</div>
                                  <div className="text-sm text-slate-500">
                                    {location.jobCount} jobs available
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {locationError && (
                          <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {locationError}
                          </div>
                        )}
                      </div>
                    )}

                    {formData.locationType === 'radius' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Center Location
                          </Label>
                          <Input
                            value={formData.radiusCenter}
                            onChange={(e) => handleInputChange('radiusCenter', e.target.value)}
                            placeholder="Enter center location for radius search..."
                            className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                          />
                        </div>
                        <div>
                          <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            Search Radius: {formData.radiusDistance} km
                          </Label>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={formData.radiusDistance}
                            onChange={(e) => handleInputChange('radiusDistance', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-sm text-slate-500 mt-1">
                            <span>5 km</span>
                            <span>100 km</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          Salary Range
                        </Label>
                        <Input
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', e.target.value)}
                          placeholder="e.g., $50,000 - $70,000"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                        />
                      </div>

                      <div>
                        <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Number of Openings
                        </Label>
                        <Input
                          type="number"
                          value={formData.openings}
                          onChange={(e) => handleInputChange('openings', e.target.value)}
                          min="1"
                          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        Work Arrangement
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remote"
                            checked={formData.isRemote}
                            onCheckedChange={(checked) => handleInputChange('isRemote', checked)}
                          />
                          <Label htmlFor="remote" className="text-sm font-medium">
                            Remote Work
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hybrid"
                            checked={formData.isHybrid}
                            onCheckedChange={(checked) => handleInputChange('isHybrid', checked)}
                          />
                          <Label htmlFor="hybrid" className="text-sm font-medium">
                            Hybrid Work
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="urgent"
                            checked={formData.isUrgent}
                            onCheckedChange={(checked) => handleInputChange('isUrgent', checked)}
                          />
                          <Label htmlFor="urgent" className="text-sm font-medium">
                            Urgent Hiring
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Review & Publish</h2>
                    <p className="text-slate-600">Review your AI-optimized job posting before publishing</p>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-slate-50/50 border-slate-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                          {formData.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                          <p className="text-slate-700 text-sm leading-relaxed">{formData.description}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-2">Requirements</h4>
                          <p className="text-slate-700 text-sm leading-relaxed">{formData.requirements}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-600">Location:</span>
                            <p className="text-slate-800">{formData.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Type:</span>
                            <p className="text-slate-800">{formData.jobType}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Experience:</span>
                            <p className="text-slate-800">{formData.experienceLevel}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-600">Openings:</span>
                            <p className="text-slate-800">{formData.openings}</p>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-slate-600">Skills:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {formData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                      />
                      <Label htmlFor="featured" className="text-sm font-medium">
                        Feature this job posting (increases visibility)
                      </Label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-4 sm:px-6 py-2 w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
                {/* Clear Form Button */}
                <Button
                  variant="outline"
                  onClick={clearFormData}
                  className="px-3 sm:px-4 py-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 w-full sm:w-auto"
                  title="Clear all form data and start fresh"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                    className="px-6 sm:px-8 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Publish Job
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
