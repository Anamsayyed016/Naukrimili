/**
 * READ-ONLY parser audit using stream-recovered text from broken-xref PDF.
 */
import { readFileSync, writeFileSync } from 'fs';
import zlib from 'zlib';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '../lib/resume-parser/custom/project-extraction';
import { extractSkillsIntelligence } from '../lib/resume-parser/custom/skills-intelligence';
import { parseLanguagesFromSection } from '../lib/resume-parser/custom/language-extraction';
import { extractCertificationsFromSection } from '../lib/resume-parser/custom/certification-extraction';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';
import { mapExtractedToUploadProfile } from '../lib/resume-parser/map-to-upload-profile';
import { normalizeUploadProfile } from '../lib/resume-parser/normalize-extracted';
import { validateAndRepairResumeExtraction } from '../lib/resume-parser/extraction-repair';
import { transformImportDataToBuilder } from '../lib/resume-builder/import-transformer';

const PDF = 'C:/Users/admin/Downloads/Sarfaraz CV_08-08-2024.pdf';

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function extractLiteralsFromContent(payload: string): string[] {
  const out: string[] = [];
  for (const m of payload.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    const lit = m[0].replace(/\s*Tj\s*$/, '');
    out.push(decodePdfLiteral(lit.slice(1, -1)));
  }
  for (const m of payload.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    const parts: string[] = [];
    for (const lit of m[1].matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      parts.push(decodePdfLiteral(lit[0].slice(1, -1)));
    }
    if (parts.length) out.push(parts.join(''));
  }
  if (out.length === 0) {
    for (const lit of payload.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      const t = decodePdfLiteral(lit[0].slice(1, -1));
      if (/[A-Za-z]{2}/.test(t)) out.push(t);
    }
  }
  return out;
}

function readableRatio(s: string): number {
  if (!s) return 0;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  return letters / Math.max(s.length, 1);
}

