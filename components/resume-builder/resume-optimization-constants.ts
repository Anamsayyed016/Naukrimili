/** Shared role / level presets for optimization UI */

export const TARGET_ROLES = [
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'HR Manager',
  'Recruiter',
  'UI/UX Designer',
  'Graphic Designer',
  'Digital Marketing Specialist',
  'Product Manager',
  'Business Analyst',
  'DevOps Engineer',
  'QA Engineer',
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / Entry' },
  { value: 'student', label: 'Student / Intern' },
  { value: 'experienced', label: 'Experienced' },
  { value: 'senior', label: 'Senior / Lead' },
] as const;

export const JD_STORAGE_PREFIX = 'resume-optimize-jd';
