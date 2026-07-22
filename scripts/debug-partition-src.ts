import { readFileSync, writeFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import * as boundaries from '../lib/resume-parser/custom/experience-extraction/boundaries';

const src = readFileSync('./lib/resume-parser/custom/experience-extraction/boundaries.ts', 'utf8');
console.log('has self-contained path', src.includes('Self-contained "Title (dates)'));
console.log('functions', Object.keys(boundaries));

const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const sections = detectResumeSections(text) as any;
const lines = buildExperienceLines(sections.experience);
const scored = boundaries.scoreExperienceBoundaries(lines);

// Manually simulate first-pass splits by calling shouldStartNew via partition and
// logging boundary scores around known employers.
for (let i = 0; i < scored.length; i++) {
  if (scored[i].boundaryScore >= 20 || /Raj|Branch|Lupin|Army|DRDO|NAHAR|Havildar/i.test(scored[i].text)) {
    console.log(i, scored[i].boundaryScore, scored[i].text.slice(0, 60));
  }
}

const blocks = boundaries.partitionExperienceBlocks(lines);
console.log('blocks', blocks.map((b) => [b.startLine, b.endLine, scored[b.startLine]?.text?.slice(0, 50)]));
