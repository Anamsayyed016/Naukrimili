'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp, Users, Building2, Sprout } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Sector {
  id: string;
  name: string;
  icon: string;
  description: string;
  jobCount: number;
  keywords: string[];
  sampleJobTitles: string[];
}

interface SeedingStats {
  totalJobs: number;
  jobsPerSector: number;
  sectors: string[];
  sectorStats: Array<{
    sector: string;
    jobCount: number;
    avgSalary: number;
  }>;
  totalCompanies: number;
  totalCategories: number;
  totalLocations: number;
  jobsCreated: number;
}

export default function SeedJobsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [stats, setStats] = useState<SeedingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string>('all');
  const [jobsPerSector, setJobsPerSector] = useState<number>(20);

  // Load sectors on component mount
  React.useEffect(() => {
    loadSectors();
  }, []);

  const loadSectors = async () => {
    try {
      const response = await fetch('/api/jobs/seed');
      if (response.ok) {
        const data = await response.json();
        setSectors(data.sectors);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load sectors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sectors',
        variant: 'destructive',
      });
    }
  };

  const handleSeedJobs = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch('/api/jobs/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobsPerSector,
          sectors: selectedSectors === 'all' ? 'all' : selectedSectors,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: `Successfully seeded ${data.stats.totalJobs} jobs`,
        });
        
        // Reload sectors to get updated stats
        await loadSectors();
      } else {
        throw new Error(data.error || 'Seeding failed');
      }
    } catch (error: any) {
      console.error('Seeding failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to seed jobs',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const formatSalary = (amount: number) => {
    if (amount >= 100000) {
      return `${(amount / 100000).toFixed(1)} LPA`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Job Seeding</h1>
        <p className="text-gray-600">
          Generate and seed realistic job postings across all sectors to populate your job portal
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Total Jobs</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalJobs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800">Jobs Created</h3>
            <p className="text-3xl font-bold text-green-600">{stats.jobsCreated}</p>
          </div>
        </div>
      )}

      {/* Seeding Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sprout className="h-5 w-5" />
            <span>Job Seeding Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="sectors">Select Sectors</Label>
              <Select value={selectedSectors} onValueChange={setSelectedSectors}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="technology">Technology & IT</SelectItem>
                  <SelectItem value="healthcare">Healthcare & Medical</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="jobsPerSector">Jobs per Sector</Label>
              <Input
                id="jobsPerSector"
                type="number"
                min="1"
                max="100"
                value={jobsPerSector}
                onChange={(e) => setJobsPerSector(parseInt(e.target.value) || 20)}
                placeholder="20"
              />
            </div>
          </div>

          <Button
            onClick={handleSeedJobs}
            disabled={isSeeding}
            className="w-full md:w-auto"
            size="lg"
          >
            {isSeeding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Seeding Jobs...
              </>
            ) : (
              <>
                <Sprout className="h-4 w-4 mr-2" />
                Seed Database with Jobs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sectors Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sectors.map((sector) => (
          <Card key={sector.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">{sector.icon}</span>
                <span className="text-lg">{sector.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{sector.description}</p>
              
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Sample Job Titles:</p>
                <div className="space-y-1">
                  {sector.sampleJobTitles.map((title, index) => (
                    <p key={index} className="text-xs text-gray-600">• {title}</p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Keywords:</p>
                <div className="flex flex-wrap gap-1">
                  {sector.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Jobs:</span> {sector.jobCount}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
