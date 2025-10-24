/**
 * Test Search Features Page
 * Comprehensive testing page for search history and AI suggestions
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  History, 
  Lightbulb, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  User,
  Briefcase,
  Building,
  MapPin
} from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useEnhancedSuggestions } from '@/hooks/useEnhancedSuggestions';
import EnhancedJobSearchHero from '@/components/EnhancedJobSearchHero';

export default function TestSearchFeaturesPage() {
  const { data: session } = useSession();
  const [testQuery, setTestQuery] = useState('software engineer');
  const [testLocation, setTestLocation] = useState('Bangalore');
  const [testResults, setTestResults] = useState<any>(null);

  // Hooks
  const {
    data: searchHistory,
    isLoading: historyLoading,
    createSearchHistory,
    deleteSearchHistory,
    clearSearchHistory,
    hasHistory,
    totalCount
  } = useSearchHistory();

  const {
    suggestions,
    context,
    isLoading: suggestionsLoading,
    getSuggestions,
    getDetailedSuggestions,
    clearSuggestions,
    hasSuggestions,
    getSuggestionsByCategory,
    getSuggestionsBySource
  } = useEnhancedSuggestions();

  // Test functions
  const testCreateSearchHistory = async () => {
    const result = await createSearchHistory({
      query: testQuery,
      location: testLocation,
      filters: {
        jobType: 'Full-time',
        experienceLevel: 'Mid Level',
        isRemote: false
      },
      resultCount: Math.floor(Math.random() * 100),
      searchType: 'job',
      source: 'test'
    });

    if (result) {
      setTestResults({ type: 'create', success: true, message: 'Search history created successfully' });
    } else {
      setTestResults({ type: 'create', success: false, message: 'Failed to create search history' });
    }
  };

  const testGetSuggestions = async () => {
    await getSuggestions({
      query: testQuery,
      location: testLocation,
      context: 'job_search'
    });
    setTestResults({ type: 'suggestions', success: true, message: 'Suggestions fetched successfully' });
  };

  const testGetDetailedSuggestions = async () => {
    await getDetailedSuggestions({
      query: testQuery,
      location: testLocation,
      context: 'job_search',
      includeHistory: true,
      includeResume: true,
      includeApplications: true
    });
    setTestResults({ type: 'detailed', success: true, message: 'Detailed suggestions fetched successfully' });
  };

  const testClearHistory = async () => {
    const result = await clearSearchHistory();
    if (result) {
      setTestResults({ type: 'clear', success: true, message: 'Search history cleared successfully' });
    } else {
      setTestResults({ type: 'clear', success: false, message: 'Failed to clear search history' });
    }
  };

  const testDeleteHistory = async (id: string) => {
    const result = await deleteSearchHistory(id);
    if (result) {
      setTestResults({ type: 'delete', success: true, message: 'Search history item deleted successfully' });
    } else {
      setTestResults({ type: 'delete', success: false, message: 'Failed to delete search history item' });
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Please sign in to test the search features.
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Features Test Page
          </h1>
          <p className="text-gray-600">
            Test search history tracking and AI-powered suggestions
          </p>
        </div>

        {/* Test Results */}
        {testResults && (
          <Card className={`mb-6 ${testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center">
                {testResults.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <span className={`font-medium ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResults.message}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Search Hero */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enhanced Search Hero Component</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedJobSearchHero
              showHistory={true}
              showSuggestions={true}
              showAdvancedFilters={true}
            />
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="testQuery">Test Query</Label>
                <Input
                  id="testQuery"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter test query"
                />
              </div>
              <div>
                <Label htmlFor="testLocation">Test Location</Label>
                <Input
                  id="testLocation"
                  value={testLocation}
                  onChange={(e) => setTestLocation(e.target.value)}
                  placeholder="Enter test location"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={testCreateSearchHistory} disabled={historyLoading}>
                <Search className="w-4 h-4 mr-2" />
                Create Search History
              </Button>
              <Button onClick={testGetSuggestions} disabled={suggestionsLoading}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Get Suggestions
              </Button>
              <Button onClick={testGetDetailedSuggestions} disabled={suggestionsLoading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Detailed Suggestions
              </Button>
              <Button onClick={testClearHistory} variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">Search History</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Search History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Search History
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {totalCount} total searches
                    </Badge>
                    {historyLoading && (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {hasHistory ? (
                  <div className="space-y-3">
                    {searchHistory.history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 truncate">
                              {item.query}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.searchType}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            {item.location && (
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.location}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            <span>{item.resultCount} results</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testDeleteHistory(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No search history found</p>
                    <p className="text-sm">Start searching to see your history here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Suggestions List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      AI Suggestions
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {(suggestions || []).length} suggestions
                      </Badge>
                      {suggestionsLoading && (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {hasSuggestions ? (
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 mb-1">
                                {suggestion.query}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {suggestion.reasoning}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.category.replace('_', ' ')}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {suggestion.source}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No suggestions available</p>
                      <p className="text-sm">Try searching to get AI-powered suggestions</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Context Information */}
              <Card>
                <CardHeader>
                  <CardTitle>User Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Search History</span>
                      <Badge variant={context.hasHistory ? "default" : "secondary"}>
                        {context.hasHistory ? "Available" : "None"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Resume Data</span>
                      <Badge variant={context.hasResume ? "default" : "secondary"}>
                        {context.hasResume ? "Available" : "None"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Applications</span>
                      <Badge variant={context.hasApplications ? "default" : "secondary"}>
                        {context.hasApplications ? "Available" : "None"}
                      </Badge>
                    </div>

                    {context.userSkills && (context.userSkills || []).length > 0 && (
                      <div>
                        <span className="text-sm font-medium block mb-2">User Skills</span>
                        <div className="flex flex-wrap gap-1">
                          {context.userSkills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {context.recentSearches && (context.recentSearches || []).length > 0 && (
                      <div>
                        <span className="text-sm font-medium block mb-2">Recent Searches</span>
                        <div className="space-y-1">
                          {context.recentSearches.map((search, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              • {search}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Searches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Suggestions Available
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(suggestions || []).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    High Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(suggestions || []).filter(s => s.confidence >= 0.7).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    AI Generated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(suggestions || []).filter(s => s.source === 'ai_generated').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
