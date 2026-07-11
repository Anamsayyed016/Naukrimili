/**
 * Tests for dynamic document analysis and adaptive parse strategy.
 */

import { analyzeResumeDocument } from '@/lib/resume-parser/dynamic-document-analysis';
import { deriveAdaptiveParseStrategy } from '@/lib/resume-parser/adaptive-parse-strategy';
import {
  computeUnifiedSectionConfidence,
  selectHybridRepairTier,
} from '@/lib/resume-parser/unified-confidence-engine';
import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

describe('dynamic-document-analysis', () => {
  it('detects multi-column layout from gap patterns', () => {
    const text = [
      'JOHN DOE          john@email.com',
      'Software Engineer    +1 555 1234',
      'EXPERIENCE',
      'Acme Corp    Jan 2020 - Present',
      'Built APIs and led team of 4 engineers on cloud migration.',
      'SKILLS',
      'JavaScript, React, Node.js, PostgreSQL, AWS',
    ].join('\n');
    const analysis = analyzeResumeDocument(text);
    expect(analysis.columnCount).toBeGreaterThanOrEqual(2);
    expect(analysis.overallConfidence).toBeGreaterThan(0);
  });

  it('derives sidebar-first strategy for sidebar signals', () => {
    const text = [
      'JANE SMITH',
      'jane@mail.com',
      'linkedin.com/in/jane',
      '+91 9876543210',
      'SKILLS',
      'Python, SQL',
      'EXPERIENCE',
      'Analyst at BigCo 2019-2023',
      'Prepared reports and dashboards.',
    ].join('\n');
    const analysis = analyzeResumeDocument(text);
    const strategy = deriveAdaptiveParseStrategy(analysis);
    expect(['sidebar-first', 'column-reconstruct', 'standard']).toContain(
      strategy.readingOrderMode
    );
    expect(strategy.experienceBoundaryThreshold).toBeGreaterThan(0);
  });
});

describe('unified-confidence-engine', () => {
  const base = (overrides: Partial<ExtractedResumeData> = {}): ExtractedResumeData => ({
    fullName: 'Alex Kumar',
    email: 'alex@example.com',
    phone: '+91 9999999999',
    location: 'Mumbai',
    summary: 'Experienced developer with 5 years in fintech.',
    skills: ['Java', 'Spring', 'Kafka'],
    experience: [
      {
        company: 'FinTech Ltd',
        position: 'Senior Developer',
        startDate: '2020-01',
        endDate: '2024-06',
        current: false,
        description: 'Led payment gateway integration and API design.',
        achievements: [],
      },
    ],
    education: [{ institution: 'IIT Delhi', degree: 'B.Tech', field: 'CS' }],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    confidence: 80,
    rawText: 'Experience\nSenior Developer at FinTech Ltd',
    ...overrides,
  });

  it('scores strong parser output high overall', () => {
    const scores = computeUnifiedSectionConfidence(base());
    expect(scores.overall).toBeGreaterThanOrEqual(60);
    expect(selectHybridRepairTier(scores)).toBe('none');
  });

  it('flags weak experience when heading exists but rows empty', () => {
    const data = base({
      experience: [],
      rawText: 'Work Experience\nSenior Engineer at Acme 2020-2024\nBuilt systems.',
    });
    const scores = computeUnifiedSectionConfidence(data, { rawText: data.rawText });
    expect(scores.experience).toBeLessThan(55);
    expect(selectHybridRepairTier(scores)).toBe('section-only');
  });
});
