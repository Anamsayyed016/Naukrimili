import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { buildLineIndex, lineContentDensity } from '../lib/resume-parser/custom/section-detection/line-index';
import { scoreHeadingCandidate, looksLikeHeadingLine } from '../lib/resume-parser/custom/section-detection/score-heading';
import { scoreHeadingKeywords } from '../lib/resume-parser/custom/section-detection/taxonomy';

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
- Wrote clean, secure code with excellent UI design.

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

const { text, profile } = prepareResumeTextForParsing(ANAM);
const lines = buildLineIndex(text);
console.log('lines:', lines.map((l, i) => `${i}: ${JSON.stringify(l.text)}`));

for (let i = 0; i < lines.length; i++) {
  const t = lines[i].text.trim();
  if (/^(PROJECTS|EDUCATION|WORK EXPERIENCE|PROFESSIONAL SUMMARY)$/i.test(t)) {
    console.log(t, 'looksLikeHeadingLine', looksLikeHeadingLine(t));
    console.log(t, 'keywords', scoreHeadingKeywords(t));
    const previewEnd = Math.min(lines.length, i + 12);
    const density = lineContentDensity(lines, i + 1, previewEnd);
    console.log(t, 'density', density);
    const c = scoreHeadingCandidate(i, lines, profile, density);
    console.log(t, '->', c ? { type: c.type, confidence: c.confidence, scores: c.scores } : null);
  }
}
