/**
 * READ-ONLY full pipeline audit for Anam Sayyed Full Stack Python resume.
 * Validation case only — does not modify production code.
 */
import { readFileSync, writeFileSync } from 'fs';
import { parsePdfBuffer } from '../lib/pdf-parse-safe';
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

const PDF = 'C:/Users/admin/Downloads/Anam_Sayyed_Full_Stack_Python_Resume.pdf';

async function main() {
  const { text: raw } = await parsePdfBuffer(Buffer.from(readFileSync(PDF)));
  const prep = prepareResumeTextForParsing(raw);
  const profile = prep.profile;

  const sections = detectResumeSections(prep.text);
  const jobs = extractExperiencesFromSection(
    sections.experience || '',
    sections.parseStrategy
      ? {
          threshold: sections.parseStrategy.experienceBoundaryThreshold,
          thresholdAfterBlank: sections.parseStrategy.experienceBoundaryThresholdAfterBlank,
        }
      : undefined
  );
  const edu = extractEducationFromSection(sections.education || '');
  const projects = extractProjectsFromSection(sections.projects || '');
  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    experienceTechnologies: jobs.map((e) => e.technologies),
    projectTechnologies: projects.map((p) => p.technologies),
    summaryText: sections.summary,
  });
  const langs = parseLanguagesFromSection(sections.languages || '');
  let certs: unknown[] = [];
  try {
    const certMod = await import('../lib/resume-parser/custom/certification-extraction');
    const fn =
      (certMod as any).extractCertificationsFromSection ||
      (certMod as any).parseCertificationsFromSection ||
      extractCertificationsFromSection;
    certs = typeof fn === 'function' ? fn(sections.certifications || '') : [];
  } catch {
    certs = [];
  }

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

  const headingMeta = ((sections as any).sections || []).map((s: any) => ({
    type: s.type,
    heading: s.rawHeading,
    conf: s.confidence,
    len: String(s.content || '').length,
  }));

  const report = {
    documentProfile: profile?.primaryType,
    rawLen: raw.length,
    preparedLen: prep.text.length,
    rawHead: raw.slice(0, 1200),
    preparedFull: prep.text,
    headingMeta,
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
      summary: String(sections.summary || '').slice(0, 400),
      experience: String(sections.experience || '').slice(0, 1200),
      education: String(sections.education || '').slice(0, 600),
      skills: String(sections.skills || '').slice(0, 400),
      projects: String(sections.projects || '').slice(0, 600),
      languages: String(sections.languages || '').slice(0, 200),
      certifications: String(sections.certifications || '').slice(0, 400),
      achievements: String((sections as any).achievements || '').slice(0, 400),
    },
    extractedJobs: jobs.map((j) => ({
      company: j.company,
      title: j.designation,
      start: j.startDate,
      end: j.endDate,
      conf: j.confidence,
      descLen: String(j.description || '').length,
      bullets: (j.bulletPoints || []).length,
    })),
    extractedEdu: edu.map((e) => ({
      degree: e.degree,
      institution: e.institution,
      start: e.startDate,
      end: e.endDate,
    })),
    extractedProjects: projects.map((p) => ({
      name: (p as any).name || (p as any).title,
      descLen: String((p as any).description || '').length,
    })),
    extractedSkills: (skills as any)?.skills?.slice?.(0, 30) || skills,
    extractedLangs: langs,
    extractedCerts: Array.isArray(certs)
      ? certs.slice(0, 10)
      : (certs as any)?.certifications?.slice?.(0, 10),
    pipelineResume: {
      name: resume?.fullName || resume?.name,
      email: resume?.email,
      phone: resume?.phone,
      location: resume?.location,
      summaryLen: String(resume?.summary || '').length,
      exp: (resume?.experience || []).map((e: any) => ({
        t: e.designation || e.title || e.position,
        c: e.company,
      })),
      edu: (resume?.education || []).map((e: any) => ({
        d: e.degree,
        i: e.institution,
      })),
      projects: (resume?.projects || []).map((p: any) => p.name || p.title),
      skills: (resume?.skills || []).slice?.(0, 20) || resume?.skills,
      langs: resume?.languages,
      certs: (resume?.certifications || []).slice?.(0, 8),
      achievements: (resume?.achievements || []).slice?.(0, 5),
    },
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
      achievements: (builder.achievements || []).slice(0, 5),
    },
  };

  writeFileSync('scripts/audit-anam-python-report.json', JSON.stringify(report, null, 2));
  console.log('=== PROFILE ===', report.documentProfile);
  console.log('=== HEADINGS ===', JSON.stringify(headingMeta, null, 2));
  console.log('=== SECTION LENS ===', report.sectionLens);
  console.log('=== JOBS ===', JSON.stringify(report.extractedJobs, null, 2));
  console.log('=== EDU ===', JSON.stringify(report.extractedEdu, null, 2));
  console.log('=== PROJECTS ===', JSON.stringify(report.extractedProjects, null, 2));
  console.log('=== SKILLS (head) ===', report.extractedSkills);
  console.log('=== LANGS ===', report.extractedLangs);
  console.log('=== BUILDER ===', JSON.stringify(report.builder, null, 2));
  console.log('=== PREPARED (full) ===\n', prep.text);
  console.log('\nWrote scripts/audit-anam-python-report.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
