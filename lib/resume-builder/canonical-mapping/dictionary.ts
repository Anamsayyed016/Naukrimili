/**
 * Canonical field dictionary — maps alias keys and Builder fields to node types.
 */

import type { BuilderFieldSpec, CanonicalNodeType } from './types';

/** Infer node type from property key + section context. */
export function inferNodeTypeFromKey(
  key: string,
  section: string
): CanonicalNodeType[] {
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  const sec = section.toLowerCase();

  if (['fullname', 'name', 'firstname', 'lastname'].includes(k)) return ['PERSON_NAME'];
  if (['email', 'mail'].includes(k)) return ['EMAIL'];
  if (['phone', 'mobile', 'telephone', 'contact'].includes(k)) return ['PHONE'];
  if (['linkedin', 'linkedinurl'].includes(k)) return ['LINKEDIN'];
  if (['portfolio', 'website', 'personalwebsite', 'url'].includes(k)) return ['PORTFOLIO'];
  if (['github', 'githuburl', 'repo'].includes(k)) return ['GITHUB'];
  if (['address', 'street'].includes(k)) return ['ADDRESS'];
  if (['location', 'city', 'state', 'country', 'office', 'branch'].includes(k)) return ['LOCATION'];

  if (['summary', 'bio', 'executivesummary', 'professionalsummary', 'aboutme'].includes(k)) {
    return ['SUMMARY', 'PROFILE'];
  }
  if (['objective', 'careerobjective', 'goal'].includes(k)) return ['OBJECTIVE'];
  if (['profile', 'professionalprofile'].includes(k)) return ['PROFILE', 'SUMMARY'];

  if (sec.includes('project') && ['name', 'title', 'projectname', 'project'].includes(k)) {
    return ['PROJECT'];
  }
  if (['company', 'firm', 'office', 'workedat'].includes(k)) return ['COMPANY', 'ORGANIZATION', 'EMPLOYER'];
  if (['organization', 'organisation', 'employer', 'companyname'].includes(k)) {
    return ['ORGANIZATION', 'COMPANY', 'EMPLOYER'];
  }
  if (['position', 'designation', 'role', 'jobtitle', 'employmenttitle'].includes(k)) {
    if (sec.includes('project')) return ['PROJECT'];
    if (sec.includes('education')) return ['EDUCATION'];
    return ['JOB_TITLE'];
  }
  if (['title'].includes(k)) {
    if (sec.includes('project')) return ['PROJECT'];
    if (sec.includes('education')) return ['EDUCATION'];
    if (sec.includes('experience')) return ['JOB_TITLE'];
    return ['JOB_TITLE', 'PROJECT'];
  }

  if (['institution', 'school', 'college', 'university', 'academy'].includes(k)) {
    return ['EDUCATION'];
  }
  if (['degree', 'qualification', 'field', 'major', 'cgpa', 'gpa', 'percentage'].includes(k)) {
    return ['EDUCATION'];
  }

  if (['certification', 'certificate', 'certificatename', 'credential', 'license'].includes(k)) {
    return ['CERTIFICATION', 'LICENSE'];
  }
  if (['issuer', 'issuedby', 'issuingorganization'].includes(k)) return ['CERTIFICATION'];

  if (['language', 'spokenlanguage', 'writtenlanguage', 'languagename'].includes(k)) {
    return ['LANGUAGE'];
  }
  if (['proficiency', 'fluency', 'level'].includes(k) && sec.includes('language')) return ['LANGUAGE'];

  if (['hobby', 'hobbies', 'interest', 'interests', 'personalinterests', 'activities'].includes(k)) {
    return ['HOBBY', 'INTEREST'];
  }

  if (['achievement', 'achievements', 'accomplishment', 'highlight', 'careerhighlight'].includes(k)) {
    return ['ACHIEVEMENT'];
  }
  if (['award', 'awards', 'honour', 'honors', 'recognition'].includes(k)) return ['AWARD'];
  if (['responsibility', 'responsibilities', 'duty', 'duties'].includes(k)) return ['RESPONSIBILITY'];
  if (['description', 'summary', 'details'].includes(k)) {
    if (sec.includes('experience')) return ['RESPONSIBILITY', 'ACHIEVEMENT'];
    if (sec.includes('project')) return ['PROJECT'];
    if (sec.includes('education')) return ['EDUCATION'];
    return ['SUMMARY'];
  }

  if (['skill', 'skills', 'expertise', 'competenc', 'competencies', 'coreskills'].includes(k)) {
    return ['TECHNICAL_SKILL', 'CORE_SKILL', 'SOFT_SKILL'];
  }
  if (['technicalskills', 'techskills', 'tools', 'frameworks', 'database'].includes(k)) {
    return ['TECHNICAL_SKILL', 'TOOLS', 'FRAMEWORK', 'DATABASE'];
  }

  if (['training', 'course', 'workshop', 'seminar', 'conference'].includes(k)) return ['TRAINING'];
  if (['internship', 'intern'].includes(k)) return ['INTERNSHIP'];
  if (['volunteer', 'volunteering', 'community'].includes(k)) return ['VOLUNTEER'];
  if (['research'].includes(k)) return ['RESEARCH'];
  if (['patent', 'patents'].includes(k)) return ['PATENT'];
  if (['publication', 'publications'].includes(k)) return ['PUBLICATION'];
  if (['reference', 'references'].includes(k)) return ['REFERENCE'];
  if (['declaration'].includes(k)) return ['DECLARATION'];
  if (['membership', 'memberships'].includes(k)) return ['MEMBERSHIP'];

  return ['UNKNOWN'];
}

