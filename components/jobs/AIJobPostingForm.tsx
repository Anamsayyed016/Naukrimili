'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  // Enhanced fields
  contactEmail: string;
  contactPhone: string;
  hidePhoneNumber: boolean;
  department: string;
  industry: string;
  workSchedule: string;
  visaSponsorship: boolean;
  equityOffered: boolean;
  minExperience: string;
  maxExperience: string;
  educationLevel: string;
  languageRequirements: string[];
  travelRequired: boolean;
}

interface AISuggestion {
  field: string;
  suggestions: string[];
  confidence: number;
  reasoning: string;
  approved?: boolean;
  pending?: boolean;
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

const departments = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 
  'Operations', 'Finance', 'Human Resources', 'Customer Success',
  'Data Science', 'Security', 'DevOps', 'Quality Assurance'
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
  'Manufacturing', 'Retail', 'Consulting', 'Media & Entertainment',
  'Real Estate', 'Transportation', 'Energy', 'Government', 'Non-profit'
];

const workSchedules = [
  'Standard (9 AM - 5 PM)', 'Flexible Hours', 'Shift Work',
  'Part-time Schedule', 'Compressed Workweek', 'On-call'
];

const educationLevels = [
  'High School', 'Associate Degree', 'Bachelor\'s Degree',
  'Master\'s Degree', 'PhD', 'No Formal Education Required'
];

