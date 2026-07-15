/**
 * Generic parser regression cases derived from common ATS layout patterns.
 * Do not hardcode person/company-specific expectations beyond structural shapes.
 */
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '@/lib/resume-parser/custom/education-extraction';
import { collectFromSkillsSection } from '@/lib/resume-parser/custom/skills-intelligence/collect';
import { detectAddress } from '@/lib/resume-parser/custom/identity-extraction/address';
import {
  isImplausibleResumeLocation,
  recoverLocationFromImportText,
  recoverSkillsFromTechnicalSkillsSection,
  sanitizeExperienceEntry,
} from '@/lib/resume-parser/import-sanitize';

describe('generic ATS layout parser hardening', () => {
  it('splits contiguous company-only headers after a completed role', () => {
    const section = `
Acme Industries Pvt. Ltd.
Assistant Manager – Accounts & Finance | October 2024 – Present
• Oversaw daily accounting operations.
Beta Food Products Pvt. Ltd.
Assistant Manager – Accounts & Finance | February 2023 – September 2024
• Managed day-to-day AP and AR operations.
`.trim();
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    expect(jobs[0].company).toMatch(/Acme/i);
    expect(jobs[0].designation).toMatch(/Assistant Manager/i);
    expect(jobs[1].company).toMatch(/Beta/i);
  });

  it('parses company-first compressed header with title and dates on one line', () => {
    const section = `
Hardware Fasteners Ltd. (Brand) Executive – Accounts & Finance | December 2021 – January 2023
• Verified vendor invoices and managed GST credits.
Trading Enterprises LLP Accountant | December 2018 – December 2021
• Supervised day-to-day accounting functions.
`.trim();
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    expect(jobs[0].company).toMatch(/Hardware Fasteners/i);
    expect(jobs[0].designation).toMatch(/Executive|Accounts/i);
    expect(String(jobs[0].company)).not.toMatch(/December|2021/i);
    expect(jobs[1].company).toMatch(/Trading Enterprises/i);
    expect(jobs[1].designation).toMatch(/Accountant/i);
  });

  it('keeps Title | Dates designation and never assigns dates as company', () => {
    const section = `
Northwind Group
Accountant | June 2017 – December 2018
• Managed routine bookkeeping functions.
`.trim();
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBe(1);
    expect(jobs[0].company).toMatch(/Northwind/i);
    expect(jobs[0].designation).toMatch(/Accountant/i);
    expect(String(jobs[0].company)).not.toMatch(/June|2017/i);
  });

  it('splits short employer headers after compressed Company+Title|Dates roles', () => {
    const section = `
Trading Enterprises LLP Accountant | December 2018 – December 2021
• Supervised day-to-day accounting functions.
Summit Group
Accountant | June 2017 – December 2018
• Managed routine bookkeeping functions.
`.trim();
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBe(2);
    expect(jobs[0].company).toMatch(/Trading Enterprises/i);
    expect(jobs[0].designation).toMatch(/Accountant/i);
    expect(jobs[1].company).toMatch(/Summit Group/i);
    expect(jobs[1].designation).toMatch(/Accountant/i);
    expect(jobs[1].company).not.toMatch(/Trading/i);
  });

  it('extracts bullet Degree – Institution (year) education rows', () => {
    const section = `
● M.Com – State University (2025)
● LLB – Government Law College (2020)
● MBA in Business Economics – Regional University (2016)
● BCA – City College (2011)
`.trim();
    const edu = extractEducationFromSection(section);
    expect(edu.length).toBe(4);
    expect(edu[0].degree).toMatch(/M\.?Com/i);
    expect(edu[0].institution).toMatch(/State University/i);
    expect(String(edu[0].degree)).not.toMatch(/●/);
    expect(edu[3].degree).toMatch(/BCA/i);
  });

  it('keeps four compact rows when school is an abbreviation without university tokens', () => {
    const section = `
● M.Sc – Central Board Hub (2024)
● LL.M – State Law Academy, Midtown (2019)
● MBA in Applied Analytics – X.Y.Z.U., Midtown (2015)
● B.Sc – Riverdale Science College, Midtown (2010)
`.trim();
    const edu = extractEducationFromSection(section);
    expect(edu).toHaveLength(4);
    expect(edu[2].degree).toMatch(/MBA/i);
    expect(edu[2].fieldOfStudy).toMatch(/Applied Analytics/i);
    expect(edu[2].institution).toMatch(/X\.Y\.Z\.U/i);
    expect(edu[2].institution).not.toMatch(/B\.?Sc|Riverdale/i);
    expect(edu[3].degree).toMatch(/B\.?Sc/i);
    expect(edu[3].institution).toMatch(/Riverdale Science College/i);
    expect(edu[3].institution).not.toMatch(/\(\s*$/);
  });

  it('preserves short titles like Executive and does not stamp profile headline across roles', () => {
    const cleaned = sanitizeExperienceEntry({
      company: 'Hardware Fasteners Ltd. (Brand)',
      designation: 'Executive',
      title: 'Executive',
      position: 'Executive',
      startDate: '2021-12',
      endDate: '2023-01',
      description: 'Verified vendor invoices and managed GST credits.',
    });
    expect(cleaned?.position || cleaned?.title || cleaned?.designation).toMatch(/Executive/i);
  });

  it('rejects bare degree abbreviations as experience companies', () => {
    expect(sanitizeExperienceEntry({
      company: 'BCA',
      designation: '',
      title: '',
      position: '',
      description: '',
    })).toBeNull();
  });

  it('rejects skill-wrap fragments as locations and recovers labeled Location', () => {
    expect(isImplausibleResumeLocation('Management, Payroll Processing')).toBe(true);
    const loc = recoverLocationFromImportText(
      'Phone: 9000000000 | Email: person@example.com | Location: Bhopal, India\nCore Skills\nManagement, Payroll Processing'
    );
    expect(loc).toMatch(/Bhopal/i);
  });

  it('parses category skill bullets and stops at Professional Experience', () => {
    const skillsSection = `
● Financial Operations: Accounts Payable (AP), Accounts Receivable (AR), Bookkeeping
● Software & Tools: SAP, Tally ERP 9, Microsoft Excel
`.trim();
    const fromSection = collectFromSkillsSection(skillsSection);
    const names = fromSection.map((s) => s.normalized || s.raw).join(' | ');
    expect(names).toMatch(/Accounts Payable|Bookkeeping|SAP|Tally/i);
    expect(names).not.toMatch(/Financial Operations:/i);

    const recovered = recoverSkillsFromTechnicalSkillsSection(`
Core Skills
● Financial Operations: Accounts Payable (AP), Payroll Processing
Professional Experience
Impression Furniture Industries Pvt. Ltd.
Assistant Manager – Accounts & Finance | October 2024 – Present
• Oversaw daily accounting operations.
`);
    expect(recovered.some((s) => /Accounts Payable|Payroll/i.test(s))).toBe(true);
    expect(recovered.some((s) => /Impression Furniture|Assistant Manager|October 2024/i.test(s))).toBe(
      false
    );
  });

  it('detects labeled Location inside pipe contact lines', () => {
    const result = detectAddress([
      {
        label: 'header',
        weight: 1,
        text: 'Phone: 9000000000 | Email: person@example.com | Location: Bhopal, India',
      },
    ]);
    const joined = [result.city, result.state, result.address, result.country].filter(Boolean).join(', ');
    expect(joined).toMatch(/Bhopal/i);
  });
});
