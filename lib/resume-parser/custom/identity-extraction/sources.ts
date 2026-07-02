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
