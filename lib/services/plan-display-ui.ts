/**
 * Shared pricing plan display transforms and feature bullet lists.
 * Used by /pricing and Resume Builder payment modal — keep in sync via this file only.
 *
 * Plan limits and activation: lib/services/razorpay-plans.ts
 */

import {
  INDIVIDUAL_PLANS,
  BUSINESS_PLANS,
  type IndividualPlanKey,
  type BusinessPlanKey,
} from './razorpay-plans';

export type IndividualPlanUI = {
  key: IndividualPlanKey;
  name: string;
  price: number;
  validity: string;
  features: {
    pdfDownloads: number;
    templateAccess: string;
    templateCount: number | null;
    aiResumeUsage: number | 'Unlimited';
    atsOptimization: string;
    maxDownloadsPerDay: number | null;
    editFeatureLabel: string | null;
    resumeVersionHistory: boolean;
    prioritySupport: boolean;
    resumeLockedAfterExpiry: boolean;
  };
  popular: boolean;
  bestValue: boolean;
};

export type BusinessPlanUI = {
  key: BusinessPlanKey;
  name: string;
  price: number;
  originalPrice: number | null;
  validity: string;
  features: {
    resumeCredits: number;
    maxDownloadsPerDay: number;
    templateAccess: string;
    prioritySupport: boolean;
    maxDownloadsPerCandidate: number | null;
    unlimitedEdits: boolean;
    resumeVersionHistory: boolean;
    atsOptimization: string | false;
  };
  recommended: boolean;
  popular: boolean;
};

export function getIndividualPlansForUI(): IndividualPlanUI[] {
  return Object.entries(INDIVIDUAL_PLANS).map(([key, plan]) => ({
    key: key as IndividualPlanKey,
    name: plan.name,
    price: plan.amount / 100,
    validity: `${plan.validityDays} Days`,
    features: {
      pdfDownloads: plan.features.pdfDownloads,
      templateAccess:
        plan.features.templateAccess === 'all'
          ? 'ALL Premium Templates'
          : `${plan.features.templateCount || plan.features.pdfDownloads} Premium Templates`,
      templateCount: plan.features.templateCount,
      aiResumeUsage:
        plan.features.aiResumeUsage === -1 ? 'Unlimited' : plan.features.aiResumeUsage,
      atsOptimization: plan.features.atsOptimization,
      maxDownloadsPerDay: plan.features.maxDownloadsPerDay,
      editFeatureLabel:
        key === 'mini_starter'
          ? '1 Resume Edit After Download'
          : key === 'starter_premium' || key === 'pro_job_seeker'
            ? '1 Resume Edit Per Day'
            : null,
      resumeVersionHistory:
        'resumeVersionHistory' in plan.features ? Boolean(plan.features.resumeVersionHistory) : false,
      prioritySupport:
        'prioritySupport' in plan.features ? Boolean(plan.features.prioritySupport) : false,
      resumeLockedAfterExpiry:
        'resumeLockedAfterExpiry' in plan.features
          ? Boolean(plan.features.resumeLockedAfterExpiry)
          : false,
    },
    popular: plan.popular || false,
    bestValue: 'bestValue' in plan ? Boolean(plan.bestValue) : false,
  }));
}

export function getBusinessPlansForUI(): BusinessPlanUI[] {
  return Object.entries(BUSINESS_PLANS).map(([key, plan]) => ({
    key: key as BusinessPlanKey,
    name: plan.name,
    price: plan.amount / 100,
    originalPrice: 'originalPrice' in plan && plan.originalPrice ? plan.originalPrice / 100 : null,
    validity: plan.durationMonths === 12 ? '1 Year' : `${plan.durationMonths} Months`,
    features: {
      resumeCredits: plan.features.resumeCredits,
      maxDownloadsPerDay: plan.features.maxDownloadsPerDay,
      templateAccess: 'ALL Premium Templates',
      prioritySupport: plan.features.prioritySupport,
      maxDownloadsPerCandidate: plan.features.maxDownloadsPerCandidate,
      unlimitedEdits: 'unlimitedEdits' in plan.features ? Boolean(plan.features.unlimitedEdits) : false,
      resumeVersionHistory:
        'resumeVersionHistory' in plan.features ? Boolean(plan.features.resumeVersionHistory) : false,
      atsOptimization:
        'atsOptimization' in plan.features ? plan.features.atsOptimization : false,
    },
    recommended: 'recommended' in plan ? Boolean(plan.recommended) : false,
    popular: 'popular' in plan ? Boolean(plan.popular) : false,
  }));
}

/** Feature bullets for individual plans — same order/text on /pricing and payment modal. */
export function getIndividualPlanFeatureBullets(plan: IndividualPlanUI): string[] {
  const f = plan.features;
  const bullets: string[] = [
    `${f.pdfDownloads} PDF Resume Downloads${
      f.maxDownloadsPerDay ? ` (max ${f.maxDownloadsPerDay}/day)` : ''
    }`,
    f.templateAccess,
    typeof f.aiResumeUsage === 'number'
      ? `${f.aiResumeUsage} AI Resume Optimization${f.aiResumeUsage === 1 ? '' : 's'}`
      : 'Unlimited AI Resume Optimization',
    `${f.atsOptimization === 'advanced' ? 'Advanced' : 'Basic'} ATS Optimization`,
  ];

  if (f.editFeatureLabel) {
    bullets.push(f.editFeatureLabel);
  }
  if (f.resumeVersionHistory) {
    bullets.push('Resume Version History');
  }
  if (f.prioritySupport) {
    bullets.push('Priority Support');
  }
  if (f.resumeLockedAfterExpiry) {
    bullets.push('Resume locked after expiry');
  }

  return bullets;
}

/** Feature bullets for business plans — same order/text on /pricing and payment modal. */
export function getBusinessPlanFeatureBullets(plan: BusinessPlanUI): string[] {
  const f = plan.features;
  const bullets: string[] = [
    `${f.resumeCredits} Resume Credits`,
    `Max ${f.maxDownloadsPerDay} PDF downloads/day`,
  ];

  if (f.maxDownloadsPerCandidate) {
    bullets.push(`Max ${f.maxDownloadsPerCandidate} downloads per candidate`);
  }

  bullets.push(f.templateAccess);

  if (f.prioritySupport) {
    bullets.push('Priority Support');
  }
  if (f.unlimitedEdits) {
    bullets.push('Unlimited resume edits during validity');
  }
  if (f.resumeVersionHistory) {
    bullets.push('Resume Version History');
  }
  if (f.atsOptimization === 'advanced') {
    bullets.push('Advanced ATS Optimization');
  }

  return bullets;
}
