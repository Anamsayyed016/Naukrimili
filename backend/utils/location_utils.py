"""
Location utilities for validating and normalizing job locations
"""

from typing import Dict, List, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)

# Supported countries with their details
SUPPORTED_COUNTRIES = {
    "IN": {
        "name": "India",
        "currency": "INR",
        "currency_symbol": "₹",
        "major_cities": [
            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", 
            "Chennai", "Kolkata", "Ahmedabad", "Gurgaon", "Noida"
        ],
        "coordinates": {"lat": 20.5937, "lng": 78.9629}
    },
    "US": {
        "name": "United States",
        "currency": "USD", 
        "currency_symbol": "$",
        "major_cities": [
            "New York", "San Francisco", "Los Angeles", "Chicago", 
            "Seattle", "Austin", "Boston", "Denver", "Atlanta", "Miami"
        ],
        "coordinates": {"lat": 39.8283, "lng": -98.5795}
    },
    "GB": {
        "name": "United Kingdom",
        "currency": "GBP",
        "currency_symbol": "£", 
        "major_cities": [
            "London", "Manchester", "Birmingham", "Edinburgh", 
            "Leeds", "Liverpool", "Bristol", "Cambridge", "Oxford", "Glasgow"
        ],
        "coordinates": {"lat": 55.3781, "lng": -3.4360}
    },
    "AE": {
        "name": "UAE",
        "currency": "AED",
        "currency_symbol": "AED ",
        "major_cities": [
            "Dubai", "Abu Dhabi", "Sharjah", "Ajman", 
            "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"
        ],
        "coordinates": {"lat": 23.4241, "lng": 53.8478}
    }
}

def get_supported_countries() -> Dict[str, Any]:
    """Get list of supported countries with details"""
    return SUPPORTED_COUNTRIES

def validate_location(
    location: Optional[str], 
    country: Optional[str] = None,
    user_lat: Optional[float] = None,
    user_lng: Optional[float] = None
) -> Dict[str, Any]:
    """
    🌍 Validate and normalize location input
    
    Returns:
    - normalized_location: Cleaned location string
    - country_code: Validated country code
    - is_supported: Whether the location is in supported countries
    - suggested_locations: List of suggested locations if invalid
    """
    
    result = {
        "normalized_location": location or "",
        "country_code": "IN",  # Default fallback
        "is_supported": True,
        "suggested_locations": [],
        "detected_from_coordinates": False
    }
    
    try:
        # 1. If coordinates provided, detect country from coordinates
        if user_lat is not None and user_lng is not None:
            detected_country = _detect_country_from_coordinates(user_lat, user_lng)
            if detected_country:
                result["country_code"] = detected_country
                result["detected_from_coordinates"] = True
                logger.info(f"🌍 Country detected from coordinates: {detected_country}")
        
        # 2. Validate provided country code
        if country and country.upper() in SUPPORTED_COUNTRIES:
            result["country_code"] = country.upper()
        elif country:
            logger.warning(f"⚠️ Unsupported country: {country}, falling back to India")
            result["country_code"] = "IN"
            result["is_supported"] = False
        
        # 3. Normalize location string
        if location:
            normalized = _normalize_location_string(location, result["country_code"])
            result["normalized_location"] = normalized["location"]
            
            # Override country if detected from location string
            if normalized["detected_country"]:
                result["country_code"] = normalized["detected_country"]
        
        # 4. Generate suggestions if location seems invalid
        if location and not _is_valid_location(location, result["country_code"]):
            suggestions = _get_location_suggestions(location, result["country_code"])
            result["suggested_locations"] = suggestions
        
        # 5. Final validation - ensure we have a supported country
        if result["country_code"] not in SUPPORTED_COUNTRIES:
            logger.warning(f"⚠️ Invalid country code: {result['country_code']}, using India")
            result["country_code"] = "IN"
            result["is_supported"] = False
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Location validation failed: {e}")
        # Return safe defaults
        return {
            "normalized_location": location or "",
            "country_code": "IN",
            "is_supported": False,
            "suggested_locations": ["Mumbai", "Delhi", "Bangalore"],
            "detected_from_coordinates": False
        }

def _detect_country_from_coordinates(lat: float, lng: float) -> Optional[str]:
    """Detect country from latitude/longitude coordinates"""
    try:
        # Simple bounding box detection for supported countries
        # More accurate reverse geocoding would require external API
        
        # India: roughly 6-37°N, 68-97°E
        if 6 <= lat <= 37 and 68 <= lng <= 97:
            return "IN"
        
        # USA: roughly 24-49°N, -125 to -66°W  
        elif 24 <= lat <= 49 and -125 <= lng <= -66:
            return "US"
        
        # UK: roughly 50-60°N, -8 to 2°E
        elif 50 <= lat <= 60 and -8 <= lng <= 2:
            return "GB"
        
        # UAE: roughly 22-26°N, 51-56°E
        elif 22 <= lat <= 26 and 51 <= lng <= 56:
            return "AE"
        
        return None
        
    except Exception as e:
        logger.error(f"Coordinate detection failed: {e}")
        return None

