import { buildExperienceFromBlock } from '../lib/resume-parser/custom/experience-extraction/fields';
import type { ExperienceRawBlock } from '../lib/resume-parser/custom/experience-extraction/types';
import { detectCompanyFromLine } from '../lib/resume-parser/custom/experience-extraction/company';

const block: ExperienceRawBlock = {
  startLine: 0,
  endLine: 2,
  lines: [],
  headerText:
    'Raj Security Force: A Security and allied service Provider company (ISO 9001:2015)\nBranch Head / Training Head (01 July 2015 to 30 May 2019) | CTC: 4.6 pa',
  bodyLines: ['Facility management, Mobilization, Controlling and maintaining to all staff.'],
};

const built = buildExperienceFromBlock(block);
console.log(JSON.stringify(built, null, 2));
console.log('direct', detectCompanyFromLine('Raj Security Force'));
