"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Sparkles, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  User,
  Settings
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import ExtendExpiryModal from "../../resume-builder/components/ExtendExpiryModal";
import AddCreditsModal from "../../resume-builder/components/AddCreditsModal";

interface ResumeBuilderTabProps {
  userId: string;
  userName: string;
}

interface PlanData {
  planType: 'individual' | 'business' | 'none';
  planName: string | null;
  status: 'active' | 'expired' | 'none';
  pdfUsed: number;
  pdfLimit: number;
  dailyUsed: number;
  dailyLimit: number | null;
  aiResumeUsed: number;
  aiResumeLimit: number;
  aiCoverLetterUsed: number;
  aiCoverLetterLimit: number;
  creditsRemaining: number | null;
  expiryDate: string | null;
  daysRemaining: number | null;
  totalCredits?: number;
  usedCredits?: number;
}

export default function ResumeBuilderTab({ userId, userName }: ResumeBuilderTabProps) {
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);

  useEffect(() => {
    fetchPlanData();
  }, [userId]);

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/resume-users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlanData(data.data.plan);
        }
      }
    } catch (error) {
      console.error('Error fetching plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanTypeBadge = (planType: string) => {
    switch (planType) {
      case 'individual':
        return <Badge className="bg-blue-100 text-blue-800"><User className="h-3 w-3 mr-1" />Individual</Badge>;
      case 'business':
        return <Badge className="bg-purple-100 text-purple-800"><Building2 className="h-3 w-3 mr-1" />Business</Badge>;
      default:
        return <Badge variant="outline">No Plan</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'expired') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
    }
    return <Badge variant="secondary">No Plan</Badge>;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resume builder data...</p>
        </div>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No resume builder data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              Current Plan
            </CardTitle>
            <div className="flex items-center gap-2">
              {getPlanTypeBadge(planData.planType)}
              {getStatusBadge(planData.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Plan Name</div>
              <div className="font-semibold text-gray-900">{planData.planName || 'No Plan'}</div>
            </div>
            {planData.expiryDate && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Expiry Date</div>
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(planData.expiryDate)}
                </div>
                {planData.daysRemaining !== null && (
                  <div className="text-xs text-gray-500 mt-1">
                    {planData.daysRemaining} days remaining
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF Downloads */}
        <Card className="bg-white border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              PDF Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Total Usage</span>
                  <span className="font-semibold text-gray-900">
                    {planData.pdfUsed} / {planData.pdfLimit === -1 ? '∞' : planData.pdfLimit}
                  </span>
                </div>
                {planData.pdfLimit > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(planData.pdfUsed, planData.pdfLimit) > 80 ? 'bg-red-500' :
                        getUsagePercentage(planData.pdfUsed, planData.pdfLimit) > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getUsagePercentage(planData.pdfUsed, planData.pdfLimit)}%` }}
                    />
                  </div>
                )}
              </div>
              {planData.dailyLimit && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Daily Usage (Today)</span>
                    <span className="font-semibold text-gray-900">
                      {planData.dailyUsed} / {planData.dailyLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(planData.dailyUsed, planData.dailyLimit) > 80 ? 'bg-red-500' :
                        getUsagePercentage(planData.dailyUsed, planData.dailyLimit) > 50 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getUsagePercentage(planData.dailyUsed, planData.dailyLimit)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Usage */}
        {planData.aiResumeLimit !== -1 && (
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">AI Resume</span>
                    <span className="font-semibold text-gray-900">
                      {planData.aiResumeUsed} / {planData.aiResumeLimit === -1 ? '∞' : planData.aiResumeLimit}
                    </span>
                  </div>
                  {planData.aiResumeLimit > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          getUsagePercentage(planData.aiResumeUsed, planData.aiResumeLimit) > 80 ? 'bg-red-500' :
                          getUsagePercentage(planData.aiResumeUsed, planData.aiResumeLimit) > 50 ? 'bg-yellow-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${getUsagePercentage(planData.aiResumeUsed, planData.aiResumeLimit)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">AI Cover Letter</span>
                    <span className="font-semibold text-gray-900">
                      {planData.aiCoverLetterUsed} / {planData.aiCoverLetterLimit === -1 ? '∞' : planData.aiCoverLetterLimit}
                    </span>
                  </div>
                  {planData.aiCoverLetterLimit > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          getUsagePercentage(planData.aiCoverLetterUsed, planData.aiCoverLetterLimit) > 80 ? 'bg-red-500' :
                          getUsagePercentage(planData.aiCoverLetterUsed, planData.aiCoverLetterLimit) > 50 ? 'bg-yellow-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${getUsagePercentage(planData.aiCoverLetterUsed, planData.aiCoverLetterLimit)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credits (Business Plans) */}
        {planData.planType === 'business' && planData.creditsRemaining !== null && (
          <Card className="bg-white border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <span className="font-semibold text-gray-900">
                      {planData.creditsRemaining}
                    </span>
                  </div>
                  {planData.totalCredits && planData.totalCredits > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (planData.creditsRemaining / planData.totalCredits) < 0.2 ? 'bg-red-500' :
                          (planData.creditsRemaining / planData.totalCredits) < 0.5 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(planData.creditsRemaining / planData.totalCredits) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {planData.totalCredits && (
                  <div className="text-sm text-gray-600">
                    Total: {planData.totalCredits} | Used: {planData.usedCredits || 0}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Actions */}
      {planData.status === 'active' && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {planData.expiryDate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExtendModal(true)}
                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Extend Expiry
                </Button>
              )}
              {planData.planType === 'business' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCreditsModal(true)}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Credits
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {planData.expiryDate && (
        <ExtendExpiryModal
          userId={userId}
          userName={userName}
          currentExpiry={planData.expiryDate}
          isOpen={showExtendModal}
          onClose={() => setShowExtendModal(false)}
          onSuccess={fetchPlanData}
        />
      )}

      {planData.planType === 'business' && planData.creditsRemaining !== null && (
        <AddCreditsModal
          userId={userId}
          userName={userName}
          currentCredits={planData.creditsRemaining}
          isOpen={showAddCreditsModal}
          onClose={() => setShowAddCreditsModal(false)}
          onSuccess={fetchPlanData}
        />
      )}
    </div>
  );
}

