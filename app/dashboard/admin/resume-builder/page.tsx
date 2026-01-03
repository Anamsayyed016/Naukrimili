"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, 
  Search, 
  Filter,
  MoreHorizontal,
  Eye,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Download,
  Sparkles,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AuthGuard from "@/components/auth/AuthGuard";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResumeUser {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  planType: 'individual' | 'business' | 'none';
  planName: string | null;
  status: 'active' | 'expired' | 'none';
  pdfUsed: number;
  pdfLimit: number;
  dailyUsed: number;
  dailyLimit: number | null;
  aiResumeUsed: number;
  aiResumeLimit: number;
  aiCoverLetterUsed: number;
  aiCoverLetterLimit: number;
  creditsRemaining: number | null;
  expiryDate: string | null;
  daysRemaining: number | null;
}

interface ResumeUsersResponse {
  success: boolean;
  data: {
    users: ResumeUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

function AdminResumeBuilderPageContent() {
  const [users, setUsers] = useState<ResumeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    planType: 'all',
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.planType !== 'all' && { planType: filters.planType }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/resume-users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: ResumeUsersResponse = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (_error) {
      console.error('Error fetching resume users:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resume builder users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const getPlanTypeBadge = (planType: string) => {
    switch (planType) {
      case 'individual':
        return <Badge className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Individual</Badge>;
      case 'business':
        return <Badge className="bg-purple-100 text-purple-800"><Building2 className="h-3 w-3 mr-1" />Business</Badge>;
      default:
        return <Badge variant="outline">No Plan</Badge>;
    }
  };

  const getStatusBadge = (user: ResumeUser) => {
    if (user.status === 'expired') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (user.status === 'active') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
    return <Badge variant="secondary">No Plan</Badge>;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resume builder users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-auto">
            <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 text-sm">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resume Builder Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor usage, plans, and limits</p>
          </div>
          <Button onClick={fetchUsers} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-xl font-bold">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Filter className="h-5 w-5 text-gray-700" />
              </div>
              Filters & Search
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Filter and search through resume builder users</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Search Users</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Search by name, email..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 flex-1"
                  />
                  <Button onClick={fetchUsers} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    <Search className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Plan Type</label>
                <Select value={filters.planType} onValueChange={(value) => setFilters(prev => ({ ...prev, planType: value }))}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl rounded-md border border-gray-200 z-50">
                    <SelectItem value="all" className="hover:bg-gray-100 cursor-pointer">All Plans</SelectItem>
                    <SelectItem value="individual" className="hover:bg-gray-100 cursor-pointer">Individual</SelectItem>
                    <SelectItem value="business" className="hover:bg-gray-100 cursor-pointer">Business</SelectItem>
                    <SelectItem value="none" className="hover:bg-gray-100 cursor-pointer">No Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl rounded-md border border-gray-200 z-50">
                    <SelectItem value="all" className="hover:bg-gray-100 cursor-pointer">All Status</SelectItem>
                    <SelectItem value="active" className="hover:bg-gray-100 cursor-pointer">Active</SelectItem>
                    <SelectItem value="expired" className="hover:bg-gray-100 cursor-pointer">Expired</SelectItem>
                    <SelectItem value="low_credits" className="hover:bg-gray-100 cursor-pointer">Low Credits (≤20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={() => setFilters({ planType: 'all', status: 'all', search: '' })} variant="outline" className="w-full bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-white border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                Resume Builder Users ({pagination.total})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="border-gray-400"
                />
                <span className="text-sm font-semibold text-gray-700">Select All</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="border-2 border-gray-100 rounded-xl p-4 sm:p-6 bg-white hover:bg-gray-50 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        className="border-gray-400 mt-1 flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between mb-2 gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-semibold text-base sm:text-lg text-gray-900 break-words">
                                {user.name}
                              </h3>
                              {getPlanTypeBadge(user.planType)}
                              {getStatusBadge(user)}
                            </div>
                            <p className="text-sm text-gray-600 break-all">{user.email}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.location.href = `/dashboard/admin/users?userId=${user.id}&tab=resume-builder`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          {/* Plan Info */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">Plan</div>
                            <div className="font-semibold text-gray-900">{user.planName || 'No Plan'}</div>
                            {user.daysRemaining !== null && (
                              <div className="text-xs text-gray-500 mt-1">
                                {user.daysRemaining} days remaining
                              </div>
                            )}
                          </div>

                          {/* PDF Usage */}
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              PDF Downloads
                            </div>
                            <div className="font-semibold text-gray-900">
                              {user.pdfUsed} / {user.pdfLimit === -1 ? '∞' : user.pdfLimit}
                            </div>
                            {user.pdfLimit > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    getUsagePercentage(user.pdfUsed, user.pdfLimit) > 80 ? 'bg-red-500' :
                                    getUsagePercentage(user.pdfUsed, user.pdfLimit) > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${getUsagePercentage(user.pdfUsed, user.pdfLimit)}%` }}
                                />
                              </div>
                            )}
                            {user.dailyLimit && (
                              <div className="text-xs text-gray-500 mt-1">
                                Daily: {user.dailyUsed} / {user.dailyLimit}
                              </div>
                            )}
                          </div>

                          {/* AI Usage */}
                          {user.aiResumeLimit !== -1 && (
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Resume
                              </div>
                              <div className="font-semibold text-gray-900">
                                {user.aiResumeUsed} / {user.aiResumeLimit === -1 ? '∞' : user.aiResumeLimit}
                              </div>
                            </div>
                          )}

                          {/* Credits (Business) */}
                          {user.planType === 'business' && user.creditsRemaining !== null && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                Credits
                              </div>
                              <div className="font-semibold text-gray-900">
                                {user.creditsRemaining} remaining
                              </div>
                              {user.pdfLimit > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {Math.round((user.creditsRemaining / user.pdfLimit) * 100)}% remaining
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {user.expiryDate && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="h-3 w-3" />
                            <span>Expires: {formatDate(user.expiryDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminResumeBuilderPage() {
  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/auth/signin">
      <AdminResumeBuilderPageContent />
    </AuthGuard>
  );
}

