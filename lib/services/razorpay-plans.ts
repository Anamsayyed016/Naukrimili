/**
 * Razorpay Plan Configurations
 * 
 * This file contains only plan definitions (constants) that are safe to import anywhere.
 * The actual Razorpay SDK functions are in razorpay-service.ts (server-only).
 */

// Plan configurations
export const INDIVIDUAL_PLANS = {
  starter_premium: {
    name: 'Starter Premium',
    amount: 9900, // ₹99 in paise
    validityDays: 3,
    features: {
      resumeDownloads: 5,
      templateAccess: 'premium',
      aiResumeUsage: 3,
      aiCoverLetterUsage: 2,
      atsOptimization: true,
      pdfDownloads: 5,
      docxDownloads: 5,
    },
  },
  professional_plus: {
    name: 'Professional Plus',
    amount: 39900, // ₹399 in paise
    validityDays: 7,
    features: {
      resumeDownloads: 15,
      templateAccess: 'premium',
      aiResumeUsage: 10,
      aiCoverLetterUsage: 5,
      atsOptimization: true,
      pdfDownloads: 15,
      docxDownloads: 15,
    },
  },
  best_value: {
    name: 'Best Value Plan',
    amount: 99900, // ₹999 in paise (30 days - calculated as ₹33/day)
    validityDays: 30,
    features: {
      resumeDownloads: 100,
      templateAccess: 'all',
      aiResumeUsage: 50,
      aiCoverLetterUsage: 25,
      atsOptimization: true,
      pdfDownloads: 100,
      docxDownloads: 100,
    },
  },
} as const;

export const BUSINESS_PLANS = {
  business_partner: {
    name: 'Business Partner',
    amount: 499900, // ₹4,999 in paise
    billingCycle: 'monthly',
    durationMonths: 6,
    features: {
      resumeCredits: 500,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
      creditDeductionPerDownload: 1,
    },
  },
  business_partner_pro: {
    name: 'Business Partner Pro',
    amount: 899900, // ₹8,999 in paise
    billingCycle: 'yearly',
    durationMonths: 12,
    features: {
      resumeCredits: 1200,
      whiteLabelBranding: true,
      clientDashboard: true,
      prioritySupport: true,
      creditDeductionPerDownload: 1,
    },
  },
} as const;

export type IndividualPlanKey = keyof typeof INDIVIDUAL_PLANS;
export type BusinessPlanKey = keyof typeof BUSINESS_PLANS;

