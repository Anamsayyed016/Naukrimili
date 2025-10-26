/**
 * Smart Country Detection Utility
 * Production-ready implementation for detecting countries from location strings
 * and managing multi-country job fetching
 * 
 * @author Senior Developer
 * @version 1.0.0
 */

export interface CountryConfig {
  code: string;           // Country code (IN, GB, US, AE, CA, AU)
  name: string;           // Full country name
  adzunaCode: string;     // Adzuna API country code (lowercase)
  jsearchCode: string;    // JSearch API country code (uppercase)
  joobleLocation: string; // Jooble API location string
  currency: string;       // Currency code (INR, GBP, USD, AED, CAD, AUD)
  priority: number;       // Priority for multi-country fetching (1 = highest)
}

/**
 * Supported countries configuration
 * Priority: 1 (India) > 2 (UK) > 3 (USA) > 4 (UAE) > 5 (Canada) > 6 (Australia)
 */
export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'IN',
    name: 'India',
    adzunaCode: 'in',
    jsearchCode: 'IN',
    joobleLocation: 'India',
    currency: 'INR',
    priority: 1
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    adzunaCode: 'gb',
    jsearchCode: 'GB',
    joobleLocation: 'United Kingdom',
    currency: 'GBP',
    priority: 2
  },
  {
    code: 'US',
    name: 'United States',
    adzunaCode: 'us',
    jsearchCode: 'US',
    joobleLocation: 'United States',
    currency: 'USD',
    priority: 3
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    adzunaCode: 'ae',
    jsearchCode: 'AE',
    joobleLocation: 'United Arab Emirates',
    currency: 'AED',
    priority: 4
  },
  {
    code: 'CA',
    name: 'Canada',
    adzunaCode: 'ca',
    jsearchCode: 'CA',
    joobleLocation: 'Canada',
    currency: 'CAD',
    priority: 5
  },
  {
    code: 'AU',
    name: 'Australia',
    adzunaCode: 'au',
    jsearchCode: 'AU',
    joobleLocation: 'Australia',
    currency: 'AUD',
    priority: 6
  }
];

/**
 * Location keywords mapped to country codes
 * Used for intelligent country detection from location strings
 */
const LOCATION_KEYWORDS: Record<string, string[]> = {
  // India
  'IN': [
    'india', 'indian', 'bharat', 
    'mumbai', 'bombay', 'delhi', 'new delhi', 'bangalore', 'bengaluru',
    'hyderabad', 'chennai', 'kolkata', 'calcutta', 'pune', 'ahmedabad',
    'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane',
    'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad',
    'ludhiana', 'agra', 'nashik', 'ranchi', 'faridabad', 'meerut', 'rajkot'
  ],
  // United Kingdom
  'GB': [
    'uk', 'united kingdom', 'britain', 'great britain', 'british', 'england',
    'london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'liverpool',
    'newcastle', 'sheffield', 'bristol', 'edinburgh', 'leicester', 'coventry',
    'bradford', 'cardiff', 'belfast', 'nottingham', 'kingston upon hull',
    'plymouth', 'stoke-on-trent', 'wolverhampton', 'derby', 'southampton',
    'portsmouth', 'brighton', 'reading', 'milton keynes', 'oxford', 'cambridge'
  ],
  // United States
  'US': [
    'usa', 'us', 'united states', 'america', 'american',
    'new york', 'nyc', 'los angeles', 'la', 'chicago', 'houston',
    'phoenix', 'philadelphia', 'san antonio', 'san diego', 'dallas',
    'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus',
    'charlotte', 'san francisco', 'sf', 'indianapolis', 'seattle',
    'denver', 'washington', 'dc', 'washington dc', 'boston', 'el paso',
    'detroit', 'nashville', 'portland', 'las vegas', 'oklahoma city'
  ],
  // United Arab Emirates
  'AE': [
    'uae', 'united arab emirates', 'emirates',
    'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 
    'fujairah', 'umm al quwain', 'al ain'
  ],
  // Canada
  'CA': [
    'canada', 'canadian',
    'toronto', 'montreal', 'vancouver', 'calgary', 'edmonton',
    'ottawa', 'winnipeg', 'quebec city', 'hamilton', 'kitchener',
    'london', 'victoria', 'halifax', 'oshawa', 'windsor', 'saskatoon'
  ],
  // Australia
  'AU': [
    'australia', 'australian', 'aussie',
    'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide',
    'gold coast', 'canberra', 'newcastle', 'wollongong', 'sunshine coast',
    'geelong', 'hobart', 'townsville', 'cairns', 'darwin', 'toowoomba'
  ]
};

