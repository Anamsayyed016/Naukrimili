/**
 * READ-ONLY end-to-end trace: experience + projects at every pipeline stage.
 */
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { buildCanonicalResumeFromValidation } from '../lib/resume-parser/custom/canonical-resume/build';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { finalizeExperienceListForCustomParserImport } from '../lib/resume-parser/import-sanitize';

const ANAM = [
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

type ExpRow = {
  company?: string;
  position?: string;
  title?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  achievements?: unknown[];
};

type ProjRow = {
  name?: string;
  title?: string;
  description?: string;
  summary?: string;
  technologies?: unknown;
  url?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
};

function pickExp(e: ExpRow, i: number) {
  return {
    index: i,
    company: String(e.company ?? e.Company ?? e.organization ?? '').slice(0, 80),
    position: String(e.position ?? e.title ?? e.job_title ?? '').slice(0, 60),
    location: String(e.location ?? e.Location ?? '').slice(0, 60),
    startDate: String(e.startDate ?? e.start_date ?? ''),
    endDate: String(e.endDate ?? e.end_date ?? ''),
    description: String(e.description ?? e.Description ?? '').slice(0, 100),
    achievements: Array.isArray(e.achievements) ? e.achievements.length : 0,
  };
}

function pickProj(p: ProjRow, i: number) {
  const tech = p.technologies ?? p.tech_stack ?? p.Technologies;
  return {
    index: i,
    name: String(p.name ?? p.title ?? '').slice(0, 80),
    description: String(p.description ?? p.summary ?? '').slice(0, 100),
    technologies: Array.isArray(tech) ? tech.join(', ') : String(tech ?? '').slice(0, 80),
    url: String(p.url ?? p.link ?? ''),
    startDate: String(p.startDate ?? ''),
    endDate: String(p.endDate ?? ''),
  };
}

function printStage(label: string, data: { experience?: ExpRow[]; projects?: ProjRow[] }) {
  console.log('\n' + '='.repeat(72));
  console.log('STAGE:', label);
  console.log('='.repeat(72));
  const exps = data.experience || [];
  console.log(`Experience count: ${exps.length}`);
  exps.forEach((e, i) => console.log(JSON.stringify(pickExp(e, i), null, 0)));
  const projs = data.projects || [];
  console.log(`Projects count: ${projs.length}`);
  projs.forEach((p, i) => console.log(JSON.stringify(pickProj(p, i), null, 0)));
}

const prepared = prepareResumeTextForParsing(ANAM);
const pipeline = runCustomParserPipeline(prepared.text);
const validation = pipeline.validation;
const extracted = validation.resume;
const canonical = buildCanonicalResumeFromValidation(validation);

printStage('1 Custom Parser → ExtractedResumeData (validation.resume)', extracted);

printStage('2 Canonical Resume', {
  experience: (canonical.experience || []).map((e) => ({
    company: e.company,
    position: e.position,
    location: e.location,
    startDate: e.startDate,
    endDate: e.endDate,
    description: e.description,
    achievements: e.achievements,
  })),
  projects: (canonical.projects || []).map((p) => ({
    name: p.name,
    description: p.description,
    technologies: p.technologies,
    url: p.url,
    startDate: p.startDate,
    endDate: p.endDate,
  })),
});

const uploadRaw = mapExtractedToUploadProfile(extracted, { aiProvider: 'custom-parser' });
printStage('3 mapExtractedToUploadProfile', uploadRaw);

const uploadNorm = normalizeUploadProfile(uploadRaw);
printStage('4 normalizeUploadProfile', uploadNorm);

// Intermediate: validateAndRepair inside transform (custom path)
const { data: repaired } = validateAndRepairResumeExtraction({ ...uploadNorm });
printStage('5 validateAndRepairResumeExtraction (inside transform)', repaired);

const finalized = {
  ...repaired,
  experience: finalizeExperienceListForCustomParserImport(
    (repaired.experience || []) as Record<string, unknown>[]
  ),
};
printStage('6 finalizeExperienceListForCustomParserImport', finalized);

const builder = transformImportDataToBuilder(uploadNorm);
printStage('7 transformImportDataToBuilder → Builder State', builder);

// Legacy path: profile WITHOUT customParser flags (simulates pre-fix / mis-tagged upload)
const uploadLegacy = normalizeUploadProfile(
  mapExtractedToUploadProfile(extracted, { aiProvider: 'extracted' })
);
delete (uploadLegacy as Record<string, unknown>).customParserUsed;
delete (uploadLegacy as Record<string, unknown>).selectedParser;
(uploadLegacy as Record<string, unknown>)._aiProvider = 'extracted';
const builderLegacy = transformImportDataToBuilder(uploadLegacy);
printStage('7b LEGACY transformImportDataToBuilder (no customParser flag)', builderLegacy);

// Template render path
async function traceTemplate() {
  const { optimizeResumeDataForRender } = await import('../lib/resume-builder/section-visibility');
  const optimized = optimizeResumeDataForRender(builder);
  printStage('8 optimizeResumeDataForRender (template input)', optimized);

  const { injectResumeData } = await import('../lib/resume-builder/template-loader');
  // Use a minimal template snippet to test rendering
  const miniTemplate = `<html><body>{{EXPERIENCE}}{{PROJECTS}}</body></html>`;
  const injected = injectResumeData(miniTemplate, builder as Record<string, unknown>);
  const expMatch = injected.match(/experience-item/g);
  const projMatch = injected.match(/project-item|class="project/gi);
  console.log('\n' + '='.repeat(72));
  console.log('STAGE: 9 injectResumeData HTML output');
  console.log('='.repeat(72));
  console.log('experience-item count:', expMatch?.length ?? 0);
  console.log('project blocks:', projMatch?.length ?? 0);
  console.log('HTML snippet (first 2000 chars):');
  console.log(injected.slice(0, 2000));
}

traceTemplate().catch(console.error);
