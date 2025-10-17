"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  User,
  MapPin,
  Calendar,
  Trash2,
  RefreshCw,
  FileText,
  Mail,
  Phone,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    profilePicture: string;
  };
  job: {
    id: number;
    title: string;
    location: string;
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

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
}

interface JobsResponse {
  success: boolean;
  data: {
    jobs: Job[];
  };
}

export default function EmployerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [jobId, setJobId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchApplications();
  }, [currentPage, status, jobId]);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (debouncedSearch !== search) {
      setCurrentPage(1);
    }
    fetchApplications();
  }, [debouncedSearch]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(status !== "all" && { status }),
        ...(jobId !== "all" && { jobId }),
        ...(debouncedSearch && { search: debouncedSearch })
      });

      const response = await fetch(`/api/employer/applications?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data: ApplicationsResponse = await response.json();
      if (data.success) {
        setApplications(data.data.applications);
        setPagination(data.data.pagination);
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch applications', {
        description: err instanceof Error ? err.message : 'An error occurred'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, status, jobId, debouncedSearch]);

  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await fetch('/api/employer/jobs?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data: JobsResponse = await response.json();
      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      toast.error('Failed to load job options');
    } finally {
      setJobsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setCurrentPage(1);
  };

  const handleJobIdChange = (newJobId: string) => {
    setJobId(newJobId);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setJobId("all");
    setCurrentPage(1);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setApplications(prev => prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          ));
          
          toast.success(`Application status updated to ${newStatus}`, {
            description: 'The candidate will be notified of this change'
          });
        } else {
          throw new Error(result.error || 'Failed to update application status');
        }
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      toast.error('Failed to update status', {
        description: errorMessage
      });
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      setDeletingId(applicationId);
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Remove from local state
          setApplications(prev => prev.filter(app => app.id !== applicationId));
          setPagination(prev => ({ ...prev, total: prev.total - 1 }));
          
          toast.success('Application deleted successfully', {
            description: 'The application has been permanently removed'
          });
        } else {
          throw new Error(result.error || 'Failed to delete application');
        }
      } else {
        throw new Error('Failed to delete application');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete application';
      toast.error('Failed to delete application', {
        description: errorMessage
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>;
      case 'reviewed':
        return <Badge variant="default"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'interview':
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Interview</Badge>;
      case 'hired':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };


  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
              <Users className="h-12 w-12 text-blue-600" />
              Job Applications
            </h1>
            <p className="text-slate-600 text-xl">
              Review, manage and track all job applications
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block text-slate-700">
                    <Search className="h-4 w-4 inline mr-1" />
                    Search Candidates
                  </label>
                  <Input
                    placeholder="Search by name, skills, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Real-time search with 500ms debounce</p>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block text-slate-700">Status</label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">📋 Submitted</SelectItem>
                      <SelectItem value="reviewed">👀 Reviewed</SelectItem>
                      <SelectItem value="interview">📞 Interview</SelectItem>
                      <SelectItem value="hired">✅ Hired</SelectItem>
                      <SelectItem value="rejected">❌ Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block text-slate-700">Filter by Job</label>
                  <Select value={jobId} onValueChange={handleJobIdChange} disabled={jobsLoading}>
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder={jobsLoading ? "Loading jobs..." : "Select job"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} - {job.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {jobs.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{jobs.length} jobs available</p>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <Button 
                    onClick={fetchApplications} 
                    variant="outline" 
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    onClick={clearFilters} 
                    variant="outline" 
                    className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50/50 pb-4">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  Applications
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-0 text-lg px-4 py-1">
                  {pagination.total} Total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
          {error && (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchApplications}>Retry</Button>
            </div>
          )}

          {applications.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {search || status !== "all" || jobId !== "all" 
                  ? "No applications match your current filters. Try adjusting your search criteria."
                  : "No candidates have applied yet. Post more jobs to attract applicants."
                }
              </p>
              {(search || status !== "all" || jobId !== "all") && (
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-4">
                {applications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl p-6 group"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {application.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors">
                              {application.user.name}
                            </h3>
                            <p className="text-sm text-slate-600">{application.job.title}</p>
                          </div>
                          {getStatusBadge(application.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-blue-600" />
                            {application.user.email}
                          </span>
                          {application.user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-green-600" />
                              {application.user.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-orange-600" />
                            {application.user.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            {formatDate(application.appliedAt)}
                          </span>
                        </div>

                        {application.coverLetter && (
                          <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Cover Letter
                            </p>
                            <p className="text-sm text-slate-700 line-clamp-2">
                              {application.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Link href={`/employer/applications/${application.id}`} className="w-full">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                            disabled={application.status === 'reviewed'}
                            className="border-slate-300 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Reviewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'interview')}
                            disabled={application.status === 'interview'}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'hired')}
                            disabled={application.status === 'hired'}
                            className="border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Hired
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            disabled={application.status === 'rejected'}
                            className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-all mt-2"
                              disabled={deletingId === application.id}
                            >
                              {deletingId === application.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Application
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="sm:max-w-[500px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Trash2 className="h-6 w-6 text-red-600" />
                                Delete Application?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base">
                                <div className="space-y-4 mt-4">
                                  <p className="text-slate-700">
                                    This action cannot be undone. The application will be permanently deleted.
                                  </p>
                                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <p className="font-semibold text-slate-900 mb-2">Application Details:</p>
                                    <p className="text-slate-700">
                                      <strong>Candidate:</strong> {application.user.name}
                                    </p>
                                    <p className="text-slate-700">
                                      <strong>Job:</strong> {application.job.title}
                                    </p>
                                    <p className="text-slate-700">
                                      <strong>Applied:</strong> {formatDate(application.appliedAt)}
                                    </p>
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-slate-300 hover:bg-slate-50">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteApplication(application.id)}
                                className="bg-red-600 text-white hover:bg-red-700 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600 mb-4 sm:mb-0">
                  Showing <span className="font-semibold text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-slate-900">{pagination.total}</span> results
                </p>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-700 rounded-lg">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </div>
  );
}
