import { parseCertificationLine, parseCertificationsFromSectionWithStats } from '../lib/resume-parser/custom/certification-extraction/parse';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { validateAndRepairResume } from '../lib/resume-parser/custom/validation-repair';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { extractProjectsFromSection } from '../lib/resume-parser/custom/project-extraction';
import { extractSkillsIntelligence } from '../lib/resume-parser/custom/skills-intelligence';
import { extractIdentityFromSections } from '../lib/resume-parser/custom/identity-extraction';

const line = 'AWS Solutions Architect - Amazon Web Services';
console.log('parseCertificationLine:', parseCertificationLine(line));

const section = [
  'CERTIFICATIONS',
  'AWS Solutions Architect - Amazon Web Services',
  '2023',
  '',
  'not a valid cert line without keywords',
].join('\n');
console.log('section stats:', parseCertificationsFromSectionWithStats(section));

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

const prepared = prepareResumeTextForParsing(ANAM_MULTI_COLUMN);
const sections = detectResumeSections(prepared.text);
console.log('\nAnam sections:', Object.fromEntries(
  Object.entries(sections).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 120) + (v.length > 120 ? '...' : '') : v])
));
const exps = extractExperiencesFromSection(sections.experience || '');
console.log('experiences:', exps.length, exps.map((e) => ({ company: e.company, title: e.title })));

const educations = extractEducationFromSection(sections.education || '');
const projects = extractProjectsFromSection(sections.projects || '');
const skills = extractSkillsIntelligence({
  skillsSectionText: sections.skills,
  experienceTechnologies: exps.map((e) => e.technologies),
  projectTechnologies: projects.map((p) => p.technologies),
  summaryText: sections.summary,
});
const result = validateAndRepairResume({
  rawText: prepared.text,
  identity: extractIdentityFromSections({
    headerText: sections.preamble || prepared.text.split('\n').slice(0, 4).join('\n'),
    contactSectionText: sections.preamble,
    fullResumeText: prepared.text,
  }),
  summary: sections.summary ? { summary: sections.summary, confidence: 80, fieldConfidence: { summary: 80 } } : null,
  experiences: exps,
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
console.log('quality:', result.resumeQualityScore, 'confidence:', result.parserConfidenceScore);
