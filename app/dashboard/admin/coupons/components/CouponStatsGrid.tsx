'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Ticket,
  CheckCircle,
  Clock,
  Users,
  IndianRupee,
  TrendingUp,
  ArrowUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsData {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalRedemptions: number;
  totalDiscountRupees: number;
  redemptionsLast30Days: number;
  topPerforming: { code: string; name: string; redemptions: number } | null;
}

interface CouponStatsGridProps {
  stats: StatsData | null;
  loading: boolean;
}

const CARDS = [
  { key: 'total', title: 'Total Coupons', icon: Ticket, color: 'blue' },
  { key: 'active', title: 'Active Coupons', icon: CheckCircle, color: 'green' },
  { key: 'expired', title: 'Expired Coupons', icon: Clock, color: 'red' },
  { key: 'redemptions', title: 'Total Redemptions', icon: Users, color: 'purple' },
  { key: 'discount', title: 'Total Discount Given', icon: IndianRupee, color: 'amber' },
  { key: 'top', title: 'Top Performing Coupon', icon: TrendingUp, color: 'indigo' },
] as const;

const colorMap: Record<string, string> = {
  blue: 'border-blue-100 bg-blue-50/30',
  green: 'border-green-100 bg-green-50/30',
  red: 'border-red-100 bg-red-50/30',
  purple: 'border-purple-100 bg-purple-50/30',
  amber: 'border-amber-100 bg-amber-50/30',
  indigo: 'border-indigo-100 bg-indigo-50/30',
};

const iconColorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600',
  indigo: 'bg-indigo-100 text-indigo-600',
};

export function CouponStatsGrid({ stats, loading }: CouponStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {CARDS.map((c) => (
          <Skeleton key={c.key} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const values: Record<string, { main: string; sub?: string }> = {
    total: { main: String(stats.totalCoupons) },
    active: { main: String(stats.activeCoupons) },
    expired: { main: String(stats.expiredCoupons) },
    redemptions: {
      main: String(stats.totalRedemptions),
      sub:
        stats.redemptionsLast30Days > 0
          ? `+${stats.redemptionsLast30Days} last 30 days`
          : undefined,
    },
    discount: {
      main: `₹${stats.totalDiscountRupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    },
    top: stats.topPerforming
      ? {
          main: stats.topPerforming.code,
          sub: `${stats.topPerforming.redemptions} redemptions · ${stats.topPerforming.name}`,
        }
      : { main: '—', sub: 'No redemptions yet' },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const val = values[card.key];
        return (
          <Card
            key={card.key}
            className={`border-2 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white ${colorMap[card.color]}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-800">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${iconColorMap[card.color]}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 truncate">
                {card.key === 'top' ? (
                  <span className="font-mono text-xl">{val.main}</span>
                ) : (
                  val.main
                )}
              </div>
              {val.sub && (
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  {card.key === 'redemptions' && stats.redemptionsLast30Days > 0 && (
                    <ArrowUp className="h-3 w-3 text-green-600" aria-hidden />
                  )}
                  <span className="line-clamp-2">{val.sub}</span>
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
