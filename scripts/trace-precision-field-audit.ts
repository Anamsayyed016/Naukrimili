/**
 * Full pipeline field trace — extraction vs validation vs builder mapping.
 */
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection/engine';
import { extractIdentityFromSections } from '../lib/resume-parser/custom/identity-extraction';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '../lib/resume-parser/custom/project-extraction';
import { extractCertificationsFromSection } from '../lib/resume-parser/custom/certification-extraction';
import { extractLanguagesFromSection } from '../lib/resume-parser/custom/language-extraction';
import { collectAllSkillCandidates } from '../lib/resume-parser/custom/skills-intelligence/collect';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { buildCanonicalResumeFromValidation } from '../lib/resume-parser/custom/canonical-resume/build';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';

const rawText = process.argv[2] || [
  'ANAM SAYYED                          SKILLS',
  'Python Developer                     Python, Django, ReactJS',
  'anamsayyed58@gmail.com | 7415566841',
  'Bhopal, Madhya Pradesh',
  '',
  'CERTIFICATIONS',
  'AWS Certified Solutions Architect - Amazon Web Services',
  '2023',
  '',
  'EXPERIENCE',
  'Python Developer | Digital Solutions Pvt Ltd',
  '2022 - Present',
  '- Built REST APIs',
].join('\n');

function diff(label: string, before: unknown, after: unknown) {
  const b = JSON.stringify(before);
  const a = JSON.stringify(after);
  if (b !== a) console.log(`  [CHANGED] ${label}\n    before: ${b}\n    after:  ${a}`);
}

const sections = detectResumeSections(rawText);
const preIdentity = extractIdentityFromSections({
  headerText: sections.preamble || rawText.split('\n').slice(0, 4).join('\n'),
  contactSectionText: sections.preamble,
  preambleText: rawText.slice(0, 800),
  fullResumeText: rawText,
});
const preExp = sections.experience ? extractExperiencesFromSection(sections.experience) : [];
const preCerts = sections.certifications
  ? extractCertificationsFromSection(sections.certifications)
  : [];

const pipeline = runCustomParserPipeline(rawText);
const canonical = buildCanonicalResumeFromValidation(pipeline.validation);
const upload = mapExtractedToUploadProfile(pipeline.validation.resume);
const builder = transformImportDataToBuilder(upload);

console.log('=== SECTION DETECTION ===');
console.log({
  preamble: sections.preamble?.slice(0, 120),
  experience: Boolean(sections.experience),
  certifications: Boolean(sections.certifications),
});

console.log('\n=== IDENTITY ===');
diff('fullName', preIdentity.fullName, pipeline.validation.resume.fullName);
diff('email', preIdentity.email, pipeline.validation.resume.email);
console.log('  source header:', rawText.split('\n')[0]);
console.log('  extracted:', pipeline.validation.resume.fullName);
console.log('  builder:', (builder as Record<string, unknown>).fullName);

console.log('\n=== EXPERIENCE[0] ===');
const pre0 = preExp[0];
const post0 = pipeline.validation.resume.experience?.[0];
if (pre0 || post0) {
  for (const f of ['company', 'position', 'startDate'] as const) {
    const pk = f === 'position' ? 'designation' : f;
    diff(f, (pre0 as Record<string, unknown>)?.[pk], post0?.[f]);
  }
}

console.log('\n=== CERTIFICATIONS ===');
console.log('  pre-parse count:', preCerts.length, preCerts.map((c) => c.name));
console.log('  post-validation:', pipeline.validation.resume.certifications?.map((c) => c.name));

console.log('\n=== REPAIRS ===');
console.log(pipeline.validation.repairReport?.repairs?.slice(0, 8) || []);
