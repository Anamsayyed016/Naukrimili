/**
 * Read-only dump: raw text + section detection for a resume PDF.
 * Usage: npx tsx scripts/dump-pdf-sections.ts path.pdf
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';

async function main() {
  const pdfPath = resolve(process.argv[2] || '');
  const buf = readFileSync(pdfPath);
  const parsed = await parsePdfBuffer(buf);
  const prepared = prepareResumeTextForParsing(String(parsed.text || ''));
  const sections = detectResumeSections(prepared.text);
  const custom = await runCustomParserPipeline(prepared.text, { sourceFileName: basename(pdfPath) });

  const outDir = resolve('.audit-trilok');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, '01-raw.txt'), String(parsed.text || ''), 'utf8');
  writeFileSync(resolve(outDir, '02-prepared.txt'), prepared.text, 'utf8');
  writeFileSync(resolve(outDir, '03-sections.json'), JSON.stringify(sections, null, 2), 'utf8');
  writeFileSync(resolve(outDir, '04-custom.json'), JSON.stringify(custom, null, 2), 'utf8');

  console.log('documentType', prepared.documentType);
  console.log('rawChars', String(parsed.text || '').length);
  console.log('preparedChars', prepared.text.length);
  console.log('sectionKeys', Object.keys((sections as any).sections || sections));
  const sec = (sections as any).sections || sections;
  for (const [k, v] of Object.entries(sec)) {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    console.log(`[section:${k}] chars=${s.length}`);
  }
  const extracted = (custom as any).extracted || custom;
  console.log('custom counts', {
    experience: Array.isArray(extracted.experience) ? extracted.experience.length : 0,
    education: Array.isArray(extracted.education) ? extracted.education.length : 0,
    projects: Array.isArray(extracted.projects) ? extracted.projects.length : 0,
    skills: Array.isArray(extracted.skills) ? extracted.skills.length : 0,
    certifications: Array.isArray(extracted.certifications) ? extracted.certifications.length : 0,
    languages: Array.isArray(extracted.languages) ? extracted.languages.length : 0,
    achievements: Array.isArray(extracted.achievements) ? extracted.achievements.length : 0,
    summary: String(extracted.summary || '').length,
    name: extracted.fullName || extracted.name || null,
  });
  console.log('wrote', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
