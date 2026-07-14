import { readFileSync } from 'fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';

async function main() {
  const { text: raw } = await parsePdfBuffer(
    Buffer.from(readFileSync('C:/Users/admin/Downloads/Anam_Sayyed_HR_Resume.pdf'))
  );
  const prep = prepareResumeTextForParsing(raw);
  console.log('=== PREPARED (head 1400) ===\n', prep.text.slice(0, 1400));
  const sections = detectResumeSections(prep.text);
  console.log('\n=== SECTION LENS ===', {
    summary: String(sections.summary || '').length,
    experience: String(sections.experience || '').length,
    education: String(sections.education || '').length,
    skills: String(sections.skills || '').length,
    languages: String(sections.languages || '').length,
    certifications: String(sections.certifications || '').length,
  });
  console.log('\n=== EXPERIENCE SECTION ===\n', String(sections.experience || '').slice(0, 900));
  const jobs = extractExperiencesFromSection(
    sections.experience || '',
    sections.parseStrategy
      ? {
          threshold: sections.parseStrategy.experienceBoundaryThreshold,
          thresholdAfterBlank: sections.parseStrategy.experienceBoundaryThresholdAfterBlank,
        }
      : undefined
  );
  console.log(
    '\n=== JOBS ===',
    jobs.map((j) => ({ c: j.company, t: j.designation, conf: j.confidence, d: String(j.description || '').length }))
  );

  const pipeline = runCustomParserPipeline(prep.text);
  const resume = pipeline.validation.resume as any;
  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(pipeline.validation.resume, { aiProvider: 'custom-parser' }) as any
  ) as any;
  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText: prep.text,
    _imported: true,
    customParserUsed: true,
  });
  const builder = transformImportDataToBuilder({
    ...repaired,
    rawText: prep.text,
    _imported: true,
    customParserUsed: true,
  }) as any;
  console.log('\n=== BUILDER ===', {
    name: `${builder.firstName || ''} ${builder.lastName || ''}`.trim(),
    exp: (builder.experience || []).map((e: any) => `${e.title || '?'} @ ${e.company || '?'}`),
    edu: (builder.education || []).length,
    skills: (builder.skills || []).slice(0, 10),
    langs: builder.languages,
    summary: String(builder.summary || '').slice(0, 120),
    projects: (builder.projects || []).map((p: any) => p.name || p.title),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
