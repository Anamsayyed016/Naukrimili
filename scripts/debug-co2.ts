import {
  detectCompanyFromLine,
  scoreCompanyCandidate,
} from '../lib/resume-parser/custom/experience-extraction/company';

console.log('left', scoreCompanyCandidate('Raj Security Force'));
console.log(
  'full',
  detectCompanyFromLine(
    'Raj Security Force: A Security and allied service Provider company (ISO 9001:2015)'
  )
);
console.log(
  'lupin',
  detectCompanyFromLine(
    'Lupin Ltd Mandideep: A Multinational pharmaceutical company Executive Liaison (SHIFT IN-CHARGE) on Fixed term (16 Feb 2013 to 15 June 2015) | CTC: 2.67 pa'
  )
);
