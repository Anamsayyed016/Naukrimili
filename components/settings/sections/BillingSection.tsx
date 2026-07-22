'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import { SettingsSectionCard } from '@/components/settings/SettingsPrimitives';
import { Loader2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <SettingsSectionCard
        title="Current plan & credits"
        description="Reuses the existing payment status card and /api/payments/status."
        action={
          <Button asChild size="sm">
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
        description="Read-only history from existing Payment records. Does not create or verify payments."
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading invoices…
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-50">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 pr-3">{payment.planName}</td>
                    <td className="py-2 pr-3">
                      ₹{payment.amountRupees.toLocaleString('en-IN')}
                      {payment.discountAmountRupees > 0 ? (
                        <span className="text-xs text-gray-500 ml-1">
                          (−₹{payment.discountAmountRupees})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2">
                      <Badge variant="secondary">{payment.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Coupon history"
        description="Read-only redemptions from existing CouponRedemption records."
      >
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">No coupons redeemed yet.</p>
        ) : (
          <ul className="space-y-2">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {coupon.code || 'Coupon'}{' '}
                    {coupon.name ? (
                      <span className="text-gray-500 font-normal">
                        · {coupon.name}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {coupon.planKey} ·{' '}
                    {new Date(coupon.redeemedAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <Badge variant="outline">
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
