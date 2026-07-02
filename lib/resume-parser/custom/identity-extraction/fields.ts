/**
 * Field assembly with confidence-aware merging — never overwrite with lower confidence.
 */

import { detectAddress } from './address';
import { extractEmailCandidates, pickAlternateEmail, pickPrimaryEmail } from './email';
import { detectHeadline } from './headline';
import { extractProfileLinks } from './links';
import { detectIdentityMetadata } from './metadata';
import { detectFullName } from './name';
import { extractPhoneCandidates, pickAlternatePhone, pickPrimaryPhone } from './phone';
import type { ScanZone } from './sources';
import type { CustomExtractedIdentity, IdentityFieldConfidence } from './types';
import { createEmptyIdentityFieldConfidence } from './types';

interface FieldPick {
  value: string;
  confidence: number;
}

function mergePick(current: FieldPick, next: FieldPick): FieldPick {
  if (!next.value) return current;
  if (!current.value || next.confidence > current.confidence) return next;
  return current;
}

function computeOverallConfidence(fc: IdentityFieldConfidence): number {
  const requiredWeights: Array<[keyof IdentityFieldConfidence, number]> = [
    ['fullName', 0.3],
    ['email', 0.25],
    ['phone', 0.2],
    ['linkedin', 0.25],
  ];

  let sum = 0;
  let weightSum = 0;
  for (const [key, w] of requiredWeights) {
    sum += fc[key] * w;
    weightSum += w;
  }

  return Math.min(100, Math.round(weightSum > 0 ? sum / weightSum : 0));
}

export function buildIdentityFromZones(zones: ScanZone[]): CustomExtractedIdentity {
  let emailPick: FieldPick = { value: '', confidence: 0 };
  let altEmailPick: FieldPick = { value: '', confidence: 0 };
  let phonePick: FieldPick = { value: '', confidence: 0 };
  let altPhonePick: FieldPick = { value: '', confidence: 0 };

  const linkPicks = {
    linkedin: { value: '', confidence: 0 },
    github: { value: '', confidence: 0 },
    portfolio: { value: '', confidence: 0 },
    website: { value: '', confidence: 0 },
    behance: { value: '', confidence: 0 },
    dribbble: { value: '', confidence: 0 },
    stackoverflow: { value: '', confidence: 0 },
    medium: { value: '', confidence: 0 },
    researchgate: { value: '', confidence: 0 },
    googleScholar: { value: '', confidence: 0 },
  };

  for (const zone of zones) {
    const emails = extractEmailCandidates(zone.text, zone.weight);
    const primaryEmail = pickPrimaryEmail(emails);
    emailPick = mergePick(emailPick, {
      value: primaryEmail.email,
      confidence: primaryEmail.confidence,
    });
    if (!altEmailPick.value) {
      altEmailPick = mergePick(altEmailPick, {
        value: pickAlternateEmail(emails).email,
        confidence: pickAlternateEmail(emails).confidence,
      });
    }

    const phones = extractPhoneCandidates(zone.text, zone.weight);
    const primaryPhone = pickPrimaryPhone(phones);
    phonePick = mergePick(phonePick, {
      value: primaryPhone.normalized,
      confidence: primaryPhone.confidence,
    });
    if (!altPhonePick.value) {
      const alt = pickAlternatePhone(phones);
      altPhonePick = mergePick(altPhonePick, {
        value: alt.normalized,
        confidence: alt.confidence,
      });
    }

    const links = extractProfileLinks(zone.text, zone.weight);
    linkPicks.linkedin = mergePick(linkPicks.linkedin, {
      value: links.linkedin,
      confidence: links.linkedin ? links.confidence : 0,
    });
    linkPicks.github = mergePick(linkPicks.github, {
      value: links.github,
      confidence: links.github ? links.confidence : 0,
    });
    linkPicks.portfolio = mergePick(linkPicks.portfolio, {
      value: links.portfolio,
      confidence: links.portfolio ? links.confidence : 0,
    });
    linkPicks.website = mergePick(linkPicks.website, {
      value: links.website,
      confidence: links.website ? links.confidence : 0,
    });
    if (links.behance) {
      linkPicks.portfolio = mergePick(linkPicks.portfolio, {
        value: links.behance,
        confidence: links.confidence,
      });
    }
    if (links.dribbble) {
      linkPicks.portfolio = mergePick(linkPicks.portfolio, {
        value: links.dribbble,
        confidence: links.confidence,
      });
    }
  }

  const name = detectFullName(zones, emailPick.value);
  const headline = detectHeadline(zones, name.fullName);
  const address = detectAddress(zones);
  const metadata = detectIdentityMetadata(zones);

  const fieldConfidence: IdentityFieldConfidence = {
    ...createEmptyIdentityFieldConfidence(),
    fullName: name.confidence,
    professionalHeadline: headline.confidence,
    professionalTitle: headline.confidence,
    email: emailPick.confidence,
    phone: phonePick.confidence,
    alternatePhone: altPhonePick.confidence,
    linkedin: linkPicks.linkedin.confidence,
    github: linkPicks.github.confidence,
    portfolio: linkPicks.portfolio.confidence,
    website: linkPicks.website.confidence,
    address: address.confidence,
    city: address.city ? address.confidence : 0,
    state: address.state ? Math.max(0, address.confidence - 5) : 0,
    country: address.country ? Math.max(0, address.confidence - 5) : 0,
    postalCode: address.postalCode ? Math.max(0, address.confidence - 8) : 0,
    nationality: metadata.nationalityConfidence,
    dateOfBirth: metadata.dateOfBirthConfidence,
    currentCompany: metadata.currentCompanyConfidence,
    currentDesignation: metadata.currentDesignationConfidence,
  };

  return {
    fullName: name.fullName,
    professionalHeadline: headline.professionalHeadline,
    email: emailPick.value,
    phone: phonePick.value,
    alternatePhone: altPhonePick.value,
    linkedin: linkPicks.linkedin.value,
    github: linkPicks.github.value,
    portfolio: linkPicks.portfolio.value || linkPicks.behance.value || linkPicks.dribbble.value,
    website: linkPicks.website.value,
    address: address.address,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    nationality: metadata.nationality,
    dateOfBirth: metadata.dateOfBirth,
    currentCompany: metadata.currentCompany,
    currentDesignation: metadata.currentDesignation,
    professionalTitle: headline.professionalTitle,
    confidence: computeOverallConfidence(fieldConfidence),
    fieldConfidence,
  };
}
