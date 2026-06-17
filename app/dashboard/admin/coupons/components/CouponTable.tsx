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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { CouponStatusBadge, CouponUsageProgress, type CouponStatus } from './CouponStatusBadge';
import { CouponPlansDisplay } from './CouponPlansDisplay';
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
  isActive: boolean;
}

interface CouponTableProps {
  coupons: CouponRow[];
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (coupon: CouponRow) => void;
}

function formatValue(type: string, value: number) {
  if (type === 'percentage') return `${value}%`;
  return `₹${(value / 100).toLocaleString('en-IN')}`;
}

function formatDiscountLabel(type: string, value: number) {
  if (type === 'percentage') return `${value}% off`;
  return `₹${(value / 100).toLocaleString('en-IN')} off`;
}

function CouponActionsMenu({
  coupon,
  onEdit,
  onToggleActive,
  onDelete,
  triggerClassName,
}: {
  coupon: CouponRow;
  onEdit: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (coupon: CouponRow) => void;
  triggerClassName?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={triggerClassName}
          aria-label={`Actions for ${coupon.code}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(coupon.id)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onToggleActive(coupon.id, !coupon.isActive)}
        >
          {coupon.isActive ? (
            <>
              <Ban className="h-4 w-4 mr-2" />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(coupon)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CouponTable({
  coupons,
  onEdit,
  onToggleActive,
  onDelete,
}: CouponTableProps) {
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
      <Card className="hidden md:block overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Value</TableHead>
                <TableHead className="font-semibold min-w-[140px]">Plans</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Usage</TableHead>
                <TableHead className="font-semibold">Expiry</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50/80">
                  <TableCell className="font-mono font-semibold text-gray-900">
                    {c.code}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-gray-700" title={c.name}>
                    {c.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize border-gray-200 text-gray-700">
                      {c.discountType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {formatValue(c.discountType, c.discountValue)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 max-w-[200px]">
                    <CouponPlansDisplay
                      planKeys={c.applicablePlanKeys}
                      className="line-clamp-2"
                    />
                  </TableCell>
                  <TableCell>
                    <CouponUsageProgress used={c.redemptionCount} max={c.maxRedemptions} />
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                    {formatDate(c.validUntil)}
                  </TableCell>
                  <TableCell>
                    <CouponStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <CouponActionsMenu
                      coupon={c}
                      onEdit={onEdit}
                      onToggleActive={onToggleActive}
                      onDelete={onDelete}
                    />
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
          <Card key={c.id} className="p-4 bg-white shadow-sm border-gray-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold text-gray-900 truncate">{c.code}</p>
                <p className="text-sm text-gray-600 truncate mt-0.5">{c.name}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <CouponStatusBadge status={c.status} />
                <CouponActionsMenu
                  coupon={c}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  onDelete={onDelete}
                />
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Discount</span>
                <span className="font-semibold text-indigo-700 capitalize">
                  {formatDiscountLabel(c.discountType, c.discountValue)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-gray-500 shrink-0">Plans</span>
                <div className="text-right min-w-0">
                  <CouponPlansDisplay
                    planKeys={c.applicablePlanKeys}
                    className="text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-gray-500">Usage</span>
                </div>
                <CouponUsageProgress used={c.redemptionCount} max={c.maxRedemptions} />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                <span className="text-gray-500">Expiry</span>
                <span className="font-medium text-gray-800">{formatDate(c.validUntil)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
