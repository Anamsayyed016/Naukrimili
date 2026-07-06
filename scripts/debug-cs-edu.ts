import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { extractNameWithConfidence } from '../lib/resume-parser/text-recovery';

const b = readFileSync('C:/Users/anams/Downloads/PROFILE OF CS.pdf');
const { text } = await parsePdfBuffer(Buffer.from(b));
const rawText = prepareResumeTextForParsing(text).text;

console.log('extractNameWithConfidence:', extractNameWithConfidence(rawText));

const pipeline = runCustomParserPipeline(rawText);
const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, { aiProvider: 'custom-parser' });
const uploadNorm = normalizeUploadProfile(uploadRaw);
const profile = { ...uploadNorm, customParserUsed: true, rawText, _imported: true };
const builder = transformImportDataToBuilder(profile) as Record<string, unknown>;

console.log('identity:', builder.firstName, builder.lastName, '|', builder.fullName);
console.log('education count:', Array.isArray(builder.education) ? builder.education.length : 0);
for (const e of (builder.education as Record<string, unknown>[]) || []) {
  console.log('  edu:', e.degree, '@', e.institution || e.school);
}
console.log('skills:', (builder.skills as string[])?.slice(0, 20).join(', '));
