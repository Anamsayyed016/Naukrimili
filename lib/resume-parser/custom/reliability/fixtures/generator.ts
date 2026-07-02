/**
 * Synthetic resume generation for stress and scale testing.
 */

import type { ReliabilityFixture, ReliabilityTestCategory } from '../types';
import { RELIABILITY_FIXTURE_CATALOG } from './catalog';

let syntheticCounter = 0;

function nextId(prefix: string): string {
  syntheticCounter += 1;
  return `${prefix}-${syntheticCounter}`;
}

function baseDeveloperText(variant: number): string {
  const companies = ['Technoart', 'Infosys', 'TCS', 'Wipro', 'Accenture'];
  const company = companies[variant % companies.length];
  return [
    `Candidate ${variant}`,
    `candidate${variant}@example.com | +91 90000${String(variant).padStart(5, '0')}`,
    '',
    'SUMMARY',
    `Software engineer variant ${variant} with full-stack experience.`,
    '',
    'EXPERIENCE',
    `Engineer | ${company} Pvt Ltd`,
    'Jan 2020 - Present',
    `- Built services using Python variant ${variant}`,
    '',
    'SKILLS',
    'Python, JavaScript, React, SQL',
  ].join('\n');
}

export function generateSyntheticFixture(
  variant: number,
  categories: ReliabilityTestCategory[] = ['it', 'one_column']
): ReliabilityFixture {
  return {
    id: nextId('synthetic'),
    name: `Synthetic Resume #${variant}`,
    categories,
    format: 'text',
    rawText: baseDeveloperText(variant),
    modules: ['identity', 'summary', 'experience', 'skills', 'validation', 'canonical'],
  };
}

export function generateStressFixtures(count: number): ReliabilityFixture[] {
  const fixtures: ReliabilityFixture[] = [];
  for (let i = 0; i < count; i++) {
    fixtures.push(generateSyntheticFixture(i, ['it', 'experienced', 'one_column']));
  }
  return fixtures;
}

export function expandCatalogForStress(count: number): ReliabilityFixture[] {
  if (count <= RELIABILITY_FIXTURE_CATALOG.length) {
    return RELIABILITY_FIXTURE_CATALOG.slice(0, count);
  }
  const out = [...RELIABILITY_FIXTURE_CATALOG];
  while (out.length < count) {
    out.push(generateSyntheticFixture(out.length));
  }
  return out;
}

export function resetSyntheticCounter(): void {
  syntheticCounter = 0;
}
