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
    amount: 100, // ₹1 in paise
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
    amount: 14900, // ₹149 in paise
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
    amount: 29900, // ₹299 in paise
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