/** Generic FlateDecode/stream text recovery when xref parsing fails. */
export function recoverTextFromPdfContentStreams(buf: Buffer): string {
  const latin = buf.toString('latin1');
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const pageChunks: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = streamRe.exec(latin))) {
    const raw = Buffer.from(m[1], 'latin1');
    let decoded: Buffer | null = null;
    try {
      decoded = zlib.inflateSync(raw);
    } catch {
      try {
        decoded = zlib.unzipSync(raw);
      } catch {
        decoded = null;
      }
    }
    const payload = (decoded || raw).toString('latin1');
    if (!/Tj|TJ|BT/.test(payload) && readableRatio(payload) < 0.35) continue;
    const literals = extractLiteralsFromContent(payload)
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter((t) => t && readableRatio(t) >= 0.4 && !/^PDFXC/i.test(t) && t.length < 500);
    if (literals.length >= 3) pageChunks.push(literals);
  }

  const pages = pageChunks.map((toks) => {
    const lines: string[] = [];
    let line = '';
    for (const t of toks) {
      if (!line) {
        line = t;
        continue;
      }
      const gapJoin =
        /[A-Za-z0-9)]$/.test(line) &&
        /^[a-z]/.test(t) &&
        t.length < 24 &&
        !/[.?:!;]$/.test(line);
      const spaceJoin =
        /[A-Za-z0-9)]$/.test(line) &&
        /^[A-Za-z0-9(]/.test(t) &&
        t.length < 40 &&
        !/[.?:!;]$/.test(line);
      if (gapJoin) line += t;
      else if (spaceJoin) line += ` ${t}`;
      else {
        lines.push(line);
        line = t;
      }
    }
    if (line) lines.push(line);
    return lines.join('\n');
  });

  return pages
    .join('\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  const buf = Buffer.from(readFileSync(PDF));
  let pdfParseError = '';
  try {
    const { parsePdfBuffer } = await import('../lib/pdf-parse-safe');
    await parsePdfBuffer(buf);
  } catch (e) {
    pdfParseError = e instanceof Error ? e.message : String(e);
  }

  const recovered = recoverTextFromPdfContentStreams(buf);
  writeFileSync('scripts/audit-sarfaraz-recovered.txt', recovered);

  const productionFallback = `Resume: Sarfaraz CV_08-08-2024.pdf\n\n[PDF parsing failed. Please complete your profile manually.]`;

  const prep = prepareResumeTextForParsing(recovered);
  const sections = detectResumeSections(prep.text);
  const jobs = extractExperiencesFromSection(sections.experience || '');
  const edu = extractEducationFromSection(sections.education || '');
  const projects = extractProjectsFromSection(sections.projects || '');
  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    experienceTechnologies: jobs.map((e) => e.technologies),
    projectTechnologies: projects.map((p) => p.technologies),
    summaryText: sections.summary,
  });
  const langs = parseLanguagesFromSection(sections.languages || '');
  const certs = extractCertificationsFromSection(sections.certifications || '');

  const pipeline = runCustomParserPipeline(prep.text);
  const resume = pipeline.validation.resume as any;
  const upload = normalizeUploadProfile(
    mapExtractedToUploadProfile(pipeline.validation.resume, { aiProvider: 'custom-parser' }) as any
  ) as any;
  const { data: repaired } = validateAndRepairResumeExtraction({
    ...upload,
    rawText: prep.text,
    _imported: true,
    customParserUsed: true,
  });
  const builder = transformImportDataToBuilder({
    ...repaired,
    rawText: prep.text,
    _imported: true,
    customParserUsed: true,
  }) as any;

  const report = {
    phase1: {
      pdfParseError,
      productionFallbackWhenPdfParseFails: productionFallback,
      recoveredLen: recovered.length,
      documentProfile: prep.profile?.primaryType,
    },
    recoveredFull: recovered,
    headingMeta: ((sections as any).sections || []).map((s: any) => ({
      type: s.type,
      heading: s.rawHeading,
      conf: s.confidence,
      len: String(s.content || '').length,
    })),
    sectionLens: {
      preamble: String(sections.preamble || '').length,
      summary: String(sections.summary || '').length,
      experience: String(sections.experience || '').length,
      education: String(sections.education || '').length,
      skills: String(sections.skills || '').length,
      projects: String(sections.projects || '').length,
      languages: String(sections.languages || '').length,
      certifications: String(sections.certifications || '').length,
      achievements: String((sections as any).achievements || '').length,
    },
    sectionSnippets: {
      preamble: String(sections.preamble || '').slice(0, 400),
      summary: String(sections.summary || '').slice(0, 400),
      experience: String(sections.experience || '').slice(0, 1500),
      education: String(sections.education || '').slice(0, 800),
      skills: String(sections.skills || '').slice(0, 400),
      projects: String(sections.projects || '').slice(0, 800),
      languages: String(sections.languages || '').slice(0, 300),
      certifications: String(sections.certifications || '').slice(0, 400),
    },
    extractedJobs: jobs.map((j) => ({
      company: j.company,
      title: j.designation,
      start: j.startDate,
      end: j.endDate,
      conf: j.confidence,
      bullets: (j.bulletPoints || []).length,
      descLen: String(j.description || '').length,
    })),
    extractedEdu: edu.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      start: e.startDate,
      end: e.endDate,
    })),
    extractedProjects: projects.map((p) => ({
      name: (p as any).title || (p as any).name,
      descLen: String((p as any).description || '').length,
    })),
    extractedSkillsHead: ((skills as any)?.skills || []).slice(0, 25).map((s: any) => s.name || s),
    extractedLangs: langs,
    extractedCerts: (certs as any[]).slice?.(0, 10) || certs,
    builder: {
      name: `${builder.firstName || ''} ${builder.lastName || ''}`.trim(),
      email: builder.email,
      phone: builder.phone,
      location: builder.location || builder.city,
      summaryLen: String(builder.summary || '').length,
      summaryHead: String(builder.summary || '').slice(0, 200),
      exp: (builder.experience || []).map((e: any) => ({
        t: e.title,
        c: e.company,
        s: e.startDate,
        e: e.endDate,
        bullets: String(e.description || '').split('\n').filter(Boolean).length,
      })),
      edu: (builder.education || []).map((e: any) => ({
        d: e.degree,
        i: e.institution,
        y: e.year || e.endDate,
      })),
      projects: (builder.projects || []).map((p: any) => ({
        n: p.name || p.title,
        desc: String(p.description || '').slice(0, 80),
      })),
      skills: (builder.skills || []).slice(0, 25),
      langs: builder.languages,
      certs: (builder.certifications || []).slice(0, 8),
      achievements: (builder.achievements || []).slice(0, 8),
    },
    pipelineName: resume?.fullName || resume?.name,
  };

  writeFileSync('scripts/audit-sarfaraz-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.phase1, null, 2));
  console.log('HEADINGS', JSON.stringify(report.headingMeta, null, 2));
  console.log('SECTIONS', report.sectionLens);
  console.log('JOBS', JSON.stringify(report.extractedJobs, null, 2));
  console.log('EDU', JSON.stringify(report.extractedEdu, null, 2));
  console.log('PROJECTS', JSON.stringify(report.extractedProjects, null, 2));
  console.log('LANGS', JSON.stringify(report.extractedLangs, null, 2));
  console.log('CERTS', JSON.stringify(report.extractedCerts, null, 2));
  console.log('BUILDER', JSON.stringify(report.builder, null, 2));
  console.log('\nWrote scripts/audit-sarfaraz-report.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
