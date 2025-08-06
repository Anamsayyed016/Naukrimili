"""
Google fallback utility for generating search URLs
"""

import urllib.parse
from typing import Optional

def generate_google_search_url(
    title: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    sector: Optional[str] = None
) -> str:
    """
    🔍 Generate Google Jobs search URL with user parameters
    
    Examples:
    - "React Developer jobs in Mumbai India"
    - "Senior Product Manager remote jobs"
    - "Data Science entry level jobs in San Francisco"
    """
    
    # Build search query components
    query_parts = []
    
    # Add job title/keywords
    if title:
        query_parts.append(title.strip())
    else:
        query_parts.append("jobs")
    
    # Add experience level
    if experience_level and experience_level != "any":
        if experience_level == "entry":
            query_parts.append("entry level")
        elif experience_level == "senior":
            query_parts.append("senior")
        elif experience_level == "executive":
            query_parts.append("executive")
    
    # Add job type
    if job_type and job_type != "all":
        if job_type == "remote":
            query_parts.append("remote")
        elif job_type == "part-time":
            query_parts.append("part time")
        elif job_type == "contract":
            query_parts.append("contract")
        elif job_type == "freelance":
            query_parts.append("freelance")
    
    # Add "jobs" if not already present
    query_text = " ".join(query_parts)
    if "job" not in query_text.lower():
        query_text += " jobs"
    
    # Add location
    if location:
        # Clean and format location
        location_clean = location.strip()
        
        # Add country context for major cities
        location_mappings = {
            "mumbai": "Mumbai India",
            "delhi": "Delhi India", 
            "bangalore": "Bangalore India",
            "hyderabad": "Hyderabad India",
            "pune": "Pune India",
            "chennai": "Chennai India",
            "san francisco": "San Francisco USA",
            "new york": "New York USA",
            "london": "London UK",
            "dubai": "Dubai UAE"
        }
        
        location_lower = location_clean.lower()
        for key, value in location_mappings.items():
            if key in location_lower:
                location_clean = value
                break
        
        query_text += f" in {location_clean}"
    
    # URL encode the query
    encoded_query = urllib.parse.quote_plus(query_text)
    
    # Build Google Jobs URL
    # Using Google Jobs search which provides better job-specific results
    google_url = f"https://www.google.com/search?q={encoded_query}&ibp=htl;jobs"
    
    # Add additional parameters for better results
    params = {
        "hl": "en",  # Language
        "gl": _get_country_code_from_location(location),  # Geographic location
    }
    
    # Append additional parameters
    param_string = "&".join([f"{k}={v}" for k, v in params.items() if v])
    if param_string:
        google_url += f"&{param_string}"
    
    return google_url

def _get_country_code_from_location(location: Optional[str]) -> str:
    """Get Google country code from location string"""
    if not location:
        return "in"  # Default to India
    
    location_lower = location.lower()
    
    # Country mappings
    if any(city in location_lower for city in ["mumbai", "delhi", "bangalore", "hyderabad", "pune", "chennai", "india"]):
        return "in"
    elif any(city in location_lower for city in ["new york", "san francisco", "los angeles", "chicago", "seattle", "usa", "united states"]):
        return "us"
    elif any(city in location_lower for city in ["london", "manchester", "birmingham", "edinburgh", "uk", "united kingdom"]):
        return "gb"
    elif any(city in location_lower for city in ["dubai", "abu dhabi", "uae", "emirates"]):
        return "ae"
    else:
        return "in"  # Default fallback

def generate_linkedin_search_url(
    title: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None
) -> str:
    """Generate LinkedIn Jobs search URL as alternative fallback"""
    
    base_url = "https://www.linkedin.com/jobs/search"
    params = {}
    
    if title:
        params["keywords"] = title
    
    if location:
        params["location"] = location
    
    if experience_level:
        experience_mapping = {
            "entry": "1",  # Entry level
            "mid": "2",    # Associate
            "senior": "3", # Mid-Senior level
            "executive": "4"  # Director
        }
        if experience_level in experience_mapping:
            params["f_E"] = experience_mapping[experience_level]
    
    # Build URL
    if params:
        param_string = urllib.parse.urlencode(params)
        return f"{base_url}?{param_string}"
    else:
        return base_url

def generate_indeed_search_url(
    title: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None
) -> str:
    """Generate Indeed Jobs search URL as alternative fallback"""
    
    # Indeed has different domains for different countries
    country_domains = {
        "IN": "indeed.co.in",
        "US": "indeed.com", 
        "GB": "indeed.co.uk",
        "AE": "indeed.ae"
    }
    
    country = _get_country_code_from_location(location).upper()
    domain = country_domains.get(country, "indeed.com")
    
    base_url = f"https://{domain}/jobs"
    params = {}
    
    if title:
        params["q"] = title
    
    if location:
        params["l"] = location
    
    if job_type:
        job_type_mapping = {
            "full-time": "fulltime",
            "part-time": "parttime", 
            "contract": "contract",
            "remote": "remote"
        }
        if job_type in job_type_mapping:
            params["jt"] = job_type_mapping[job_type]
    
    # Build URL
    if params:
        param_string = urllib.parse.urlencode(params)
        return f"{base_url}?{param_string}"
    else:
        return base_url

def generate_multiple_fallback_urls(
    title: Optional[str] = None,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None
) -> dict:
    """Generate multiple job search URLs for comprehensive fallback"""
    
    return {
        "google": generate_google_search_url(title, location, job_type, experience_level),
        "linkedin": generate_linkedin_search_url(title, location, experience_level),
        "indeed": generate_indeed_search_url(title, location, job_type),
        "primary_recommendation": "google"  # Which one to show first
    }
