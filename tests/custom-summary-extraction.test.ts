import {
  extractSummaryFromSection,
  extractSummaryWithMeta,
  toCanonicalSummary,
  isValidSummaryContent,
} from '@/lib/resume-parser/custom/summary-extraction';

describe('custom summary extraction engine', () => {
  it('ATS — professional summary paragraph preserved', () => {
    const section = [
      'Professional Summary',
      'Motivated Full-Stack Developer with 3+ years of experience building scalable web applications.',
      'Skilled in Python, Django, React, and PostgreSQL with a focus on clean architecture.',
    ].join('\n');

    const result = extractSummaryFromSection(section);
    expect(result.summary).toMatch(/Motivated Full-Stack Developer/i);
    expect(result.summary).toMatch(/Python|Django|React/i);
    expect(result.sourceLabel).toMatch(/professional summary/i);
    expect(result.confidence).toBeGreaterThan(40);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(1);

    const canonical = toCanonicalSummary(result);
    expect(canonical.summary).toBe(result.summary);
  });

  it('objective heading maps to canonical summary', () => {
    const section = [
      'Career Objective',
      'Seeking a challenging software engineering role where I can contribute to innovative products.',
    ].join('\n');

    const result = extractSummaryFromSection(section);
    expect(result.summary).toMatch(/challenging software engineering/i);
    expect(result.sourceLabel).toMatch(/career objective/i);
  });

  it('bullet summary — preserves bullets', () => {
    const section = [
      'Executive Summary',
      '- 15+ years leading engineering teams across fintech and healthcare',
      '- Delivered platforms serving 2M+ daily active users',
      '- Expert in cloud architecture, compliance, and stakeholder management',
    ].join('\n');

    const result = extractSummaryFromSection(section);
    expect(result.isBulletSummary).toBe(true);
    expect(result.summary).toMatch(/15\+ years/i);
    expect(result.summary).toMatch(/^-/m);
  });

  it('stops at embedded experience heading', () => {
    const section = [
      'Profile',
      'Passionate developer with strong problem-solving skills.',
      'Work Experience',
      'Technoart Pvt Ltd',
      'Full Stack Developer',
    ].join('\n');

    const result = extractSummaryFromSection(section);
    expect(result.summary).toMatch(/Passionate developer/i);
    expect(result.summary).not.toMatch(/Technoart/i);
    expect(result.fieldConfidence.boundaryAccuracy).toBeLessThan(90);
  });

  it('rejects skill list only', () => {
    const { accepted } = extractSummaryWithMeta('Python, React, AWS, Docker, Redis, Kafka');
    expect(accepted).toBe(false);
    expect(isValidSummaryContent('Python, React, AWS, Docker, Redis, Kafka')).toBe(false);
  });

  it('rejects contact-only block', () => {
    const section = ['anam@example.com', '+91 9876543210', 'linkedin.com/in/anam'].join('\n');
    const { accepted } = extractSummaryWithMeta(section);
    expect(accepted).toBe(false);
  });

  it('multi-paragraph academic profile', () => {
    const section = [
      'Personal Statement',
      'Research-oriented computer science graduate with publications in machine learning.',
      '',
      'Interested in applied AI for healthcare diagnostics and explainable models.',
    ].join('\n');

    const result = extractSummaryFromSection(section);
    expect(result.summary).toMatch(/Research-oriented/i);
    expect(result.summary).toMatch(/healthcare diagnostics/i);
    expect(result.paragraphCount).toBeGreaterThanOrEqual(2);
  });

  it('does not rewrite content', () => {
    const original =
      'Results-driven engineer with EXACT-PHRASE-123 and experience in legacy COBOL systems.';
    const result = extractSummaryFromSection(original);
    expect(result.summary).toContain('EXACT-PHRASE-123');
    expect(result.summary).toContain('COBOL');
  });
});
