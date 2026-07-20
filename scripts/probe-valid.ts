import { looksLikeSentenceNotCompany } from '../lib/resume-parser/custom/experience-extraction/company';
import { isValidExperience } from '../lib/resume-parser/custom/experience-extraction/validate';
import { isPlausibleExperienceCompany } from '../lib/resume-parser/import-sanitize';

const c =
  'To ensure the quality of conformance through planning, establishing systems, taking CAPA, and following';
console.log('len', c.length);
console.log('sentence', looksLikeSentenceNotCompany(c));
console.log('plausible', isPlausibleExperienceCompany(c));
console.log(
  'valid',
  isValidExperience({
    company: c,
    designation: '',
    location: '',
    employmentType: '',
    startDate: null,
    endDate: null,
    current: false,
    description: 'x'.repeat(100),
    bulletPoints: [],
    technologies: [],
    confidence: 50,
    fieldConfidence: {
      company: 40,
      designation: 0,
      location: 0,
      employmentType: 0,
      startDate: 0,
      endDate: 0,
      description: 50,
    },
  })
);
