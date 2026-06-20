import { validateAndRepairResumeExtraction } from '@/lib/resume-parser/extraction-repair';
import { expandCompoundLanguages } from '@/lib/resume-parser/normalize-extracted';
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
});
