import { parsePdfBuffer } from '@/lib/pdf-parse-safe';
import { recoverTextFromPdfContentStreams, isUsableRecoveredPdfText } from '@/lib/pdf-stream-text-recovery';
import { parseTenureExperienceLine } from '@/lib/resume-parser/custom/experience-extraction/tenure';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';
import { readFileSync } from 'fs';

describe('pdf stream text recovery', () => {
  it('recovers usable text from broken-xref Sarfaraz PDF when available', async () => {
    const path = 'C:/Users/admin/Downloads/Sarfaraz CV_08-08-2024.pdf';
    let buf: Buffer;
    try {
      buf = Buffer.from(readFileSync(path));
    } catch {
      // Skip when the validation PDF is not present on the machine.
      return;
    }
    let threw = false;
    try {
      // Old pdf-parse alone may fail; parsePdfBuffer should recover.
      const result = await parsePdfBuffer(buf);
      expect(isUsableRecoveredPdfText(result.text)).toBe(true);
      expect(result.text.toLowerCase()).toMatch(/experience|quality|engineer|education|qualification/);
    } catch {
      threw = true;
      const recovered = recoverTextFromPdfContentStreams(buf);
      expect(isUsableRecoveredPdfText(recovered)).toBe(true);
    }
    expect(threw).toBe(false);
  });
});

describe('tenure experience lines', () => {
  it('parses N years experience as Title at Company', () => {
    const parsed = parseTenureExperienceLine(
      '07 Year experience as a Deputy Quality Manager at M/s Example Transformers (Global) Pvt. Ltd.'
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.designation).toMatch(/deputy quality manager/i);
    expect(parsed!.company).toMatch(/example transformers/i);
    expect(parsed!.years).toBe(7);
  });

  it('splits contiguous tenure lines into multiple jobs', () => {
    const section = [
      'Experience Summary:',
      '05 Year experience as a Quality Manager at M/s Alpha Industries Pvt. Ltd.',
      '02 years experience as a Project Engineer at M/s Beta Works Ltd.',
      'Quality Manager Roles & Responsibilities',
      'To ensure quality conformance through planning and inspections.',
    ].join('\n');
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    expect(jobs.some((j) => /quality manager/i.test(j.designation))).toBe(true);
    expect(jobs.some((j) => /project engineer/i.test(j.designation))).toBe(true);
    expect(jobs.every((j) => !/roles?\s*&?\s*responsibilit/i.test(j.designation))).toBe(true);
  });
});

describe('experience summary heading classification', () => {
  it('maps Experience Summary to experience, not summary', () => {
    const text = [
      'Jane Example',
      'Engineer',
      'jane@example.com',
      '',
      'Experience Summary:',
      '05 Year experience as a Quality Manager at M/s Alpha Industries Pvt. Ltd.',
      'To ensure quality of conformance through planning.',
      '',
      'Education',
      'B.E. (Electrical) From Sample Institute of Technology',
    ].join('\n');
    const sections = detectResumeSections(text);
    const expHeading = sections.sections.find((s) => /experience summary/i.test(s.rawHeading));
    expect(expHeading?.type).toBe('experience');
    expect(sections.experience.length).toBeGreaterThan(40);
  });
});
