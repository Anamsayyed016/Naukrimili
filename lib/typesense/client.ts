/**
 * Typesense Client Module
 * Isolated module for Typesense Cloud integration
 * Provides real-time, typo-tolerant search suggestions
 */

import Typesense from 'typesense';

// Type declaration for Typesense Client
type TypesenseClient = Typesense.Client;

// Typesense configuration from environment variables
const TYPESENSE_CONFIG = {
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || '',
      port: parseInt(process.env.TYPESENSE_PORT || '443'),
      protocol: process.env.TYPESENSE_PROTOCOL || 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || '',
  connectionTimeoutSeconds: 5,
};

// Initialize Typesense client
let typesenseClient: TypesenseClient | null = null;

/**
 * Get or create Typesense client instance
 */
export function getTypesenseClient(): TypesenseClient {
  if (!typesenseClient) {
    // Validate configuration
    if (!TYPESENSE_CONFIG.nodes[0].host || !TYPESENSE_CONFIG.apiKey) {
      throw new Error(
        'Typesense configuration is missing. Please set TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_PROTOCOL, and TYPESENSE_API_KEY in your .env file.'
      );
    }

    typesenseClient = new Typesense.Client(TYPESENSE_CONFIG);
  }

  return typesenseClient;
}

/**
 * Check if Typesense is properly configured
 */
export function isTypesenseConfigured(): boolean {
  return !!(
    process.env.TYPESENSE_HOST &&
    process.env.TYPESENSE_API_KEY &&
    process.env.TYPESENSE_PORT &&
    process.env.TYPESENSE_PROTOCOL
  );
}

/**
 * Search suggestions interface
 */
export interface AutocompleteSuggestion {
  text: string;
  type: 'job_title' | 'company' | 'location' | 'skill';
  highlight?: string;
}

/**
 * Autocomplete search options
 */
export interface AutocompleteOptions {
  query: string;
  collection: 'job_titles' | 'companies' | 'locations' | 'skills';
  limit?: number;
  prefix?: boolean;
  typoTolerance?: number;
}

/**
 * Perform autocomplete search with typo tolerance
 */
export async function autocompleteSearch(
  options: AutocompleteOptions
): Promise<AutocompleteSuggestion[]> {
  if (!isTypesenseConfigured()) {
    console.warn('Typesense is not configured. Returning empty suggestions.');
    return [];
  }

  try {
    const client = getTypesenseClient();
    const {
      query,
      collection,
      limit = 8,
      prefix = true,
      typoTolerance = 2,
    } = options;

    if (!query || query.length < 2) {
      return [];
    }

    const searchParameters = {
      q: query,
      query_by: collection === 'job_titles' ? 'title' : 
                collection === 'companies' ? 'name' :
                collection === 'locations' ? 'name' : 'name',
      prefix: prefix,
      limit: limit,
      typo_tolerance: typoTolerance,
      num_typos: typoTolerance,
      drop_tokens_threshold: 0,
      sort_by: '_text_match:desc',
    };

    const searchResults = await client
      .collections(collection)
      .documents()
      .search(searchParameters);

    const suggestions: AutocompleteSuggestion[] = [];

    if (searchResults.hits && searchResults.hits.length > 0) {
      searchResults.hits.forEach((hit: Record<string, unknown>) => {
        const document = hit.document;
        const highlight = hit.highlights?.[0]?.snippet || document.name || document.title;
        
        suggestions.push({
          text: document.name || document.title || document.text || '',
          type: collection === 'job_titles' ? 'job_title' :
                collection === 'companies' ? 'company' :
                collection === 'locations' ? 'location' : 'skill',
          highlight: highlight,
        });
      });
    }

    return suggestions;
  } catch (error: unknown) {
    console.error('Typesense autocomplete error:', error);
    // Return empty array on error to not break the UI
    return [];
  }
}

/**
 * Multi-collection autocomplete search
 * Searches across all collections (job_titles, companies, locations, skills)
 */
export async function multiCollectionAutocomplete(
  query: string,
  limit: number = 10
): Promise<AutocompleteSuggestion[]> {
  if (!isTypesenseConfigured() || !query || query.length < 2) {
    return [];
  }

  try {
    // Search all collections in parallel
    const [jobTitles, companies, locations, skills] = await Promise.allSettled([
      autocompleteSearch({ query, collection: 'job_titles', limit: Math.ceil(limit / 4) }),
      autocompleteSearch({ query, collection: 'companies', limit: Math.ceil(limit / 4) }),
      autocompleteSearch({ query, collection: 'locations', limit: Math.ceil(limit / 4) }),
      autocompleteSearch({ query, collection: 'skills', limit: Math.ceil(limit / 4) }),
    ]);

    // Combine results from all collections
    const allSuggestions: AutocompleteSuggestion[] = [];

    if (jobTitles.status === 'fulfilled') {
      allSuggestions.push(...jobTitles.value);
    }
    if (companies.status === 'fulfilled') {
      allSuggestions.push(...companies.value);
    }
    if (locations.status === 'fulfilled') {
      allSuggestions.push(...locations.value);
    }
    if (skills.status === 'fulfilled') {
      allSuggestions.push(...skills.value);
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(item => [item.text.toLowerCase(), item])).values()
    ).slice(0, limit);

    return uniqueSuggestions;
  } catch (error: unknown) {
    console.error('Multi-collection autocomplete error:', error);
    return [];
  }
}

/**
 * Health check for Typesense connection
 */
export async function checkTypesenseHealth(): Promise<boolean> {
  if (!isTypesenseConfigured()) {
    return false;
  }

  try {
    const client = getTypesenseClient();
    await client.health.retrieve();
    return true;
  } catch (error) {
    console.error('Typesense health check failed:', error);
    return false;
  }
}

