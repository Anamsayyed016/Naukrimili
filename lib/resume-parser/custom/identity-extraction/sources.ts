/**
 * Combine contact section, header, and preamble into prioritized scan zones.
 */

import type { IdentityExtractionInput } from './types';

export interface ScanZone {
  label: 'header' | 'contact' | 'preamble' | 'full';
  text: string;
  weight: number;
}

export function buildIdentityScanZones(input: IdentityExtractionInput): ScanZone[] {
  const zones: ScanZone[] = [];

  if (input.headerText?.trim()) {
    zones.push({ label: 'header', text: input.headerText.trim(), weight: 1 });
  }
  if (input.contactSectionText?.trim()) {
    zones.push({ label: 'contact', text: input.contactSectionText.trim(), weight: 0.96 });
  }
  if (input.preambleText?.trim()) {
    zones.push({ label: 'preamble', text: input.preambleText.trim(), weight: 0.9 });
  }
  if (input.fullResumeText?.trim()) {
    const lines = input.fullResumeText.replace(/\r\n/g, '\n').split('\n');
    const tail = lines.slice(-15).join('\n').trim();
    if (tail && tail !== input.preambleText?.trim()) {
      zones.push({ label: 'contact', text: tail, weight: 0.82 });
    }
    const contactLines = lines
      .filter((l) => /@|linkedin\.com|github\.com|\+?\d[\d\s().-]{7,}\d|https?:\/\//i.test(l))
      .slice(0, 8)
      .join('\n')
      .trim();
    if (contactLines) {
      zones.push({ label: 'contact', text: contactLines, weight: 0.88 });
    }
    zones.push({ label: 'full', text: input.fullResumeText.trim(), weight: 0.55 });
  }

  return zones;
}

export function combineZoneText(zones: ScanZone[]): string {
  return zones.map((z) => z.text).join('\n');
}

export function getZoneLines(zones: ScanZone[], labels: ScanZone['label'][]): string[] {
  const text = zones
    .filter((z) => labels.includes(z.label))
    .map((z) => z.text)
    .join('\n');
  return text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
}
