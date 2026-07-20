/** Probe Sarfaraz-specific generic patterns (no PDF hardcoding). */
import { parseTenureExperienceLine } from '../lib/resume-parser/custom/experience-extraction/tenure';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '../lib/resume-parser/custom/education-extraction';
import { extractLanguagesFromSection } from '../lib/resume-parser/custom/language-extraction';
import { detectFullName } from '../lib/resume-parser/custom/identity-extraction/name';
import { deriveDisplayNameFromEmail, pickBestNameFromCandidates } from '../lib/resume-parser/import-sanitize';
import { readFileSync } from 'node:fs';

const fields = readFileSync('.audit3/fields.txt', 'utf8');
const expMatch = fields.match(/===== experience \((\d+)\) =====\n([\s\S]*?)(?=\n===== )/);
const eduMatch = fields.match(/===== education \((\d+)\) =====\n([\s\S]*?)(?=\n===== )/);
const langMatch = fields.match(/===== languages \((\d+)\) =====\n([\s\S]*?)(?=\n===== |$)/);

console.log('--- tenure lines ---');
for (const line of [
  '07 Year experience as a Deputy Quality Manager at M/s Tesla Transformers (Global) Pvt. Ltd.',
  '03 years experience as a Project Engineer at M/s Tesla Transformers Ltd.',
]) {
  console.log(JSON.stringify(parseTenureExperienceLine(line)));
}

if (expMatch) {
  const exps = extractExperiencesFromSection(expMatch[2]);
  console.log('\n--- experience blocks', exps.length, '---');
  for (const e of exps) {
    console.log({
      company: e.company,
      designation: e.designation,
      start: e.startDate,
      end: e.endDate,
      current: e.current,
      descLen: (e.description || '').length,
      bullets: e.bulletPoints?.length,
    });
  }
}

if (eduMatch) {
  const edus = extractEducationFromSection(eduMatch[2]);
  console.log('\n--- education', edus.length, '---');
  for (const e of edus) console.log(e);
}

if (langMatch) {
  console.log('\n--- languages section text ---');
  console.log(langMatch[2].slice(0, 400));
  console.log('parsed', extractLanguagesFromSection(langMatch[2]));
}

console.log('\n--- name ---');
console.log('email derived', deriveDisplayNameFromEmail('allam.tesla@gmail.com'));
const candidates = [
  { value: 'Mohammed Sarfaraz Allam', confidence: 85, source: 'header' as const },
  { value: 'MOHAMMED SARFARAZ ALLAM', confidence: 80, source: 'text_recovery' as const },
  { value: 'Allam Tesla', confidence: 92, source: 'email_derived' as const },
];
console.log('pickBest', pickBestNameFromCandidates(candidates, 'allam.tesla@gmail.com'));
console.log(
  'pickBest without email cand',
  pickBestNameFromCandidates(
    [
      { value: 'Mohammed Sarfaraz Allam', confidence: 85, source: 'header' as const },
      { value: 'CURRICULUM VITAE MOHAMMED SARFARAZ ALLAM', confidence: 70, source: 'text_recovery' as const },
    ],
    'allam.tesla@gmail.com'
  )
);
