import {
  enrichPartialNameFromEmail,
  splitFullNameWithRejected,
  isValidatedContactName,
} from '../lib/resume-parser/import-sanitize';

const email = 'cssyedmujahidali12@gmail.com';
const enriched = enrichPartialNameFromEmail('Mujahid Ali', email);
console.log('enriched', enriched);
console.log('split', splitFullNameWithRejected(enriched));
console.log('validated', isValidatedContactName(enriched, ''));
