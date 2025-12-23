/**
 * Payment Status Card Component
 * Shows user's current plan status, credits, and validity
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Calendar, 
  Download, 
  Sparkles, 
  FileText, 
  Zap,
  Building2,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PaymentStatus {
  planType: 'individual' | 'business' | null;
  isActive: boolean;
  planName?: string;
  daysRemaining?: number;
  credits?: {
    resumeDownloads: { used: number; limit: number; remaining: number };
    aiResume: { used: number; limit: number; remaining: number };
    aiCoverLetter: { used: number; limit: number; remaining: number };
    pdfDownloads: { used: number; limit: number; remaining: number };
    docxDownloads: { used: number; limit: number; remaining: number };
    templateAccess: string;
    atsOptimization: boolean;
  };
  subscription?: {
    planName: string;
    status: string;
    creditsRemaining: number;
    totalCredits: number;
    usedCredits: number;
    expiresAt: string;
  };
  validUntil?: string;
  message?: string;
}

export default function PaymentStatusCard() {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/payments/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status || !status.isActive) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            No Active Plan
          </CardTitle>
          <CardDescription>
            Upgrade to unlock premium features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/pricing">
            <Button className="w-full" size="lg">
              <Crown className="w-4 h-4 mr-2" />
              View Plans
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Business Plan Display
  if (status.planType === 'business' && status.subscription) {
    const sub = status.subscription;
    const usagePercent = sub.totalCredits > 0 
      ? Math.round((sub.usedCredits / sub.totalCredits) * 100) 
      : 0;

    return (
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Business Plan
          </CardTitle>
          <CardDescription>
            <Badge variant="outline" className="mr-2">{sub.planName}</Badge>
            Status: <Badge className={sub.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
              {sub.status}
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Resume Credits</span>
              <span className="text-sm text-gray-600">
                {sub.creditsRemaining} / {sub.totalCredits} remaining
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${100 - usagePercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            Expires: {new Date(sub.expiresAt).toLocaleDateString()}
          </div>
          <Link href="/pricing">
            <Button variant="outline" className="w-full" size="sm">
              Manage Subscription
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Individual Plan Display
  if (status.planType === 'individual' && status.credits) {
    const credits = status.credits;
    const daysRemaining = status.daysRemaining || 0;

    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            {status.planName?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </CardTitle>
          <CardDescription>
            {daysRemaining > 0 ? (
              <span className="text-green-600 font-medium">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
            ) : (
              <span className="text-red-600">Expired</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resume Downloads */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Resume Downloads</span>
              </div>
              <span className="text-sm text-gray-600">
                {credits.resumeDownloads.remaining} / {credits.resumeDownloads.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(credits.resumeDownloads.remaining / credits.resumeDownloads.limit) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* AI Resume Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">AI Resume Uses</span>
              </div>
              <span className="text-sm text-gray-600">
                {credits.aiResume.remaining} / {credits.aiResume.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(credits.aiResume.remaining / credits.aiResume.limit) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* AI Cover Letter Usage */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">AI Cover Letter Uses</span>
              </div>
              <span className="text-sm text-gray-600">
                {credits.aiCoverLetter.remaining} / {credits.aiCoverLetter.limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(credits.aiCoverLetter.remaining / credits.aiCoverLetter.limit) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Features */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Template Access: {credits.templateAccess}</span>
            </div>
            {credits.atsOptimization && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>ATS Optimization Enabled</span>
              </div>
            )}
          </div>

          {daysRemaining <= 3 && daysRemaining > 0 && (
            <Link href="/pricing">
              <Button className="w-full" size="sm" variant="outline">
                Renew Plan
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

