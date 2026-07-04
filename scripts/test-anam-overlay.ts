import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  finalizeExperienceListForCustomParserImport,
} from '../lib/resume-parser/import-sanitize';
import { overlaySparseSectionsFromTextRecovery } from '../lib/resume-parser/prefer-recovered-wording';

const pdf = readFileSync('C:/Users/anams/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf');
const { text } = await parsePdfBuffer(Buffer.from(pdf));
const { text: prep } = prepareResumeTextForParsing(text);
const pipeline = runCustomParserPipeline(prep);
const uploadRaw = mapExtractedToUploadProfile(pipeline.validation.resume, {
  aiProvider: 'custom-parser',
}) as Record<string, unknown>;
uploadRaw.customParserUsed = true;
uploadRaw.selectedParser = 'custom';
uploadRaw.rawText = prep;

let profile = normalizeUploadProfile(uploadRaw) as Record<string, unknown>;
const { data: repaired } = validateAndRepairResumeExtraction(profile);
profile = {
  ...repaired,
  customParserUsed: true,
  selectedParser: 'custom',
  rawText: prep,
};
profile.experience = finalizeExperienceListForCustomParserImport(
  profile.experience as Record<string, unknown>[]
);

console.log('BEFORE overlay:');
(profile.experience as Record<string, unknown>[]).forEach((e, i) => {
  console.log(i, e.company, '|', e.position || e.title);
});

const after = overlaySparseSectionsFromTextRecovery(profile);
console.log('\nAFTER overlay:');
(after.experience as Record<string, unknown>[]).forEach((e, i) => {
  console.log(i, e.company, '|', e.position || e.title);
});
