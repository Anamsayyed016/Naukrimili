import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { syncExperienceEntryAliases } from '../lib/resume-builder/experience-entry-sync';

const ANAM = [
  'WORK EXPERIENCE',
  'Python Developer                     Digital Solutions Pvt Ltd',
  'Bhopal, Madhya Pradesh               2022-01 - Present',
  '- Designed secure APIs.',
  '',
  'Full Stack Developer                 Digital',
  'Bhopal, Madhya Pradesh               2020-02 - 2022-01',
  '- Led full-stack apps.',
  '',
  'Full Stack Python Developer          Cybrom Technology',
  'Bhopal                               2019 - 2020',
  '- Wrote clean code.',
].join('\n');

const parser = runCustomParserPipeline(prepareResumeTextForParsing(ANAM).text).validation.resume;
const builder = transformImportDataToBuilder({
  ...normalizeUploadProfile(mapExtractedToUploadProfile(parser, { aiProvider: 'custom-parser' })),
  customParserUsed: true,
});

for (const [i, exp] of (builder.experience as Record<string, unknown>[]).entries()) {
  const before = { company: exp.company, title: exp.title, desc: String(exp.description).slice(0, 40) };
  const after = syncExperienceEntryAliases(exp);
  const changed =
    before.company !== after.company ||
    before.title !== after.title ||
    before.desc !== String(after.description).slice(0, 40);
  console.log(`#${i + 1} before`, before);
  console.log(`#${i + 1} after `, {
    company: after.company,
    title: after.title,
    desc: String(after.description).slice(0, 40),
    bullets: Array.isArray(after.achievements) ? after.achievements.length : 0,
  });
  if (changed) console.log(`#${i + 1} CHANGED`);
}
