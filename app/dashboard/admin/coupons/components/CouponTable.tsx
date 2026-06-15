'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Ban } from 'lucide-react';
import { PLAN_DISPLAY_NAMES, type PlanKey } from '@/lib/services/razorpay-plans';
import { CouponStatusBadge, CouponUsageProgress, type CouponStatus } from './CouponStatusBadge';
import { formatDate } from '@/lib/utils';

export interface CouponRow {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  applicablePlanKeys: unknown;
  redemptionCount: number;
  maxRedemptions: number | null;
  validUntil: string;
  status: CouponStatus;
}

interface CouponTableProps {
  coupons: CouponRow[];
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
}

function formatValue(type: string, value: number) {
  if (type === 'percentage') return `${value}%`;
  return `₹${(value / 100).toLocaleString('en-IN')}`;
}

function planLabel(keys: unknown) {
  if (!Array.isArray(keys)) return '—';
  const labels = keys.slice(0, 2).map((k) => PLAN_DISPLAY_NAMES[k as PlanKey] ?? k);
  const extra = keys.length > 2 ? ` +${keys.length - 2}` : '';
  return labels.join(', ') + extra;
}

export function CouponTable({ coupons, onEdit, onDeactivate }: CouponTableProps) {
  if (coupons.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500 bg-white">
        No coupons found. Create your first coupon to get started.
      </Card>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden bg-white">
        <div className="overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Plans</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-semibold">{c.code}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatValue(c.discountType, c.discountValue)}</TableCell>
                  <TableCell className="text-xs max-w-[160px] truncate" title={planLabel(c.applicablePlanKeys)}>
                    {planLabel(c.applicablePlanKeys)}
                  </TableCell>
                  <TableCell>
                    <CouponUsageProgress used={c.redemptionCount} max={c.maxRedemptions} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(c.validUntil)}
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for ${c.code}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(c.id)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeactivate(c.id)}
                          className="text-red-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {coupons.map((c) => (
          <Card key={c.id} className="p-4 bg-white">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="font-mono font-bold text-gray-900">{c.code}</p>
                <p className="text-sm text-gray-600 truncate">{c.name}</p>
              </div>
              <CouponStatusBadge status={c.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Value</span>
                <p className="font-medium">{formatValue(c.discountType, c.discountValue)}</p>
              </div>
              <div>
                <span className="text-gray-500">Expires</span>
                <p className="font-medium">{formatDate(c.validUntil)}</p>
              </div>
            </div>
            <CouponUsageProgress used={c.redemptionCount} max={c.maxRedemptions} className="mb-3" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(c.id)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => onDeactivate(c.id)}
              >
                Deactivate
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
