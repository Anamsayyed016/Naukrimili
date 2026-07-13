import {
  recoverStructuredExperienceFromRawText,
  recoverCareerObjectiveFromRawText,
  isPlausibleProjectName,
  sanitizePersonName,
} from '@/lib/resume-parser/import-sanitize';
import { runCustomParserPipeline } from '@/lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '@/lib/resume-parser/map-to-upload-profile';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '@/lib/resume-builder/import-transformer';

/**
 * Generic Title–Company–(date) sample (no production-person identifiers).
 * Mirrors compact practical-experience CV layouts used across CS/legal/manufacturing roles.
 */
const TITLE_COMPANY_DATE_SAMPLE = `CURRICULUM VITAE
ALEX RIVERA
COMPANY SECRETARY

CAREER OBJECTIVE:
To secure a responsible and challenging position in a progressive organization
to utilize analytical skill while meeting organizational objectives.

QUALIFICATION:
PROFESSIONAL:
Examination Institution
Company Secretaries Passed in June, 2011, Institute of Demo Secretaries

ACADEMIC:
Graduation Demo University
LLB from Example Institute of Law in 2016

PRACTICAL EXPERIENCE:
 Head Company Secretary & Legal Manager-Acme Iron & Steel Co. Ltd, Delhi-110054,
Stainless Steel Manufacturing Company, (August. 2021 to Cont.....),
 Company Secretary & Compliance Officer with Northwind Trimex Ltd., Marble Manufacturing
Company. (Jan. 2018 to May. 2021)
 Assistant Company Secretary-Beacon Group of Companies, Beacon Brands Limited, Gurgaon,
(Jan. 2016 – Dec. 2017)
 Assistant Company Secretary & CS Trainee- Orion Kumar & Associates, Company
Secretaries, Lajpat Nagar-IV, Delhi-110024 (April, 2010-Dec.,2015)

TECHNICAL SKILL:
 Well versed with MS office, MS excel and Internet.

Work Exposure:
Secretarial Compliances:
 Routine Secretarial Work viz drafting of Notice, Agenda, Directors Report.
`;

function runImport(rawText: string) {
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

describe('title-company-date experience recovery', () => {
  it('recovers Title - Company (Mon. Year to Cont/Present) and Title with Company (date range)', () => {
    const rows = recoverStructuredExperienceFromRawText(TITLE_COMPANY_DATE_SAMPLE);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(
      rows.some((e) => /acme iron/i.test(String(e.company || '')))
    ).toBe(true);
    expect(
      rows.some((e) => /northwind/i.test(String(e.company || '')))
    ).toBe(true);
    expect(
      rows.some(
        (e) =>
          e.current === true ||
          /present/i.test(String(e.endDate || ''))
      )
    ).toBe(true);
    expect(
      rows.every((e) => !/practical experience/i.test(String(e.company || '')))
    ).toBe(true);
  });

  it('recovers career objective as summary text', () => {
    const summary = recoverCareerObjectiveFromRawText(TITLE_COMPANY_DATE_SAMPLE);
    expect(summary.toLowerCase()).toMatch(/challenging position/);
    expect(summary.toLowerCase()).not.toMatch(/father/);
  });

  it('rejects section headings as project names', () => {
    expect(isPlausibleProjectName('PRACTICAL EXPERIENCE:')).toBe(false);
    expect(isPlausibleProjectName('Examination Institution')).toBe(false);
    expect(isPlausibleProjectName('Work Exposure')).toBe(false);
  });

  it('strips kinship labels trailing into person names', () => {
    expect(sanitizePersonName('Alex Rivera Father')).toBe('Alex Rivera');
  });

  it('imports compact practical-experience CV through full pipeline', () => {
    const out = runImport(TITLE_COMPANY_DATE_SAMPLE);
    const exps = (out.experience || []) as Array<Record<string, unknown>>;
    expect(exps.length).toBeGreaterThanOrEqual(3);
    expect(
      exps.some((e) => /acme|northwind|beacon|orion/i.test(String(e.company || '')))
    ).toBe(true);
    expect(String(out.summary || out.bio || '').length).toBeGreaterThan(40);
    const projects = (out.projects || []) as Array<Record<string, unknown>>;
    expect(
      projects.every(
        (p) => !/practical experience|examination institution/i.test(String(p.title || p.name || ''))
      )
    ).toBe(true);
  });
});
