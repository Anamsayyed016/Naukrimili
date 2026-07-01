import { validateAndRepairResumeExtraction } from '@/lib/resume-parser/extraction-repair';
import { expandCompoundLanguages } from '@/lib/resume-parser/normalize-extracted';
import { sanitizeSkillEntry } from '@/lib/resume-parser/import-sanitize';
import { extractResumeFromText } from '@/lib/resume-parser/text-recovery';

describe('resume extraction intelligence', () => {
  it('expandCompoundLanguages splits Hindi & English', () => {
    const langs = expandCompoundLanguages(['Hindi & English']);
    expect(langs.map((l) => l.name.toLowerCase()).sort()).toEqual(['english', 'hindi']);
  });

  it('validateAndRepair moves education and certifications out of achievements', () => {
    const { data } = validateAndRepairResumeExtraction({
      achievements: [
        'B.Tech Computer Science, IIT Bombay',
        'IATA/UFTAA Certified',
        'Increased revenue by 20%',
        'Handled client onboarding daily',
      ],
      experience: [{ company: 'Acme', position: 'Analyst', achievements: [] }],
      education: [],
      certifications: [],
    });

    expect(data.achievements).toEqual(
      expect.arrayContaining([expect.stringMatching(/20%/i)])
    );
    expect(data.achievements.some((a) => /handled client/i.test(String(a)))).toBe(false);
    expect(data.education.length).toBeGreaterThan(0);
    expect(data.certifications.length).toBeGreaterThan(0);
  });

  it('extractResumeFromText separates professional qualifications from education', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'EDUCATION',
      'Bachelor of Commerce, Delhi University, 2018',
      '',
      'PROFESSIONAL QUALIFICATIONS',
      'IATA/UFTAA Foundation',
      'PMP Certification',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.education.some((e) => /bachelor|commerce/i.test(String(e.degree || '')))).toBe(true);
    expect(parsed.certifications.some((c) => /IATA|PMP/i.test(String(c.name || '')))).toBe(true);
    expect(parsed.education.some((e) => /IATA|PMP/i.test(String(e.degree || e.institution || '')))).toBe(false);
  });

  it('parseSkills and sanitizeSkillEntry reject metadata and section bleed', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'SKILLS',
      'Java, SQL, Excel',
      'Current CTC: 12 LPA',
      'Reading',
      'Listening Music',
      'Certifications',
      'PMP',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.skills).toEqual(expect.arrayContaining(['Java', 'SQL', 'Excel']));
    expect(parsed.skills.some((s) => /ctc/i.test(s))).toBe(false);
    expect(parsed.skills.some((s) => /reading/i.test(s))).toBe(false);
    expect(parsed.skills.some((s) => /certif/i.test(s))).toBe(false);
    expect(sanitizeSkillEntry('Expected CTC: 15 LPA')).toBe('');
  });

  it('experience body stops at embedded section headings', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'EXPERIENCE',
      'Software Engineer',
      'Acme Corp',
      'Jan 2020 - Present',
      'Built APIs for billing platform',
      'Reduced latency by 30%',
      '',
      'SKILLS',
      'Java, Python',
      '',
      'CERTIFICATIONS',
      'AWS Certified',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    const desc = String(parsed.experience[0]?.description || '');
    expect(desc).toMatch(/billing|latency/i);
    expect(desc).not.toMatch(/AWS Certified/i);
    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.certifications.some((c) => /AWS/i.test(String(c.name || '')))).toBe(true);
  });
});
