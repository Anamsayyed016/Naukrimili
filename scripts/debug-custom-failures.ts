import { reconstructColumnLayout } from '../lib/resume-parser/text-recovery';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { resolveAchievementsSectionText } from '../lib/resume-parser/custom/section-detection/resolve-section';
import { extractAchievementsFromSection } from '../lib/resume-parser/custom/achievements-extraction';
import { parseCertificationLine } from '../lib/resume-parser/custom/certification-extraction/parse';
import { parseLanguageLine } from '../lib/resume-parser/custom/language-extraction/parse';
import { classifyResumeTextSignals } from '../lib/resume-parser/text-recovery';

const ANAM = `ANAM SAYYED                          SKILLS
Python Developer                     Python, Django, ReactJS, HTML, CSS
anamsayyed58@gmail.com | 7415566841  JavaScript, Node.js, MySQL, Git
Bhopal, Madhya Pradesh               REST API, MongoDB, Firebase, AWS
linkedin.com/in/anam-sayyed

PROFESSIONAL SUMMARY
Highly motivated Full-Stack Python Developer with expertise in Python, Django, and ReactJS.

WORK EXPERIENCE
Python Developer                     Digital Solutions Pvt Ltd
Bhopal, Madhya Pradesh               2022-01 - Present
- Designed secure, scalable RESTful APIs using Django and Flask.

Full Stack Developer                 Digital
Bhopal, Madhya Pradesh               2020-02 - 2022-01
- Led design and development of full-stack web applications.

Full Stack Python Developer          Cybrom Technology
Bhopal                               2019 - 2020

PROJECTS
Job Portal Application
Built a full-stack job portal with Next.js and PostgreSQL

EDUCATION
All Saints' College of Technology
B.Tech Computer Science
2016 - 2020

Barkatullah University
Master of Business Administration (MBA)
2020 - 2022`;

console.log('=== SIGNALS ===');
console.log(classifyResumeTextSignals(ANAM));

const prep = prepareResumeTextForParsing(ANAM);
const recon = reconstructColumnLayout(ANAM);
console.log('\n=== MBA prepared vs reconstructed ===');
for (const [label, text] of [
  ['prepared', prep.text],
  ['reconstructed', recon],
] as const) {
  const sections = detectResumeSections(text);
  const edu = extractEducationFromSection(sections.education || '');
  const mba = edu.find((e) => /mba|business administration/i.test(e.degree || ''));
console.log('reconstructed text tail:\n', recon.split('\n').slice(-15).join('\n'));
const reconSections = detectResumeSections(recon);
console.log('recon section types:', reconSections.sections.map((s) => ({ t: s.type, h: s.rawHeading, c: s.content?.slice(0, 40) })));
console.log('recon education:', JSON.stringify(reconSections.education));

console.log('\n=== ACHIEVEMENTS WIRING ===');
const achFull = [
  'Jane Doe',
  'jane@example.com',
  '',
  'ACHIEVEMENTS',
  'Employee of the Year 2022',
  'Published research in IEEE conference',
  '',
  'HOBBIES',
  'Reading, Chess, Travel',
  '',
  'EXPERIENCE',
  'Analyst | Acme Corp',
  '2020 - Present',
].join('\n');
const achSec = detectResumeSections(achFull);
console.log('achievements field:', JSON.stringify(achSec.achievements));
console.log('resolved:', JSON.stringify(resolveAchievementsSectionText(achSec)));
console.log(
  'extracted:',
  extractAchievementsFromSection(resolveAchievementsSectionText(achSec)).map((a) => a.text)
);
console.log('section types:', achSec.sections.map((s) => ({ t: s.type, h: s.rawHeading })));

console.log('\n=== LANG/CERT ===');
console.log('cert no-keyword:', parseCertificationLine('AWS Solutions Architect - Amazon Web Services'));
const langFull = [
  'LANGUAGES',
  'English - Native',
  'French - Intermediate',
].join('\n');
const langSec = detectResumeSections(
  ['Jane Doe', '', 'LANGUAGES', 'English - Native', 'French - Intermediate'].join('\n')
);
console.log('languages field:', JSON.stringify(langSec.languages));
console.log('french line:', parseLanguageLine('French - Intermediate'));
