import { readFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import { partitionExperienceBlocks, scoreExperienceBoundaries } from '../lib/resume-parser/custom/experience-extraction/boundaries';
import { detectCompanyFromLine } from '../lib/resume-parser/custom/experience-extraction/company';
import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { parseDateRangeFromText } from '../lib/resume-parser/custom/experience-extraction/dates';

const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const sections = detectResumeSections(text) as any;
const expText = sections.experience;
const lines = buildExperienceLines(expText);
const scored = scoreExperienceBoundaries(lines);
const blocks = partitionExperienceBlocks(lines);

console.log('exp chars', expText.length, 'lines', lines.length, 'blocks', blocks.length);
for (const b of blocks) {
  console.log('--- block', b.startLine, '-', b.endLine, 'preview', lines.slice(b.startLine, Math.min(b.endLine, b.startLine + 3)).map((l) => l.text).join(' | '));
}

for (let i = 0; i < scored.length; i++) {
  const t = scored[i].text.trim();
  if (!/Raj Security|Branch Head|Lupin|Indian Army|DRDO|NAHAR|Havildar/i.test(t)) continue;
  console.log(
    JSON.stringify({
      i,
      t: t.slice(0, 90),
      score: scored[i].boundaryScore,
      company: detectCompanyFromLine(t).confidence,
      title: detectDesignationFromLine(t).confidence,
      dates: !!parseDateRangeFromText(t),
    })
  );
}
