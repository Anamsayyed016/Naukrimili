import {
  parseAsRoleEmployerHeader,
  sanitizeExperienceEntry,
  isPlausiblePersonName,
  sanitizePersonName,
  isExperienceBlurbFragment,
} from '../lib/resume-parser/import-sanitize';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';

describe('as-role-employer headers (generic)', () => {
  it('parses As {Role} in {Employer}', () => {
    const parsed = parseAsRoleEmployerHeader(
      'As Company Secretary in Indian Steel Corporation Limited'
    );
    expect(parsed?.role).toMatch(/company secretary/i);
    expect(parsed?.employer).toMatch(/indian steel corporation/i);
  });

  it('parses As {Role} at {Employer}, City', () => {
    const parsed = parseAsRoleEmployerHeader(
      'As Group Company Secretary at Sahayog Group, Bhopal'
    );
    expect(parsed?.role).toMatch(/group company secretary/i);
    expect(parsed?.employer).toMatch(/sahayog group/i);
  });

  it('rejects parenthetical turnover blurbs as companies', () => {
    expect(isExperienceBlurbFragment('(A Ruchi Group Company with')).toBe(true);
    expect(isExperienceBlurbFragment('(A Ruchi Group Company with turnover of around 1000 Crores)')).toBe(
      true
    );
  });

  it('keeps experience when title embeds employer and company slot is a blurb', () => {
    const kept = sanitizeExperienceEntry({
      company: '(A Ruchi Group Company with',
      title: 'As Company Secretary in Indian Steel Corporation Limited',
      position: 'As Company Secretary in Indian Steel Corporation Limited',
      startDate: '2019-04',
      endDate: '',
      current: true,
      description: 'Heading Secretarial Department and compliance filings.',
      achievements: ['Heading Secretarial Department'],
    });
    expect(kept).not.toBeNull();
    expect(String(kept?.company || '')).toMatch(/indian steel/i);
    expect(String(kept?.title || kept?.position || '')).toMatch(/company secretary/i);
  });

  it('partitions multiple As-role-in-company blocks in one experience section', () => {
    const section = `
As Counsel in Alpha Manufacturing Limited
(An affiliate with turnover notes)
01.01.2020 - present
• Led compliance reviews

As Counsel in Beta Construction Limited
(An NSE listed company)
01.01.2018 – 31.12.2019
• Handled listings
`;
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    expect(jobs.map((j) => j.company).join('|')).toMatch(/alpha/i);
    expect(jobs.map((j) => j.company).join('|')).toMatch(/beta/i);
  });
});

describe('personal-detail name labels (generic)', () => {
  it('strips marital-status labels glued onto names', () => {
    expect(sanitizePersonName('Neha Singh Marital Status')).toMatch(/^Neha Singh$/i);
    expect(isPlausiblePersonName('Marital Status')).toBe(false);
    expect(isPlausiblePersonName('Neha Singh Marital Status')).toBe(true);
  });

  it('strips credential tokens from names', () => {
    expect(sanitizePersonName('FCS NEHA SINGH')).toMatch(/^Neha Singh$/i);
    expect(sanitizePersonName('Nehas Fcs Neha Singh')).toMatch(/neha singh/i);
    expect(sanitizePersonName('Nehas Fcs Neha Singh')).not.toMatch(/fcs/i);
  });

  it('prefers labeled Name over email-local extension', () => {
    const { pickBestNameFromCandidates } = require('../lib/resume-parser/import-sanitize');
    const best = pickBestNameFromCandidates(
      [
        { value: 'Neha Singh', confidence: 90, source: 'labeled_name' },
        { value: 'Nehas Singh', confidence: 92, source: 'email_derived' },
      ],
      'nehas.singh21@gmail.com'
    );
    expect(best).toMatch(/^Neha Singh$/i);
  });
});
