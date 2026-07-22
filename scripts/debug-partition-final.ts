import { readFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';
import { buildExperienceLines } from '../lib/resume-parser/custom/experience-extraction/lines';
import {
  scoreExperienceBoundaries,
  partitionExperienceBlocks,
} from '../lib/resume-parser/custom/experience-extraction/boundaries';

// Monkey-patch by reimplementing the first-pass loop only
const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const sections = detectResumeSections(text) as any;
const lines = buildExperienceLines(sections.experience);
const scored = scoreExperienceBoundaries(lines);
const blocks = partitionExperienceBlocks(lines);
console.log('final blocks', blocks.length);
for (const b of blocks) {
  console.log(b.startLine, b.endLine, scored[b.startLine]?.text?.slice(0, 70));
}
