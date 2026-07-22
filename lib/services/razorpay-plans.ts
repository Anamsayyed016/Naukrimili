/**
 * Razorpay Plan Configurations
 * 
 * This file is the SINGLE SOURCE OF TRUTH for all pricing plans.
 * Import from here in pricing page and FinalizeStep to avoid duplication.
 * The actual Razorpay SDK functions are in razorpay-service.ts (server-only).
 */

// Individual Plans (One-Time Payments)
export const INDIVIDUAL_PLANS = {
  mini_starter: {
    name: 'Mini Starter',
    amount: 9900, // ₹99 in paise
    validityDays: 3,
    features: {
      pdfDownloads: 1,
      templateAccess: 'premium',
      templateCount: 1,
      aiResumeUsage: 1,
      aiCoverLetterUsage: 1,
      atsOptimization: 'basic',
      maxDownloadsPerDay: null,
      resumeLockedAfterExpiry: true,
    },
    popular: false,
  },
  starter_premium: {
    name: 'Starter Premium',
    amount: 11900, // ₹119 in paise
    validityDays: 7,
    features: {
      pdfDownloads: 7,
      templateAccess: 'premium',
      templateCount: 7,
      aiResumeUsage: 5,
      aiCoverLetterUsage: 3,
      atsOptimization: 'advanced',
      maxDownloadsPerDay: 1,
      unlimitedEdits: true,
    },
    popular: true, // Most Popular
  },
  pro_job_seeker: {
    name: 'Pro Job Seeker',
    amount: 19900, // ₹199 in paise
    validityDays: 30,
    features: {
      pdfDownloads: 30,
      templateAccess: 'all',
      templateCount: null, // All templates
      aiResumeUsage: -1, // Unlimited (-1 means unlimited)
      aiCoverLetterUsage: -1, // Unlimited
      atsOptimization: 'advanced',
      maxDownloadsPerDay: 1,
      resumeVersionHistory: true,
      prioritySupport: true,
    },
    popular: false, // Best Value
    bestValue: true,
    showCouponOffer: true,
  },
} as const;

// Business / Partner Plans (Credits Based - Subscriptions)
export const BUSINESS_PLANS = {
  partner_lite: {
    name: 'Partner Lite',
    amount: 299900, // ₹2,999 in paise
    billingCycle: 'monthly',
    durationMonths: 6,
    features: {
      resumeCredits: 200,
      maxDownloadsPerDay: 10,
      templateAccess: 'all',
      prioritySupport: false,
      whiteLabelBranding: false,
      clientDashboard: false,
      creditDeductionPerDownload: 1,
      maxDownloadsPerCandidate: null,
    },
  },
  partner_max: {
    name: 'Partner Max',
    amount: 799900, // ₹7,999 in paise
    billingCycle: 'monthly',
    durationMonths: 6,
    features: {
      resumeCredits: 1000,
      maxDownloadsPerDay: 40,
      templateAccess: 'all',
      prioritySupport: true,
      whiteLabelBranding: false,
      clientDashboard: false,
      creditDeductionPerDownload: 1,
      maxDownloadsPerCandidate: null,
    },
  },
  partner_pro: {
    name: 'Partner Pro',
    amount: 499900, // ₹4,999 in paise
    billingCycle: 'monthly',
    durationMonths: 6,
    features: {
      resumeCredits: 500,
      maxDownloadsPerDay: 25,
      templateAccess: 'all',
      prioritySupport: true,
      whiteLabelBranding: false,
      clientDashboard: false,
      creditDeductionPerDownload: 1,
      maxDownloadsPerCandidate: null,
      unlimitedEdits: true,
      resumeVersionHistory: true,
      atsOptimization: 'advanced',
    },
    popular: true, // Most Popular
  },
  business_partner: {
    name: 'Business Partner',
    amount: 899900, // ₹8,999 in paise
    originalPrice: 1200000, // ₹12,000 in paise (crossed price)
    billingCycle: 'yearly',
    durationMonths: 12,
    features: {
      resumeCredits: 1200,
      maxDownloadsPerDay: 50,
      templateAccess: 'all',
      prioritySupport: true,
      whiteLabelBranding: false,
      clientDashboard: false,
      creditDeductionPerDownload: 1,
      maxDownloadsPerCandidate: 2,
    },
    recommended: true,
  },
} as const;

export type IndividualPlanKey = keyof typeof INDIVIDUAL_PLANS;
export type BusinessPlanKey = keyof typeof BUSINESS_PLANS;
export type PlanKey = IndividualPlanKey | BusinessPlanKey;

export const ALL_INDIVIDUAL_PLAN_KEYS = Object.keys(INDIVIDUAL_PLANS) as IndividualPlanKey[];
export const ALL_BUSINESS_PLAN_KEYS = Object.keys(BUSINESS_PLANS) as BusinessPlanKey[];
export const ALL_PLAN_KEYS: PlanKey[] = [...ALL_INDIVIDUAL_PLAN_KEYS, ...ALL_BUSINESS_PLAN_KEYS];

export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  mini_starter: INDIVIDUAL_PLANS.mini_starter.name,
  starter_premium: INDIVIDUAL_PLANS.starter_premium.name,
  pro_job_seeker: INDIVIDUAL_PLANS.pro_job_seeker.name,
  partner_lite: BUSINESS_PLANS.partner_lite.name,
  partner_pro: BUSINESS_PLANS.partner_pro.name,
  partner_max: BUSINESS_PLANS.partner_max.name,
  business_partner: BUSINESS_PLANS.business_partner.name,
};

export function getPlanType(planKey: string): 'individual' | 'business' | null {
  if (planKey in INDIVIDUAL_PLANS) return 'individual';
  if (planKey in BUSINESS_PLANS) return 'business';
  return null;
}

/** Response from POST /api/payments/create-order when admin bypass activates a plan. */
export function isAdminPlanBypassResponse(
  data: Record<string, unknown> | null | undefined
): data is { adminBypass: true; activated: true; planKey: string; planType: 'individual' } {
  return Boolean(
    data &&
      data.adminBypass === true &&
      data.activated === true &&
      data.planType === 'individual' &&
      typeof data.planKey === 'string' &&
      data.planKey in INDIVIDUAL_PLANS
  );
}

export function getListAmountPaise(planKey: string): number | null {
  const planType = getPlanType(planKey);
  if (planType === 'individual') {
    return INDIVIDUAL_PLANS[planKey as IndividualPlanKey].amount;
  }
  if (planType === 'business') {
    return BUSINESS_PLANS[planKey as BusinessPlanKey].amount;
  }
  return null;
}

