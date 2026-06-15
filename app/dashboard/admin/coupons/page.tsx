'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { toast } from '@/hooks/use-toast';
import { CouponStatsGrid } from './components/CouponStatsGrid';
import { CouponTable, type CouponRow } from './components/CouponTable';
import { CouponFormDialog, type CouponFormValues } from './components/CouponFormDialog';
import { EnhancedPagination } from '@/components/ui/enhanced-pagination';

function AdminCouponsPageContent() {
  const [stats, setStats] = useState(null as Parameters<typeof CouponStatsGrid>[0]['stats']);
  const [statsLoading, setStatsLoading] = useState(true);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });
  const [formOpen, setFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<CouponFormValues | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      console.error('Failed to load coupon stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sort,
        ...(search ? { search } : {}),
        ...(status !== 'all' ? { status } : {}),
      });
      const res = await fetch(`/api/admin/coupons?${params}`);
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data.coupons);
        setPagination(data.data.pagination);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load coupons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, sort]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`);
      const data = await res.json();
      if (data.success) {
        const c = data.data;
        setEditCoupon({
          id: c.id,
          code: c.code,
          name: c.name,
          notes: c.notes ?? '',
          discountType: c.discountType,
          discountValue: c.discountValue,
          maxDiscountAmount: c.maxDiscountAmount,
          minOrderAmount: c.minOrderAmount,
          applicablePlanKeys: Array.isArray(c.applicablePlanKeys) ? c.applicablePlanKeys : [],
          maxRedemptions: c.maxRedemptions,
          maxRedemptionsPerUser: c.maxRedemptionsPerUser,
          validFrom: c.validFrom,
          validUntil: c.validUntil,
          isActive: c.isActive,
          redemptionCount: c.redemptionCount,
        });
        setFormOpen(true);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load coupon', variant: 'destructive' });
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this coupon?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Coupon deactivated' });
        void fetchCoupons();
        void fetchStats();
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to deactivate', variant: 'destructive' });
    }
  };

  const refreshAll = () => {
    void fetchStats();
    void fetchCoupons();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm mb-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Admin
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Coupon Management
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Create and manage discount codes for all plans
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={refreshAll} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setEditCoupon(null);
                setFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden />
              Create Coupon
            </Button>
          </div>
        </div>

        <CouponStatsGrid stats={stats} loading={statsLoading} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
            <Input
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
              aria-label="Search coupons"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 border-gray-300 bg-white text-gray-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full sm:w-40 border-gray-300 bg-white text-gray-900">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="expiry">Expiry</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
              <SelectItem value="code">Code A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading coupons...</div>
        ) : (
          <CouponTable coupons={coupons} onEdit={handleEdit} onDeactivate={handleDeactivate} />
        )}

        {pagination.totalPages > 1 && (
          <EnhancedPagination
            config={{
              page,
              limit: pagination.limit,
              total: pagination.total,
            }}
            onPageChange={setPage}
            compact
          />
        )}

        <CouponFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditCoupon(null);
          }}
          onSuccess={refreshAll}
          initial={editCoupon}
        />
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/auth/signin">
      <AdminCouponsPageContent />
    </AuthGuard>
  );
}
