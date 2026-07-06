import { parseGluedEmailLocalPart, enrichPartialNameFromEmail } from '../lib/resume-parser/import-sanitize';

console.log('glued', parseGluedEmailLocalPart('ashishbgupta'));
console.log('enrich', enrichPartialNameFromEmail('Shbgupta Ashi', 'ashishbgupta@rediffmail.com'));

const body = 'ashishbgupta';
for (let i = 3; i <= body.length - 3; i++) {
  const a = body.slice(0, i);
  const b = body.slice(i);
  if (a.length >= 4 && b.length >= 4) console.log(i, a, b);
}
