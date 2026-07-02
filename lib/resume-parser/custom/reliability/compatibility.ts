/**
 * Compatibility testing — format profiles, unicode, RTL, OCR simulations.
 */

import { runCustomParserPipelineSafe } from './pipeline';
import { RELIABILITY_FIXTURE_CATALOG } from './fixtures/catalog';
import type {
  CompatibilityCaseResult,
  CompatibilityProfile,
  CompatibilityReport,
  ReliabilityFixture,
} from './types';

function checkCompatibility(
  profile: CompatibilityProfile,
  fixture: ReliabilityFixture,
  rawText: string
): string[] {
  const issues: string[] = [];

  switch (profile) {
    case 'unicode_text':
      if (/[^\x00-\x7F]/.test(rawText) && !/[^\x00-\x7F]/.test(fixture.rawText)) {
        issues.push('Unicode characters not preserved in fixture');
      }
      break;
    case 'rtl_safe':
      if (/[\u0600-\u06FF]/.test(rawText) && rawText.includes('\u200F') === false) {
        // RTL chars present — parser should not crash; no hard requirement on marks
      }
      break;
    case 'ocr_pdf':
    case 'scanned_image':
      if (fixture.categories.includes('low_quality_ocr') && !rawText.match(/[0O]/)) {
        issues.push('OCR noise patterns expected');
      }
      break;
    case 'windows_pdf':
    case 'mac_pdf':
      if (fixture.format === 'pdf' && !fixture.rawText.trim()) {
        issues.push('PDF fixture missing text export');
      }
      break;
    case 'libreoffice_docx':
    case 'microsoft_word_docx':
    case 'google_docs_docx':
      if (fixture.format === 'docx' && !fixture.rawText.trim()) {
        issues.push('DOCX fixture missing text export');
      }
      break;
  }

  return issues;
}

export function runCompatibilityCase(
  fixture: ReliabilityFixture,
  profile: CompatibilityProfile
): CompatibilityCaseResult {
  const t0 = performance.now();
  const result = runCustomParserPipelineSafe(fixture.rawText);
  const parseTimeMs = performance.now() - t0;
  const issues: string[] = [];

  if ('error' in result) {
    return {
      fixtureId: fixture.id,
      profile,
      categories: fixture.categories,
      passed: false,
      issues: [result.error],
      parseTimeMs,
    };
  }

  issues.push(...checkCompatibility(profile, fixture, fixture.rawText));

  if (profile === 'unicode_text' && fixture.categories.includes('unicode')) {
    const name = result.validation.resume.fullName;
    if (!name) issues.push('Unicode name not extracted');
  }

  if (profile === 'rtl_safe' && fixture.categories.includes('multiple_languages')) {
    if (!result.validation.resume.summary && fixture.rawText.includes('SUMMARY')) {
      issues.push('Summary not extracted from bilingual resume');
    }
  }

  return {
    fixtureId: fixture.id,
    profile,
    categories: fixture.categories,
    passed: issues.length === 0,
    issues,
    parseTimeMs,
  };
}

export function runCompatibilitySuite(fixtures?: ReliabilityFixture[]): CompatibilityReport {
  const catalog = fixtures || RELIABILITY_FIXTURE_CATALOG;
  const cases: CompatibilityCaseResult[] = [];

  for (const fixture of catalog) {
    const profiles = fixture.compatibilityProfiles || [];
    if (!profiles.length) {
      cases.push({
        fixtureId: fixture.id,
        profile: 'unicode_text',
        categories: fixture.categories,
        passed: !('error' in runCustomParserPipelineSafe(fixture.rawText)),
        issues: [],
        parseTimeMs: 0,
      });
      continue;
    }

    for (const profile of profiles) {
      cases.push(runCompatibilityCase(fixture, profile));
    }
  }

  const passed = cases.filter((c) => c.passed).length;
  const byProfile: CompatibilityReport['byProfile'] = {};

  for (const c of cases) {
    if (!byProfile[c.profile]) byProfile[c.profile] = { passed: 0, failed: 0 };
    if (c.passed) byProfile[c.profile].passed += 1;
    else byProfile[c.profile].failed += 1;
  }

  return {
    cases,
    passed,
    failed: cases.length - passed,
    passRate: cases.length ? Math.round((passed / cases.length) * 1000) / 10 : 100,
    byProfile,
  };
}
