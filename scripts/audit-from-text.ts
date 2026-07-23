/**
 * Continue audit from already-extracted text (skip flaky PDF parse).
 * Usage: npx tsx scripts/audit-from-text.ts path/to.txt
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import {
  coalesceBuilderImportPayload,
  transformImportDataToBuilder,
} from '../lib/resume-builder/import-transformer';
import { prepareGalleryPreviewFormData } from '../lib/resume-builder/builder-hydration';
import { recoverStructuredExperienceFromRawText } from '../lib/resume-parser/import-sanitize';

function counts(data: Record<string, unknown>) {
  const exps = Array.isArray(data.experience) ? data.experience : [];
  const summary = String(data.summary || data.bio || data.objective || '');
  return {
    experience: exps.length,
    withCompany: exps.filter((e) => String((e as any).company || '').trim().length >= 2).length,
    withTitle: exps.filter((e) => String((e as any).title || (e as any).position || '').trim().length >= 2).length,
    projects: Array.isArray(data.projects) ? data.projects.length : 0,
    education: Array.isArray(data.education) ? data.education.length : 0,
    certifications: Array.isArray(data.certifications) ? data.certifications.length : 0,
    skills: Array.isArray(data.skills) ? data.skills.length : 0,
    languages: Array.isArray(data.languages) ? data.languages.length : 0,
    achievements: Array.isArray(data.achievements) ? data.achievements.length : 0,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies.length : 0,
    summaryChars: summary.length,
    name: String(data.fullName || data.name || '').trim() || null,
    email: String(data.email || '').trim() || null,
    phone: String(data.phone || data.mobile || '').trim() || null,
  };
}

function slim(arr: unknown, n = 20) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, n).map((item, i) => {
    if (typeof item === 'string') return { i, v: item.slice(0, 140) };
    const o = item as any;
    return {
      i,
      title: o.title || o.position || o.degree || o.name || null,
      company: o.company || o.institution || o.organization || null,
      dates: [o.startDate || o.start, o.endDate || o.end].filter(Boolean).join(' - ') || null,
      descLen: String(o.description || '').length,
      extra: String(o.skill || o.language || o.issuer || '').slice(0, 80) || undefined,
    };
  });
}

async function main() {
  const textPath = resolve(process.argv[2] || '.audit-trilok/try0.txt');
  if (!existsSync(textPath)) {
    console.error('text not found', textPath);
    process.exit(1);
  }
  const outDir = resolve(process.argv[3] || '.audit-pipeline');
  mkdirSync(outDir, { recursive: true });

  const raw = readFileSync(textPath, 'utf8');
  const prep = prepareResumeTextForParsing(raw);
  const text = prep.text;
  writeFileSync(resolve(outDir, '02-prepared.txt'), text, 'utf8');

  const sections = detectResumeSections(text) as Record<string, unknown>;
  const lens: Record<string, number> = {};
  const bodies: Record<string, string> = {};
  for (const [k, v] of Object.entries(sections)) {
    if (typeof v === 'string') {
      lens[k] = v.length;
      bodies[k] = v;
    } else if (typeof v === 'number') {
      lens[k] = v;
    }
  }
  writeFileSync(resolve(outDir, '03-sections.json'), JSON.stringify({ lens, bodies }, null, 2), 'utf8');

  const structured = recoverStructuredExperienceFromRawText(text);
  writeFileSync(resolve(outDir, '03b-structured-exp.json'), JSON.stringify(structured, null, 2), 'utf8');

  const pipeline = await runCustomParserPipeline(text, { sourceFileName: 'audit.txt' });
  const parserResume = (pipeline as any).validation?.resume || (pipeline as any).extracted || pipeline;
  writeFileSync(resolve(outDir, '04-custom-parser.json'), JSON.stringify(parserResume, null, 2), 'utf8');

  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(parserResume, { aiProvider: 'custom-parser' }) as Record<string, unknown>
  ) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '05-upload-normalized.json'), JSON.stringify(upload, null, 2), 'utf8');

  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText: text,
    _imported: true,
    customParserUsed: true,
  });
  writeFileSync(resolve(outDir, '06-repaired.json'), JSON.stringify(repaired, null, 2), 'utf8');

  const coalesced = coalesceBuilderImportPayload({
    ...repaired,
    rawText: text,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '07-coalesced.json'), JSON.stringify(coalesced, null, 2), 'utf8');

  const gallery = prepareGalleryPreviewFormData(coalesced);
  writeFileSync(resolve(outDir, '08-gallery-form.json'), JSON.stringify(gallery, null, 2), 'utf8');

  const builder = transformImportDataToBuilder({
    ...coalesced,
    rawText: text,
    _imported: true,
    customParserUsed: true,
  }) as Record<string, unknown>;
  writeFileSync(resolve(outDir, '09-builder.json'), JSON.stringify(builder, null, 2), 'utf8');

  const report = {
    sourceTextChars: raw.length,
    preparedChars: text.length,
    documentType: (prep as any).profile?.primaryType ?? null,
    sectionLens: lens,
    structuredExp: structured.length,
    stages: {
      custom: { counts: counts(parserResume), experience: slim(parserResume.experience), education: slim(parserResume.education), projects: slim(parserResume.projects), skills: slim(parserResume.skills), certs: slim(parserResume.certifications), langs: slim(parserResume.languages), achievements: slim(parserResume.achievements), hobbies: slim(parserResume.hobbies), summary: String(parserResume.summary || '').slice(0, 400) },
      upload: { counts: counts(upload), experience: slim(upload.experience), education: slim(upload.education), projects: slim(upload.projects), skills: slim(upload.skills) },
      repaired: { counts: counts(repaired), experience: slim(repaired.experience), education: slim(repaired.education), projects: slim(repaired.projects), skills: slim(repaired.skills), achievements: slim(repaired.achievements), hobbies: slim(repaired.hobbies), summary: String(repaired.summary || '').slice(0, 300) },
      coalesced: { counts: counts(coalesced), experience: slim(coalesced.experience), education: slim(coalesced.education), projects: slim(coalesced.projects), skills: slim(coalesced.skills), hobbies: slim(coalesced.hobbies), summary: String(coalesced.summary || '').slice(0, 300) },
      gallery: { counts: counts(gallery as any), experience: slim((gallery as any).experience), projects: slim((gallery as any).projects), skills: slim((gallery as any).skills), hobbies: slim((gallery as any).hobbies), summary: String((gallery as any).summary || '').slice(0, 300) },
      builder: { counts: counts(builder), experience: slim(builder.experience), education: slim(builder.education), projects: slim(builder.projects), skills: slim(builder.skills), hobbies: slim(builder.hobbies), summary: String(builder.summary || '').slice(0, 300) },
    },
  };
  writeFileSync(resolve(outDir, '10-comparison-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
