"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Referral {
  _id: string;
  candidateName: string;
  status: "pending" | "paid";
  amount?: number;
  hireDate?: string;
}

interface AffiliateStats {
  userId: string;
  referrals: Referral[];
  totalEarnings: number;
  pendingEarnings: number;
}

export function AffiliateWidget() {
  const { data, error, isLoading } = useSWR<AffiliateStats>(
    "/api/affiliate/stats"
  );

  if (isLoading) {
    return (
      <Card className="p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <p className="text-red-500">Failed to load affiliate data</p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Your Referral Program</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your Referral Code:
          </p>
          <code className="text-lg font-mono bg-white dark:bg-gray-900 px-3 py-1 rounded border">
            NMI-{data.userId}
          </code>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Earn 5% of your referrals' first salary when they get hired
        </p>
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</p>
            <p className="text-xl font-semibold">
              ₹{data.totalEarnings.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-xl font-semibold">
              ₹{data.pendingEarnings.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            Recent Referrals
          </h4>
          {data.referrals.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No referrals yet
            </p>
          ) : (
            data.referrals.map((ref) => (
              <div
                key={ref._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{ref.candidateName}</p>
                  {ref.hireDate && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Hired: {new Date(ref.hireDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ref.amount && (
                    <span className="text-sm font-medium">
                      ₹{ref.amount.toLocaleString()}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={
                      ref.status === "paid"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-foreground"
                    }
                  >
                    {ref.status === "paid" ? "✓ Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default AffiliateWidget;
