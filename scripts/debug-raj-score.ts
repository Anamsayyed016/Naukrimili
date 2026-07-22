import { scoreCompanyCandidate, detectCompanyFromLine } from '../lib/resume-parser/custom/experience-extraction/company';
import {
  isLikelyCompanyNameFragment,
  looksLikeCompanyNameLine,
  isPlausibleExperienceCompany,
} from '../lib/resume-parser/import-sanitize';
import { classifyResumeTextFragment } from '../lib/resume-parser/field-classification';

const left = 'Raj Security Force';
console.log({
  score: scoreCompanyCandidate(left),
  detect: detectCompanyFromLine(left + ': tagline here'),
  likely: isLikelyCompanyNameFragment(left),
  looks: looksLikeCompanyNameLine(left),
  plausible: isPlausibleExperienceCompany(left),
  classified: classifyResumeTextFragment(left),
});
