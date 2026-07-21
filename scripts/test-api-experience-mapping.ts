/** Simulate ultimate-upload profile experience mapping (isCurrent bug) */
import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';

function mapExperienceLikeApi(exp: Record<string, unknown>) {
  const startDate = String(exp.start_date || exp.startDate || '').trim();
  const endDateRaw = String(exp.end_date || exp.endDate || '').trim();
  const isCurrent =
    exp.current === true ||
    !endDateRaw ||
    /^(present|current|now|ongoing)$/i.test(endDateRaw);
  const endDate = isCurrent ? '' : endDateRaw;
  const duration = isCurrent
    ? startDate
      ? `${startDate} - Present`
      : 'Present'
    : startDate && endDate
      ? `${startDate} - ${endDate}`
      : endDate || startDate || '';
  return { company: exp.company, startDate, endDate, current: isCurrent, duration };
}

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Resume - SSY HRD IR.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(
    Buffer.from(readFileSync(pdfPath))
  );
  const prep = prepareResumeTextForParsing(rawPdfText);
  const pipeline = runCustomParserPipeline(prep.text);
  const extracted = pipeline.validation.resume;
  const uploadRaw = mapExtractedToUploadProfile(extracted, {
    aiProvider: 'custom-parser',
  }) as Record<string, unknown>;
  uploadRaw.customParserUsed = true;
  uploadRaw.rawText = prep.text;
  const uploadNorm = normalizeUploadProfile(uploadRaw) as Record<string, unknown>;
  const { data: repaired } = validateAndRepairResumeExtraction({
    ...uploadNorm,
    rawText: prep.text,
    customParserUsed: true,
  });

  const exps = (repaired.experience as Record<string, unknown>[]) || [];
  console.log('Raw repaired experience (first 4):');
  for (const e of exps.slice(0, 4)) {
    console.log({
      company: String(e.company).slice(0, 35),
      startDate: e.startDate,
      endDate: e.endDate,
      end_date: e.end_date,
      current: e.current,
    });
  }

  console.log('\nAfter API-style mapping:');
  for (const e of exps.slice(0, 4)) {
    console.log(mapExperienceLikeApi(e));
  }

  const profile = {
    ...(repaired as Record<string, unknown>),
    fullName: repaired.fullName,
    experience: exps.map(mapExperienceLikeApi),
    customParserUsed: true,
    rawText: prep.text,
  };

  const builder = transformImportDataToBuilder(profile) as Record<string, unknown>;
  console.log('\nBuilder identity:', {
    firstName: builder.firstName,
    lastName: builder.lastName,
    fullName: builder.fullName,
  });
  console.log('\nBuilder experience (first 4):');
  for (const e of ((builder.experience as Record<string, unknown>[]) || []).slice(0, 4)) {
    console.log({
      company: String(e.company).slice(0, 35),
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      duration: e.duration,
    });
  }
}

main().catch(console.error);
