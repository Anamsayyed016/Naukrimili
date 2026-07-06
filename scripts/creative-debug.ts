import { detectResumeSections } from '../lib/resume-parser/custom/section-detection';

const text = [
  'Maya Singh',
  'UX Designer',
  '',
  'About Me',
  'Designer focused on accessible products.',
  '',
  'Awards',
  'Best Design Award 2023',
  '',
  'Interests',
  'Photography, hiking, open source',
].join('\n');

const result = detectResumeSections(text);
console.log({
  summary: result.summary,
  achievements: result.achievements,
  hobbies: result.hobbies,
  sections: result.sections.map((s) => ({ t: s.type, h: s.rawHeading })),
});
