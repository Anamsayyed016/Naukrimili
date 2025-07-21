"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { AdzunaJob } from "../types/adzuna";
import { AdzunaService } from "../lib/adzuna-service";
import SalaryRangeSelector, { SalaryRange } from "./salary/SalaryRangeSelector";
import { sampleIndianJobs } from "../lib/sample-indian-jobs";
import { 
  ChevronRightIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyRupeeIcon, 
  BuildingOffice2Icon as BuildingOfficeIcon, 
  UserGroupIcon, 
  ClockIcon, 
  FireIcon, 
  ChartBarIcon, 
  StarIcon,
  ChevronDownIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

// Indian States
const indianStates = [
  { code: 'MH', name: 'Maharashtra' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'DL', name: 'Delhi' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'TG', name: 'Telangana' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'HR', name: 'Haryana' },
  { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' }
];

// Popular Indian Cities with state mapping
const popularCities = [
  { name: "Mumbai", state: 'MH', areas: ['Andheri', 'Bandra', 'Powai', 'Lower Parel', 'Goregaon'] },
  { name: "Delhi", state: 'DL', areas: ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Rohini'] },
  { name: "Bangalore", state: 'KA', areas: ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'HSR Layout'] },
  { name: "Hyderabad", state: 'TG', areas: ['Hitech City', 'Gachibowli', 'Madhapur', 'Banjara Hills', 'Jubilee Hills'] },
  { name: "Pune", state: 'MH', areas: ['Hinjewadi', 'Koregaon Park', 'Viman Nagar', 'Wakad', 'Baner'] },
  { name: "Chennai", state: 'TN', areas: ['OMR', 'T. Nagar', 'Anna Nagar', 'Velachery', 'Adyar'] },
  { name: "Kolkata", state: 'WB', areas: ['Salt Lake', 'Park Street', 'Ballygunge', 'New Town', 'Rajarhat'] },
  { name: "Ahmedabad", state: 'GJ', areas: ['Satellite', 'Vastrapur', 'Bopal', 'Prahlad Nagar', 'Thaltej'] },
  { name: "Gurgaon", state: 'HR', areas: ['Cyber City', 'Golf Course Road', 'Sohna Road', 'MG Road', 'Sector 29'] },
  { name: "Noida", state: 'UP', areas: ['Sector 62', 'Sector 18', 'Greater Noida', 'Sector 16', 'Film City'] },
  { name: "Kochi", state: 'KL', areas: ['Infopark', 'Marine Drive', 'Kakkanad', 'Edappally', 'Fort Kochi'] },
  { name: "Indore", state: 'MP', areas: ['Vijay Nagar', 'Palasia', 'Rajwada', 'Sapna Sangeeta', 'Bhawar Kuan'] },
  { name: "Bhopal", state: 'MP', areas: ['New Market', 'MP Nagar', 'Arera Colony', 'Berasia Road', 'Kolar Road'] }
];

// Popular Job Categories in India
const indianJobCategories = [
  { id: "it-jobs", name: "IT & Software", icon: "💻", trending: true },
  { id: "banking-financial-services-jobs", name: "Banking & Finance", icon: "💰", hot: true },
  { id: "teaching-jobs", name: "Teaching & Education", icon: "📚", trending: false },
  { id: "healthcare-nursing-jobs", name: "Healthcare & Medical", icon: "🏥", hot: true },
  { id: "sales-jobs", name: "Sales & Marketing", icon: "📈", trending: true },
  { id: "engineering-jobs", name: "Engineering", icon: "⚙️", hot: false },
  { id: "hr-jobs", name: "Human Resources", icon: "👥", trending: false },
  { id: "customer-services-jobs", name: "Customer Service", icon: "📞", hot: false },
];

// Experience Levels
const experienceLevels = [
  { value: "", label: "Any Experience" },
  { value: "0-1", label: "Fresher (0-1 years)" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5-8", label: "5-8 years" },
  { value: "8+", label: "8+ years" }
];

// Company Types
const companyTypes = [
  { value: "", label: "All Companies" },
  { value: "startup", label: "Startups" },
  { value: "mnc", label: "MNC" },
  { value: "corporate", label: "Corporate" },
  { value: "government", label: "Government" },
  { value: "ngo", label: "NGO" }
];

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location?: string;
    salaryFormatted?: string;
    timeAgo?: string;
    description?: string;
    redirect_url: string;
    isUrgent?: boolean;
    isRemote?: boolean;
    jobType?: string;
  };
  bookmarked: boolean;
  onBookmark: (id: string) => void;
}

const JobCard = ({ job, bookmarked, onBookmark }: JobCardProps) => (
  <div className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden">
    {/* Job Card Header */}
    <div className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {job.isUrgent && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full mb-2">
              <FireIcon className="w-3 h-3" />
              Urgent Hiring
            </span>
          )}
          {job.isRemote && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full mb-2 ml-2">
              🏠 Remote
            </span>
          )}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center text-gray-600 dark:text-gray-300 mb-2">
            <BuildingOfficeIcon className="w-4 h-4 mr-2" />
            <span className="font-medium">{job.company}</span>
          </div>
          {job.location && (
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-3">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <span>{job.location}</span>
              {job.jobType && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {job.jobType}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => onBookmark(job.id)}
          className={`p-2 rounded-full transition-colors ${
            bookmarked 
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700'
          }`}
          title={bookmarked ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {job.salaryFormatted && (
        <div className="flex items-center text-green-600 dark:text-green-400 font-semibold mb-3">
          <CurrencyRupeeIcon className="w-5 h-5 mr-1" />
          <span className="text-lg">{job.salaryFormatted}</span>
        </div>
      )}

      {job.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        {job.timeAgo && (
          <div className="flex items-center text-gray-400 text-sm">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>Posted {job.timeAgo}</span>
          </div>
        )}
      </div>
    </div>

    {/* Job Card Footer */}
    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex gap-3">
      <button 
        onClick={() => window.open(job.redirect_url, '_blank')}
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        Apply Now
        <ChevronRightIcon className="w-4 h-4" />
      </button>
      <button 
        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        onClick={() => {
          // Quick apply functionality
          alert('Quick Apply feature - Save your profile to apply instantly!');
        }}
      >
        Quick Apply
      </button>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3"></div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);

const TrendingJobsSection = () => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-6">
      <ChartBarIcon className="w-6 h-6 text-orange-500" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Jobs in India</h2>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {indianJobCategories.map((category) => (
        <div
          key={category.id}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 ${
            category.trending 
              ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/20 dark:to-red-900/20' 
              : category.hot
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
          }`}
        >
          {category.trending && (
            <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              🔥 Trending
            </span>
          )}
          {category.hot && !category.trending && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              ⭐ Hot
            </span>
          )}
          <div className="text-center">
            <div className="text-3xl mb-2">{category.icon}</div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {category.name}
            </h3>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const QuickFiltersSection = ({ onCitySelect, onCategorySelect }: { 
  onCitySelect: (city: string) => void;
  onCategorySelect: (category: string) => void;
}) => (
  <div className="mb-8 space-y-6">
        {/* Popular Cities */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🏙️ Popular Cities
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularCities.map((city) => (
              <button
                key={city.name}
                onClick={() => onCitySelect(city.name)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
  </div>
);

// Location interface
interface LocationFilter {
  country: string;
  state: string;
  city: string;
  area: string;
}

interface IndianJobPortalProps {
  initialQuery?: string;
  initialLocation?: string;
}

// Location interface for current location
interface CurrentLocationState {
  isLoading: boolean;
  coordinates?: { lat: number; lng: number };
  city?: string;
  state?: string;
  error?: string;
}

export default function IndianJobPortal({ initialQuery = "developer", initialLocation = "London" }: IndianJobPortalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({
    country: 'India',
    state: '',
    city: '',
    area: ''
  });
  const [currentLocation, setCurrentLocation] = useState<CurrentLocationState>({
    isLoading: false
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance");
  const [salaryRange, setSalaryRange] = useState<SalaryRange>({
    min: 300000,    // ₹3 LPA
    max: 2000000,   // ₹20 LPA
    currency: "INR",
    period: "year"
  });
  const [showSalaryFilter, setShowSalaryFilter] = useState(false);
  const [showAdvancedLocation, setShowAdvancedLocation] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('bookmarkedJobs') || '[]');
    }
    return [];
  });
  const [categories, setCategories] = useState<Array<{id: string, label: string}>>([]);
  const [availableCities, setAvailableCities] = useState<typeof popularCities>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [googleUrl, setGoogleUrl] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bookmarkedJobs', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get('/api/jobs/categories');
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Update available cities when state changes
  useEffect(() => {
    if (locationFilter.state) {
      const citiesInState = popularCities.filter(city => city.state === locationFilter.state);
      setAvailableCities(citiesInState);
      // Clear city and area if they don't exist in the new state
      if (!citiesInState.find(city => city.name === locationFilter.city)) {
        setLocationFilter(prev => ({ ...prev, city: '', area: '' }));
      }
    } else {
      setAvailableCities(popularCities);
    }
  }, [locationFilter.state]);

  // Update available areas when city changes
  useEffect(() => {
    if (locationFilter.city) {
      const selectedCity = popularCities.find(city => city.name === locationFilter.city);
      if (selectedCity) {
        setAvailableAreas(selectedCity.areas);
        // Clear area if it doesn't exist in the new city
        if (!selectedCity.areas.includes(locationFilter.area)) {
          setLocationFilter(prev => ({ ...prev, area: '' }));
        }
      }
    } else {
      setAvailableAreas([]);
    }
  }, [locationFilter.city]);

  const fetchJobs = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    
    // Build location string from advanced filters or fallback to simple location
    let locationString = location;
    if (showAdvancedLocation && (locationFilter.city || locationFilter.state)) {
      const locationParts = [];
      if (locationFilter.area) locationParts.push(locationFilter.area);
      if (locationFilter.city) locationParts.push(locationFilter.city);
      if (locationFilter.state) {
        const state = indianStates.find(s => s.code === locationFilter.state);
        if (state) locationParts.push(state.name);
      }
      if (locationFilter.country) locationParts.push(locationFilter.country);
      locationString = locationParts.join(', ');
    }
    
    if (locationString) params.append('location', locationString);
    
    // Map job types to SerpApi format
    if (jobType === 'Full-time') params.append('job_type', 'full_time');
    if (jobType === 'Part-time') params.append('job_type', 'part_time');
    if (jobType === 'Contract') params.append('job_type', 'contract');
    if (jobType === 'Internship') params.append('job_type', 'internship');
    
    // Add date filter based on sort
    if (sortBy === 'date') {
      params.append('date_posted', 'week'); // Get jobs from last week for freshness
    }
    
    params.append('num', '20');

    try {
      console.log('🔍 Fetching jobs with unified API:', params.toString());
      
      // Use the unified job API that aggregates multiple sources
      const { data } = await axios.get(`/api/jobs?${params.toString()}`);
      
      if (data.error) {
        console.warn('Unified API error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('✅ Unified API returned', data.jobs?.length || 0, 'live jobs');
      
      // Attach googleUrl if present
      if (data.googleUrl) {
        (data.jobs || []).googleUrl = data.googleUrl;
      }
      return (data.jobs || []).map((job: any, index: number) => ({
        id: job.id,
        title: job.title,
        company: job.company,
        redirect_url: job.redirect_url,
        location: job.location,
        description: job.description,
        salaryFormatted: job.salaryFormatted,
        timeAgo: job.timeAgo || 'Recently posted',
        isUrgent: job.isUrgent || false,
        isRemote: job.isRemote || false,
        jobType: job.jobType || 'Full-time',
        googleUrl: data.googleUrl || undefined,
      }));
      
    } catch (error) {
      console.error('❌ Error fetching live jobs:', error);
      throw error; // Re-throw to be handled by React Query
    }
  };

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: [
      "indianJobs", 
      searchQuery, 
      location, 
      showAdvancedLocation ? locationFilter : null,
      jobType, 
      selectedCategory, 
      experienceLevel, 
      companyType, 
      sortBy, 
      showSalaryFilter ? salaryRange : null
    ],
    queryFn: fetchJobs,
    enabled: !!(searchQuery || location || (showAdvancedLocation && (locationFilter.city || locationFilter.state)) || jobType || selectedCategory),
  });

  // Add state for googleUrl
  useEffect(() => {
    if (jobs.length === 0 && !isLoading && !error) {
      // Try to get googleUrl from the last fetch
      fetchJobs().then((result) => {
        if (result && result[0] && result[0].googleUrl) {
          setGoogleUrl(result[0].googleUrl);
        } else {
          setGoogleUrl(null);
        }
      });
    } else {
      setGoogleUrl(null);
    }
  }, [jobs, isLoading, error]);

  // Show sample jobs by default to demonstrate the portal
  const displayJobs = jobs.length > 0 ? jobs : (searchQuery || location || jobType || selectedCategory) ? [] : sampleIndianJobs.slice(0, 6).map((job, index) => ({
    id: job.id,
    title: job.title,
    company: job.company.display_name,
    redirect_url: job.redirect_url,
    location: job.location.display_name,
    description: job.description,
    salaryFormatted: `₹${(job.salary_min / 100000).toFixed(1)}L - ₹${(job.salary_max / 100000).toFixed(1)}L`,
    timeAgo: AdzunaService.getRelativeTime(job.created),
    isUrgent: job.isUrgent || false,
    isRemote: job.isRemote || false,
    jobType: job.contract_type
  }));

  const handleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) 
        ? prev.filter(jobId => jobId !== id)
        : [...prev, id]
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleQuickCitySelect = (cityName: string) => {
    if (showAdvancedLocation) {
      const city = popularCities.find(c => c.name === cityName);
      if (city) {
        setLocationFilter(prev => ({
          ...prev,
          city: cityName,
          state: city.state,
          area: ''
        }));
      }
    } else {
      setLocation(cityName);
    }
  };

  const handleQuickCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Geolocation functions
  const getCurrentLocation = () => {
    setGettingLocation(true);
    setCurrentLocation({ isLoading: true });
    
    if (!navigator.geolocation) {
      setCurrentLocation({
        isLoading: false,
        error: 'Geolocation is not supported by this browser.'
      });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get location timed out.';
            break;
        }
        setCurrentLocation({
          isLoading: false,
          error: errorMessage
        });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Reverse geocode coordinates to city/state
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Use a simple mapping approach based on approximate coordinates
      const detectedLocation = findNearestCity(lat, lng);
      
      if (detectedLocation) {
        setCurrentLocation({
          isLoading: false,
          coordinates: { lat, lng },
          city: detectedLocation.city,
          state: detectedLocation.state
        });
        
        // Update location filters
        if (showAdvancedLocation) {
          setLocationFilter(prev => ({
            ...prev,
            city: detectedLocation.city,
            state: detectedLocation.stateCode,
            area: ''
          }));
        } else {
          setLocation(detectedLocation.city);
        }
        
        setUseCurrentLocation(true);
        setGettingLocation(false);
      } else {
        // Fallback - try to use a geocoding service or set a default
        setCurrentLocation({
          isLoading: false,
          coordinates: { lat, lng },
          city: 'Mumbai', // Default fallback
          state: 'Maharashtra'
        });
        setLocation('Mumbai');
        setUseCurrentLocation(true);
        setGettingLocation(false);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setCurrentLocation({
        isLoading: false,
        coordinates: { lat, lng },
        error: 'Unable to determine city from location.',
        city: 'Mumbai', // Fallback
        state: 'Maharashtra'
      });
      setLocation('Mumbai');
      setGettingLocation(false);
    }
  };

  // Find nearest city based on coordinates (simplified approach)
  const findNearestCity = (lat: number, lng: number) => {
    const cityCoordinates = [
      { city: 'Mumbai', state: 'Maharashtra', stateCode: 'MH', lat: 19.0760, lng: 72.8777 },
      { city: 'Delhi', state: 'Delhi', stateCode: 'DL', lat: 28.7041, lng: 77.1025 },
      { city: 'Bangalore', state: 'Karnataka', stateCode: 'KA', lat: 12.9716, lng: 77.5946 },
      { city: 'Hyderabad', state: 'Telangana', stateCode: 'TG', lat: 17.3850, lng: 78.4867 },
      { city: 'Pune', state: 'Maharashtra', stateCode: 'MH', lat: 18.5204, lng: 73.8567 },
      { city: 'Chennai', state: 'Tamil Nadu', stateCode: 'TN', lat: 13.0827, lng: 80.2707 },
      { city: 'Kolkata', state: 'West Bengal', stateCode: 'WB', lat: 22.5726, lng: 88.3639 },
      { city: 'Ahmedabad', state: 'Gujarat', stateCode: 'GJ', lat: 23.0225, lng: 72.5714 },
      { city: 'Gurgaon', state: 'Haryana', stateCode: 'HR', lat: 28.4595, lng: 77.0266 },
      { city: 'Noida', state: 'Uttar Pradesh', stateCode: 'UP', lat: 28.5355, lng: 77.3910 },
      { city: 'Kochi', state: 'Kerala', stateCode: 'KL', lat: 9.9312, lng: 76.2673 },
      { city: 'Indore', state: 'Madhya Pradesh', stateCode: 'MP', lat: 22.7196, lng: 75.8577 },
      { city: 'Bhopal', state: 'Madhya Pradesh', stateCode: 'MP', lat: 23.2599, lng: 77.4126 }
    ];

    let nearestCity = null;
    let minDistance = Infinity;

    for (const city of cityCoordinates) {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }

    // Return city if within reasonable distance (approximately 100km)
    return minDistance < 1.0 ? nearestCity : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent mb-4">
            🇮🇳 India's Premier Job Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Find your dream job with top companies across India
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            💼 {jobs.length}+ Active Jobs • 🏢 1000+ Companies • 🌟 Trusted by Millions
          </p>
        </div>

        {/* Trending Jobs Section */}
        <TrendingJobsSection />

        {/* Quick Filters */}
        <QuickFiltersSection 
          onCitySelect={handleQuickCitySelect}
          onCategorySelect={handleQuickCategorySelect}
        />

        {/* Advanced Search Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            🔍 Advanced Job Search
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Primary Search Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Title / Keywords
                </label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Data Analyst, Marketing Manager"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Use current location"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {gettingLocation ? 'Locating...' : 'Nearby'}
                </button>
                {currentLocation.city && (
                  <span className="text-xs text-gray-500 bg-green-50 px-2 py-1 rounded-full">
                    📍 {currentLocation.city}
                  </span>
                )}
                    <button
                      type="button"
                      onClick={() => setShowAdvancedLocation(!showAdvancedLocation)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <GlobeAltIcon className="w-3 h-3" />
                      {showAdvancedLocation ? 'Simple' : 'Advanced'}
                    </button>
                  </div>
                </div>
                {!showAdvancedLocation ? (
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Bangalore, Delhi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={locationFilter.state}
                        onChange={(e) => setLocationFilter(prev => ({ ...prev, state: e.target.value, city: '', area: '' }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                      >
                        <option value="">All States</option>
                        {indianStates.map((state) => (
                          <option key={state.code} value={state.code}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        value={locationFilter.city}
                        onChange={(e) => setLocationFilter(prev => ({ ...prev, city: e.target.value, area: '' }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                        disabled={!locationFilter.state}
                      >
                        <option value="">All Cities</option>
                        {availableCities.map((city) => (
                          <option key={city.name} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    {locationFilter.city && availableAreas.length > 0 && (
                      <div className="col-span-2">
                        <select
                          value={locationFilter.area}
                          onChange={(e) => setLocationFilter(prev => ({ ...prev, area: e.target.value }))}
                          className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                        >
                          <option value="">All Areas in {locationFilter.city}</option>
                          {availableAreas.map((area) => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Secondary Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Type
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                >
                  <option value="">All Job Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Experience
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                >
                  {experienceLevels.map((level) => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Type
                </label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                >
                  {companyTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "relevance" | "date" | "salary")}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="date">Latest First</option>
                  <option value="salary">Highest Salary</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSalaryFilter(!showSalaryFilter)}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                <CurrencyRupeeIcon className="w-5 h-5" />
                {showSalaryFilter ? "Hide" : "Show"} Salary Filter
              </button>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setLocation("Mumbai");
                    setLocationFilter({
                      country: 'India',
                      state: '',
                      city: '',
                      area: ''
                    });
                    setJobType("");
                    setSelectedCategory("");
                    setExperienceLevel("");
                    setCompanyType("");
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Search Jobs
                </button>
              </div>
            </div>
          </form>

          {/* Salary Filter */}
          {showSalaryFilter && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💰 Salary Range (Indian Rupees)
              </h3>
              <SalaryRangeSelector
                countryCode="IN"
                value={salaryRange}
                onChange={setSalaryRange}
              />
            </div>
          )}
        </div>

        {/* Job Results */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl">
              <h3 className="font-semibold mb-2">❌ Error Loading Jobs</h3>
              <p>Unable to fetch jobs. Please check your internet connection and try again.</p>
            </div>
          )}
          
          {!isLoading && !error && displayJobs.length === 0 && (searchQuery || location || jobType || selectedCategory) && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Jobs Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search criteria or explore trending jobs above
              </p>
              {googleUrl && (
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-lg shadow-lg"
                >
                  🔗 Search on Google Jobs
                </a>
              )}
              <button
                onClick={() => {
                  setSearchQuery("software engineer");
                  setLocation("Mumbai");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-4 ml-4"
              >
                Try Popular Search
              </button>
            </div>
          )}

          {!searchQuery && !location && !jobType && !selectedCategory && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💼</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Start Your Job Search
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter keywords, select location, or click on trending categories above
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setSearchQuery("software engineer");
                    setLocation("Bangalore");
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  🖥️ Tech Jobs
                </button>
                <button
                  onClick={() => {
                    setSearchQuery("marketing manager");
                    setLocation("Mumbai");
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  📈 Marketing Jobs
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <>
              {displayJobs.length > 0 && (
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🎯 {jobs.length > 0 ? `Found ${jobs.length}` : `Featured ${displayJobs.length}`} Jobs
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {jobs.length > 0 ? 'Search results' : 'Sample jobs to get you started'}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayJobs.map((job: any) => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    bookmarked={bookmarks.includes(job.id)} 
                    onBookmark={handleBookmark} 
                  />
                ))}
              </div>
            </>
          )}

          {displayJobs.length > 0 && (
            <div className="text-center mt-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {jobs.length > 0 ? '🎉 That\'s all for now!' : '🚀 Ready to find your dream job?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {jobs.length > 0 
                  ? `Showing ${jobs.length} jobs. Try different keywords for more opportunities.`
                  : `These are sample jobs from top Indian companies. Use the search above to find real opportunities!`
                }
              </p>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {jobs.length > 0 ? '⬆️ Search Again' : '🔍 Start Job Search'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
