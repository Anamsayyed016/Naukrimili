'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CouponPlanChips } from './CouponPlanChips';
import { CouponPreviewCard } from './CouponPreviewCard';

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export interface CouponFormValues {
  id?: string;
  code: string;
  name: string;
  notes: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  applicablePlanKeys: string[];
  maxRedemptions: number | null;
  maxRedemptionsPerUser: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  redemptionCount?: number;
}

interface CouponFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initial?: CouponFormValues | null;
}

const defaultValues: CouponFormValues = {
  code: '',
  name: '',
  notes: '',
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountAmount: null,
  minOrderAmount: null,
  applicablePlanKeys: [],
  maxRedemptions: 100,
  maxRedemptionsPerUser: 1,
  validFrom: new Date().toISOString().slice(0, 16),
  validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  isActive: true,
  redemptionCount: 0,
};

const labelClass = 'text-sm font-medium text-gray-700';
const fieldClass = 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400';

export function CouponFormDialog({ open, onClose, onSuccess, initial }: CouponFormDialogProps) {
  const [form, setForm] = useState<CouponFormValues>(defaultValues);
  const [loading, setLoading] = useState(false);
  const [unlimitedUsage, setUnlimitedUsage] = useState(false);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          ...initial,
          validFrom: new Date(initial.validFrom).toISOString().slice(0, 16),
          validUntil: new Date(initial.validUntil).toISOString().slice(0, 16),
          discountValue:
            initial.discountType === 'fixed'
              ? initial.discountValue / 100
              : initial.discountValue,
          minOrderAmount: initial.minOrderAmount ? initial.minOrderAmount / 100 : null,
          maxDiscountAmount: initial.maxDiscountAmount
            ? initial.maxDiscountAmount / 100
            : null,
        });
        setUnlimitedUsage(initial.maxRedemptions == null);
      } else {
        setForm(defaultValues);
        setUnlimitedUsage(false);
      }
    }
  }, [open, initial]);

  const previewData = useMemo(
    () => ({
      code: form.code ? normalizeCode(form.code) : 'COUPON',
      name: form.name,
      discountType: form.discountType,
      discountValue:
        form.discountType === 'fixed'
          ? Math.round(form.discountValue * 100)
          : form.discountValue,
      minOrderAmount: form.minOrderAmount ? Math.round(form.minOrderAmount * 100) : null,
      applicablePlanKeys: form.applicablePlanKeys,
      maxRedemptions: unlimitedUsage ? null : form.maxRedemptions,
      redemptionCount: form.redemptionCount ?? 0,
      validUntil: form.validUntil,
    }),
    [form, unlimitedUsage]
  );

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: 'Error', description: 'Code and name are required', variant: 'destructive' });
      return;
    }
    if (form.applicablePlanKeys.length === 0) {
      toast({ title: 'Error', description: 'Select at least one plan', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        notes: form.notes || null,
        discountType: form.discountType,
        discountValue:
          form.discountType === 'fixed'
            ? Math.round(form.discountValue * 100)
            : Math.round(form.discountValue),
        maxDiscountAmount:
          form.discountType === 'percentage' && form.maxDiscountAmount
            ? Math.round(form.maxDiscountAmount * 100)
            : null,
        minOrderAmount: form.minOrderAmount ? Math.round(form.minOrderAmount * 100) : null,
        applicablePlanKeys: form.applicablePlanKeys,
        maxRedemptions: unlimitedUsage ? null : form.maxRedemptions,
        maxRedemptionsPerUser: form.maxRedemptionsPerUser,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
        isActive: form.isActive,
      };

      const url = isEdit ? `/api/admin/coupons/${initial!.id}` : '/api/admin/coupons';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save coupon');
      }
      toast({ title: 'Success', description: isEdit ? 'Coupon updated' : 'Coupon created' });
      onSuccess();
      onClose();
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[min(100vw-2rem,64rem)] max-w-5xl flex-col gap-0 overflow-hidden bg-white p-0 text-gray-900">
        <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Coupon' : 'Create Coupon'}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto px-6 py-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:overflow-hidden">
            {/* Form column — independent scroll on desktop */}
            <div className="min-w-0 space-y-4 lg:max-h-[calc(90vh-10.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coupon-code" className={labelClass}>Coupon Code</Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={isEdit}
                  className={cn('font-mono uppercase', fieldClass)}
                  placeholder="ANAM10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-name" className={labelClass}>Name</Label>
                <Input
                  id="coupon-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Launch discount"
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={labelClass}>Discount Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v: 'percentage' | 'fixed') =>
                    setForm({ ...form, discountType: v })
                  }
                >
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value" className={labelClass}>
                  {form.discountType === 'percentage' ? 'Percentage' : 'Amount (₹)'}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min={1}
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            {form.discountType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="max-discount" className={labelClass}>Max Discount Cap (₹, optional)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className={fieldClass}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="min-purchase" className={labelClass}>Min Purchase (₹, optional)</Label>
              <Input
                id="min-purchase"
                type="number"
                min={0}
                value={form.minOrderAmount ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    minOrderAmount: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Applicable Plans</Label>
              <CouponPlanChips
                selected={form.applicablePlanKeys}
                onChange={(keys) => setForm({ ...form, applicablePlanKeys: keys })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-redemptions" className={labelClass}>Max Redemptions</Label>
                <Input
                  id="max-redemptions"
                  type="number"
                  min={1}
                  disabled={unlimitedUsage}
                  value={form.maxRedemptions ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxRedemptions: parseInt(e.target.value, 10) || null,
                    })
                  }
                  className={fieldClass}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <Switch checked={unlimitedUsage} onCheckedChange={setUnlimitedUsage} />
                  Unlimited
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="per-user" className={labelClass}>Per User Limit</Label>
                <Input
                  id="per-user"
                  type="number"
                  min={1}
                  value={form.maxRedemptionsPerUser}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxRedemptionsPerUser: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid-from" className={labelClass}>Valid From</Label>
                <Input
                  id="valid-from"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid-until" className={labelClass}>Valid Until</Label>
                <Input
                  id="valid-until"
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label htmlFor="is-active" className={labelClass}>Active</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className={labelClass}>Notes (internal)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className={fieldClass}
              />
            </div>
            </div>

            {/* Preview column — fixed width, never overlaps form */}
            <div className="min-w-0 lg:self-start lg:overflow-y-auto lg:max-h-[calc(90vh-10.5rem)]">
              <CouponPreviewCard coupon={previewData} />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-gray-200 bg-white px-6 py-4 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
