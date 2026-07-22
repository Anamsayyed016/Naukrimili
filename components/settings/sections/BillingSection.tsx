'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import {
  SettingsEmptyState,
  SettingsSectionCard,
} from '@/components/settings/SettingsPrimitives';
import { CreditCard, Loader2, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentHistoryItem {
  id: string;
  planName: string;
  planType: string;
  status: string;
  amountRupees: number;
  discountAmountRupees: number;
  createdAt: string;
  paymentMethod?: string | null;
}

interface CouponHistoryItem {
  id: string;
  code: string | null;
  name: string | null;
  planKey: string;
  discountAmountRupees: number;
  finalAmountRupees: number;
  redeemedAt: string;
}

function statusBadgeClass(status: string) {
  const value = status.toLowerCase();
  if (value === 'captured' || value === 'paid' || value === 'success') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value === 'failed' || value === 'refunded') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function BillingSection() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [coupons, setCoupons] = useState<CouponHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/payments/history');
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load billing history');
        }
        if (!cancelled) {
          setPayments(json.payments || []);
          setCoupons(json.couponHistory || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestPayment = payments[0];
  const totalSaved = coupons.reduce(
    (sum, coupon) => sum + (coupon.discountAmountRupees || 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Latest payment
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {latestPayment
              ? `₹${latestPayment.amountRupees.toLocaleString('en-IN')}`
              : '—'}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            {latestPayment
              ? new Date(latestPayment.createdAt).toLocaleDateString('en-IN')
              : 'No payments yet'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Transactions
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {payments.length}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">Payment history records</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Coupon savings
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            ₹{totalSaved.toLocaleString('en-IN')}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Across {coupons.length} redemption{coupons.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <SettingsSectionCard
        title="Current plan & credits"
        description="Live plan status from the existing payments system."
        action={
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/pricing?return=/settings?section=billing">
              Upgrade plan
            </Link>
          </Button>
        }
      >
        <PaymentStatusCard />
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Payment history"
        description="Recent invoices and plan purchases."
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading invoices…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : payments.length === 0 ? (
          <SettingsEmptyState
            icon={CreditCard}
            title="No payment history"
            description="When you purchase a plan, invoices and receipts will appear here."
            action={
              <Button asChild className="rounded-xl">
                <Link href="/pricing">View plans</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr className="text-left text-[12px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-t border-slate-100 transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {payment.planName}
                        </div>
                        <div className="text-[12px] text-slate-500 capitalize">
                          {payment.planType}
                          {payment.paymentMethod
                            ? ` · ${payment.paymentMethod}`
                            : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        ₹{payment.amountRupees.toLocaleString('en-IN')}
                        {payment.discountAmountRupees > 0 ? (
                          <span className="ml-1 text-[12px] font-normal text-emerald-600">
                            (−₹{payment.discountAmountRupees})
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            'rounded-full border capitalize',
                            statusBadgeClass(payment.status)
                          )}
                        >
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Coupon history"
        description="Coupons you have already redeemed."
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <SettingsEmptyState
            icon={Ticket}
            title="No coupons redeemed"
            description="Valid coupons applied at checkout will show up here."
          />
        ) : (
          <ul className="space-y-2">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/40 px-4 py-3 transition-colors hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {coupon.code || 'Coupon'}
                    {coupon.name ? (
                      <span className="ml-1 font-normal text-slate-500">
                        · {coupon.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {coupon.planKey} ·{' '}
                    {new Date(coupon.redeemedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Saved ₹{coupon.discountAmountRupees.toLocaleString('en-IN')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SettingsSectionCard>
    </div>
  );
}
