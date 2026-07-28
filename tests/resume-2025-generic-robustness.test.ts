import {
  normalizeHeadingText,
  scoreHeadingKeywords,
} from '@/lib/resume-parser/custom/section-detection/taxonomy';
import {
  splitGluedAllCapsNameUsingEmail,
  isPlausibleExperienceCompany,
  isPlausiblePersonName,
  formatDisplayName,
} from '@/lib/resume-parser/import-sanitize';
import { softSplitContactLabels } from '@/lib/docx-text-extraction';
import { detectCompanyFromLine } from '@/lib/resume-parser/custom/experience-extraction/company';

describe('resume 2025 generic robustness', () => {
  it('unglues PascalCase section headings so qualification maps correctly', () => {
    expect(normalizeHeadingText('ProfessionalQualification:')).toBe('professional qualification');
    expect(normalizeHeadingText('TechnicalQualification:')).toBe('technical qualification');
    expect(normalizeHeadingText('AcademicQualification:')).toBe('academic qualification');

    const prof = scoreHeadingKeywords('ProfessionalQualification:');
    expect(prof.certifications ?? 0).toBeGreaterThanOrEqual(80);
    expect(prof.experience ?? 0).toBe(0);

    const tech = scoreHeadingKeywords('TechnicalQualification:');
    expect(tech.certifications ?? 0).toBeGreaterThanOrEqual(80);

    const acad = scoreHeadingKeywords('AcademicQualification:');
    expect(acad.education ?? 0).toBeGreaterThanOrEqual(70);

    const exp = scoreHeadingKeywords('EXPERIENCE:');
    expect(exp.experience ?? 0).toBeGreaterThanOrEqual(70);

    expect(scoreHeadingKeywords('AWARD:-').achievements ?? 0).toBeLessThan(38);
    // Bare Key Area is an in-role duty label, not a Skills section opener.
    expect(scoreHeadingKeywords('KeyArea:').skills ?? 0).toBeLessThan(38);
    expect(scoreHeadingKeywords('Key Area:').skills ?? 0).toBeLessThan(38);
    expect(scoreHeadingKeywords('Key Areas of Expertise').skills ?? 0).toBeGreaterThanOrEqual(70);
  });

  it('rejects mid-experience duty/employer lines as section headings', async () => {
    const { scoreHeadingCandidate } = await import(
      '@/lib/resume-parser/custom/section-detection/score-heading'
    );
    const { buildLineIndex, lineContentDensity } = await import(
      '@/lib/resume-parser/custom/section-detection/line-index'
    );
    const { prepareResumeTextForParsing } = await import(
      '@/lib/resume-parser/resume-document-analysis'
    );

    const sample = [
      'EXPERIENCE:',
      '(1).ACMEPOLYFILMSLTD:A packaging group of companies',
      'Liaison officer (03 Jun 2019 to 29/05/2023) CTC: 5.4 lakh',
      'KeyArea:',
      '(a) Controlling induction and exit of staff',
      'Security staff management.',
      'BetaSecurityForce:A security and allied service provider (ISO9001:2015)',
      'Branch Head / Training Head (01 JULY 2015 TO 30 May 2019) CTC 4.6 pa',
      'GammaLtd Plant: A multinational company',
      'Hobbies & Interest :',
      'Reading',
    ].join('\n');

    const prepared = prepareResumeTextForParsing(sample);
    const lines = buildLineIndex(prepared.text);
    const blocked = [
      'KeyArea:',
      '(a) Controlling induction and exit of staff',
      'Security staff management.',
      'BetaSecurityForce:A security and allied service provider (ISO9001:2015)',
      'Branch Head / Training Head (01 JULY 2015 TO 30 May 2019) CTC 4.6 pa',
      'GammaLtd Plant: A multinational company',
    ];
    for (let i = 0; i < lines.length; i++) {
      const density = lineContentDensity(lines, i + 1, Math.min(lines.length, i + 8));
      const cand = scoreHeadingCandidate(i, lines, prepared.profile, density);
      if (blocked.some((b) => lines[i].text.includes(b.slice(0, 20)))) {
        expect(cand).toBeNull();
      }
    }

    const { detectResumeSections } = await import(
      '@/lib/resume-parser/custom/section-detection'
    );
    const sections = detectResumeSections(sample) as { experience?: string };
    expect(sections.experience || '').toMatch(/ACMEPOLYFILMSLTD/i);
    expect(sections.experience || '').toMatch(/BetaSecurityForce/i);
    expect(sections.experience || '').toMatch(/GammaLtd/i);
  });

  it('rejects table column headers as employers', () => {
    expect(isPlausibleExperienceCompany('Remarks')).toBe(false);
    expect(isPlausibleExperienceCompany('Organization')).toBe(false);
    expect(isPlausibleExperienceCompany('Course')).toBe(false);
    expect(isPlausibleExperienceCompany('BBA')).toBe(false);
    expect(isPlausibleExperienceCompany('U.P. Board')).toBe(false);
    expect(isPlausibleExperienceCompany('NAHAR POLY FILMS LTD')).toBe(true);
  });

  it('splits glued ALL-CAPS names using email local tokens', () => {
    const healed = splitGluedAllCapsNameUsingEmail(
      'TRILOKINATHUPADHYAYA(Ex- Havildar Radio OperatorfromArmy)',
      'upadhyaya.tn@gmail.com'
    );
    expect(healed).toMatch(/Trilokinath/i);
    expect(healed).toMatch(/Upadhyaya/i);
    expect(isPlausiblePersonName(healed)).toBe(true);

    expect(
      splitGluedAllCapsNameUsingEmail('ANAMSAYYED', 'anam.sayyed@example.com')
    ).toMatch(/Anam/i);
    expect(
      splitGluedAllCapsNameUsingEmail('S/oSHRIBANKEYUPADHYAYA NEAR TEMPLE', 'upadhyaya.tn@gmail.com')
    ).toBe('');
  });

  it('title-cases multi-word ALL CAPS display names', () => {
    expect(formatDisplayName('TRILOKINATH UPADHYAYA')).toBe('Trilokinath Upadhyaya');
  });

  it('soft-splits demographics without inventing names', () => {
    const split = softSplitContactLabels('Alex Rivera Female Age 40 years');
    expect(split).toMatch(/Alex Rivera/);
    expect(split).toMatch(/Female/);
    expect(split).toMatch(/Age 40/);
  });

  it('detects numbered employer:tagline lines', () => {
    const det = detectCompanyFromLine(
      '(1).NAHARPOLYFILMSLTD:Nahargroupsof companies'
    );
    expect(det.confidence).toBeGreaterThanOrEqual(42);
    expect(det.company).toMatch(/NAHAR|FILMS|LTD/i);
  });

  it('heals glued day-month-year tenures and scores colon employers before prose rejection', async () => {
    const { parseDateRangeFromText } = await import(
      '@/lib/resume-parser/custom/experience-extraction/dates'
    );
    const { detectCompanyFromLine } = await import(
      '@/lib/resume-parser/custom/experience-extraction/company'
    );

    const dates = parseDateRangeFromText(
      'Liaison officer (03Jun2019to29/05/2023)CTC: 5.4 lakh'
    );
    expect(dates?.startDate).toMatch(/2019/);
    expect(dates?.endDate).toMatch(/2023/);

    const longColon = detectCompanyFromLine(
      'AcmeSecurityForce:A security and allied service provider company (ISO9001:2015)'
    );
    expect(longColon.confidence).toBeGreaterThanOrEqual(50);
    expect(longColon.company).toMatch(/AcmeSecurityForce|Acme Security Force/i);

    expect(detectCompanyFromLine('KeyArea:').confidence).toBe(0);
    expect(detectCompanyFromLine('CashAward').confidence).toBe(0);
    expect(detectCompanyFromLine('(a) Controlling staff induction').confidence).toBe(0);
  });
});
