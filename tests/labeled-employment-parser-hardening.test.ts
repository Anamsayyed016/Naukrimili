import { recoverSummaryFromRawText } from '@/lib/resume-parser/import-sanitize';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { toCanonicalExperience } from '@/lib/resume-parser/custom/experience-extraction/types';
import { extractSkillsWithMeta } from '@/lib/resume-parser/custom/skills-intelligence';
import { validateAndRepairResume } from '@/lib/resume-parser/custom/validation-repair';
import { validateCertifications } from '@/lib/resume-parser/custom/validation-repair/languages';
import { createRepairContext } from '@/lib/resume-parser/custom/validation-repair/types';

describe('labeled employment and competency parser hardening', () => {
  it('recovers full opening profile prose instead of truncating at 120 characters', () => {
    const raw = [
      'Jane Example',
      'jane@example.com',
      '',
      'Strategic operations specialist with 16+ years of experience.',
      'Operations and administration professional with 16+ years of experience leading audits,',
      'policy framing, and technology transformation across multiple sites.',
      'Proven expertise in implementing custom workflows, automations, and integrations.',
      'Glimpse: Corporate operations',
      '• Worked across the spectrum from hiring to retirement.',
    ].join('\n');

    const summary = recoverSummaryFromRawText(raw);
    expect(summary.length).toBeGreaterThan(180);
    expect(summary).toMatch(/policy framing/i);
    expect(summary).toMatch(/custom workflows/i);
    expect(summary).not.toMatch(/Glimpse/i);
  });

  it('keeps responsibilities in description and drops tenure metadata from achievements', () => {
    const section = [
      'Acme Industries Ltd, Indore, Madhya Pradesh',
      'Designation: Senior Manager Corporate HR',
      'Tenure – May 25 – till date',
      'Responsibilities – Overall responsible for corporate HR activities, employee lifecycle, and policy implementation.',
    ].join('\n');

    const [job] = extractExperiencesFromSection(section);
    expect(job.description).toMatch(/Overall responsible for corporate HR activities/i);
    expect(job.bulletPoints.join(' ')).not.toMatch(/\bTenure\b/);

    const canonical = toCanonicalExperience(job);
    expect(canonical.description).toMatch(/Overall responsible for corporate HR activities/i);
    expect(canonical.achievements).toEqual([]);
  });

  it('preserves competency bullets from explicit skills sections during validation repair', () => {
    const skills = extractSkillsWithMeta({
      skillsSectionText: [
        'Strengths & IT Skills',
        '• Recruitment, Talent Acquisition (with Strong TPO network)',
        '• HR Policy Drafting & Implementation.',
        '• HRMS Configuration & Integrations.',
        '• Data Governance & Compliance.',
      ].join('\n'),
    }).skills;

    const result = validateAndRepairResume({
      skills,
      parserConfidence: 75,
      rawText: '',
    });

    const names = result.validated.skills.map((s) => s.name);
    expect(names.length).toBeGreaterThanOrEqual(4);
    expect(names).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Recruitment/i),
        expect.stringMatching(/HRMS Configuration/i),
        expect.stringMatching(/Data Governance/i),
      ])
    );
  });

  it('accepts online course titles without explicit certificate keywords', () => {
    const ctx = createRepairContext({ rawText: '' });
    const kept = validateCertifications(
      [
        { name: 'Generative AI in HR & Business Leaders', issuer: '', date: '' },
        { name: 'Human Resources: Selecting an HR System', issuer: '', date: '' },
        { name: 'Diploma in Labour Laws and Statutory Compliance for HRs', issuer: 'Udemy', date: '' },
      ],
      ctx
    );

    expect(kept).toHaveLength(3);
  });
});
