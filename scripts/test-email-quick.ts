import { parseGluedEmailLocalPart, parseIntelligentNameFromEmail } from '../lib/resume-parser/import-sanitize';

console.log('glued', parseGluedEmailLocalPart('cssyedmujahidali'));
console.log('intel', parseIntelligentNameFromEmail('cssyedmujahidali12@gmail.com'));
