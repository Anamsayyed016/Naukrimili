import {
  enrichPartialNameFromEmail,
  expandVowelDroppedNameFromEmail,
  pickRicherFullName,
  recoverStructuredExperienceFromRawText,
  recoverCredentialProfileSummaryFromRawText,
  recoverLanguagesFromPersonalDetails,
  recoverSkillsFromCompetencySections,
  recoverCompetencyBulletsFromRawText,
  recoverSupplementaryExperienceFromRawText,
} from '@/lib/resume-parser/import-sanitize';
import { transformImportDataToBuilder, coalesceBuilderImportPayload } from '@/lib/resume-builder/import-transformer';
import { runCustomParserPipeline } from '@/lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '@/lib/resume-parser/map-to-upload-profile';

const NAUKRI_QAMAR_TEXT = `QMR ALI
Company Secretary
12 Years 0 Months Experience
Email: qamar.ali@gmail.com
Mobile: +91 9876543210

Work Experience

Dec 2021 - Till Date with Capital Aim Financial Advisory Pvt. Ltd. as Compliance Officer
Handling SEBI and RBI compliance filings for NBFC operations.

Jan 2015 - Dec 2021 with ICSI Indore Chapter as Company Secretary
Managed chapter administration and member engagement programs.

Jan 2010 - Dec 2014 with Sterling Industries Limited as Assistant Company Secretary
Drafted board resolutions and maintained statutory registers.

Jan 2006 - Dec 2009 with ABC Manufacturing Pvt Ltd as Legal Executive
Supported corporate legal documentation.

Education
ICSI - Associate Company Secretary
HSC MP BOARD

Key Skills
Corporate Law, Compliance, Secretarial Standards, Financial Reporting, Governance

Languages
Hindi, English, German

Interests
Reading and watching news related to corporate law.`;

const NAUKRI_QAMAR_PROSE_BULLETS = `CS Qamar Ali
E-Mail: qmr.ali@gmail.com

● Currently working as a company secretary at I.G. International Private Limited (Turnover 1000 Crore +) Navi Mumbai from 14 th Feb, 2022 till Present
● Worked as a Company Secretary and compliance officer at Josts Engineering Co. Ltd. (BSE Listed Co.) Mumbai from 5 th April, 2021 till Feb, 2022.
● Worked as a Company Secretary at Indian Steel Corporation Limited (Turnover 1200 Crore +) from March 2018 till September 2020.
● Worked as a Compliance Officer at Capital Aim Financial Advisory Pvt. Ltd. from April 2017 to March 2018.
● Worked as a Company Secretary and Compliance officer at Shri Krishna Devcon Limited from May 2016 to March 2017.
● Worked as a Company Secretary and Compliance officer at Amit Securities Limited from May 2015 to April 2016.`;

function runImportPipeline(rawText: string) {
  const pipeline = runCustomParserPipeline(rawText);
  const upload = mapExtractedToUploadProfile(pipeline.validation.resume, {
    aiProvider: 'custom-parser',
  });
  const builder = transformImportDataToBuilder({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  });
  return coalesceBuilderImportPayload({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
    builderFormData: builder,
  }) as Record<string, unknown>;
}

