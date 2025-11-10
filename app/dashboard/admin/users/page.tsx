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
  Users, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  ArrowLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import UserEditModal from "./components/UserEditModal";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    applications: number;
    createdJobs: number;
    createdCompanies: number;
  };
}

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    role: 'all',
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
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/users?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (_error) {
      console.error('Error fetching users:', _error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message
          });
          setSelectedUsers([]);
          fetchUsers();
        }
      }
    } catch (_error) {
      console.error('Error performing bulk action:', _error);
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive'
      });
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

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
        fetchUsers();
      }
    } catch (_error) {
      console.error('Error updating user status:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully'
        });
        fetchUsers();
      }
    } catch (_error) {
      console.error('Error deleting user:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'employer':
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Employer</Badge>;
      case 'jobseeker':
        return <Badge className="bg-blue-100 text-blue-800"><Users className="h-3 w-3 mr-1" />Jobseeker</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) {
      return <Badge variant="destructive"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (!user.isVerified) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Unverified</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };



  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage and moderate all users on your platform</p>
          </div>
          <Button onClick={fetchUsers} variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
            <Users className="h-4 w-4 mr-2" />
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
            <p className="text-sm text-gray-600 mt-1">Filter and search through all users on your platform</p>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Search Users</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search users by name, email..."
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
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Role</label>
              <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl rounded-md border border-gray-200 z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 cursor-pointer">All Roles</SelectItem>
                  <SelectItem value="admin" className="hover:bg-gray-100 cursor-pointer">Admin</SelectItem>
                  <SelectItem value="employer" className="hover:bg-gray-100 cursor-pointer">Employer</SelectItem>
                  <SelectItem value="jobseeker" className="hover:bg-gray-100 cursor-pointer">Jobseeker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl rounded-md border border-gray-200 z-50">
                  <SelectItem value="all" className="hover:bg-gray-100 cursor-pointer">All Status</SelectItem>
                  <SelectItem value="active" className="hover:bg-gray-100 cursor-pointer">Active</SelectItem>
                  <SelectItem value="inactive" className="hover:bg-gray-100 cursor-pointer">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => setFilters({ role: 'all', status: 'all', search: '' })} variant="outline" className="w-full bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} user(s) selected
                </span>
                <Button
                  onClick={() => setSelectedUsers([])}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleBulkAction('activate')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkAction('deactivate')}
                  size="sm"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card className="bg-white border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              Users ({pagination.total})
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
            {users.map((user) => (
              <div key={user.id} className="border-2 border-gray-100 rounded-xl p-6 bg-white hover:bg-gray-50 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => toggleUserSelection(user.id)}
                    className="border-gray-400 mt-1"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {user.name || 'No Name'}
                          </h3>
                          {getRoleBadge(user.role)}
                          {getStatusBadge(user)}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{user.email}</span>
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span className="truncate">{user.phone}</span>
                            </span>
                          )}
                          {user.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{user.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className="truncate">Joined {formatDate(user.createdAt)}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="truncate">{user._count.applications} applications</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                        <span className="truncate">{user._count.createdJobs} jobs</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-4 w-4" />
                        <span className="truncate">{user._count.createdCompanies} companies</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t-2 border-gray-100">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateUserStatus(user.id, !user.isActive)}
                          className={`font-semibold ${
                            user.isActive 
                              ? 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300' 
                              : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-semibold"
                        >
                          <Eye className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 font-semibold"
                        >
                          <Edit className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {pagination.totalPages} ({pagination.total} total users)
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

      {/* Edit User Modal */}
      <UserEditModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
      />
      </div>
    </div>
  );
}

