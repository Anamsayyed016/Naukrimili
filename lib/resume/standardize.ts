export type CandidateProfile = {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  jobTitle?: string;
  skills: string[];
  education: string[];
  experience: string[];
};

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).filter(Boolean);
  return [String(value)].filter(Boolean);
}

export function standardizeCandidateProfile(input: any): CandidateProfile {
  // Handle RealResumeService extracted structure
  if (input && (input.fullName || input.email || input.phone)) {
    return {
      fullName: String(input.fullName || '').trim(),
      email: String(input.email || '').trim(),
      phone: input.phone ? String(input.phone).trim() : undefined,
      location: input.location ? String(input.location).trim() : undefined,
      jobTitle: input.jobTitle ? String(input.jobTitle).trim() : undefined,
      skills: toStringArray(input.skills),
      education: toStringArray(input.education),
      experience: toStringArray(input.experience),
    };
  }

  // Handle ResumeService ResumeData structure
  if (input && (input.contact || input.skills || input.workExperience)) {
    const education = Array.isArray(input.education)
      ? input.education.map((e: any) => e?.degree || e?.institution || JSON.stringify(e)).filter(Boolean)
      : [];
    const experience = Array.isArray(input.workExperience)
      ? input.workExperience.map((w: any) => w?.jobTitle || w?.company || JSON.stringify(w)).filter(Boolean)
      : [];
    return {
      fullName: String(input.fullName || '').trim(),
      email: String(input.contact?.email || '').trim(),
      phone: input.contact?.phone ? String(input.contact.phone).trim() : undefined,
      location: input.preferences?.preferredLocation || undefined,
      jobTitle: input.preferences?.preferredJobType || undefined,
      skills: toStringArray(input.skills),
      education,
      experience,
    };
  }

  // Fallback empty profile
  return {
    fullName: '',
    email: '',
    skills: [],
    education: [],
    experience: [],
  };
}

// Convenience wrapper for existing ResumeData type users
// Reuses the unified standardizer to avoid duplicate logic
export { type ResumeData } from '@/lib/resume-api-types';
export function mapResumeToProfile(resume: any): CandidateProfile {
  return standardizeCandidateProfile(resume);
}


