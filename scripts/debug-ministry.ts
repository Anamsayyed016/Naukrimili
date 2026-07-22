import { looksLikeCompanyNameLine, looksLikeJobTitleLine } from '../lib/resume-parser/import-sanitize';
import { looksLikeHeadingLine, scoreHeadingCandidate } from '../lib/resume-parser/custom/section-detection/score-heading';
import { scoreHeadingKeywords } from '../lib/resume-parser/custom/section-detection/taxonomy';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { buildLineIndex, lineContentDensity } from '../lib/resume-parser/custom/section-detection/line-index';
import { readFileSync } from 'fs';

const t = 'Ministry of labour employment';
console.log(
  JSON.stringify({
    company: looksLikeCompanyNameLine(t),
    title: looksLikeJobTitleLine(t),
    heading: looksLikeHeadingLine(t),
    kw: scoreHeadingKeywords(t),
  })
);

const raw = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const { text, profile } = prepareResumeTextForParsing(raw);
const lines = buildLineIndex(text);
for (let i = 0; i < lines.length; i++) {
  if (!/ministry of labour/i.test(lines[i].text)) continue;
  const density = lineContentDensity(lines, i + 1, Math.min(lines.length, i + 12));
  const c = scoreHeadingCandidate(i, lines, profile, density);
  console.log('line', i, JSON.stringify(lines[i].text), 'candidate', c);
}
