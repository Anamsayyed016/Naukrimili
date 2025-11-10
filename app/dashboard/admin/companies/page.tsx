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
  Building2, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Globe,
  Users,
  Calendar,
  Phone,
  Mail,
  ArrowLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CompanyEditModal from "./components/CompanyEditModal";
import { formatDate } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
  founded?: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count: {
    jobs: number;
    applications: number;
  };
}

interface CompaniesResponse {
  success: boolean;
  data: {
    companies: Company[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    industry: 'all',
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
    fetchCompanies();
  }, [currentPage, filters]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.industry !== 'all' && { industry: filters.industry }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/companies?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }

      const data: CompaniesResponse = await response.json();
      if (data.success && data.data) {
        // Ensure companies is always an array and validate data
        const validCompanies = Array.isArray(data.data.companies) 
          ? data.data.companies.filter(company => company && company.id && company.name)
          : [];
        setCompanies(validCompanies);
        setPagination(data.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0
        });
        console.log(`✅ Loaded ${validCompanies.length} companies`);
      } else {
        console.error('Invalid API response:', data);
        setCompanies([]);
      }
    } catch (_error) {
      console.error('Error fetching companies:', _error);
      setCompanies([]); // Set empty array on error
      toast({
        title: 'Error',
        description: 'Failed to fetch companies',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCompanies.length === 0) return;

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          companyIds: selectedCompanies
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: 'Success',
            description: data.message
          });
          setSelectedCompanies([]);
          fetchCompanies();
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

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === companies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(companies.map(company => company.id));
    }
  };

  const updateCompanyStatus = async (companyId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Company ${isVerified ? 'verified' : 'unverified'} successfully`
        });
        fetchCompanies();
      }
    } catch (_error) {
      console.error('Error updating company status:', _error);
      toast({
        title: 'Error',
        description: 'Failed to update company status',
        variant: 'destructive'
      });
    }
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowEditModal(true);
  };

  const handleSaveCompany = (updatedCompany: Company) => {
    setCompanies(prev => prev.map(company => 
      company.id === updatedCompany.id ? updatedCompany : company
    ));
    setShowEditModal(false);
    setEditingCompany(null);
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Company deleted successfully'
        });
        fetchCompanies();
      }
    } catch (_error) {
      console.error('Error deleting company:', _error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (company: Company) => {
    if (!company.isActive) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    if (!company.isVerified) {
      return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Unverified</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
  };



  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <Link href="/dashboard/admin" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Company Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and verify all companies</p>
        </div>
        <Button onClick={fetchCompanies} variant="outline" className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="text-xs sm:text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && fetchCompanies()}
                  className="text-sm"
                />
                <Button onClick={fetchCompanies} size="sm" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-2 block">Industry</label>
              <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end sm:col-span-2 lg:col-span-1">
              <Button onClick={() => setFilters({ status: 'all', industry: 'all', search: '' })} variant="outline" className="w-full text-sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCompanies.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="text-xs sm:text-sm font-medium text-blue-900">
                  {selectedCompanies.length} company(ies) selected
                </span>
                <Button
                  onClick={() => setSelectedCompanies([])}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => handleBulkAction('verify')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Verify
                </Button>
                <Button
                  onClick={() => handleBulkAction('unverify')}
                  size="sm"
                  variant="destructive"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Unverify
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Companies ({pagination.total})</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedCompanies.length === companies.length && companies.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          <div className="space-y-3 sm:space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-2 sm:gap-4">
                  <Checkbox
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={() => toggleCompanySelection(company.id)}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4 mb-2">
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 break-words">
                            {company.name}
                          </h3>
                          {getStatusBadge(company)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                          {company.website && (
                            <span className="flex items-center gap-1 break-all">
                              <Globe className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-none">{company.website}</span>
                            </span>
                          )}
                          {company.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              {company.location}
                            </span>
                          )}
                          {company.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              {company.industry}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 flex-1 sm:flex-none"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {company.description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                        {company.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{company._count.jobs} jobs</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{company._count.applications} applications</span>
                      </span>
                      {company.size && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{company.size} employees</span>
                        </span>
                      )}
                      {company.founded && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">Founded {company.founded}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                      <div className="text-xs sm:text-sm text-gray-600 break-words w-full sm:w-auto">
                        <span className="font-medium">Owner:</span> {company.creator?.name || 'Unknown'} <span className="text-gray-500">({company.creator?.email || 'N/A'})</span>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCompanyStatus(company.id, !company.isVerified)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {company.isVerified ? 'Unverify' : 'Verify'}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-xs sm:text-sm">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                Page {currentPage} of {pagination.totalPages} <span className="hidden sm:inline">({pagination.total} total companies)</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Modal */}
      <CompanyEditModal
        company={editingCompany}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCompany(null);
        }}
        onSave={handleSaveCompany}
      />
    </div>
  );
}

