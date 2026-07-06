import { reconstructColumnLayout, prepareResumeTextForParsing } from '../lib/resume-parser/text-recovery';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';

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

for (const [name, text] of [
  ['raw', ANAM],
  ['prepared', prepareResumeTextForParsing(ANAM).text],
  ['reconstructed', reconstructColumnLayout(ANAM)],
] as const) {
  const sections = detectResumeSections(text);
  const edu = extractEducationFromSection(sections.education || '');
  console.log('\n===', name, '===');
  console.log('education field:', JSON.stringify(sections.education));
  console.log(
    'relevant headings:',
    sections.sections
      .filter((s) =>
        /education|skills|barkatullah|mba|b\.tech/i.test(`${s.type} ${s.rawHeading}`)
      )
      .map((s) => ({ t: s.type, h: s.rawHeading, c: s.content?.slice(0, 50) }))
  );
  console.log('entries:', edu.map((e) => ({ inst: e.institution, deg: e.degree })));
}
