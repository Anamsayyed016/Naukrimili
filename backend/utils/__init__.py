# Utils package
from .location_utils import (
    get_supported_countries,
    validate_location,
    get_popular_locations_by_country,
    calculate_distance_between_coordinates,
    is_location_in_supported_region
)
from .google_fallback import (
    generate_google_search_url,
    generate_linkedin_search_url,
    generate_indeed_search_url,
    generate_multiple_fallback_urls
)

__all__ = [
    "get_supported_countries",
    "validate_location", 
    "get_popular_locations_by_country",
    "calculate_distance_between_coordinates",
    "is_location_in_supported_region",
    "generate_google_search_url",
    "generate_linkedin_search_url",
    "generate_indeed_search_url",
    "generate_multiple_fallback_urls"
]
