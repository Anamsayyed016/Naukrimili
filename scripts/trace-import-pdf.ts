/**
 * Trace import pipeline for any resume PDF — reports missing / sparse sections.
 * Usage: npx tsx scripts/trace-import-pdf.ts [path-to.pdf]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';
import { collectExperienceBodyFields } from '../lib/resume-parser/import-sanitize';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

const defaultPdf = resolve(
  process.env.USERPROFILE || '',
  'Downloads',
  'RESUME_RAJ_KUMAR_BHAWSAR_01.01.2026 (1).pdf'
);
const pdfPath = process.argv[2] ? resolve(process.argv[2]) : defaultPdf;

function countBodyUnits(row: Record<string, unknown>): number {
  const body = collectExperienceBodyFields(row);
  const descLines = body.description.split(/\n/).filter((l) => l.trim().length >= 12).length;
  return body.achievements.length + descLines;
}

async function main() {
  if (!existsSync(pdfPath)) {
    console.error('PDF not found:', pdfPath);
    process.exit(1);
  }

  console.log('PDF:', pdfPath);
  const bytes = readFileSync(pdfPath);
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(bytes));
  const prep = prepareResumeTextForParsing(rawPdfText);
  const rawText = prep.text;

  console.log('\n--- Text extraction ---');
  console.log('raw chars:', rawPdfText.length);
  console.log('prepared chars:', rawText.length);
  console.log('document type:', prep.profile.primaryType);

  const sections = detectResumeSections(rawText);
  console.log('\n--- Section text lengths ---');
  for (const key of [
    'preamble',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'achievements',
    'hobbies',
  ] as const) {
    const v = sections[key];
    console.log(`  ${key}:`, typeof v === 'string' ? v.length : 0);
  }

  const pipeline = runCustomParserPipeline(rawText);
  const resume = pipeline.validation.resume;

  console.log('\n--- Parser output ---');
  console.log('confidence:', pipeline.parserConfidenceScore);
  console.log('experiences:', resume.experiences?.length ?? 0);
  console.log('education:', resume.education?.length ?? 0);
  console.log('skills:', resume.skills?.length ?? 0);
  console.log('certifications:', resume.certifications?.length ?? 0);

  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(resume, { aiProvider: 'custom-parser' }) as Record<string, unknown>
  );
  const builder = transformImportDataToBuilder({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  const coalesced = coalesceBuilderImportPayload({
    ...upload,
    rawText,
    _imported: true,
    customParserUsed: true,
    builderFormData: builder,
  }) as Record<string, unknown>;

  const exps = Array.isArray(coalesced.experience) ? coalesced.experience : [];
  console.log('\n--- Experience detail ---');
  let sparse = 0;
  for (let i = 0; i < exps.length; i++) {
    const e = exps[i] as Record<string, unknown>;
    const units = countBodyUnits(e);
    if (units === 0) sparse += 1;
    console.log(
      `#${i + 1}`,
      String(e.title || e.position || '?'),
      '@',
      String(e.company || '?'),
      '| body units:',
      units
    );
  }
  console.log('\nSparse experience rows (no description/bullets):', sparse, '/', exps.length);

  const rawExpMentions = (rawText.match(/\b(?:ltd|limited|pvt|private limited|corporation)\b/gi) || [])
    .length;
  console.log('\nHeuristic: company suffix mentions in raw text:', rawExpMentions);
  if (rawExpMentions > exps.length + 2) {
    console.log('WARNING: raw text may contain more jobs than parsed experiences.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