export const BUILDER_FIELD_SPECS: BuilderFieldSpec[] = [
  {
    builderKey: 'firstName',
    acceptedTypes: ['PERSON_NAME'],
    aliasKeys: ['firstName', 'first_name'],
    scalar: true,
  },
  {
    builderKey: 'lastName',
    acceptedTypes: ['PERSON_NAME'],
    aliasKeys: ['lastName', 'last_name'],
    scalar: true,
  },
  {
    builderKey: 'fullName',
    acceptedTypes: ['PERSON_NAME'],
    aliasKeys: ['fullName', 'name'],
    scalar: true,
  },
  {
    builderKey: 'email',
    acceptedTypes: ['EMAIL'],
    aliasKeys: ['email'],
    scalar: true,
  },
  {
    builderKey: 'phone',
    acceptedTypes: ['PHONE'],
    aliasKeys: ['phone', 'mobile'],
    scalar: true,
  },
  {
    builderKey: 'location',
    acceptedTypes: ['LOCATION', 'ADDRESS'],
    aliasKeys: ['location', 'address', 'city'],
    scalar: true,
  },
  {
    builderKey: 'linkedin',
    acceptedTypes: ['LINKEDIN'],
    aliasKeys: ['linkedin', 'linkedinUrl'],
    scalar: true,
  },
  {
    builderKey: 'portfolio',
    acceptedTypes: ['PORTFOLIO', 'GITHUB'],
    aliasKeys: ['portfolio', 'website'],
    scalar: true,
  },
  {
    builderKey: 'github',
    acceptedTypes: ['GITHUB'],
    aliasKeys: ['github'],
    scalar: true,
  },
  {
    builderKey: 'summary',
    acceptedTypes: ['SUMMARY', 'OBJECTIVE', 'PROFILE'],
    aliasKeys: ['summary', 'bio', 'objective', 'professionalSummary'],
    scalar: true,
  },
  {
    builderKey: 'jobTitle',
    acceptedTypes: ['JOB_TITLE'],
    aliasKeys: ['jobTitle', 'headline', 'designation', 'title'],
    scalar: true,
  },
  {
    builderKey: 'skills',
    acceptedTypes: ['TECHNICAL_SKILL', 'CORE_SKILL', 'SOFT_SKILL', 'TOOLS'],
    aliasKeys: ['skills', 'technicalSkills', 'expertise', 'competencies'],
  },
  {
    builderKey: 'experience',
    acceptedTypes: ['EXPERIENCE'],
    aliasKeys: ['experience', 'workExperience'],
    arrayEntry: true,
  },
  {
    builderKey: 'education',
    acceptedTypes: ['EDUCATION'],
    aliasKeys: ['education'],
    arrayEntry: true,
  },
  {
    builderKey: 'projects',
    acceptedTypes: ['PROJECT'],
    aliasKeys: ['projects'],
    arrayEntry: true,
  },
  {
    builderKey: 'certifications',
    acceptedTypes: ['CERTIFICATION', 'LICENSE'],
    aliasKeys: ['certifications', 'licenses', 'credentials'],
    arrayEntry: true,
  },
  {
    builderKey: 'languages',
    acceptedTypes: ['LANGUAGE'],
    aliasKeys: ['languages', 'spokenLanguages'],
    arrayEntry: true,
  },
  {
    builderKey: 'achievements',
    acceptedTypes: ['ACHIEVEMENT'],
    aliasKeys: ['achievements', 'accomplishments'],
  },
  {
    builderKey: 'hobbies',
    acceptedTypes: ['HOBBY', 'INTEREST'],
    aliasKeys: ['hobbies', 'interests', 'activities'],
  },
];

/** Dynamic section headings → extended Builder bucket. */
export const DYNAMIC_SECTION_ROUTING: Array<{
  pattern: RegExp;
  bucket: keyof import('./types').ExtendedBuilderSections;
}> = [
  { pattern: /professional\s+qualification/i, bucket: 'professionalQualifications' },
  { pattern: /professional\s+highlight|career\s+highlight/i, bucket: 'professionalHighlights' },
  { pattern: /core\s+competenc/i, bucket: 'coreCompetencies' },
  { pattern: /soft\s+skill/i, bucket: 'softSkills' },
  { pattern: /technical\s+skill/i, bucket: 'technicalSkills' },
  { pattern: /^awards?$/i, bucket: 'awards' },
  { pattern: /membership/i, bucket: 'memberships' },
  { pattern: /training|seminar|conference/i, bucket: 'training' },
  { pattern: /internship/i, bucket: 'internships' },
  { pattern: /volunteer/i, bucket: 'volunteer' },
  { pattern: /research/i, bucket: 'research' },
  { pattern: /patent/i, bucket: 'patents' },
  { pattern: /publication/i, bucket: 'publications' },
  { pattern: /reference/i, bucket: 'references' },
  { pattern: /declaration/i, bucket: 'declaration' },
  { pattern: /personal\s+detail/i, bucket: 'personalDetails' },
];