def _normalize_location_string(location: str, default_country: str) -> Dict[str, Any]:
    """Normalize and clean location string"""
    try:
        location_clean = location.strip().title()
        detected_country = None
        
        # City name mappings and country detection
        city_mappings = {
            # India
            "Mumbai": ("Mumbai, India", "IN"),
            "Bombay": ("Mumbai, India", "IN"),
            "Delhi": ("Delhi, India", "IN"),
            "New Delhi": ("Delhi, India", "IN"),
            "Bangalore": ("Bangalore, India", "IN"),
            "Bengaluru": ("Bangalore, India", "IN"),
            "Hyderabad": ("Hyderabad, India", "IN"),
            "Pune": ("Pune, India", "IN"),
            "Chennai": ("Chennai, India", "IN"),
            "Madras": ("Chennai, India", "IN"),
            "Kolkata": ("Kolkata, India", "IN"),
            "Calcutta": ("Kolkata, India", "IN"),
            
            # USA
            "New York": ("New York, NY", "US"),
            "NYC": ("New York, NY", "US"),
            "San Francisco": ("San Francisco, CA", "US"),
            "SF": ("San Francisco, CA", "US"),
            "Los Angeles": ("Los Angeles, CA", "US"),
            "LA": ("Los Angeles, CA", "US"),
            "Chicago": ("Chicago, IL", "US"),
            "Seattle": ("Seattle, WA", "US"),
            "Austin": ("Austin, TX", "US"),
            "Boston": ("Boston, MA", "US"),
            
            # UK
            "London": ("London, UK", "GB"),
            "Manchester": ("Manchester, UK", "GB"),
            "Birmingham": ("Birmingham, UK", "GB"),
            "Edinburgh": ("Edinburgh, UK", "GB"),
            "Leeds": ("Leeds, UK", "GB"),
            
            # UAE
            "Dubai": ("Dubai, UAE", "AE"),
            "Abu Dhabi": ("Abu Dhabi, UAE", "AE"),
            "Sharjah": ("Sharjah, UAE", "AE")
        }
        
        # Check for exact matches
        for city, (normalized, country) in city_mappings.items():
            if city.lower() in location_clean.lower():
                detected_country = country
                location_clean = normalized
                break
        
        # Handle "Remote" locations
        if any(remote_keyword in location_clean.lower() for remote_keyword in ["remote", "anywhere", "work from home", "wfh"]):
            country_names = {
                "IN": "Remote, India",
                "US": "Remote, USA", 
                "GB": "Remote, UK",
                "AE": "Remote, UAE"
            }
            location_clean = country_names.get(default_country, "Remote")
        
        return {
            "location": location_clean,
            "detected_country": detected_country
        }
        
    except Exception as e:
        logger.error(f"Location normalization failed: {e}")
        return {
            "location": location,
            "detected_country": None
        }

def _is_valid_location(location: str, country_code: str) -> bool:
    """Check if location is valid for the given country"""
    try:
        location_lower = location.lower()
        country_info = SUPPORTED_COUNTRIES.get(country_code, {})
        major_cities = [city.lower() for city in country_info.get("major_cities", [])]
        
        # Check if location contains any major city
        return any(city in location_lower for city in major_cities) or "remote" in location_lower
        
    except Exception as e:
        logger.error(f"Location validation failed: {e}")
        return False

def _get_location_suggestions(location: str, country_code: str) -> List[str]:
    """Get location suggestions for invalid locations"""
    try:
        country_info = SUPPORTED_COUNTRIES.get(country_code, {})
        major_cities = country_info.get("major_cities", [])
        
        # Add remote option
        suggestions = ["Remote"] + major_cities[:5]  # Top 5 cities + remote
        
        # If user typed something, try to find similar cities
        if location:
            location_lower = location.lower()
            similar_cities = []
            
            for city in major_cities:
                if (any(char in city.lower() for char in location_lower) or 
                    any(char in location_lower for char in city.lower())):
                    similar_cities.append(city)
            
            if similar_cities:
                suggestions = similar_cities[:3] + ["Remote"]
        
        return suggestions[:5]  # Limit to 5 suggestions
        
    except Exception as e:
        logger.error(f"Location suggestions failed: {e}")
        return ["Mumbai", "Delhi", "Bangalore", "Remote"]

def get_popular_locations_by_country() -> Dict[str, List[str]]:
    """Get popular job locations organized by country"""
    result = {}
    
    for country_code, country_info in SUPPORTED_COUNTRIES.items():
        locations = country_info["major_cities"][:8]  # Top 8 cities
        locations.append(f"Remote, {country_info['name']}")  # Add remote option
        result[country_code] = locations
    
    return result

def calculate_distance_between_coordinates(
    lat1: float, lng1: float, 
    lat2: float, lng2: float
) -> float:
    """Calculate distance between two coordinates in kilometers"""
    try:
        import math
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lng1_rad = math.radians(lng1)
        lat2_rad = math.radians(lat2)
        lng2_rad = math.radians(lng2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2)
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth radius in kilometers
        earth_radius = 6371
        distance = earth_radius * c
        
        return distance
        
    except Exception as e:
        logger.error(f"Distance calculation failed: {e}")
        return float('inf')

def is_location_in_supported_region(
    user_lat: Optional[float], 
    user_lng: Optional[float]
) -> Tuple[bool, Optional[str]]:
    """Check if user coordinates are in supported regions"""
    if user_lat is None or user_lng is None:
        return False, None
    
    detected_country = _detect_country_from_coordinates(user_lat, user_lng)
    return detected_country is not None, detected_country
