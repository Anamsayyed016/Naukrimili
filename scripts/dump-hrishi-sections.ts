import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

const text = readFileSync('./.audit-hrishi/02-prepared.txt', 'utf8');
const s = detectResumeSections(text) as any;
const blocks = (s.sections || []).map((b: any) => ({
  type: b.type,
  conf: b.confidence,
  heading: b.rawHeading,
  contentLen: String(b.content || '').length,
  contentPreview: String(b.content || '').slice(0, 160),
}));
mkdirSync('.audit-hrishi', { recursive: true });
writeFileSync(
  './.audit-hrishi/03-heading-blocks.json',
  JSON.stringify({ lens: {
    preamble: s.preamble?.length, summary: s.summary?.length, experience: s.experience?.length,
    education: s.education?.length, skills: s.skills?.length, achievements: s.achievements?.length,
    certifications: s.certifications?.length, hobbies: s.hobbies?.length,
  }, blocks, custom: s.customSections }, null, 2)
);
for (const b of blocks) console.log(JSON.stringify(b));
console.log('skills body preview:', String(s.skills || '').slice(0, 500));
console.log('edu body:', String(s.education || '').slice(0, 300));
console.log('exp body preview:', String(s.experience || '').slice(0, 600));
