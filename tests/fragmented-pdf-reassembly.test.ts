import {
  reassembleFragmentedResumeLines,
  joinSplitSectionHeadings,
} from '@/lib/resume-parser/text-recovery';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { parseLanguagesFromSection } from '@/lib/resume-parser/custom/language-extraction';
import { isValidSkillCandidate } from '@/lib/resume-parser/custom/skills-intelligence/validate';

describe('fragmented PDF line reassembly (generic)', () => {
  it('joins split section heading tokens', () => {
    const joined = joinSplitSectionHeadings(['WORK', 'EXPERIENCE', 'HR Coordinator'].join('\n'));
    expect(joined).toMatch(/WORK EXPERIENCE/i);
  });

  it('reassembles word-per-line job headers without inventing employers', () => {
    const fragmented = [
      'WORK',
      'EXPERIENCE',
      'HR',
      'Coordinator',
      'Acme',
      'Systems Pvt. Ltd. | Metro City | Mar 2025 – Present',
      '• Led recruitment cycles',
      'Office',
      'Administrator',
      'Northwind',
      '| Metro | 2020 – 2024',
      '• Managed onboarding',
    ].join('\n');

    const reassembled = reassembleFragmentedResumeLines(fragmented);
    expect(reassembled).toMatch(/WORK EXPERIENCE/i);
    expect(reassembled).toMatch(/HR Coordinator/i);
    expect(reassembled).toMatch(/Acme Systems Pvt\. Ltd\./i);
    expect(reassembled).toMatch(/Office Administrator/i);
    expect(reassembled).toMatch(/Northwind.*Metro.*2020/i);

    const prepared = prepareResumeTextForParsing(fragmented);
    const sections = detectResumeSections(prepared.text);
    const jobs = extractExperiencesFromSection(sections.experience || '');
    expect(jobs.length).toBeGreaterThanOrEqual(1);
    const companyBlob = jobs.map((j) => j.company).join(' | ');
    expect(companyBlob).toMatch(/acme|northwind/i);
  });

  it('leaves low-fragmentation ATS text largely unchanged', () => {
    const ats = [
      'Alice Example',
      'alice@example.com',
      'PROFESSIONAL SUMMARY',
      'Engineer with experience building APIs and dashboards for product teams.',
      'WORK EXPERIENCE',
      'Software Engineer | Example Corp | 2020 - Present',
      '- Built services',
    ].join('\n');
    const out = reassembleFragmentedResumeLines(ats);
    expect(out).toContain('Software Engineer | Example Corp | 2020 - Present');
    expect(out).toContain('Engineer with experience building APIs');
  });
});

describe('language proficiency line merge (generic)', () => {
  it('merges language name with following parenthetical proficiency', () => {
    const langs = parseLanguagesFromSection(['English', '(Fluent)', 'Hindi', '(Native)'].join('\n'));
    expect(langs.map((l) => l.name.toLowerCase())).toEqual(['english', 'hindi']);
    expect(langs.every((l) => !/^(fluent|native)$/i.test(l.name))).toBe(true);
    expect(langs.find((l) => /english/i.test(l.name))?.proficiency).toMatch(/fluent/i);
  });
});

describe('skill duty-verb rejection (generic)', () => {
  it('rejects past-tense duty verbs masquerading as skills', () => {
    expect(isValidSkillCandidate('Conducted')).toBe(false);
    expect(isValidSkillCandidate('Maintained')).toBe(false);
    expect(isValidSkillCandidate('Employee Relations')).toBe(true);
    expect(isValidSkillCandidate('Communication')).toBe(true);
  });
});
