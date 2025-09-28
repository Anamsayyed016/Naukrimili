"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Briefcase, 
  Search, 
  Filter,
  Eye,
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Star,
  Wifi,
  WifiOff
} from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  notes?: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salary?: string;
    isRemote: boolean;
  };
  company: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
  };
}

interface ApplicationsResponse {
  success: boolean;
  data: {
    applications: Application[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function JobSeekerApplicationsPage() {
  const { socket, isConnected, notifications } = useSocket();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [currentPage, filters]);

  // Real-time Socket.io integration
  useEffect(() => {
    if (!socket) return;

    // Listen for application status updates
    const handleApplicationStatusUpdate = (data: { applicationId: string; newStatus: string; application?: Application }) => {
      console.log('📊 Real-time application status update:', data);
      
      setApplications(prev => {
        const updated = prev.map(app => 
          app.id === data.applicationId 
            ? { ...app, status: data.newStatus }
            : app
        );
        
        // If we received the full application object, use it
        if (data.application) {
          const existingIndex = updated.findIndex(app => app.id === data.applicationId);
          if (existingIndex !== -1) {
            updated[existingIndex] = data.application;
          }
        }
        
        return updated;
      });
      
      setLastUpdateTime(new Date());
      
      // Show toast notification
      toast({
        title: 'Application Updated',
        description: `Your application status has been updated to ${data.newStatus}`,
      });
    };

    // Listen for new applications (when user applies)
    const handleNewApplication = (data: { application: Application }) => {
      console.log('📝 Real-time new application:', data);
      
      setApplications(prev => [data.application, ...prev]);
      setLastUpdateTime(new Date());
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total + 1
      }));
      
      // Show toast notification
      toast({
        title: 'Application Submitted',
        description: `Successfully applied for ${data.application.job.title}`,
      });
    };

    // Listen for application-related notifications
    const handleApplicationNotification = (notification: any) => {
      if (notification.type === 'APPLICATION_UPDATE' || notification.type === 'INTERVIEW_SCHEDULED') {
        // Refresh applications when receiving application-related notifications
        fetchApplications();
        setLastUpdateTime(new Date());
      }
    };

    // Register event listeners
    socket.on('application_status_updated', handleApplicationStatusUpdate);
    socket.on('new_application', handleNewApplication);
    socket.on('new_notification', handleApplicationNotification);

    return () => {
      socket.off('application_status_updated', handleApplicationStatusUpdate);
      socket.off('new_application', handleNewApplication);
      socket.off('new_notification', handleApplicationNotification);
    };
  }, [socket]);

  // Listen for notifications that might affect applications
  useEffect(() => {
    const applicationNotifications = notifications.filter(
      n => n.type === 'APPLICATION_UPDATE' || 
           n.type === 'INTERVIEW_SCHEDULED' || 
           n.type === 'JOB_APPLICATION_RECEIVED' && !n.isRead
    );
    
    if (applicationNotifications.length > 0) {
      // Refresh applications when we have new application-related notifications
      fetchApplications();
      setLastUpdateTime(new Date());
    }
  }, [notifications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      console.log('🔍 Fetching applications with params:', params.toString());
      const response = await fetch(`/api/applications?${params}`);
      console.log('📊 Applications API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data: ApplicationsResponse = await response.json();
      console.log('📊 Applications data received:', data);
      
      if (data.success) {
        setApplications(data.data.applications);
        setPagination(data.data.pagination);
        console.log('✅ Applications updated:', data.data.applications.length, 'applications');
      } else {
        console.error('❌ Applications API returned error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'interview':
        return <Badge className="bg-purple-100 text-purple-800"><CheckCircle className="h-3 w-3 mr-1" />Interview</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusCounts = () => {
    const counts = {
      submitted: 0,
      reviewed: 0,
      interview: 0,
      hired: 0,
      rejected: 0
    };

    applications.forEach(app => {
      const status = app.status.toLowerCase();
      if (counts.hasOwnProperty(status)) {
        counts[status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const statusCounts = getStatusCounts();

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Application Tracking</h1>
            {/* Real-time Connection Status */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              {lastUpdateTime && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">Track your job applications and their status in real-time</p>
        </div>
        <Link href="/jobs">
          <Button>
            <Briefcase className="h-4 w-4 mr-2" />
            Browse Jobs
          </Button>
        </Link>
      </div>

      {/* Application Stats - Real-time Updates */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className={`transition-all duration-300 ${lastUpdateTime ? 'shadow-md' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Submitted</p>
                <p className="text-2xl font-bold transition-all duration-500">{statusCounts.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-300 ${lastUpdateTime ? 'shadow-md' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold transition-all duration-500">{statusCounts.reviewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-300 ${lastUpdateTime ? 'shadow-md' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interview</p>
                <p className="text-2xl font-bold transition-all duration-500">{statusCounts.interview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-300 ${lastUpdateTime ? 'shadow-md' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hired</p>
                <p className="text-2xl font-bold transition-all duration-500">{statusCounts.hired}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-all duration-300 ${lastUpdateTime ? 'shadow-md' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold transition-all duration-500">{statusCounts.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search jobs or companies..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && fetchApplications()}
                />
                <Button onClick={fetchApplications} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => setFilters({ status: 'all', search: '' })} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Applications ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 && !loading ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600 mb-6">
                Start applying to jobs to track your applications here
              </p>
              <Link href="/jobs">
                <Button>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {application.job.title}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {application.job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {application.job.jobType}
                        </span>
                        {application.job.isRemote && (
                          <Badge variant="outline">Remote</Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied {formatDate(application.appliedAt)}
                        </span>
                      </div>

                      {application.job.salary && (
                        <div className="text-sm text-green-700 font-medium mb-3">
                          {application.job.salary}
                        </div>
                      )}

                      {application.coverLetter && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {application.coverLetter}
                          </p>
                        </div>
                      )}

                      {application.notes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {application.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/jobs/${application.job.id}/apply`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Job
                        </Button>
                      </Link>
                      <Link href={`/applications/${application.id}`}>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {pagination.totalPages} ({pagination.total} total applications)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
