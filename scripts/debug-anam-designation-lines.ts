import { detectDesignationFromLine } from '../lib/resume-parser/custom/experience-extraction/designation';
import { detectCompanyFromLine } from '../lib/resume-parser/custom/experience-extraction/company';
import { isTenureOrDateOnlyHeaderLine } from '../lib/resume-parser/custom/experience-extraction/dates';

const lines = [
  'Led design and deployment of full-stack web applications using Python,',
  'Designed secure, scalable RESTful APIs reducing data retrieval time by',
  'Optimized SQL queries and backend systems improving performance by 40%',
  'Full Stack Developer',
  '2020 – 2024',
  'Techroot | Bhopal',
];

for (const l of lines) {
  console.log(JSON.stringify(l.slice(0, 55)));
  console.log('  des', detectDesignationFromLine(l));
  console.log('  co', detectCompanyFromLine(l));
  console.log('  tenureHdr', isTenureOrDateOnlyHeaderLine(l));
}
