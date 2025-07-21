// Adzuna API Types

export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  company: {
    display_name: string;
  };
  category: {
    label: string;
    tag: string;
  };
  location: {
    area: string[];
    display_name: string;
  };
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  contract_type?: string;
  contract_time?: string;
  created: string;
  redirect_url: string;
  adref: string;
}

export interface AdzunaSearchResponse {
  results: AdzunaJob[];
  count: number;
  mean?: number;
  __CLASS__: string;
}

export interface AdzunaSearchParams {
  what?: string; // Job title or keywords
  where?: string; // Location
  distance?: number; // Distance in km from location
  salary_min?: number;
  salary_max?: number;
  salary_include_unknown?: 0 | 1;
  full_time?: 0 | 1;
  part_time?: 0 | 1;
  contract?: 0 | 1;
  permanent?: 0 | 1;
  sort_by?: 'relevance' | 'date' | 'salary';
  results_per_page?: number; // Max 50
  page?: number;
  max_days_old?: number;
  category?: string;
  company?: string;
  title_only?: string;
}

export interface AdzunaCategory {
  label: string;
  tag: string;
}

export interface AdzunaCategoriesResponse {
  results: {
    [key: string]: AdzunaCategory;
  };
  __CLASS__: string;
}

export interface AdzunaHistogramResponse {
  month: {
    [key: string]: number;
  };
  __CLASS__: string;
}

export interface AdzunaTopCompaniesResponse {
  leaderboard: Array<{
    name: string;
    count: number;
  }>;
  __CLASS__: string;
}

export interface AdzunaGeoLocationResponse {
  locations: Array<{
    area: string[];
    display_name: string;
    longitude: number;
    latitude: number;
  }>;
  __CLASS__: string;
}

// Error response type
export interface AdzunaError {
  exception: string;
  doc: string;
}

// Countries supported by Adzuna
export type AdzunaCountry = 
  | 'gb' // United Kingdom
  | 'us' // United States
  | 'at' // Austria
  | 'au' // Australia
  | 'be' // Belgium
  | 'br' // Brazil
  | 'ca' // Canada
  | 'de' // Germany
  | 'es' // Spain
  | 'fr' // France
  | 'in' // India
  | 'it' // Italy
  | 'mx' // Mexico
  | 'nl' // Netherlands
  | 'nz' // New Zealand
  | 'pl' // Poland
  | 'ru' // Russia
  | 'sg' // Singapore
  | 'za'; // South Africa

export interface AdzunaApiConfig {
  appId: string;
  apiKey: string;
  country: AdzunaCountry;
  baseUrl?: string;
}
