import { looksLikeCompanyNameLine, looksLikeJobTitleLine } from '../lib/resume-parser/import-sanitize';
import { looksLikeHeadingLine, isAllCapsHeading } from '../lib/resume-parser/custom/section-detection/score-heading';
import { scoreHeadingKeywords } from '../lib/resume-parser/custom/section-detection/taxonomy';

const lines = [
  'PROFESSIONAL EXPERIENCE',
  'PROFESSIONAL & TECHNICAL QUALIFICATION',
  'CORE SPECIALTIES & KEY AREAS',
  'LIAISON WITH & HOBBIES',
  'S/ No',
  'ACADEMIC QUALIFICATION',
  'CAREER OBJECTIVE',
  'DECLARATION',
];

for (const t of lines) {
  console.log(
    JSON.stringify({
      t,
      heading: looksLikeHeadingLine(t),
      caps: isAllCapsHeading(t),
      company: looksLikeCompanyNameLine(t),
      title: looksLikeJobTitleLine(t),
      kw: scoreHeadingKeywords(t),
    })
  );
}
