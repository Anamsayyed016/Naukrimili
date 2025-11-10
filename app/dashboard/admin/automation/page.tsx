'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Activity, 
  Database, 
  Globe, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface AutomationStatus {
  isRunning: boolean;
  config: any;
  stats: {
    totalJobs: number;
    externalJobs: number;
    employerJobs: number;
    manualJobs: number;
    activeJobs: number;
    expiredJobs: number;
    qualityScore: number;
    lastSync: Date;
    syncDuration: number;
    errors: string[];
  };
  sources: Array<{
    id: string;
    name: string;
    type: string;
    priority: number;
    enabled: boolean;
    lastSync: Date | null;
    totalJobs: number;
    activeJobs: number;
  }>;
}

export default function AutomationDashboard() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/automation/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.data);
      } else {
        toast.error('Failed to fetch automation status');
      }
    } catch (_error) {
      console.error('Error fetching status:', error);
      toast.error('Failed to fetch automation status');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/automation/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        await fetchStatus();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch (_error) {
      console.error('Error performing action:', error);
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async () => {
    setActionLoading('sync');
    try {
      const response = await fetch('/api/automation/sync', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Sync completed successfully');
        await fetchStatus();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch (_error) {
      console.error('Error performing sync:', error);
      toast.error('Sync failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Automation System</h1>
          <p className="text-gray-600">Failed to load automation status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Automation System</h1>
        <p className="text-gray-600">Manage 3rd party integrations, employer postings, and unified workflow</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {status.isRunning ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">Running</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600 font-medium">Stopped</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {status.stats.activeJobs} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">External Jobs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.externalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From 3rd party APIs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employer Jobs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.employerJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Posted by employers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Score */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Quality Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold">
              {(status.stats.qualityScore * 100).toFixed(1)}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${status.stats.qualityScore * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleAction(status.isRunning ? 'stop' : 'start')}
              disabled={actionLoading !== null}
              variant={status.isRunning ? 'destructive' : 'default'}
            >
              {actionLoading === 'start' || actionLoading === 'stop' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : status.isRunning ? (
                <Pause className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {status.isRunning ? 'Stop System' : 'Start System'}
            </Button>

            <Button
              onClick={handleSync}
              disabled={actionLoading !== null}
              variant="outline"
            >
              {actionLoading === 'sync' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Manual Sync
            </Button>

            <Button
              onClick={fetchStatus}
              disabled={actionLoading !== null}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Sources */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Job Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {source.type === 'external' ? (
                      <Globe className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Users className="h-5 w-5 text-green-600" />
                    )}
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <Badge variant={source.enabled ? 'default' : 'secondary'}>
                    {source.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{source.totalJobs} jobs</div>
                  <div className="text-xs text-muted-foreground">
                    {source.lastSync ? `Last sync: ${new Date(source.lastSync).toLocaleString()}` : 'Never synced'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Last Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Sync Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Sync</div>
              <div className="text-lg">
                {new Date(status.stats.lastSync).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Sync Duration</div>
              <div className="text-lg">
                {status.stats.syncDuration}ms
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Errors</div>
              <div className="text-lg">
                {status.stats.errors.length}
                {status.stats.errors.length > 0 && (
                  <AlertCircle className="h-4 w-4 text-red-600 inline ml-1" />
                )}
              </div>
            </div>
          </div>
          
          {status.stats.errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm font-medium text-red-800 mb-2">Recent Errors:</div>
              <div className="space-y-1">
                {status.stats.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-700">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
