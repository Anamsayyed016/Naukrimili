import { recoverRoleLabeledExperienceFromRawText } from '@/lib/resume-parser/import-sanitize';
import { parseDateRangeFromText } from '@/lib/resume-parser/custom/experience-extraction/dates';
import { collapseOcrBrokenDateLines } from '@/lib/resume-parser/custom/experience-extraction/lines';

describe('role-labeled experience recovery (generic)', () => {
  it('extracts multiple Role: employment blocks with companies and dates', () => {
    const text = [
      'Organizational Experience',
      'Acme Infra Ltd.',
      '(June 2022 to till date)',
      'Project:',
      'Network Expansion',
      'Role: Billing Manager',
      'Team Size: 20+',
      'Key Responsibility:',
      'Handled client billing and vendor reconciliation.',
      '',
      'Beta Builders Pvt. Ltd.',
      '(January 2018 - May 2022)',
      'Project: Real Estate',
      'Role: Project Manager',
      'Key Responsibility:',
      'Supervised civil and finishing works.',
      '',
      'Gamma Towers LLC',
      '(March 2015 - December 2017)',
      'Role: Site Engineer',
      'Key Responsibility:',
      'Executed foundation and tower erection.',
    ].join('\n');

    const rows = recoverRoleLabeledExperienceFromRawText(text);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    const companies = rows.map((r) => String(r.company || ''));
    expect(companies.some((c) => /Acme Infra/i.test(c))).toBe(true);
    expect(companies.some((c) => /Beta Builders/i.test(c))).toBe(true);
    expect(companies.some((c) => /Gamma Towers/i.test(c))).toBe(true);
    expect(rows.some((r) => /Billing Manager/i.test(String(r.title || '')))).toBe(true);
  });

  it('parses OCR-broken ordinal date ranges', () => {
    const broken = collapseOcrBrokenDateLines('(26\nth\nJune2025 to till date)');
    expect(broken).toMatch(/26\s+June\s*2025/i);
    const parsed = parseDateRangeFromText(broken);
    expect(parsed).not.toBeNull();
    expect(parsed?.current).toBe(true);
    expect(parsed?.startDate).toMatch(/2025/);
  });
});
