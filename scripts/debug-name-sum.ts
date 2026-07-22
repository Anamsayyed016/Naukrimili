import { readFileSync } from 'fs';
import {
  isInvalidImportSummary,
  sanitizeImportSummary,
  enrichPartialNameFromEmail,
  pickRicherFullName,
  isValidatedContactName,
  isEmailDerivedName,
} from '../lib/resume-parser/import-sanitize';

const p = JSON.parse(readFileSync('./.audit-trilok/04-custom-parser.json', 'utf8'));
const raw = readFileSync('./.audit-trilok/02-prepared.txt', 'utf8');
const s = p.summary;
console.log(
  JSON.stringify(
    {
      summaryLen: String(s || '').length,
      invalid: isInvalidImportSummary(s),
      sanitizedLen: sanitizeImportSummary(s, raw).length,
      sanitizedPreview: sanitizeImportSummary(s, raw).slice(0, 120),
      enrich: enrichPartialNameFromEmail('TRILOKINATH UPADHYAYA', 'upadhyaya.tn@gmail.com'),
      pick: pickRicherFullName(
        'TRILOKINATH UPADHYAYA',
        'Upadhyaya Tn',
        'upadhyaya.tn@gmail.com'
      ),
      validDoc: isValidatedContactName('TRILOKINATH UPADHYAYA'),
      emailDer: isEmailDerivedName('Upadhyaya Tn', 'upadhyaya.tn@gmail.com'),
    },
    null,
    2
  )
);
