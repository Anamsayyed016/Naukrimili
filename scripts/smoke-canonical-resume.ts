import {
  buildCanonicalResumeFromValidation,
  experienceNodeId,
  isFrozenCanonicalResume,
  serializeBuilderResume,
  serializeCanonicalResume,
  toExtractedResumeData,
} from '../lib/resume-parser/custom/canonical-resume';
import { validateAndRepairResume } from '../lib/resume-parser/custom/validation-repair';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const section = [
  'Software Engineer | Technoart Pvt Ltd',
  'Jan 2022 - Present',
  '- Built APIs',
].join('\n');

const experiences = extractExperiencesFromSection(section);
const repaired = validateAndRepairResume({
  experiences,
  sectionTexts: { experience: section },
  parserConfidence: 72,
});

const resume = buildCanonicalResumeFromValidation(repaired);
assert(isFrozenCanonicalResume(resume), 'resume must be frozen');
assert(resume.experience.length >= 1, 'experience present');

const stableId = experienceNodeId(0, resume.experience[0].data);
assert(resume.experience[0].id === stableId, 'stable experience id');

const builder = toExtractedResumeData(resume);
assert(!('metadata' in builder), 'builder export has no metadata');
assert(builder.skills.length >= 0, 'skills array exists');

const full = serializeCanonicalResume(resume);
const builderJson = serializeBuilderResume(resume);
assert(full.includes('"metadata"'), 'full snapshot has metadata');
assert(!builderJson.includes('"metadata"'), 'builder json has no metadata');

console.log('smoke-canonical-resume: OK');
console.log(
  JSON.stringify(
    {
      version: resume.version,
      experienceIds: resume.experience.map((e) => e.id),
      quality: resume.metadata.quality.resumeQualityScore,
      frozen: isFrozenCanonicalResume(resume),
    },
    null,
    2
  )
);
