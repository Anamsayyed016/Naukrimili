import {
  validateAndRepairResume,
  createRepairContext,
  repairExperienceEntry,
} from '../lib/resume-parser/custom/validation-repair';
import { extractExperiencesFromSection } from '../lib/resume-parser/custom/experience-extraction';
import { extractSkillsIntelligence } from '../lib/resume-parser/custom/skills-intelligence';
import type { CustomExtractedExperience } from '../lib/resume-parser/custom/experience-extraction';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Test 1: current + endDate repair
const exp: CustomExtractedExperience = {
  company: 'Acme Corp',
  designation: 'Software Engineer',
  location: '',
  employmentType: '',
  startDate: '2022-01',
  endDate: '2024-06',
  current: true,
  description: '',
  bulletPoints: ['Built APIs'],
  technologies: ['Python'],
  confidence: 70,
  fieldConfidence: {
    company: 70,
    designation: 70,
    location: 0,
    employmentType: 0,
    startDate: 70,
    endDate: 60,
    description: 50,
  },
};
const ctx = createRepairContext({ rawText: '' });
const repaired = repairExperienceEntry(exp, 0, ctx);
assert(repaired.endDate === null, 'endDate should be cleared');
assert(ctx.repairs.some((r) => r.field === 'endDate'), 'repair recorded');

// Test 2: skill alias dedupe
const skills = extractSkillsIntelligence({ skillsSectionText: 'ReactJS, React, NodeJS' });
const skillResult = validateAndRepairResume({ skills, parserConfidence: 75 });
assert(skillResult.validated.skills.filter((s) => s.name === 'React').length === 1, 'React deduped');

// Test 3: experience pipeline
const section = [
  'Software Engineer | Technoart Pvt Ltd | Bhopal',
  'Jan 2022 - Present',
  '- Developed REST APIs at Technoart using Python',
].join('\n');
const experiences = extractExperiencesFromSection(section);
const full = validateAndRepairResume({
  rawText: section,
  experiences,
  sectionTexts: { experience: section },
  parserConfidence: 72,
});
assert(full.resume.experience.length >= 1, 'experience assembled');
assert(full.resumeQualityScore > 0, 'quality score > 0');

// Test 4: invalid email cleared
const emailResult = validateAndRepairResume({
  identity: {
    fullName: 'Jane Doe',
    professionalHeadline: '',
    email: 'not-an-email',
    phone: '',
    alternatePhone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    nationality: '',
    dateOfBirth: '',
    currentCompany: '',
    currentDesignation: '',
    professionalTitle: '',
    confidence: 50,
    fieldConfidence: {
      fullName: 50,
      professionalHeadline: 0,
      email: 40,
      phone: 0,
      alternatePhone: 0,
      linkedin: 0,
      github: 0,
      portfolio: 0,
      website: 0,
      address: 0,
      city: 0,
      state: 0,
      country: 0,
      postalCode: 0,
      nationality: 0,
      dateOfBirth: 0,
      currentCompany: 0,
      currentDesignation: 0,
      professionalTitle: 0,
    },
  },
});
assert(emailResult.resume.email === '', 'invalid email cleared');

console.log('smoke-validation-repair: OK');
console.log(JSON.stringify({
  quality: full.resumeQualityScore,
  parser: full.parserConfidenceScore,
  repairs: full.repairReport.repairCount,
  warnings: full.validationReport.warnings.length,
}, null, 2));
