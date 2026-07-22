import { readFileSync } from 'fs';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { buildLineIndex, lineContentDensity } from '../lib/resume-parser/custom/section-detection/line-index';
import { scoreHeadingCandidate } from '../lib/resume-parser/custom/section-detection/score-heading';
import { scoreHeadingKeywords } from '../lib/resume-parser/custom/section-detection/taxonomy';

const raw = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const { text, profile } = prepareResumeTextForParsing(raw);
const lines = buildLineIndex(text);

const interesting =
  /specialt|experience|qualification|s\/\s*no|awards|liaison|personal|core|professional|academic|summary|objective|declaration|hobby|hobbies/i;

for (let i = 0; i < lines.length; i++) {
  const t = lines[i].text.trim();
  if (!t || !interesting.test(t)) continue;
  const density = lineContentDensity(lines, i + 1, Math.min(lines.length, i + 12));
  const c = scoreHeadingCandidate(i, lines, profile, density);
  const kw = scoreHeadingKeywords(t);
  console.log(
    JSON.stringify({
      i,
      t: t.slice(0, 80),
      candidate: c
        ? { type: c.type, conf: c.confidence, scores: c.scores }
        : null,
      kwTop: Object.entries(kw)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3),
    })
  );
}
