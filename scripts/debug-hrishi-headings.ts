import { readFileSync } from 'fs';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { buildLineIndex, lineContentDensity } from '../lib/resume-parser/custom/section-detection/line-index';
import { scoreHeadingCandidate, looksLikeHeadingLine } from '../lib/resume-parser/custom/section-detection/score-heading';
import { scoreHeadingKeywords } from '../lib/resume-parser/custom/section-detection/taxonomy';
import { looksLikeCompanyNameLine } from '../lib/resume-parser/import-sanitize';

const raw = readFileSync('./.audit-hrishi/02-prepared.txt', 'utf8');
const { text, profile } = prepareResumeTextForParsing(raw);
const lines = buildLineIndex(text);

const interesting = /career achievement|key skills|professional experience|education|profile|group company|fmcg|listed infrastructure|velnik|various clients/i;
for (let i = 0; i < lines.length; i++) {
  const t = lines[i].text.trim();
  if (!t || !interesting.test(t)) continue;
  const density = lineContentDensity(lines, i + 1, Math.min(lines.length, i + 12));
  const c = scoreHeadingCandidate(i, lines, profile, density);
  console.log(
    JSON.stringify({
      i,
      t: t.slice(0, 90),
      headingLine: looksLikeHeadingLine(t),
      company: looksLikeCompanyNameLine(t),
      candidate: c ? { type: c.type, conf: c.confidence } : null,
      kw: scoreHeadingKeywords(t),
    })
  );
}