const languages = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese',
  'Japanese', 'Korean', 'Portuguese', 'Arabic', 'Russian'
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
  const router = useRouter();

  // Clean, professional dropdown styles - following company form pattern
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'job-dropdown-styles';
    style.textContent = `
      /* Professional dropdown styling - matching company form */
      .radix-select-content {
        z-index: 9999 !important;
      }
      
      /* Fix for mobile and tablet visibility */
      @media (max-width: 768px) {
        [data-radix-popper-content-wrapper] {
          z-index: 9999 !important;
          position: fixed !important;
          max-width: calc(100vw - 32px) !important;
        }
      }
      
      /* Additional specific fixes for Radix Select */
      [data-radix-select-content][data-state="open"] {
        z-index: 9999 !important;
        position: fixed !important;
      }
      
      [data-radix-select-viewport] {
        z-index: 9999 !important;
      }
      
      /* Ensure dropdown items are visible */
      [data-radix-select-item] {
        z-index: 9999 !important;
      }
      
      /* Fix for any parent container clipping */
      .overflow-hidden {
        overflow: visible !important;
      }
      
      /* Ensure proper stacking context for all dropdown elements */
      [data-radix-popper-content-wrapper],
      [data-radix-select-content],
      [data-radix-select-viewport],
      [data-radix-select-item] {
        z-index: 9999 !important;
      }
      
      /* Professional hover effects */
      [data-radix-select-item]:hover {
        background-color: #f8fafc !important;
        color: #1e293b !important;
      }
      
      [data-radix-select-item][data-highlighted] {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      
      [data-radix-select-item][data-state="checked"] {
        background-color: #10b981 !important;
        color: white !important;
        font-weight: 600 !important;
      }
    `;
    
    // Remove existing style if it exists
    const existingStyle = document.getElementById('job-dropdown-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    document.head.appendChild(style);
    
    return () => {
      const styleElement = document.getElementById('job-dropdown-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  // Initialize form data from localStorage or default values
  const initialFormData = useMemo((): JobFormData => {
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
      radiusCenter: '',
      // Enhanced fields
      contactEmail: '',
      contactPhone: '',
      hidePhoneNumber: false,
      department: '',
      industry: 'Technology',
      workSchedule: 'Standard (9 AM - 5 PM)',
      visaSponsorship: false,
      equityOffered: false,
      minExperience: '0',
      maxExperience: '5',
      educationLevel: 'Bachelor\'s Degree',
      languageRequirements: ['English'],
      travelRequired: false
    };
  }, []);

  // Initialize current step from sessionStorage or default
  const initialStep = useMemo((): number => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('jobPostingCurrentStep');
      if (saved) {
        const step = parseInt(saved, 10);
        console.log('Restored current step from sessionStorage:', step);
        return step;
      }
    }
    return 1;
  }, []);

  // All hooks must be at the top level
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<LocationOption[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldSuggestions, setFieldSuggestions] = useState<{[key: string]: AISuggestion}>({});
  const [showGuidance, setShowGuidance] = useState<string | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  
  // Refs for debouncing dynamic AI suggestions
  const titleDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const requirementsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs to track if suggestion was manually applied (to prevent re-trigger)
  const manuallyAppliedRef = useRef<string | null>(null);
  
  // Currency mapping based on country
  const getCurrencyByCountry = (countryCode: string) => {
    const currencyMap: { [key: string]: { symbol: string; code: string; name: string } } = {
      'US': { symbol: '$', code: 'USD', name: 'US Dollar' },
      'IN': { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
      'GB': { symbol: '£', code: 'GBP', name: 'British Pound' },
      'CA': { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
      'AU': { symbol: 'A$', code: 'AUD', name: 'Australian Dollar' },
      'DE': { symbol: '€', code: 'EUR', name: 'Euro' },
      'FR': { symbol: '€', code: 'EUR', name: 'Euro' },
      'IT': { symbol: '€', code: 'EUR', name: 'Euro' },
      'ES': { symbol: '€', code: 'EUR', name: 'Euro' },
      'NL': { symbol: '€', code: 'EUR', name: 'Euro' },
      'JP': { symbol: '¥', code: 'JPY', name: 'Japanese Yen' },
      'CN': { symbol: '¥', code: 'CNY', name: 'Chinese Yuan' },
      'KR': { symbol: '₩', code: 'KRW', name: 'South Korean Won' },
      'SG': { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar' },
      'HK': { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
      'AE': { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham' },
      'SA': { symbol: '﷼', code: 'SAR', name: 'Saudi Riyal' },
      'BR': { symbol: 'R$', code: 'BRL', name: 'Brazilian Real' },
      'MX': { symbol: '$', code: 'MXN', name: 'Mexican Peso' },
      'RU': { symbol: '₽', code: 'RUB', name: 'Russian Ruble' },
      'ZA': { symbol: 'R', code: 'ZAR', name: 'South African Rand' },
      'NG': { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
      'EG': { symbol: '£', code: 'EGP', name: 'Egyptian Pound' },
      'TH': { symbol: '฿', code: 'THB', name: 'Thai Baht' },
      'MY': { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit' },
      'ID': { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah' },
      'PH': { symbol: '₱', code: 'PHP', name: 'Philippine Peso' },
      'VN': { symbol: '₫', code: 'VND', name: 'Vietnamese Dong' },
      'TR': { symbol: '₺', code: 'TRY', name: 'Turkish Lira' },
      'PL': { symbol: 'zł', code: 'PLN', name: 'Polish Zloty' },
      'CZ': { symbol: 'Kč', code: 'CZK', name: 'Czech Koruna' },
      'HU': { symbol: 'Ft', code: 'HUF', name: 'Hungarian Forint' },
      'RO': { symbol: 'lei', code: 'RON', name: 'Romanian Leu' },
      'BG': { symbol: 'лв', code: 'BGN', name: 'Bulgarian Lev' },
      'HR': { symbol: 'kn', code: 'HRK', name: 'Croatian Kuna' },
      'SE': { symbol: 'kr', code: 'SEK', name: 'Swedish Krona' },
      'NO': { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone' },
      'DK': { symbol: 'kr', code: 'DKK', name: 'Danish Krone' },
      'FI': { symbol: '€', code: 'EUR', name: 'Euro' },
      'CH': { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc' },
      'AT': { symbol: '€', code: 'EUR', name: 'Euro' },
      'BE': { symbol: '€', code: 'EUR', name: 'Euro' },
      'IE': { symbol: '€', code: 'EUR', name: 'Euro' },
      'PT': { symbol: '€', code: 'EUR', name: 'Euro' },
      'GR': { symbol: '€', code: 'EUR', name: 'Euro' },
      'LU': { symbol: '€', code: 'EUR', name: 'Euro' },
      'MT': { symbol: '€', code: 'EUR', name: 'Euro' },
      'CY': { symbol: '€', code: 'EUR', name: 'Euro' },
      'SK': { symbol: '€', code: 'EUR', name: 'Euro' },
      'SI': { symbol: '€', code: 'EUR', name: 'Euro' },
      'EE': { symbol: '€', code: 'EUR', name: 'Euro' },
      'LV': { symbol: '€', code: 'EUR', name: 'Euro' },
      'LT': { symbol: '€', code: 'EUR', name: 'Euro' }
    };
    
    return currencyMap[countryCode] || { symbol: '$', code: 'USD', name: 'US Dollar' };
  };

  const [formData, setFormData] = useState<JobFormData>(() => {
    const data = initialFormData;
    // Initialize currency based on initial country
    const currency = getCurrencyByCountry(data.country);
    setCurrencySymbol(currency.symbol);
    setCurrencyCode(currency.code);
    return data;
  });

  // Dynamic AI suggestions with debouncing - auto-suggest as user types
  useEffect(() => {
    // Skip if suggestion was just manually applied
    if (manuallyAppliedRef.current === 'title') {
      manuallyAppliedRef.current = null;
      return;
    }
    
    // Auto-suggest for title field (debounced)
    if (formData.title && formData.title.length >= 3 && currentStep === 1) {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      
      titleDebounceRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI suggestions for title:', formData.title);
        getAISuggestions('title', formData.title);
      }, 1500); // 1.5 second debounce for performance
    }

    return () => {
      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    };
  }, [formData.title, currentStep]);

  useEffect(() => {
    // Skip if suggestion was just manually applied
    if (manuallyAppliedRef.current === 'description') {
      manuallyAppliedRef.current = null;
      return;
    }
    
    // Auto-suggest for description field (debounced)
    if (formData.description && formData.description.length >= 10 && currentStep === 1) {
      if (descriptionDebounceRef.current) clearTimeout(descriptionDebounceRef.current);
      
      descriptionDebounceRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI suggestions for description');
        getAISuggestions('description', formData.description);
      }, 2000); // 2 second debounce for longer text
    }

    return () => {
      if (descriptionDebounceRef.current) clearTimeout(descriptionDebounceRef.current);
    };
  }, [formData.description, currentStep]);

  useEffect(() => {
    // Skip if suggestion was just manually applied
    if (manuallyAppliedRef.current === 'requirements') {
      manuallyAppliedRef.current = null;
      return;
    }
    
    // Auto-suggest for requirements field (debounced)
    if (formData.requirements && formData.requirements.length >= 10 && currentStep === 2) {
      if (requirementsDebounceRef.current) clearTimeout(requirementsDebounceRef.current);
      
      requirementsDebounceRef.current = setTimeout(() => {
        console.log('🤖 Auto-triggering AI suggestions for requirements');
        getAISuggestions('requirements', formData.requirements);
      }, 2000); // 2 second debounce
    }

    return () => {
      if (requirementsDebounceRef.current) clearTimeout(requirementsDebounceRef.current);
    };
  }, [formData.requirements, currentStep]);

  // Function to extract country from location string
  const extractCountryFromLocation = (locationString: string) => {
    if (!locationString) return 'IN';
    
    // Check for common country indicators in the location string
    const locationLower = locationString.toLowerCase();
    
    if (locationLower.includes('india') || locationLower.includes('mumbai') || locationLower.includes('delhi') || 
        locationLower.includes('bangalore') || locationLower.includes('chennai') || locationLower.includes('kolkata') ||
        locationLower.includes('hyderabad') || locationLower.includes('pune') || locationLower.includes('ahmedabad') ||
        locationLower.includes('jaipur') || locationLower.includes('jaisalmer') || locationLower.includes('rajasthan')) {
      return 'IN';
    }
    
    if (locationLower.includes('united states') || locationLower.includes('usa') || locationLower.includes('us') ||
        locationLower.includes('new york') || locationLower.includes('california') || locationLower.includes('texas') ||
        locationLower.includes('florida') || locationLower.includes('washington')) {
      return 'US';
    }
    
    if (locationLower.includes('united kingdom') || locationLower.includes('uk') || locationLower.includes('london') ||
        locationLower.includes('manchester') || locationLower.includes('birmingham')) {
      return 'GB';
    }
    
    if (locationLower.includes('canada') || locationLower.includes('toronto') || locationLower.includes('vancouver') ||
        locationLower.includes('montreal')) {
      return 'CA';
    }
    
    if (locationLower.includes('australia') || locationLower.includes('sydney') || locationLower.includes('melbourne') ||
        locationLower.includes('brisbane')) {
      return 'AU';
    }
    
    if (locationLower.includes('germany') || locationLower.includes('berlin') || locationLower.includes('munich') ||
        locationLower.includes('hamburg')) {
      return 'DE';
    }
    
    if (locationLower.includes('france') || locationLower.includes('paris') || locationLower.includes('lyon') ||
        locationLower.includes('marseille')) {
      return 'FR';
    }
    
    if (locationLower.includes('singapore') || locationLower.includes('sg')) {
      return 'SG';
    }
    
    if (locationLower.includes('uae') || locationLower.includes('dubai') || locationLower.includes('abu dhabi')) {
      return 'AE';
    }
    
    // Default to India for Indian locations
    return 'IN';
  };

  // Update currency when country changes
  useEffect(() => {
    const currency = getCurrencyByCountry(formData.country);
    setCurrencySymbol(currency.symbol);
    setCurrencyCode(currency.code);
    
    // Debug logging
    console.log('🌍 Currency updated:', {
      country: formData.country,
      currency: currency,
      location: formData.location
    });
    
    // Show currency change notification
    if (formData.country && formData.country !== 'IN') {
      toast.info(`Currency updated to ${currency.name}`, {
        description: `Salary field now uses ${currency.symbol} symbol`,
        duration: 2000,
      });
    }
  }, [formData.country]);

  // Update country when location changes manually
  useEffect(() => {
    if (formData.location && !formData.country) {
      const detectedCountry = extractCountryFromLocation(formData.location);
      if (detectedCountry !== formData.country) {
        setFormData(prev => ({
          ...prev,
          country: detectedCountry
        }));
        console.log('🌍 Country auto-detected from location:', {
          location: formData.location,
          detectedCountry: detectedCountry
        });
      }
    }
  }, [formData.location, formData.country]);

  // AI Guidance content for different fields
  const getGuidanceContent = (field: string) => {
    const guidanceMap = {
      title: {
        title: "AI-Powered Job Title Suggestions",
        icon: <Briefcase className="h-6 w-6 text-blue-600" />,
        steps: [
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>,
            text: "Type a basic job title or role description"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>,
            text: "Click the sparkle icon to get AI suggestions"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>,
            text: "Review suggestions and click 'Use This' to apply"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">4</div>,
            text: "Or continue typing manually if you prefer"
          }
        ],
        tips: [
          "AI suggestions are based on industry standards and current job market trends",
          "You can always edit the suggested title after applying it",
          "The more specific you are, the better the AI suggestions will be"
        ]
      },
      description: {
        title: "AI-Powered Job Description Suggestions",
        icon: <FileText className="h-6 w-6 text-blue-600" />,
        steps: [
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>,
            text: "Start writing your job description or key requirements"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>,
            text: "Click the sparkle icon for AI-generated descriptions"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>,
            text: "Choose from multiple professional descriptions"
          },
          {
            icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">4</div>,
            text: "Customize the selected description to match your needs"
          }
        ],
        tips: [
          "AI descriptions include industry-standard responsibilities and requirements",
          "Each suggestion is tailored to the job title and experience level",
          "You can combine multiple suggestions or use them as inspiration"
        ]
      }
    };
    
    return guidanceMap[field as keyof typeof guidanceMap] || guidanceMap.title;
  };

  // Professional Guidance Modal Component
  const GuidanceModal = ({ field, onClose }: { field: string; onClose: () => void }) => {
    const guidance = getGuidanceContent(field);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-t-2xl border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {guidance.icon}
                <h2 className="text-xl font-bold text-slate-900">{guidance.title}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-slate-200 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Steps */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-blue-600" />
                </div>
                How to Use AI Suggestions
              </h3>
              <div className="space-y-4">
                {guidance.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    {step.icon}
                    <p className="text-slate-700 font-medium flex-1">{step.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-3 w-3 text-green-600" />
                </div>
                Pro Tips
              </h3>
              <div className="space-y-3">
                {guidance.tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (guidance.steps.length + index) * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-slate-700 text-sm">{tip}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Demo Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Quick Demo</span>
              </div>
              <p className="text-blue-800 text-sm">
                Try typing something in the field above, then click the sparkle icon to see AI suggestions in action!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-50 px-6 py-4 rounded-b-2xl border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>AI suggestions are completely optional - you can always type manually</span>
              </div>
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                Got it!
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Instant fallback suggestions for professional feel
  const getInstantSuggestions = (field: string, value: string): AISuggestion => {
    // Enhanced instant suggestions with technology-specific titles
    const instantSuggestions: { [key: string]: string[] } = {
      title: [
        // Python-related
        'Python Developer', 'Senior Python Developer', 'Python Software Engineer',
        'Python Backend Developer', 'Python Data Engineer', 'Python Automation Engineer',
        // General tech
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
    
    // Smart filtering: prioritize exact matches, then partial matches
    const lowerValue = value.toLowerCase();
    const exactMatches = suggestions.filter(s => s.toLowerCase().includes(lowerValue));
    const partialMatches = suggestions.filter(s => {
      const words = s.toLowerCase().split(/\s+/);
      return words.some(word => word.includes(lowerValue) || lowerValue.includes(word));
    });
    const allMatches = [...new Set([...exactMatches, ...partialMatches])];

    // If no matches, return top 5 suggestions (no filtering)
    const finalSuggestions = allMatches.length > 0 
      ? allMatches.slice(0, 5) 
      : suggestions.slice(0, 5);

    return {
      field,
      suggestions: finalSuggestions,
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
    
    console.log(`🔮 Requesting AI suggestions for field: ${field}, value: ${value}`);

    // Show instant suggestions immediately for professional feel
    const instantSuggestion = getInstantSuggestions(field, value);
    setFieldSuggestions(prev => ({
      ...prev,
      [field]: instantSuggestion
    }));
    setActiveField(field);
    
    setAiLoading(true);
    try {
      console.log('📡 Making API call to /api/ai/form-suggestions');
      
      // Try enhanced job-specific API first
      const response = await fetch('/api/ai/job-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: field,
          field,
          value,
          context: {
            jobType: formData.jobType,
            experienceLevel: formData.experienceLevel,
            industry: formData.industry || 'Technology',
            department: formData.department,
            skills: formData.skills,
            location: formData.location,
            companySize: 'Medium'
          }
        })
      });

      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        console.log('📡 Enhanced API failed, trying fallback...');
        const errorText = await response.text();
        console.error('❌ Enhanced API Error Response:', errorText);
        
        // Fallback to original form-suggestions API
        const fallbackResponse = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field,
            value,
            context: {
              jobType: formData.jobType,
              experienceLevel: formData.experienceLevel,
              industry: formData.industry || 'Technology',
              skills: formData.skills
            }
          })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.success && fallbackData.suggestions && fallbackData.suggestions.length > 0) {
            const suggestion: AISuggestion = {
              field,
              suggestions: fallbackData.suggestions,
              confidence: fallbackData.confidence,
              reasoning: `Fallback AI confidence: ${fallbackData.confidence}% (${fallbackData.aiProvider || 'fallback'})`
            };
            
            setFieldSuggestions(prev => ({
              ...prev,
              [field]: suggestion
            }));
            
            setActiveField(field);
            toast.success(`AI suggestions loaded! (Fallback)`);
            return;
          }
        }
        
        throw new Error(`Both APIs failed: Enhanced ${response.status}, Fallback ${fallbackResponse.status}`);
      }

      const data = await response.json();
      console.log('📡 API Response data:', data);
      
      if (data.success) {
        const suggestion: AISuggestion = {
          field,
          suggestions: data.suggestions,
          confidence: data.confidence,
          reasoning: `AI confidence: ${data.confidence}% (${data.aiProvider || 'unknown'})`
        };
        
        console.log(`✅ AI suggestions received: ${data.suggestions.length} suggestions with ${data.confidence}% confidence`);
        
        // Update with AI suggestions (replace instant ones)
        setFieldSuggestions(prev => ({
          ...prev,
          [field]: suggestion
        }));
        
        setActiveField(field);
        
        // Show success toast
        toast.success(`Enhanced AI suggestions loaded! (${data.aiProvider || 'Enhanced AI'})`);
      } else {
        console.error('❌ API returned success: false', data);
        toast.error('AI suggestions failed. Using instant suggestions.');
      }
    } catch (error) {
      console.error('❌ AI suggestions error:', error);
      toast.error('AI suggestions unavailable. Using instant suggestions.');
      // Keep instant suggestions if AI fails
    } finally {
      setAiLoading(false);
    }
  }, [formData.jobType, formData.experienceLevel, formData.skills]);

  // Removed handleInputChangeWithSuggestions - now using direct handleInputChange for manual typing

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
          
          // Map country name to country code
          const getCountryCode = (countryName: string) => {
            const countryMap: { [key: string]: string } = {
              'India': 'IN',
              'United States': 'US',
              'United Kingdom': 'GB',
              'Canada': 'CA',
              'Australia': 'AU',
              'Germany': 'DE',
              'France': 'FR',
              'Italy': 'IT',
              'Spain': 'ES',
              'Netherlands': 'NL',
              'Japan': 'JP',
              'China': 'CN',
              'South Korea': 'KR',
              'Singapore': 'SG',
              'Hong Kong': 'HK',
              'UAE': 'AE',
              'Saudi Arabia': 'SA',
              'Brazil': 'BR',
              'Mexico': 'MX',
              'Russia': 'RU',
              'South Africa': 'ZA',
              'Nigeria': 'NG',
              'Egypt': 'EG',
              'Thailand': 'TH',
              'Malaysia': 'MY',
              'Indonesia': 'ID',
              'Philippines': 'PH',
              'Vietnam': 'VN',
              'Turkey': 'TR',
              'Poland': 'PL',
              'Czech Republic': 'CZ',
              'Hungary': 'HU',
              'Romania': 'RO',
              'Bulgaria': 'BG',
              'Croatia': 'HR',
              'Sweden': 'SE',
              'Norway': 'NO',
              'Denmark': 'DK',
              'Finland': 'FI',
              'Switzerland': 'CH',
              'Austria': 'AT',
              'Belgium': 'BE',
              'Ireland': 'IE',
              'Portugal': 'PT',
              'Greece': 'GR',
              'Luxembourg': 'LU',
              'Malta': 'MT',
              'Cyprus': 'CY',
              'Slovakia': 'SK',
              'Slovenia': 'SI',
              'Estonia': 'EE',
              'Latvia': 'LV',
              'Lithuania': 'LT'
            };
            return countryMap[countryName] || 'IN'; // Default to India instead of US
          };
          
          const countryCode = getCountryCode(result.country || 'India');
          
          // Debug logging
          console.log('🌍 Location detected:', {
            location: locationName,
            country: result.country,
            countryCode: countryCode
          });
          
          setFormData(prev => ({
            ...prev,
            location: locationName,
            city: result.city || '',
            state: result.state || '',
            country: countryCode
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
    
    // Handle location type changes with proper cleanup
    if (field === 'locationType') {
      console.log(`🔄 Switching location type to: ${value}`);
      
      // Clear location-related fields when switching types
      setFormData(prev => {
        const newData = { ...prev, [field]: value };
        
        // Clear location data based on the new type
        if (value === 'single') {
          // Keep single location data, clear others
          newData.multipleLocations = [];
          newData.radiusCenter = '';
          newData.radiusDistance = 25;
        } else if (value === 'multiple') {
          // Clear single location, keep multiple locations
          newData.location = '';
          newData.city = '';
          newData.state = '';
          newData.radiusCenter = '';
          newData.radiusDistance = 25;
        } else if (value === 'radius') {
          // Clear single and multiple, keep radius
          newData.location = '';
          newData.city = '';
          newData.state = '';
          newData.multipleLocations = [];
        }
        
        return newData;
      });
      
      // Clear location input and suggestions
      setLocationInput('');
      setLocationSuggestions([]);
      
      // Show success message
      const typeNames = {
        single: 'Single Location',
        multiple: 'Multiple Cities',
        radius: 'Radius Search'
      };
      toast.success(`Switched to ${typeNames[value as keyof typeof typeNames]} mode`);
    } else {
      // Directly update form data for other fields
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear any existing suggestions for this field to prevent conflicts
    setFieldSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[field];
      return newSuggestions;
    });
    setActiveField(null);
  };

  // Optional AI suggestions - only triggered when user requests them
  const requestAISuggestions = (field: string) => {
    let fieldValue: string;
    
    if (field === 'skills') {
      fieldValue = skillsInput;
    } else {
      fieldValue = formData[field as keyof JobFormData] as string;
    }
    
    if (typeof fieldValue === 'string' && fieldValue.trim().length > 0) {
      console.log('User requested AI suggestions for:', field, fieldValue);
      getAISuggestions(field, fieldValue);
    } else {
      toast.error('Please enter some text first before requesting AI suggestions');
    }
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
    
    // Clear any existing AI suggestions to prevent conflicts
    setFieldSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions.skills;
      return newSuggestions;
    });
    setActiveField(null);
  };

  // Removed unused addSkill function

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: prev.skills.filter(skill => skill !== skillToRemove) 
    }));
  };

  const applyAISuggestion = (field: string, suggestion: string) => {
    console.log('Applying AI suggestion:', { field, suggestion });
    
    // Mark that we're manually applying a suggestion to prevent re-trigger
    manuallyAppliedRef.current = field;
    
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
  // Removed typingTimeout cleanup - no longer needed

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
      locationType: 'single' as const, multipleLocations: [], radiusDistance: 25, radiusCenter: '',
      // Enhanced fields
      contactEmail: '', contactPhone: '', hidePhoneNumber: false, department: '', industry: 'Technology',
      workSchedule: 'Standard (9 AM - 5 PM)', visaSponsorship: false, equityOffered: false,
      minExperience: '0', maxExperience: '5', educationLevel: 'Bachelor\'s Degree',
      languageRequirements: ['English'], travelRequired: false
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
        // Validate based on location type
        if (formData.locationType === 'single') {
          isValid = formData.location.trim() !== '';
          console.log('Step 3 validation (single):', { 
            location: formData.location.trim(), 
            isValid 
          });
        } else if (formData.locationType === 'multiple') {
          isValid = formData.multipleLocations.length > 0;
          console.log('Step 3 validation (multiple):', { 
            multipleLocations: formData.multipleLocations.length, 
            locations: formData.multipleLocations,
            isValid 
          });
        } else if (formData.locationType === 'radius') {
          isValid = formData.radiusCenter.trim() !== '';
          console.log('Step 3 validation (radius):', { 
            radiusCenter: formData.radiusCenter.trim(),
            radiusDistance: formData.radiusDistance,
            isValid 
          });
        } else {
          isValid = false;
          console.log('Step 3 validation (unknown type):', { 
            locationType: formData.locationType,
            isValid 
          });
        }
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
    
    // Validate each step with specific error messages
    if (!validateStep(1)) {
      console.log('❌ Step 1 validation failed');
      toast.error('Please complete job title and description');
      return;
    }
    
    if (!validateStep(2)) {
      console.log('❌ Step 2 validation failed');
      toast.error('Please add job requirements and skills');
      return;
    }
    
    if (!validateStep(3)) {
      console.log('❌ Step 3 validation failed');
      if (formData.locationType === 'single') {
        toast.error('Please select a job location');
      } else if (formData.locationType === 'multiple') {
        toast.error('Please add at least one city for multiple locations');
      } else if (formData.locationType === 'radius') {
        toast.error('Please enter a center location for radius search');
      } else {
        toast.error('Please complete location requirements');
      }
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
        radiusCenter: formData.radiusCenter,
        // Currency information
        currencyCode: currencyCode,
        currencySymbol: currencySymbol
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
        console.log('🎉 Job posted successfully!', data);
        
        // Show success notification
        toast.success('🎉 Job posted successfully! Your AI-optimized listing is now live.', {
          description: 'Job seekers can now find and apply to your position with enhanced visibility.',
          duration: 5000,
        });
        
        // Real-time notification is handled by the backend API
        // No need to emit from frontend as the backend already handles this
        console.log('📡 Job creation notification handled by backend API');
        
        // Send database notification
        try {
          const notificationResponse = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Job Posted Successfully! 🎉',
              message: `Your job "${data.job.title}" has been posted and is now live on the platform.`,
              type: 'success',
              data: {
                jobId: data.job.id,
                jobTitle: data.job.title,
                action: 'job_created'
              }
            })
          });
          
          if (notificationResponse.ok) {
            console.log('✅ Job creation notification sent to database');
          }
        } catch (notificationError) {
          console.error('❌ Failed to send job creation notification:', notificationError);
          // Don&apos;t fail the job posting if notification fails
        }
        
        // Clear form data and redirect to dashboard
        console.log('🔄 Clearing form and redirecting to dashboard...');
        
        // Reset form data
        const resetFormData: JobFormData = {
          title: '', description: '', requirements: '', location: '', city: '', state: '', country: 'IN',
          jobType: 'Full-time', experienceLevel: 'Entry Level (0-2 years)', salary: '', skills: [], benefits: '',
          isRemote: false, isHybrid: false, isUrgent: false, isFeatured: false, applicationDeadline: '', openings: '1',
          locationType: 'single' as const, multipleLocations: [], radiusDistance: 25, radiusCenter: '',
          // Enhanced fields
          contactEmail: '', contactPhone: '', hidePhoneNumber: false, department: '', industry: 'Technology',
          workSchedule: 'Standard (9 AM - 5 PM)', visaSponsorship: false, equityOffered: false,
          minExperience: '0', maxExperience: '5', educationLevel: 'Bachelor\'s Degree',
          languageRequirements: ['English'], travelRequired: false
        };
        setFormData(resetFormData);
        setCurrentStep(1);
        
        // Clear localStorage and sessionStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('jobPostingFormData');
          sessionStorage.removeItem('jobPostingCurrentStep');
          console.log('✅ Cleared form persistence after successful submission');
        }
        
        // Redirect to employer dashboard after a short delay
        setTimeout(() => {
          console.log('🚀 Redirecting to employer dashboard...');
          router.push('/employer/dashboard');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to post job');
      }
    } catch {
      toast.error('Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 mobile-job-form">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-6xl py-4 sm:py-8 form-container">
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
        <Card className="shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/20">
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
                          className="text-base sm:text-lg h-12 sm:h-16 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 pr-20 bg-white text-slate-900 font-medium touch-manipulation"
                        />
                        {/* AI Suggestion and Help Buttons */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                          {/* Help Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowGuidance('title')}
                            className="h-8 w-8 p-0 hover:bg-green-50 rounded-full"
                            title="How to use AI suggestions"
                          >
                            <Lightbulb className="h-4 w-4 text-green-600" />
                          </Button>
                          {/* AI Suggestion Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestAISuggestions('title')}
                            disabled={!formData.title.trim() || aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-2 py-1 text-xs font-medium h-8 min-w-fit"
                            title="Get AI suggestions for job title"
                          >
                            {aiLoading && activeField === 'title' ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        {aiLoading && activeField === 'title' && (
                          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
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
                                <div className="w-full p-3 sm:p-4 border-2 border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 group">
                                  <div className="flex items-start sm:items-center gap-3 w-full mb-3">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Review and approve this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => applyAISuggestion('title', suggestion)}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Use This
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setFieldSuggestions(prev => {
                                          const newSuggestions = { ...prev };
                                          delete newSuggestions['title'];
                                          return newSuggestions;
                                        });
                                      }}
                                      className="px-4 py-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
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
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-14 text-base sm:text-lg bg-white text-slate-900 touch-manipulation resize-none"
                        />
                        {/* AI Suggestion and Help Buttons */}
                        <div className="absolute right-2 top-2 flex gap-1">
                          {/* Help Button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowGuidance('description')}
                            className="h-8 w-8 p-0 hover:bg-green-50 rounded-full"
                            title="How to use AI suggestions"
                          >
                            <Lightbulb className="h-4 w-4 text-green-600" />
                          </Button>
                          {/* AI Suggestion Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestAISuggestions('description')}
                            disabled={!formData.description.trim() || aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-2 py-1 text-xs font-medium h-8 min-w-fit"
                            title="Get AI suggestions for job description"
                          >
                            {aiLoading && activeField === 'description' ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            )}
                          </Button>
                        </div>
                        {aiLoading && activeField === 'description' && (
                          <div className="absolute right-12 top-3">
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
                                <div className="w-full p-3 sm:p-4 border-2 border-blue-300 bg-white/80 text-slate-900 shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 group">
                                  <div className="flex items-start sm:items-center gap-3 w-full mb-3">
                                    <div className="p-2 bg-blue-300 rounded-full group-hover:bg-blue-400 transition-colors shadow-sm flex-shrink-0 mt-0.5 sm:mt-0">
                                      <Lightbulb className="h-4 w-4 text-blue-800" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-bold text-slate-900 block break-words leading-tight">
                                        {suggestion}
                                      </span>
                                      <span className="text-xs text-slate-700 font-medium">
                                        Review and approve this suggestion
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-600 font-semibold bg-slate-200 px-2 py-1 rounded-full flex-shrink-0">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => applyAISuggestion('description', suggestion)}
                                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Use This
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setFieldSuggestions(prev => {
                                          const newSuggestions = { ...prev };
                                          delete newSuggestions['description'];
                                          return newSuggestions;
                                        });
                                      }}
                                      className="px-4 py-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-6 sm:space-y-8 mb-8">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Contact Information</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Contact Email */}
                        <div className="space-y-3 sm:space-y-4">
                          <Label className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                            </div>
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Contact Email *</span>
                          </Label>
                          <Input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                            placeholder="hr@company.com"
                            className="text-base sm:text-lg h-12 sm:h-14 border-2 border-slate-200 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-slate-900 font-medium"
                            required
                          />
                        </div>

                        {/* Contact Phone */}
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                              </div>
                              <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Contact Phone *</span>
                            </Label>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id="hidePhone"
                                checked={formData.hidePhoneNumber}
                                onCheckedChange={(checked) => handleInputChange('hidePhoneNumber', checked)}
                                className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                              />
                              <Label htmlFor="hidePhone" className="text-sm text-slate-600 cursor-pointer">
                                Hide from public
                              </Label>
                            </div>
                          </div>
                          <Input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder="+91 98765 43210"
                            className="text-base sm:text-lg h-12 sm:h-14 border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white text-slate-900 font-medium"
                            required
                          />
                          {formData.hidePhoneNumber && (
                            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                              <AlertCircle className="h-4 w-4" />
                              <span>Phone number will not be visible to job seekers</span>
                            </div>
                          )}
                        </div>
                      </div>
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
                          <SelectContent 
                            className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                            position="popper"
                            sideOffset={8}
                          >
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
                          <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 relative z-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent 
                            className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                            position="popper"
                            sideOffset={8}
                          >
                            {experienceLevels.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Professional Fields */}
                    <div className="space-y-8 sm:space-y-10 mt-12 relative">
                      <div className="flex items-center gap-3 mb-6 sm:mb-8">
                        <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900">Additional Details</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        {/* Department */}
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Department *
                          </Label>
                          <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                            <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                    position="popper"
                    sideOffset={8}
                  >
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                          </Select>
                        </div>

                        {/* Industry */}
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Industry *
                          </Label>
                          <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                            <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                    position="popper"
                    sideOffset={8}
                  >
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                          </Select>
                        </div>

                        {/* Work Schedule */}
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Work Schedule
                          </Label>
                          <Select value={formData.workSchedule} onValueChange={(value) => handleInputChange('workSchedule', value)}>
                            <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select work schedule" />
                            </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                    position="popper"
                    sideOffset={8}
                  >
                    {workSchedules.map((schedule) => (
                      <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>
                    ))}
                  </SelectContent>
                          </Select>
                        </div>

                        {/* Education Level */}
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Education Level
                          </Label>
                          <Select value={formData.educationLevel} onValueChange={(value) => handleInputChange('educationLevel', value)}>
                            <SelectTrigger className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
                              <SelectValue placeholder="Select education level" />
                            </SelectTrigger>
                  <SelectContent 
                    className="max-h-60 overflow-y-auto z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl"
                    position="popper"
                    sideOffset={8}
                  >
                    {educationLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Experience Range */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Min Experience (Years)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.minExperience}
                            onChange={(e) => handleInputChange('minExperience', e.target.value)}
                            placeholder="0"
                            className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                          />
                        </div>
                        <div>
                          <Label className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 flex items-center gap-2">
                            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                            Max Experience (Years)
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={formData.maxExperience}
                            onChange={(e) => handleInputChange('maxExperience', e.target.value)}
                            placeholder="5"
                            className="h-10 sm:h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          <h4 className="text-lg font-bold text-slate-900">Additional Options</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <Checkbox
                              id="visaSponsorship"
                              checked={formData.visaSponsorship}
                              onCheckedChange={(checked) => handleInputChange('visaSponsorship', checked)}
                              className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 flex-shrink-0"
                            />
                            <Label htmlFor="visaSponsorship" className="text-sm font-semibold text-slate-700 cursor-pointer flex-1">
                              Visa Sponsorship Available
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <Checkbox
                              id="equityOffered"
                              checked={formData.equityOffered}
                              onCheckedChange={(checked) => handleInputChange('equityOffered', checked)}
                              className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 flex-shrink-0"
                            />
                            <Label htmlFor="equityOffered" className="text-sm font-semibold text-slate-700 cursor-pointer flex-1">
                              Equity/Stock Options
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors sm:col-span-2 lg:col-span-1">
                            <Checkbox
                              id="travelRequired"
                              checked={formData.travelRequired}
                              onCheckedChange={(checked) => handleInputChange('travelRequired', checked)}
                              className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 flex-shrink-0"
                            />
                            <Label htmlFor="travelRequired" className="text-sm font-semibold text-slate-700 cursor-pointer flex-1">
                              Travel Required
                            </Label>
                          </div>
                        </div>
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
                    <p className="text-slate-600">Define what you&apos;re looking for with AI optimization</p>
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
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-14 text-base bg-white text-slate-900 touch-manipulation resize-none"
                        />
                        {/* AI Suggestion Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => requestAISuggestions('requirements')}
                          disabled={!formData.requirements.trim() || aiLoading}
                          className="absolute right-2 top-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-2 py-1 text-xs font-medium h-8 min-w-fit"
                          title="Get AI suggestions for job requirements"
                        >
                          {aiLoading && activeField === 'requirements' ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              <span className="hidden sm:inline">AI Generate</span>
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">AI Generate</span>
                            </>
                          )}
                        </Button>
                        {aiLoading && activeField === 'requirements' && (
                          <div className="absolute right-12 top-3">
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
                            onChange={(e) => handleSkillsChange(e.target.value)}
                            onKeyDown={(e) => {
                              // Handle Enter key to add skill
                              if (e.key === 'Enter' && skillsInput.trim()) {
                                e.preventDefault();
                                const skill = skillsInput.trim();
                                if (skill && !formData.skills.includes(skill)) {
                                  setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
                                  setSkillsInput('');
                                  toast.success(`Added skill: ${skill}`);
                                }
                              }
                            }}
                            placeholder="Type skills and press Enter or comma to add..."
                            className="h-12 sm:h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 bg-white text-slate-900 text-base sm:text-lg touch-manipulation pr-12"
                          />
                          {/* AI Suggestion Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestAISuggestions('skills')}
                            disabled={!skillsInput.trim() || aiLoading}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-2 py-1 text-xs font-medium h-8 min-w-fit"
                            title="Get AI suggestions for skills"
                          >
                            {aiLoading && activeField === 'skills' ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            ) : (
                              <>
                                <Brain className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">AI Generate</span>
                              </>
                            )}
                          </Button>
                          {aiLoading && activeField === 'skills' && (
                            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
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
                          className="border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 pr-14 text-base bg-white text-slate-900 touch-manipulation resize-none"
                        />
                        {/* AI Suggestion Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => requestAISuggestions('benefits')}
                          disabled={!formData.benefits.trim() || aiLoading}
                          className="absolute right-2 top-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700 shadow-lg px-2 py-1 text-xs font-medium h-8 min-w-fit"
                          title="Get AI suggestions for benefits"
                        >
                          {aiLoading && activeField === 'benefits' ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              <span className="hidden sm:inline">AI Generate</span>
                            </>
                          ) : (
                            <>
                              <Brain className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">AI Generate</span>
                            </>
                          )}
                        </Button>
                        {aiLoading && activeField === 'benefits' && (
                          <div className="absolute right-12 top-3">
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
                    
                    {/* Location Type Indicator */}
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        {formData.locationType === 'single' && <MapPin className="h-4 w-4 text-blue-600" />}
                        {formData.locationType === 'multiple' && <Globe className="h-4 w-4 text-blue-600" />}
                        {formData.locationType === 'radius' && <Target className="h-4 w-4 text-blue-600" />}
                        <span className="text-sm font-medium text-blue-800">
                          {formData.locationType === 'single' && 'Single Location Mode'}
                          {formData.locationType === 'multiple' && 'Multiple Cities Mode'}
                          {formData.locationType === 'radius' && 'Radius Search Mode'}
                        </span>
                      </div>
                    </div>
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
                          {formData.country && (
                            <span className="text-sm font-normal text-slate-500 ml-2 bg-slate-100 px-2 py-1 rounded-full">
                              {getCurrencyByCountry(formData.country).symbol} {getCurrencyByCountry(formData.country).code}
                            </span>
                          )}
                        </Label>
                        <div className="space-y-3">
                          <div className="relative">
                            <Input
                              value={locationInput}
                              onChange={(e) => {
                                setLocationInput(e.target.value);
                                getLocationSuggestions(e.target.value);
                                
                                // Update formData.location when user types manually
                                setFormData(prev => ({
                                  ...prev,
                                  location: e.target.value
                                }));
                                
                                // Auto-detect country from typed location
                                const detectedCountry = extractCountryFromLocation(e.target.value);
                                if (detectedCountry !== formData.country) {
                                  setFormData(prevFormData => ({
                                    ...prevFormData,
                                    country: detectedCountry
                                  }));
                                }
                              }}
                              placeholder="Search for a city or location (e.g., Mumbai, Bangalore, New York)..."
                              className="h-12 pr-20 border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 bg-white text-slate-900 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={detectCurrentLocation}
                              disabled={locationLoading}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3 text-xs bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-medium rounded-lg"
                            >
                              {locationLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                              ) : (
                                <Navigation className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          
                          {/* Location Detection Status */}
                          {locationLoading && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                              <span>Detecting your current location...</span>
                            </div>
                          )}
                          
                          {locationError && (
                            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                              <AlertCircle className="h-4 w-4" />
                              <span>{locationError}</span>
                            </div>
                          )}
                          
                          {/* Manual Location Entry Help */}
                          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <strong>💡 Tip:</strong> You can type any city name, or use the location button to detect your current location automatically.
                          </div>
                          {formData.location && formData.location.trim() !== '' && (
                            <div className="text-xs text-green-600 flex items-center gap-2 bg-green-50 p-2 rounded-lg border border-green-200">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span>Location entered: {formData.location}</span>
                            </div>
                          )}
                          {locationSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white border-2 border-slate-200 rounded-xl shadow-2xl z-[9999] mt-2 max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                                  Suggested Locations
                                </div>
                                {locationSuggestions.map((location, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setLocationInput(location.name);
                                      
                                      // Map country name to country code
                                      const getCountryCode = (countryName: string) => {
                                        const countryMap: { [key: string]: string } = {
                                          'India': 'IN',
                                          'United States': 'US',
                                          'United Kingdom': 'GB',
                                          'Canada': 'CA',
                                          'Australia': 'AU',
                                          'Germany': 'DE',
                                          'France': 'FR',
                                          'Italy': 'IT',
                                          'Spain': 'ES',
                                          'Netherlands': 'NL',
                                          'Japan': 'JP',
                                          'China': 'CN',
                                          'South Korea': 'KR',
                                          'Singapore': 'SG',
                                          'Hong Kong': 'HK',
                                          'UAE': 'AE',
                                          'Saudi Arabia': 'SA',
                                          'Brazil': 'BR',
                                          'Mexico': 'MX',
                                          'Russia': 'RU',
                                          'South Africa': 'ZA',
                                          'Nigeria': 'NG',
                                          'Egypt': 'EG',
                                          'Thailand': 'TH',
                                          'Malaysia': 'MY',
                                          'Indonesia': 'ID',
                                          'Philippines': 'PH',
                                          'Vietnam': 'VN',
                                          'Turkey': 'TR',
                                          'Poland': 'PL',
                                          'Czech Republic': 'CZ',
                                          'Hungary': 'HU',
                                          'Romania': 'RO',
                                          'Bulgaria': 'BG',
                                          'Croatia': 'HR',
                                          'Sweden': 'SE',
                                          'Norway': 'NO',
                                          'Denmark': 'DK',
                                          'Finland': 'FI',
                                          'Switzerland': 'CH',
                                          'Austria': 'AT',
                                          'Belgium': 'BE',
                                          'Ireland': 'IE',
                                          'Portugal': 'PT',
                                          'Greece': 'GR',
                                          'Luxembourg': 'LU',
                                          'Malta': 'MT',
                                          'Cyprus': 'CY',
                                          'Slovakia': 'SK',
                                          'Slovenia': 'SI',
                                          'Estonia': 'EE',
                                          'Latvia': 'LV',
                                          'Lithuania': 'LT'
                                        };
                                        return countryMap[countryName] || 'IN'; // Default to India instead of US
                                      };
                                      
                                      const countryCode = getCountryCode(location.country);
                                      
                                      // Debug logging
                                      console.log('📍 Location selected:', {
                                        location: location.name,
                                        country: location.country,
                                        countryCode: countryCode
                                      });
                                      
                                      setFormData(prev => ({
                                        ...prev,
                                        location: location.name,
                                        city: location.city,
                                        state: location.state,
                                        country: countryCode
                                      }));
                                      setLocationSuggestions([]);
                                    }}
                                    className="w-full text-left p-3 hover:bg-blue-50 rounded-lg transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-slate-900 group-hover:text-blue-900">
                                          {location.name}
                                        </div>
                                        <div className="text-sm text-slate-600 group-hover:text-blue-700">
                                          {location.city}, {location.state}, {location.country}
                                        </div>
                                      </div>
                                      <div className="text-xs font-medium text-slate-500 bg-slate-100 group-hover:bg-blue-100 px-2 py-1 rounded-full">
                                        {location.jobCount} jobs
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
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

                    {formData.locationType === 'multiple' && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            Multiple Cities
                          </Label>
                          <div className="space-y-3">
                            {/* Add new location input */}
                            <div className="flex gap-2">
                              <Input
                                value={locationInput}
                                onChange={(e) => {
                                  setLocationInput(e.target.value);
                                  getLocationSuggestions(e.target.value);
                                  
                                  // Auto-detect country from typed location for multiple cities
                                  const detectedCountry = extractCountryFromLocation(e.target.value);
                                  if (detectedCountry !== formData.country) {
                                    setFormData(prev => ({
                                      ...prev,
                                      country: detectedCountry
                                    }));
                                  }
                                }}
                                placeholder="Search and add cities..."
                                className="flex-1 h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  if (locationInput.trim()) {
                                    const newLocation = locationInput.trim();
                                    if (!formData.multipleLocations.includes(newLocation)) {
                                      handleInputChange('multipleLocations', [...formData.multipleLocations, newLocation]);
                                      setLocationInput('');
                                      setLocationSuggestions([]);
                                    } else {
                                      toast.error('Location already added');
                                    }
                                  }
                                }}
                                disabled={!locationInput.trim()}
                                className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Location suggestions dropdown */}
                            {locationSuggestions.length > 0 && (
                              <div className="bg-white border border-slate-200 rounded-lg shadow-lg z-[9999]">
                                {locationSuggestions.map((location, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      const locationName = location.name;
                                      if (!formData.multipleLocations.includes(locationName)) {
                                        handleInputChange('multipleLocations', [...formData.multipleLocations, locationName]);
                                        setLocationInput('');
                                        setLocationSuggestions([]);
                                      } else {
                                        toast.error('Location already added');
                                      }
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
                            
                            {/* Display added locations */}
                            {formData.multipleLocations.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">
                                  Selected Cities ({formData.multipleLocations.length})
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {formData.multipleLocations.map((location, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="px-3 py-1 bg-blue-100 text-blue-800 border-blue-200"
                                    >
                                      {location}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedLocations = formData.multipleLocations.filter((_, i) => i !== index);
                                          handleInputChange('multipleLocations', updatedLocations);
                                        }}
                                        className="ml-2 hover:text-red-600"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Help text */}
                            <p className="text-sm text-slate-500">
                              Add multiple cities where you want to hire. Candidates from any of these locations can apply.
                            </p>
                          </div>
                        </div>
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
                            onChange={(e) => {
                              handleInputChange('radiusCenter', e.target.value);
                              
                              // Auto-detect country from typed location for radius search
                              const detectedCountry = extractCountryFromLocation(e.target.value);
                              if (detectedCountry !== formData.country) {
                                setFormData(prev => ({
                                  ...prev,
                                  country: detectedCountry
                                }));
                              }
                            }}
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
                          <span className="text-sm font-normal text-slate-500 ml-2">
                            ({currencyCode})
                          </span>
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium text-lg">
                            {currencySymbol}
                          </div>
                          <Input
                            value={formData.salary}
                            onChange={(e) => handleInputChange('salary', e.target.value)}
                            placeholder={`e.g., ${currencySymbol}50,000 - ${currencySymbol}70,000`}
                            className="h-12 pl-8 pr-4 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white text-slate-900 font-medium"
                          />
                        </div>
                        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Currency automatically set based on job location: {getCurrencyByCountry(formData.country).name}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Example: {currencySymbol}50,000 - {currencySymbol}70,000 per year</span>
                        </div>
                        {formData.location && (
                          <div className="mt-1 text-xs text-amber-600 flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                            <span>Location detected: {formData.location} → {getCurrencyByCountry(formData.country).name}</span>
                          </div>
                        )}
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
                  className="px-3 sm:px-4 py-3 sm:py-4 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl"
                  title="Clear all form data and start fresh"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    onClick={nextStep}
                    disabled={!validateStep(currentStep)}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || !validateStep(1) || !validateStep(2) || !validateStep(3)}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto min-h-[48px] touch-manipulation text-base font-semibold rounded-xl"
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

      {/* Guidance Modal */}
      <AnimatePresence>
        {showGuidance && (
          <GuidanceModal
            field={showGuidance}
            onClose={() => setShowGuidance(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
