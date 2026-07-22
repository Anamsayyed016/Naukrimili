import { readFileSync, writeFileSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

const text = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const s = detectResumeSections(text) as any;
const blocks = (s.sectionBlocks || s.sections || s.blocks || []).map((b: any) => ({
  type: b.type,
  conf: b.confidence,
  heading: b.rawHeading,
  contentLen: String(b.content || '').length,
  contentPreview: String(b.content || '').slice(0, 120),
}));
writeFileSync(
  './.audit-trilok/03-heading-blocks.json',
  JSON.stringify(
    {
      keys: Object.keys(s),
      meta: {
        detectionVersion: s.detectionVersion,
        coverage: s.coverage,
      },
      blocks,
      customSections: s.customSections,
    },
    null,
    2
  )
);
console.log('blocks', blocks.length);
for (const b of blocks) console.log(JSON.stringify(b));
console.log('custom', JSON.stringify(s.customSections || []).slice(0, 1500));
