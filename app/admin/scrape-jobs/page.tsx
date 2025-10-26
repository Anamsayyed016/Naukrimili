"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Globe, 
  Settings, 
  Play, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ScrapingConfig {
  query: string;
  countries: string[];
  maxJobsPerSource: number;
  enableDeduplication: boolean;
  sources: string[];
}

interface ScrapingResult {
  source: string;
  jobsFound: number;
  jobsAdded: number;
  duplicatesSkipped: number;
  errors: string[];
  duration: number;
}

export default function JobScrapingPage() {
  const [config, setConfig] = useState<ScrapingConfig>({
    query: 'software developer',
    countries: ['IN', 'US', 'GB', 'AE'],
    maxJobsPerSource: 200,
    enableDeduplication: true,
    sources: ['adzuna', 'jsearch', 'reed']
  });

  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [stats, setStats] = useState<any>(null);

  const availableSources = [
    { id: 'adzuna', name: 'Adzuna', description: 'UK-based job search API', enabled: true },
    { id: 'jsearch', name: 'JSearch', description: 'RapidAPI job search', enabled: true },
    { id: 'reed', name: 'Reed', description: 'UK job board API', enabled: true },
    { id: 'indeed', name: 'Indeed', description: 'Global job board', enabled: false },
    { id: 'linkedin', name: 'LinkedIn', description: 'Professional network', enabled: false }
  ];

  const availableCountries = [
    { code: 'IN', name: 'India' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' }
  ];

  const handleSourceToggle = (sourceId: string) => {
    setConfig(prev => ({
      ...prev,
      sources: prev.sources.includes(sourceId)
        ? prev.sources.filter(s => s !== sourceId)
        : [...prev.sources, sourceId]
    }));
  };

  const handleCountryToggle = (countryCode: string) => {
    setConfig(prev => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter(c => c !== countryCode)
        : [...prev.countries, countryCode]
    }));
  };

  const startScraping = async () => {
    if (config.sources.length === 0) {
      toast.error('Please select at least one source');
      return;
    }

    if (config.countries.length === 0) {
      toast.error('Please select at least one country');
      return;
    }

    setIsScraping(true);
    setProgress(0);
    setResults([]);

    try {
      const response = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results.sources || []);
        setStats(data.stats);
        
        const totalJobs = data.results.totalJobs || 0;
        const totalDuplicates = data.results.totalDuplicates || 0;
        
        toast.success(`Scraping completed! Added ${totalJobs} jobs, skipped ${totalDuplicates} duplicates`);
      } else {
        toast.error(data.error || 'Scraping failed');
      }
    } catch (_error) {
      console.error('Scraping error:', _error);
      toast.error('Failed to start scraping');
    } finally {
      setIsScraping(false);
      setProgress(100);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/jobs/scrape');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (_error) {
      console.error('Failed to fetch stats:', _error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Scraping</h1>
            <p className="text-gray-600 mt-1">Scrape real jobs from external sources</p>
          </div>
          <Button onClick={fetchStats} variant="outline" className="bg-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>

        {/* Configuration */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Scraping Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Query */}
            <div>
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                value={config.query}
                onChange={(e) => setConfig(prev => ({ ...prev, query: e.target.value }))}
                placeholder="e.g., software developer, marketing manager"
                className="mt-1"
              />
            </div>

            {/* Countries */}
            <div>
              <Label>Countries</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {availableCountries.map(country => (
                  <div key={country.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={country.code}
                      checked={config.countries.includes(country.code)}
                      onCheckedChange={() => handleCountryToggle(country.code)}
                    />
                    <Label htmlFor={country.code} className="text-sm">
                      {country.name} ({country.code})
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sources */}
            <div>
              <Label>Job Sources</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {availableSources.map(source => (
                  <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={source.id}
                        checked={config.sources.includes(source.id)}
                        onCheckedChange={() => handleSourceToggle(source.id)}
                        disabled={!source.enabled}
                      />
                      <div>
                        <Label htmlFor={source.id} className="font-medium">
                          {source.name}
                        </Label>
                        <p className="text-sm text-gray-500">{source.description}</p>
                      </div>
                    </div>
                    {!source.enabled && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxJobs">Max Jobs per Source</Label>
                <Select
                  value={config.maxJobsPerSource.toString()}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    maxJobsPerSource: parseInt(value) 
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="deduplication"
                  checked={config.enableDeduplication}
                  onCheckedChange={(checked) => setConfig(prev => ({ 
                    ...prev, 
                    enableDeduplication: !!checked 
                  }))}
                />
                <Label htmlFor="deduplication">Enable Duplicate Prevention</Label>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={startScraping}
              disabled={isScraping}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isScraping ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Scraping in Progress...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scraping
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress */}
        {isScraping && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Scraping progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Scraping Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">{result.source}</h3>
                        <p className="text-sm text-gray-500">
                          Found {result.jobsFound} jobs, added {result.jobsAdded}, skipped {result.duplicatesSkipped}
                        </p>
                        {result.errors.length > 0 && (
                          <p className="text-sm text-red-500">
                            {result.errors.length} errors
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {result.jobsAdded > 0 && (
                          <Badge className="bg-green-100 text-green-800">
                            +{result.jobsAdded}
                          </Badge>
                        )}
                        {result.duplicatesSkipped > 0 && (
                          <Badge variant="secondary">
                            ~{result.duplicatesSkipped}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {(result.duration / 1000).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {stats && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Job Database Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalJobs?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Jobs</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.jobsBySource?.length || 0}
                  </div>
                  <div className="text-sm text-green-600">Active Sources</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.jobsBySector?.length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Sectors</div>
                </div>
              </div>

              {/* Jobs by Source */}
              {stats.jobsBySource && stats.jobsBySource.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Jobs by Source</h3>
                  <div className="space-y-2">
                    {stats.jobsBySource.map((source: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="capitalize">{source.source || 'Unknown'}</span>
                        <Badge>{source._count.id}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">How Job Scraping Works</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Jobs are fetched from external APIs and saved to your database</li>
                  <li>• Duplicate prevention ensures no duplicate jobs are added</li>
                  <li>• Each source has rate limits to respect API terms</li>
                  <li>• Jobs include real company names, locations, and descriptions</li>
                  <li>• External jobs link to original job postings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
