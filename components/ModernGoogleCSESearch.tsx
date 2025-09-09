"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MapPin, 
  Filter, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  ExternalLink,
  Brain,
  Zap,
  Globe,
  Target,
  TrendingUp,
  Star,
  Clock,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Settings,
  Lightbulb
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface ModernGoogleCSESearchProps {
  searchQuery: string;
  location?: string;
  className?: string;
  onResultsUpdate?: (results: any[]) => void;
  showAdvancedOptions?: boolean;
  enableAIFeatures?: boolean;
}

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
  formattedUrl: string;
  pagemap?: {
    cse_thumbnail?: Array<{ src: string; width: string; height: string }>;
    metatags?: Array<{ [key: string]: string }>;
  };
}

interface AISearchSuggestion {
  query: string;
  confidence: number;
  reasoning: string;
}

export default function ModernGoogleCSESearch({
  searchQuery,
  location = '',
  className = '',
  onResultsUpdate,
  showAdvancedOptions = true,
  enableAIFeatures = true
}: ModernGoogleCSESearchProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISearchSuggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Advanced search options
  const [searchOptions, setSearchOptions] = useState({
    numResults: 6,
    sortBy: 'relevance',
    timeRange: 'any',
    safeSearch: 'active',
    includeImages: true,
    includeVideos: false,
    language: 'en',
    country: 'us'
  });

  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Check for CSE configuration
  const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
  
  // Debug logging
  useEffect(() => {
    console.log('ModernGoogleCSESearch Debug:', {
      cseId,
      searchQuery,
      location,
      showAdvancedOptions,
      enableAIFeatures
    });
  }, [cseId, searchQuery, location, showAdvancedOptions, enableAIFeatures]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, options = searchOptions) => {
    if (!query.trim() || !cseId) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Add delay for better UX
      await new Promise(resolve => {
        searchTimeoutRef.current = setTimeout(resolve, 300);
      });

      const searchParams = new URLSearchParams({
        q: query,
        location: location || '',
        num: options.numResults.toString(),
        sort: options.sortBy,
        safe: options.safeSearch,
        lr: `lang_${options.language}`,
        cr: `country${options.country}`,
        ...(options.timeRange !== 'any' && { dateRestrict: options.timeRange }),
        ...(options.includeImages && { searchType: 'image' }),
        ...(options.includeVideos && { searchType: 'video' })
      });

      const response = await fetch(
        `/api/cse/search?${searchParams}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
      onResultsUpdate?.(data.results || []);

    } catch (err) {
      console.error('Google CSE Search Error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [cseId, location, searchOptions, onResultsUpdate]);

  // Generate AI-powered search suggestions
  const generateAISuggestions = useCallback(async (query: string) => {
    if (!enableAIFeatures || !query.trim()) return;

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/search-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query, 
          location,
          context: 'job_search'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('AI suggestions error:', err);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [enableAIFeatures, location]);

  // Effect to trigger search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
      if (enableAIFeatures) {
        generateAISuggestions(searchQuery);
      }
    } else {
      setResults([]);
      setHasSearched(false);
      setAiSuggestions([]);
    }
  }, [searchQuery, performSearch, generateAISuggestions, enableAIFeatures]);

  // Show configuration warning if CSE not configured, but still render the component
  const showConfigWarning = !cseId;

  const handleAdvancedSearch = () => {
    performSearch(searchQuery, searchOptions);
  };

  const handleAISuggestionClick = (suggestion: AISearchSuggestion) => {
    performSearch(suggestion.query, searchOptions);
  };

  const getTimeRangeLabel = (range: string) => {
    const labels: { [key: string]: string } = {
      'any': 'Any time',
      'd1': 'Past 24 hours',
      'w1': 'Past week',
      'm1': 'Past month',
      'y1': 'Past year'
    };
    return labels[range] || 'Any time';
  };

  const getSortByLabel = (sort: string) => {
    const labels: { [key: string]: string } = {
      'relevance': 'Relevance',
      'date': 'Date',
      'rating': 'Rating'
    };
    return labels[sort] || 'Relevance';
  };

  return (
    <div className={`space-y-6 ${className}`}>      {/* Configuration Warning */}
      {showConfigWarning && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Google CSE is not configured. Search functionality will be limited.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Section */}
      <Card className="bg-gradient-to-r from-green-50 via-white to-blue-50 border-2 border-green-200 shadow-xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span>Global Job Search</span>
                  <Badge className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border-0 font-bold text-xs sm:text-sm w-fit">
                    Powered by Google
                  </Badge>
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Discover opportunities from across the web
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {enableAIFeatures && (
                <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0 font-bold flex items-center gap-1 text-xs">
                  <Sparkles className="w-3 h-3" />
                  AI Enhanced
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="border-2 border-gray-300 hover:border-blue-500 text-xs sm:text-sm"
              >
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{showAdvanced ? 'Hide' : 'Advanced'}</span>
                <span className="sm:hidden">{showAdvanced ? 'Hide' : 'Options'}</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Advanced Options */}
        {showAdvanced && showAdvancedOptions && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border-2 border-gray-100">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Results Count</Label>
                <Select 
                  value={searchOptions.numResults.toString()} 
                  onValueChange={(value) => setSearchOptions(prev => ({ ...prev, numResults: parseInt(value) }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 results</SelectItem>
                    <SelectItem value="6">6 results</SelectItem>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="20">20 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Sort By</Label>
                <Select 
                  value={searchOptions.sortBy} 
                  onValueChange={(value) => setSearchOptions(prev => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Time Range</Label>
                <Select 
                  value={searchOptions.timeRange} 
                  onValueChange={(value) => setSearchOptions(prev => ({ ...prev, timeRange: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="d1">Past 24 hours</SelectItem>
                    <SelectItem value="w1">Past week</SelectItem>
                    <SelectItem value="m1">Past month</SelectItem>
                    <SelectItem value="y1">Past year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Safe Search</Label>
                <Select 
                  value={searchOptions.safeSearch} 
                  onValueChange={(value) => setSearchOptions(prev => ({ ...prev, safeSearch: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="off">Off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImages"
                    checked={searchOptions.includeImages}
                    onCheckedChange={(checked) => setSearchOptions(prev => ({ ...prev, includeImages: !!checked }))}
                  />
                  <Label htmlFor="includeImages" className="text-sm font-medium">Include Images</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeVideos"
                    checked={searchOptions.includeVideos}
                    onCheckedChange={(checked) => setSearchOptions(prev => ({ ...prev, includeVideos: !!checked }))}
                  />
                  <Label htmlFor="includeVideos" className="text-sm font-medium">Include Videos</Label>
                </div>
              </div>
              <Button onClick={handleAdvancedSearch} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Suggestions */}
      {enableAIFeatures && aiSuggestions.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg font-bold text-green-800">AI-Powered Search Suggestions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => handleAISuggestionClick(suggestion)}
                  className="justify-start h-auto p-4 text-left border-2 border-green-200 hover:border-green-400 hover:bg-green-100"
                >
                  <div className="flex items-start gap-3 w-full">
                    <Lightbulb className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-green-800 mb-1">{suggestion.query}</div>
                      <div className="text-xs text-green-600">{suggestion.reasoning}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% match
                        </Badge>
                        <Star className="w-3 h-3 text-yellow-500" />
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder State - No Search Query */}
      {!searchQuery.trim() && !isLoading && !error && (
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-full">
                <Search className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Search the Web</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Enter a job search term above to discover opportunities from across the web using Google's powerful search engine.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-0">Software Engineer</Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-0">Remote Jobs</Badge>
                  <Badge className="bg-purple-100 text-purple-800 border-0">Marketing</Badge>
                  <Badge className="bg-orange-100 text-orange-800 border-0">Data Science</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="relative mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-green-300 opacity-20 mx-auto"></div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Searching the web...</h3>
            <p className="text-gray-600">Finding the best job opportunities for you</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 shadow-xl">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-800 mb-2">Search Error</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => performSearch(searchQuery)} 
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && !error && hasSearched && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Found {results.length} opportunities
            </h3>
            <Badge className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border-0 font-bold">
              Web Results
            </Badge>
          </div>

          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-green-300 bg-white shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Thumbnail */}
                    {result.pagemap?.cse_thumbnail?.[0] && (
                      <div className="flex-shrink-0 self-center sm:self-start">
                        <img
                          src={result.pagemap.cse_thumbnail[0].src}
                          alt=""
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border-2 border-gray-200"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title and Link */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                        <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors flex-1 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                          {result.title}
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(result.link, '_blank')}
                          className="flex-shrink-0 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Visit
                        </Button>
                      </div>

                      {/* URL and Domain */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-blue-600 font-medium truncate">{result.displayLink}</span>
                        </div>
                        <Badge variant="outline" className="text-xs w-fit">
                          {(() => {
                            try {
                              return new URL(result.link).hostname;
                            } catch {
                              return result.displayLink || 'Unknown';
                            }
                          })()}
                        </Badge>
                      </div>

                      {/* Snippet */}
                      <p className="text-gray-700 text-sm leading-relaxed mb-4 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'}}>
                        {result.snippet}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Web Result</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>External Source</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>Google Search</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && hasSearched && results.length === 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 shadow-xl">
          <CardContent className="p-8 text-center">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">No web results found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters to find more opportunities
            </p>
            <Button 
              onClick={() => setShowAdvanced(true)}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Adjust Search Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