/**
 * Detect country from location string
 * Uses intelligent keyword matching with priority
 * 
 * @param location - Location string (e.g., "London", "New York", "Bangalore")
 * @returns Country code (IN, GB, US, AE, CA, AU) or null if not detected
 */
export function detectCountryFromLocation(location: string | null | undefined): string | null {
  if (!location || typeof location !== 'string') {
    return null;
  }

  const normalizedLocation = location.toLowerCase().trim();
  
  // Check each country's keywords
  for (const [countryCode, keywords] of Object.entries(LOCATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedLocation.includes(keyword)) {
        return countryCode;
      }
    }
  }

  return null; // No match found
}

/**
 * Get country configuration by code
 * 
 * @param countryCode - Country code (IN, GB, US, etc.)
 * @returns CountryConfig object or undefined
 */
export function getCountryConfig(countryCode: string): CountryConfig | undefined {
  return SUPPORTED_COUNTRIES.find(c => c.code === countryCode.toUpperCase());
}

/**
 * Smart country selection for job fetching
 * Returns countries to fetch based on context
 * 
 * Strategy:
 * 1. If specific location given → Fetch only that country
 * 2. If general search → Fetch top priority countries (India, UK, USA, UAE)
 * 3. If country code provided → Fetch only that country
 * 
 * @param options - Options object with location and country
 * @returns Array of CountryConfig to fetch jobs from
 */
export function getCountriesToFetch(options: {
  location?: string | null;
  country?: string | null;
  fetchAll?: boolean;
}): CountryConfig[] {
  const { location, country, fetchAll = false } = options;

  // Priority 1: Explicit country parameter
  if (country && country !== 'ALL') {
    const config = getCountryConfig(country);
    return config ? [config] : [];
  }

  // Priority 2: Detect from location
  if (location) {
    const detectedCountry = detectCountryFromLocation(location);
    if (detectedCountry) {
      const config = getCountryConfig(detectedCountry);
      return config ? [config] : [];
    }
  }

  // Priority 3: Fetch all or default top countries
  if (fetchAll || country === 'ALL') {
    // Return all countries sorted by priority
    return [...SUPPORTED_COUNTRIES].sort((a, b) => a.priority - b.priority);
  }

  // Default: Fetch top 4 priority countries (India, UK, USA, UAE)
  return SUPPORTED_COUNTRIES
    .filter(c => c.priority <= 4)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Check if a country code is supported
 * 
 * @param countryCode - Country code to check
 * @returns boolean
 */
export function isSupportedCountry(countryCode: string): boolean {
  return SUPPORTED_COUNTRIES.some(c => c.code === countryCode.toUpperCase());
}

/**
 * Get all supported country codes
 * 
 * @returns Array of country codes
 */
export function getSupportedCountryCodes(): string[] {
  return SUPPORTED_COUNTRIES.map(c => c.code);
}

/**
 * Format country name for display
 * 
 * @param countryCode - Country code
 * @returns Formatted country name or code if not found
 */
export function formatCountryName(countryCode: string): string {
  const config = getCountryConfig(countryCode);
  return config ? config.name : countryCode;
}

/**
 * Get currency for country
 * 
 * @param countryCode - Country code
 * @returns Currency code (INR, GBP, USD, etc.)
 */
export function getCurrencyForCountry(countryCode: string): string {
  const config = getCountryConfig(countryCode);
  return config ? config.currency : 'USD'; // Default to USD
}

/**
 * Validate and normalize country code
 * Ensures country code is in correct format
 * 
 * @param countryCode - Raw country code
 * @returns Normalized country code or null
 */
export function normalizeCountryCode(countryCode: string | null | undefined): string | null {
  if (!countryCode || typeof countryCode !== 'string') {
    return null;
  }

  const normalized = countryCode.toUpperCase().trim();
  
  if (normalized === 'ALL') {
    return 'ALL';
  }

  return isSupportedCountry(normalized) ? normalized : null;
}

/**
 * Get suggested countries based on query
 * Useful for showing country suggestions in UI
 * 
 * @param query - Search query
 * @returns Array of suggested CountryConfig
 */
export function getSuggestedCountries(query?: string): CountryConfig[] {
  if (!query) {
    // Return top 4 by default
    return SUPPORTED_COUNTRIES.filter(c => c.priority <= 4);
  }

  // Check if query mentions a specific country
  const detectedCountry = detectCountryFromLocation(query);
  if (detectedCountry) {
    const config = getCountryConfig(detectedCountry);
    return config ? [config] : [];
  }

  // Return all for generic search
  return [...SUPPORTED_COUNTRIES].sort((a, b) => a.priority - b.priority);
}