describe('Naukri Qamar Ali import patterns', () => {
  it('expands vowel-dropped first name from email local part', () => {
    expect(expandVowelDroppedNameFromEmail('Qmr Ali', 'qamar.ali@gmail.com')).toBe('Qamar Ali');
    expect(enrichPartialNameFromEmail('Qmr Ali', 'qamar.ali@gmail.com')).toBe('Qamar Ali');
  });

  it('prefers fuller first name when consonant skeletons match (Qmr vs Qamar)', () => {
    expect(pickRicherFullName('Qmr Ali', 'Qamar Ali', 'qmr.ali@gmail.com')).toBe('Qamar Ali');
  });

  it('recovers Till Date Naukri experience lines', () => {
    const recovered = recoverStructuredExperienceFromRawText(NAUKRI_QAMAR_TEXT);
    expect(recovered.length).toBeGreaterThanOrEqual(4);
    expect(
      recovered.some((e) =>
        String(e.company || '').toLowerCase().includes('capital aim')
      )
    ).toBe(true);
    expect(
      recovered.some(
        (e) =>
          String(e.endDate || '')
            .toLowerCase()
            .includes('present') || e.current === true
      )
    ).toBe(true);
  });

  it('recovers prose bullet experience lines (Currently working / Worked as)', () => {
    const recovered = recoverStructuredExperienceFromRawText(NAUKRI_QAMAR_PROSE_BULLETS);
    expect(recovered.length).toBeGreaterThanOrEqual(5);
    expect(
      recovered.some((e) => String(e.company || '').toLowerCase().includes('capital aim'))
    ).toBe(true);
    expect(
      recovered.some((e) => String(e.company || '').toLowerCase().includes('josts'))
    ).toBe(true);
    expect(
      recovered.some(
        (e) =>
          e.current === true ||
          String(e.endDate || '')
            .toLowerCase()
            .includes('present')
      )
    ).toBe(true);
  });

  it('recovers credential profile summary from preamble-style text', () => {
    const text = `CS Qamar Ali
(ACS Membership No. A39406)
CS and LL. B with Strong Corporate Exposure of 8 Years including 4 Years of handling Listed
and 20 + Group Companies.
● Currently working as a company secretary at Example Ltd from Jan 2020 till Present`;
    const summary = recoverCredentialProfileSummaryFromRawText(text);
    expect(summary.toLowerCase()).toMatch(/corporate exposure/);
    expect(summary.toLowerCase()).toMatch(/8 years/);
  });

  it('recovers languages from personal information lines', () => {
    const langs = recoverLanguagesFromPersonalDetails(
      'Languages known Hindi, English, Gujarati, Urdu, Arabic (Reading & Writing) Age 32 years'
    );
    expect(langs.length).toBeGreaterThanOrEqual(4);
    expect(langs.map((l) => l.toLowerCase())).toEqual(
      expect.arrayContaining(['hindi', 'english', 'urdu'])
    );
  });

  it('recovers competency synopsis bullets and skills labels', () => {
    const text = `Synopsis of work profile and experience gained:
● Corporate Actions- Stock split, Change of RTA, Dividend and All IEPF Compliances.
● Drafting and Vetting of Legal Agreements (Supply, Contractual, NDA).
Extracurricular Activities:`;
    const bullets = recoverCompetencyBulletsFromRawText(text);
    expect(bullets.length).toBeGreaterThanOrEqual(2);
    const skills = recoverSkillsFromCompetencySections(text);
    expect(skills.some((s) => /corporate actions/i.test(s))).toBe(true);
  });

  it('recovers supplementary training and teaching experience', () => {
    const text = `Trainings
● Worked at Example Financial Services Ltd. as a CS trainee for 15 months.
Teaching Experience
● Worked as a Law Faculty in Pioneer Academy and taught foundation students.
Synopsis of work profile:`;
    const rows = recoverSupplementaryExperienceFromRawText(text);
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });


  it('splits dual-company prose employment into two entries', () => {
    const text = `● Worked as Company Secretary at Alpha Securities Limited registered office at Mumbai and Beta Creations Pvt. Ltd. an NBFC Company from May 2015 to April 2016.`;
    const rows = recoverStructuredExperienceFromRawText(text);
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it('prefers prose recovery when section extraction only finds academic bleed', () => {
    // Multi-column bleed: education "rank" line dominates section engine;
    // real jobs appear as Currently working / Worked as bullets.
    const contaminated = `rank in college in 1

semester and 4 th in 2 .

● Currently working as a company secretary at Apex Holdings Private Limited from 14 th Feb, 2022 till Present
● Worked as a Company Secretary at Northwind Industries Limited from March 2018 till September 2020.
● Worked as a Compliance Officer at Meridian Advisory Pvt. Ltd. from April 2017 to March 2018.`;
    const pipeline = runCustomParserPipeline(contaminated);
    const exps = pipeline.validation.resume.experience || [];
    expect(exps.length).toBeGreaterThanOrEqual(3);
    expect(
      exps.every((e) => !/rank\s+in\s+college/i.test(String(e.company || '')))
    ).toBe(true);
    expect(
      exps.some((e) => /apex holdings/i.test(String(e.company || '')))
    ).toBe(true);
  });

  it('imports multiple jobs, skills, and education from Naukri-style text', () => {
    const out = runImportPipeline(NAUKRI_QAMAR_TEXT);
    const exps = out.experience as Array<Record<string, unknown>>;
    expect(exps.length).toBeGreaterThanOrEqual(3);
    expect(String(out.firstName || out.fullName)).toMatch(/qamar/i);
    const skills = out.skills as string[];
    expect(skills.length).toBeGreaterThan(2);
    expect(skills.join(' ').toLowerCase()).toMatch(/compliance|corporate/);
    const edu = out.education as Array<Record<string, unknown>>;
    expect(edu.some((e) => /hsc|board/i.test(String(e.degree || e.school || '')))).toBe(true);
  });
});
