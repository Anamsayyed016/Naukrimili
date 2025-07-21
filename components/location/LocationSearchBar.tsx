import React, { useState, useRef } from "react";

// Location state interface
export interface Location {
  area?: string;
  city: string;
  country: string;
  coordinates?: [number, number];
  isRemote?: boolean;
}

interface LocationSearchBarProps {
  value: Location[];
  onChange: (locations: Location[]) => void;
}

const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with env var in production

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({ value, onChange }) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<Location | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch suggestions from Google Places API
  const fetchSuggestions = async (query: string) => {
    setLoading(true);
    setShowDropdown(true);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      setSuggestions(data.predictions || []);
    } catch (e) {
      setSuggestions([]);
    }
    setLoading(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 1) fetchSuggestions(val);
    else setSuggestions([]);
  };

  // Handle suggestion select
  const handleSuggestionSelect = async (suggestion: any) => {
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
    // Fetch place details for city/country
    const placeId = suggestion.place_id;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_API_KEY}`
    );
    const data = await res.json();
    const details = data.result;
    const city = details.address_components?.find((c: any) => c.types.includes("locality"))?.long_name || details.name;
    const country = details.address_components?.find((c: any) => c.types.includes("country"))?.long_name;
    const coordinates: [number, number] = [details.geometry.location.lat, details.geometry.location.lng];
    const newLoc: Location = { city, country, coordinates };
    setSelectedCity(newLoc);
    onChange([...value, newLoc]);
  };

  // Remove a location
  const handleRemove = (idx: number) => {
    const newArr = value.slice();
    newArr.splice(idx, 1);
    onChange(newArr);
  };

  // Toggle remote
  const handleRemoteToggle = () => {
    if (value.some(loc => loc.isRemote)) {
      onChange(value.filter(loc => !loc.isRemote));
    } else {
      onChange([...value, { city: "Remote", country: "", isRemote: true }]);
    }
  };

  return (
    <div style={{ position: "relative", maxWidth: 600, margin: "0 auto 32px" }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "center",
        marginBottom: 8
      }}>
        {value.map((loc, idx) => (
          <span key={idx} style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#f3f4f6",
            borderRadius: 20,
            padding: "6px 14px",
            fontSize: 15,
            fontWeight: 500,
            color: loc.isRemote ? "#2563eb" : "#1f2937",
            border: loc.isRemote ? "1.5px solid #2563eb" : "none",
            cursor: "pointer"
          }}>
            {loc.isRemote ? <span>🌍 Remote</span> : (
              <>
                {loc.area && <span style={{ color: "#6b7280", fontWeight: 400 }}>{loc.area}, </span>}
                <span style={{ fontWeight: 600 }}>{loc.city}</span>
                {loc.country && <span style={{ marginLeft: 4, color: "#6b7280" }}>, {loc.country}</span>}
              </>
            )}
            <button onClick={() => handleRemove(idx)} style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              marginLeft: 8,
              fontSize: 18,
              cursor: "pointer"
            }}>×</button>
          </span>
        ))}
        <button onClick={handleRemoteToggle} style={{
          background: value.some(loc => loc.isRemote) ? "#2563eb" : "#f3f4f6",
          color: value.some(loc => loc.isRemote) ? "white" : "#2563eb",
          border: value.some(loc => loc.isRemote) ? "none" : "1.5px solid #2563eb",
          borderRadius: 20,
          padding: "6px 14px",
          fontWeight: 500,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          cursor: "pointer"
        }}>
          🌍 Include Remote
        </button>
      </div>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder="City or Postal Code"
          style={{
            width: "100%",
            padding: "14px 18px",
            borderRadius: 16,
            border: "1.5px solid #d1d5db",
            fontSize: 16,
            fontFamily: "Sora, Inter, sans-serif",
            fontWeight: 600,
            outline: "none",
            boxShadow: "0 2px 8px #0001",
            background: "rgba(255,255,255,0.7)",
            transition: "box-shadow 0.2s"
          }}
        />
        {loading && <div style={{ position: "absolute", left: 20, top: 16 }}><span className="skeleton-pulse" style={{ width: 20, height: 20, borderRadius: "50%", background: "#e5e7eb", display: "inline-block" }}></span></div>}
        {showDropdown && suggestions.length > 0 && (
          <div style={{
            position: "absolute",
            top: 48,
            left: 0,
            width: "100%",
            background: "white",
            borderRadius: 12,
            boxShadow: "0 4px 16px #0002",
            zIndex: 10,
            maxHeight: 260,
            overflowY: "auto"
          }}>
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => handleSuggestionSelect(s)} style={{
                padding: "12px 18px",
                cursor: "pointer",
                fontSize: 16,
                borderBottom: i !== suggestions.length - 1 ? "1px solid #f3f4f6" : "none",
                color: "#1f2937"
              }}>
                {s.description}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearchBar; 