"use client";

import { useState, useEffect } from "react";
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
  Mail
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
      console.error('Error fetching companies:', error);
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
      console.error('Error performing bulk action:', error);
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
      console.error('Error updating company status:', error);
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
      console.error('Error deleting company:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">Manage and verify all companies</p>
        </div>
        <Button onClick={fetchCompanies} variant="outline">
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
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && fetchCompanies()}
                />
                <Button onClick={fetchCompanies} size="sm">
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
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Industry</label>
              <Select value={filters.industry} onValueChange={(value) => setFilters(prev => ({ ...prev, industry: value }))}>
                <SelectTrigger>
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

            <div className="flex items-end">
              <Button onClick={() => setFilters({ status: 'all', industry: 'all', search: '' })} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCompanies.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCompanies.length} company(ies) selected
                </span>
                <Button
                  onClick={() => setSelectedCompanies([])}
                  variant="outline"
                  size="sm"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleBulkAction('verify')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify
                </Button>
                <Button
                  onClick={() => handleBulkAction('unverify')}
                  size="sm"
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
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
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div key={company.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedCompanies.includes(company.id)}
                    onCheckedChange={() => toggleCompanySelection(company.id)}
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {company.name}
                          </h3>
                          {getStatusBadge(company)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          {company.website && (
                            <span className="flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              {company.website}
                            </span>
                          )}
                          {company.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {company.location}
                            </span>
                          )}
                          {company.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {company.industry}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Joined {formatDate(company.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCompany(company)}
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCompany(company.id)}
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {company.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {company.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {company._count.jobs} jobs
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company._count.applications} applications
                      </span>
                      {company.size && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.size} employees
                        </span>
                      )}
                      {company.founded && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Founded {company.founded}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Owner:</span> {company.creator?.name || 'Unknown'} ({company.creator?.email || 'N/A'})
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCompanyStatus(company.id, !company.isVerified)}
                        >
                          {company.isVerified ? 'Unverify' : 'Verify'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
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
                Page {currentPage} of {pagination.totalPages} ({pagination.total} total companies)
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

