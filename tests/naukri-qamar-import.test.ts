import {
  enrichPartialNameFromEmail,
  expandVowelDroppedNameFromEmail,
  pickRicherFullName,
  recoverStructuredExperienceFromRawText,
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
