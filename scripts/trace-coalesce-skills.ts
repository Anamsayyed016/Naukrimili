import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';
import { normalizeSkillsList, normalizeCustomParserSkillsList } from '../lib/resume-parser/import-sanitize';

const ANAM = [
  'ANAM SAYYED                          SKILLS',
  'Python Developer                     Python, Django, ReactJS, HTML, CSS',
  'anamsayyed58@gmail.com | 7415566841  JavaScript, Node.js, MySQL, Git',
  'Bhopal, Madhya Pradesh               REST API, MongoDB, Firebase, AWS',
  'linkedin.com/in/anam-sayyed',
  'WORK EXPERIENCE',
  'Python Developer                     Digital Solutions Pvt Ltd',
  'Bhopal, Madhya Pradesh               2022-01 - Present',
  '- Designed secure APIs.',
  'Full Stack Developer                 Digital',
  'Bhopal, Madhya Pradesh               2020-02 - 2022-01',
  'Full Stack Python Developer          Cybrom Technology',
  'Bhopal                               2019 - 2020',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js and PostgreSQL',
  'EDUCATION',
  "All Saints' College of Technology",
  'B.Tech Computer Science',
  'Barkatullah University',
  'Master of Business Administration (MBA)',
].join('\n');

const parser = runCustomParserPipeline(prepareResumeTextForParsing(ANAM).text).validation.resume;
const upload = normalizeUploadProfile(
  mapExtractedToUploadProfile(parser, { aiProvider: 'custom-parser' })
);
const profile = {
  ...upload,
  customParserUsed: true,
  selectedParser: 'custom',
  _aiProvider: 'custom-parser',
};
const builder = transformImportDataToBuilder(profile);
const coalesced = coalesceBuilderImportPayload({ ...profile, builderFormData: builder });

console.log('parser skills', parser.skills?.length);
console.log('builder skills', builder.skills?.length, builder.skills);
console.log('coalesced skills', coalesced.skills?.length, coalesced.skills);

const legacyNorm = normalizeSkillsList(builder.skills as string[]);
const customNorm = normalizeCustomParserSkillsList(builder.skills as string[]);
console.log('normalizeSkillsList on builder', legacyNorm.length, legacyNorm);
console.log('normalizeCustomParserSkillsList on builder', customNorm.length, customNorm);

const missing = (builder.skills as string[]).filter(
  (s) => !(coalesced.skills as string[]).some((c) => c.toLowerCase() === s.toLowerCase())
);
console.log('missing after coalesce:', missing);
