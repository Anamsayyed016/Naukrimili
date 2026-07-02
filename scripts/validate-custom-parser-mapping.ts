/**
 * Validates custom-parser → Builder mapping preserves section counts.
 */
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';

const ANAM_MULTI_COLUMN = [
  'ANAM SAYYED                          SKILLS',
  'Python Developer                     Python, Django, ReactJS, HTML, CSS',
  'anamsayyed58@gmail.com | 7415566841  JavaScript, Node.js, MySQL, Git',
  'Bhopal, Madhya Pradesh               REST API, MongoDB, Firebase, AWS',
  'linkedin.com/in/anam-sayyed',
  '',
  'PROFESSIONAL SUMMARY',
  'Highly motivated Full-Stack Python Developer with expertise in Python, Django, and ReactJS.',
  '',
  'WORK EXPERIENCE',
  'Python Developer                     Digital Solutions Pvt Ltd',
  'Bhopal, Madhya Pradesh               2022-01 - Present',
  '- Designed secure, scalable RESTful APIs using Django and Flask.',
  '',
  'Full Stack Developer                 Digital',
  'Bhopal, Madhya Pradesh               2020-02 - 2022-01',
  '- Led design and development of full-stack web applications.',
  '',
  'Full Stack Python Developer          Cybrom Technology',
  'Bhopal                               2019 - 2020',
  '- Wrote clean, secure code with excellent UI design.',
  '',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js and PostgreSQL',
  '',
  'EDUCATION',
  "All Saints' College of Technology",
  'B.Tech Computer Science',
  '2016 - 2020',
  '',
  'Barkatullah University',
  'Master of Business Administration (MBA)',
  '2020 - 2022',
].join('\n');

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
const pipeline = runCustomParserPipeline(prepared.text);
const extracted = pipeline.validation.resume;
const profile = normalizeUploadProfile(
  mapExtractedToUploadProfile(extracted, { aiProvider: 'custom-parser' })
);
const builder = transformImportDataToBuilder(profile);

console.log('Parser experience:', extracted.experience?.length);
console.log('Profile experience:', profile.experience?.length);
console.log('Builder experience:', builder.experience?.length);
console.log('Parser skills:', extracted.skills?.length);
console.log('Profile skills:', profile.skills?.length);
console.log('Builder skills:', builder.skills?.length);
console.log('Parser projects:', extracted.projects?.length);
console.log('Builder projects:', builder.projects?.length);

assert(extracted.experience?.length === 3, `parser experience expected 3, got ${extracted.experience?.length}`);
assert(profile.experience?.length === 3, `profile experience expected 3, got ${profile.experience?.length}`);
assert(builder.experience?.length === 3, `builder experience expected 3, got ${builder.experience?.length}`);
assert(extracted.projects?.length === 1, `parser projects expected 1, got ${extracted.projects?.length}`);
assert(builder.projects?.length === 1, `builder projects expected 1, got ${builder.projects?.length}`);
assert(extracted.skills?.length === 16, `parser skills expected 16, got ${extracted.skills?.length}`);
assert(profile.skills?.length === 16, `profile skills expected 16, got ${profile.skills?.length}`);
assert(builder.skills?.length === 16, `builder skills expected 16, got ${builder.skills?.length}`);

const cybrom = builder.experience?.find((e: { company?: string }) =>
  /cybrom/i.test(String(e.company || ''))
);
assert(!!cybrom, 'Cybrom Technology should be in company field');
assert(
  !/wrote clean/i.test(String(builder.experience?.map((e: { company?: string }) => e.company).join(' '))),
  'bullet text must not appear as company'
);

console.log('✓ Custom parser → Builder mapping validation passed');
