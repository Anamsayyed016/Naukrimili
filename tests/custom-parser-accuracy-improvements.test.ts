import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import { reconstructColumnLayout } from '@/lib/resume-parser/text-recovery';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { looksLikeSentenceNotCompany } from '@/lib/resume-parser/custom/experience-extraction/company';
import { extractEducationFromSection } from '@/lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '@/lib/resume-parser/custom/project-extraction';
import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';
import { extractIdentityFromSections } from '@/lib/resume-parser/custom/identity-extraction';
import { extractSkillsIntelligence } from '@/lib/resume-parser/custom/skills-intelligence';
import { validateAndRepairResume } from '@/lib/resume-parser/custom/validation-repair';
import {
  computeParserConfidenceScore,
  inferSectionPresence,
} from '@/lib/resume-parser/custom/validation-repair/scoring';

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

function runPipeline(rawText: string) {
  const prepared = prepareResumeTextForParsing(rawText);
  const sections = detectResumeSections(prepared.text);
  const experiences = extractExperiencesFromSection(sections.experience || '');
  const educations = extractEducationFromSection(sections.education || '');
  const projects = extractProjectsFromSection(sections.projects || '');
  const skills = extractSkillsIntelligence({
    skillsSectionText: sections.skills,
    experienceTechnologies: experiences.map((e) => e.technologies),
    projectTechnologies: projects.map((p) => p.technologies),
    summaryText: sections.summary,
  });

  return validateAndRepairResume({
    rawText: prepared.text,
    identity: extractIdentityFromSections({
      headerText: sections.preamble || prepared.text.split('\n').slice(0, 4).join('\n'),
      contactSectionText: sections.preamble,
      fullResumeText: prepared.text,
    }),
    summary: sections.summary
      ? { summary: sections.summary, confidence: 80, fieldConfidence: { summary: 80 } }
      : null,
    experiences,
    educations,
    projects,
    skills,
    sectionTexts: {
      experience: sections.experience,
      education: sections.education,
      projects: sections.projects,
      skills: sections.skills,
      summary: sections.summary,
      contact: sections.preamble,
    },
    parserConfidence: 70,
  });
}

describe('column layout reconstruction', () => {
  it('splits dual-column lines and strips SKILLS bleed from name', () => {
    const reconstructed = reconstructColumnLayout(ANAM_MULTI_COLUMN);
    expect(reconstructed).toMatch(/ANAM SAYYED/);
    expect(reconstructed).not.toMatch(/ANAM SAYYED\s+SKILLS/i);
    expect(reconstructed.indexOf('Python, Django')).toBeLessThan(
      reconstructed.indexOf('WORK EXPERIENCE')
    );
  });
});

describe('experience extraction accuracy', () => {
  it('rejects bullet sentences as company names', () => {
    expect(
      looksLikeSentenceNotCompany('Led design and development of full-stack web applications.')
    ).toBe(true);
    expect(looksLikeSentenceNotCompany('Digital Solutions Pvt Ltd')).toBe(false);
  });

  it('extracts multiple experiences with real company names on Anam resume', () => {
    const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
    const sections = detectResumeSections(prepared.text);
    const exps = extractExperiencesFromSection(sections.experience || '');
    expect(exps.length).toBeGreaterThanOrEqual(2);
    const companies = exps.map((e) => e.company).filter(Boolean);
    expect(companies.some((c) => /digital/i.test(c))).toBe(true);
    expect(companies.some((c) => looksLikeSentenceNotCompany(c))).toBe(false);
  });
});

describe('education extraction accuracy', () => {
  it('does not swap MBA degree into institution field', () => {
    const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
    const sections = detectResumeSections(prepared.text);
    const edu = extractEducationFromSection(sections.education || '');
    const mba = edu.find((e) => /mba|business administration/i.test(e.degree || ''));
    expect(mba).toBeDefined();
    expect(mba?.institution).toMatch(/barkatullah/i);
    expect(mba?.institution).not.toMatch(/master of business/i);
  });
});

describe('project extraction accuracy', () => {
  it('rejects bare job titles as project names', () => {
    const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
    const sections = detectResumeSections(prepared.text);
    const projects = extractProjectsFromSection(sections.projects || '');
    for (const p of projects) {
      expect(p.title).not.toMatch(/^full stack python developer$/i);
    }
  });
});

describe('confidence scoring improvements', () => {
  it('excludes absent languages/certifications from weighted score', () => {
    const sectionConfidence = {
      identity: 80,
      summary: 80,
      experience: 70,
      projects: 0,
      education: 70,
      skills: 75,
      languages: 0,
      certifications: 0,
    };
    const presence = inferSectionPresence({ rawText: 'John Doe\nExperience\nAcme' });
    const withAbsent = computeParserConfidenceScore(sectionConfidence, 70, presence);
    const withPresent = computeParserConfidenceScore(sectionConfidence, 70, {
      languages: true,
      certifications: true,
      projects: false,
    });
    expect(withAbsent).toBeGreaterThan(withPresent);
  });

  it('improves parser confidence on Anam multi-column resume vs baseline shape', () => {
    const result = runPipeline(ANAM_MULTI_COLUMN);
    expect(result.parserConfidenceScore).toBeGreaterThanOrEqual(58);
    expect(result.resumeQualityScore).toBeGreaterThanOrEqual(66);
    expect(result.validationReport.errors).toHaveLength(0);
  });
});
