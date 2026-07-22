import { parseDateRangeFromText } from '../lib/resume-parser/custom/experience-extraction/dates';
import { detectCompanyFromLine } from '../lib/resume-parser/custom/experience-extraction/company';
import { isExperienceBlurbFragment } from '../lib/resume-parser/import-sanitize';

const line =
  'Raj Security Force: A Security and allied service Provider company (ISO 9001:2015)';
console.log({
  date: parseDateRangeFromText(line),
  company: detectCompanyFromLine(line),
  blurb: isExperienceBlurbFragment(line),
});
