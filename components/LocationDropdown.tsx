"use client";
import React, { useEffect, useState, useRef } from "react";

interface City {
  city: string;
  jobCount: number;
  isTrending?: boolean;
}

interface LocationDropdownProps {
  onLocationChange?: (city: string) => void;
  currentLocation?: string;
}

const LocationDropdown: React.FC<LocationDropdownProps> = ({ onLocationChange, currentLocation }) => {
  const [cities, setCities] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(currentLocation || "Delhi");
  const [floating, setFloating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCities = async () => {
      setLoading(true);
      try {
        console.log('Fetching locations from API...');
        const response = await fetch("/api/locations");
        if (!response.ok) {
          throw new Error('Failed to fetch locations');
        }
        const data = await response.json();
        console.log('Locations fetched successfully:', data.length, 'cities');
        console.log('Cities include Bhopal:', data.some((city: City) => city.city === "Bhopal"));
        setCities(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
        // Fallback to default cities if API fails
        const fallbackCities = [
          { city: "Mumbai", jobCount: 15420, isTrending: true },
          { city: "Delhi", jobCount: 12850, isTrending: true },
          { city: "Bangalore", jobCount: 11230, isTrending: true },
          { city: "Hyderabad", jobCount: 8950, isTrending: true },
          { city: "Chennai", jobCount: 7230 },
          { city: "Pune", jobCount: 6540 },
          { city: "Bhopal", jobCount: 1430 },
        ];
        console.log('Using fallback cities:', fallbackCities);
        setCities(fallbackCities);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCities();
    setSelected(currentLocation || "Delhi");
  }, [currentLocation]);

  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (city: string) => {
    setSelected(city);
    setOpen(false);
    onLocationChange?.(city);
  };

  const handleCurrentLocation = () => {
    setDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          // In real app, reverse geocode here
          // For now, we'll use a mock location based on coordinates
          const { latitude, longitude } = pos.coords;
          
          // Simple reverse geocoding logic (in real app, use Google Maps API)
          let detectedCity = "Your Location";
          
          // Mock reverse geocoding based on coordinates
          if (latitude > 20 && latitude < 30 && longitude > 70 && longitude < 90) {
            // India coordinates - could be Mumbai, Delhi, etc.
            detectedCity = "Mumbai";
          } else if (latitude > 25 && latitude < 30 && longitude > 75 && longitude < 85) {
            detectedCity = "Delhi";
          } else if (latitude > 12 && latitude < 14 && longitude > 77 && longitude < 78) {
            detectedCity = "Bangalore";
          } else if (latitude > 17 && latitude < 18 && longitude > 78 && longitude < 79) {
            detectedCity = "Hyderabad";
          } else if (latitude > 23 && latitude < 24 && longitude > 77 && longitude < 78) {
            detectedCity = "Bhopal";
          }
          
          setSelected(detectedCity);
          setOpen(false);
          onLocationChange?.(detectedCity);
          setDetectingLocation(false);
        },
        () => {
          alert("Unable to access location. Please select manually.");
          setDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      alert("Geolocation not supported by your browser");
      setDetectingLocation(false);
    }
  };

  const filtered = cities.filter(c => c.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div
        className={`relative ml-4 ${floating ? "fixed top-4 right-4 z-50 bg-white shadow-lg rounded-full px-4 py-2 border border-blue-200" : ""}`}
        ref={dropdownRef}
      >
        <button
          className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-white text-blue-700 font-medium hover:bg-blue-50 focus:outline-none focus-visible:ring-2 ring-blue-300"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Your Location: ${selected}`}
          onClick={() => setOpen(o => !o)}
          disabled={loading}
        >
          <span role="img" aria-label="Location">📍</span> 
          {loading ? (
            <span className="text-sm">Loading...</span>
          ) : (
            selected
          )}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-50" role="listbox">
            {/* Current Location Button */}
            <div className="p-3 border-b border-gray-100">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCurrentLocation}
                disabled={detectingLocation}
                aria-label="Use Current Location"
              >
                <span role="img" aria-label="GPS">📍</span>
                <span>
                  {detectingLocation ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">⏳</span>
                      Detecting...
                    </span>
                  ) : (
                    "📍 Use Current Location"
                  )}
                </span>
              </button>
            </div>
            
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Search cities..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search city"
                autoFocus
              />
            </div>
            
            {/* Popular Cities Quick Access */}
            {!search && (
              <div className="p-2 border-b border-gray-100">
                <div className="text-xs text-gray-500 mb-2 font-medium">Popular Cities:</div>
                <div className="flex flex-wrap gap-1">
                  {["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Bhopal"].map(city => (
                    <button
                      key={city}
                      onClick={() => handleSelect(city)}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 rounded-full text-gray-700 hover:text-blue-700 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cities List */}
            <ul className="max-h-60 overflow-y-auto" tabIndex={-1}>
              {filtered.length > 0 ? (
                filtered.map(city => (
                  <li
                    key={city.city}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-blue-50 ${selected === city.city ? "bg-blue-100" : ""} ${city.city === "Bhopal" ? "border-l-4 border-green-500" : ""}`}
                    onClick={() => handleSelect(city.city)}
                    aria-label={`${city.city}, ${city.jobCount} jobs${city.isTrending ? ', trending' : ''}`}
                    tabIndex={0}
                  >
                    <span className="flex items-center gap-2">
                      <span role="img" aria-label="Pin">📍</span> 
                      <span className="font-medium">
                        {city.city}
                        {city.city === "Bhopal" && <span className="ml-1 text-green-600 text-xs">(MP)</span>}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500">
                      {city.jobCount.toLocaleString()} Jobs
                      {city.isTrending && <span className="ml-1 text-teal-600">🔥</span>}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-gray-400 text-center">No cities found</li>
              )}
            </ul>
            
            {/* Show total count */}
            {filtered.length > 0 && (
              <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-100">
                {filtered.length} of {cities.length} cities
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default LocationDropdown; 