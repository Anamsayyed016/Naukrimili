import { readFileSync } from 'node:fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractProjectsFromSection } from '../lib/resume-parser/custom/project-extraction';
import { extractLanguagesFromSection } from '../lib/resume-parser/custom/language-extraction';

async function main() {
  const pdfPath =
    process.argv[2] || 'C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf';
  const { text: rawPdfText } = await parsePdfBuffer(Buffer.from(readFileSync(pdfPath)));
  const prep = prepareResumeTextForParsing(rawPdfText);
  const sections = detectResumeSections(prep.text);

  console.log('Section keys:', Object.keys(sections));
  console.log('Experience section length:', String(sections.experience || '').length);
  console.log('Projects section length:', String(sections.projects || '').length);
  console.log('Skills section length:', String(sections.skills || '').length);
  console.log('\n--- EXPERIENCE SECTION ---\n');
  console.log(String(sections.experience || '').slice(0, 1200));
  console.log('\n--- PROJECTS SECTION ---\n');
  console.log(String(sections.projects || '').slice(0, 800));

  const exps = extractExperiencesFromSection(String(sections.experience || ''));
  console.log('\nExtracted experiences:', exps.length);
  for (const e of exps) {
    console.log({
      company: e.company,
      designation: e.designation,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      descLen: e.description?.length,
    });
  }

  const projs = extractProjectsFromSection(String(sections.projects || ''));
  console.log('\nExtracted projects:', projs.length);
  for (const p of projs) {
    console.log({ name: p.name, tech: p.technologies?.slice(0, 5), descLen: p.description?.length });
  }

  const langs = extractLanguagesFromSection(
    String(sections.languages || sections.certifications || '')
  );
  console.log('\nLanguages:', langs);
}

main().catch(console.error);
