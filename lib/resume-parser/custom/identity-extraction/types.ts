/**
 * Types for custom identity / contact extraction (isolated module).
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

export const IDENTITY_EXTRACTION_VERSION = '1.0.0';

export interface IdentityFieldConfidence {
  fullName: number;
  professionalHeadline: number;
  email: number;
  phone: number;
  alternatePhone: number;
  linkedin: number;
  github: number;
  portfolio: number;
  website: number;
  address: number;
  city: number;
  state: number;
  country: number;
  postalCode: number;
  nationality: number;
  dateOfBirth: number;
  currentCompany: number;
  currentDesignation: number;
  professionalTitle: number;
}

/** Rich identity record — maps to ExtractedResumeData contact fields. */
export interface CustomExtractedIdentity {
  fullName: string;
  professionalHeadline: string;
  email: string;
  phone: string;
  alternatePhone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  nationality: string;
  dateOfBirth: string;
  currentCompany: string;
  currentDesignation: string;
  professionalTitle: string;
  confidence: number;
  fieldConfidence: IdentityFieldConfidence;
}

export interface IdentityExtractionInput {
  contactSectionText?: string;
  headerText?: string;
  preambleText?: string;
  fullResumeText?: string;
}

export type CanonicalIdentity = Pick<
  ExtractedResumeData,
  'fullName' | 'email' | 'phone' | 'location' | 'linkedin' | 'portfolio'
>;

export function toCanonicalIdentity(identity: CustomExtractedIdentity): CanonicalIdentity {
  const location =
    identity.address ||
    [identity.city, identity.state, identity.country, identity.postalCode]
      .filter(Boolean)
      .join(', ') ||
    '';

  return {
    fullName: identity.fullName || '',
    email: identity.email || '',
    phone: identity.phone || '',
    location: location || undefined,
    linkedin: identity.linkedin || undefined,
    portfolio:
      identity.portfolio || identity.website || identity.github || undefined,
  };
}

export function createEmptyIdentityFieldConfidence(): IdentityFieldConfidence {
  return {
    fullName: 0,
    professionalHeadline: 0,
    email: 0,
    phone: 0,
    alternatePhone: 0,
    linkedin: 0,
    github: 0,
    portfolio: 0,
    website: 0,
    address: 0,
    city: 0,
    state: 0,
    country: 0,
    postalCode: 0,
    nationality: 0,
    dateOfBirth: 0,
    currentCompany: 0,
    currentDesignation: 0,
    professionalTitle: 0,
  };
}

export function createEmptyIdentity(): CustomExtractedIdentity {
  return {
    fullName: '',
    professionalHeadline: '',
    email: '',
    phone: '',
    alternatePhone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    nationality: '',
    dateOfBirth: '',
    currentCompany: '',
    currentDesignation: '',
    professionalTitle: '',
    confidence: 0,
    fieldConfidence: createEmptyIdentityFieldConfidence(),
  };
}
