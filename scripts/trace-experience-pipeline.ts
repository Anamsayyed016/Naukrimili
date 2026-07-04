/**
 * End-to-end experience field trace for mapping debugging.
 */
import { extractResumeFromText } from '../lib/resume-parser/text-recovery';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import {
  transformImportDataToBuilder,
  coalesceBuilderImportPayload,
} from '../lib/resume-builder/import-transformer';
import { overlaySparseSectionsFromTextRecovery } from '../lib/resume-parser/prefer-recovered-wording';

const RAW = [
  'WORK EXPERIENCE',
  'Full Stack Developer                 Digital Solutions Pvt Ltd',
  'Bhopal                               2022-01 - Present',
  '- Designed secure APIs.',
  'PROJECTS',
  'Job Portal Application',
  'Built a full-stack job portal with Next.js',
].join('\n');

const FIELDS = [
  'company',
  'designation',
  'location',
  'startDate',
  'endDate',
  'current',
  'description',
  'achievements',
] as const;

function pick(exp: Record<string, unknown> | undefined, field: string): unknown {
  if (!exp) return '';
  if (field === 'designation') {
    return exp.position || exp.title || exp.designation || '';
  }
  if (field === 'achievements') {
    return Array.isArray(exp.achievements) ? exp.achievements.length : 0;
  }
  return exp[field] ?? '';
}

function traceStage(label: string, list: unknown[]) {
  console.log(`\n=== ${label} (${Array.isArray(list) ? list.length : 0} entries) ===`);
  if (!Array.isArray(list)) return;
  list.forEach((exp, index) => {
    if (!exp || typeof exp !== 'object') return;
    const rec = exp as Record<string, unknown>;
    console.log(`  [${index}]`, {
      company: pick(rec, 'company'),
      designation: pick(rec, 'designation'),
      location: pick(rec, 'location'),
      startDate: pick(rec, 'startDate'),
      endDate: pick(rec, 'endDate'),
      current: pick(rec, 'current'),
      description: String(pick(rec, 'description') || '').slice(0, 80),
      achievements: pick(rec, 'achievements'),
    });
  });
}

const textRecovered = extractResumeFromText(RAW);
traceStage('text-recovery', textRecovered.experience || []);

const pipeline = runCustomParserPipeline(RAW);
traceStage('custom-parser canonical', pipeline.validation.resume.experience || []);

const upload = mapExtractedToUploadProfile(pipeline.validation.resume, { aiProvider: 'custom-parser' });
traceStage('upload profile', upload.experience || []);

const builder = transformImportDataToBuilder(upload);
traceStage('builder formData', builder.experience || []);

const overlayInput = {
  rawText: RAW,
  experience: builder.experience,
  customParserUsed: true,
};
const overlaid = overlaySparseSectionsFromTextRecovery(overlayInput);
traceStage('after overlaySparseSections', overlaid.experience || []);

const apiPayload = {
  rawText: RAW,
  firstName: 'Anam',
  lastName: 'Sayyed',
  customParserUsed: true,
  experience: upload.experience,
  projects: upload.projects || [],
  builderFormData: {
    firstName: 'Anam',
    lastName: 'Sayyed',
    experience: (builder.experience as unknown[]).map((e) => ({
      ...(e as Record<string, unknown>),
      company: (e as Record<string, unknown>).company || '',
    })),
    projects: builder.projects || [],
  },
};
const coalesced = coalesceBuilderImportPayload(apiPayload);
traceStage('coalesceBuilderImportPayload', coalesced.experience || []);
