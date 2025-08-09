// Job matching helpers (minimal, type-safe)

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface SeekerPreferences {
  totalExperience: number; // in years
  expectedSalaryMin: number; // in currency units
  expectedSalaryMax: number;
  preferredLocations: string[]; // lowercase city/region names
}

export interface MatchParams {
  jobSkills: Skill[];
  seekerSkills: Skill[];
  jobPreferences: {
    experienceRequired: number;
    salaryRange: [number, number];
    location: { city?: string } & Record<string, unknown>;
  };
  seekerPreferences: SeekerPreferences | null;
}

export function calculateMatchScore(params: MatchParams): number {
  const { jobSkills, seekerSkills, jobPreferences, seekerPreferences } = params;
  if (!seekerPreferences) return 0;

  const skillsScore = calculateSkillsMatch(jobSkills, seekerSkills) * 0.5; // 50%
  const experienceScore = calculateExperienceMatch(
    jobPreferences.experienceRequired,
    seekerPreferences.totalExperience
  ) * 0.2; // 20%
  const salaryScore = calculateSalaryMatch(
    jobPreferences.salaryRange,
    [seekerPreferences.expectedSalaryMin, seekerPreferences.expectedSalaryMax]
  ) * 0.2; // 20%
  const locationScore = calculateLocationMatch(
    jobPreferences.location,
    seekerPreferences.preferredLocations
  ) * 0.1; // 10%

  return Math.round(skillsScore + experienceScore + salaryScore + locationScore);
}

function calculateSkillsMatch(jobSkills: Skill[], seekerSkills: Skill[]): number {
  const required = jobSkills.map(s => s.name.toLowerCase());
  const candidateSet = new Set(seekerSkills.map(s => s.name.toLowerCase()));
  if (required.length === 0) return 100;
  let matching = 0;
  for (let i = 0; i < required.length; i++) {
    if (candidateSet.has(required[i])) matching++;
  }
  return (matching / required.length) * 100;
}

function calculateExperienceMatch(required: number, actual: number): number {
  if (actual >= required) return 100;
  if (actual >= required * 0.8) return 80;
  if (actual >= required * 0.6) return 60;
  return Math.max((actual / Math.max(required, 1)) * 50, 0);
}

function calculateSalaryMatch(jobRange: [number, number], expectedRange: [number, number]): number {
  const [jobMin, jobMax] = jobRange;
  const [expectedMin, expectedMax] = expectedRange;
  if (jobMax >= expectedMin && jobMin <= expectedMax) return 100; // overlap
  const difference = Math.min(
    Math.abs(jobMin - expectedMax),
    Math.abs(jobMax - expectedMin)
  );
  // Normalize difference by a wide band (adjust as needed)
  const normalizedDiff = Math.min(difference / Math.max(expectedMax - expectedMin, 1), 1);
  return Math.max((1 - normalizedDiff) * 100, 0);
}

function calculateLocationMatch(jobLocation: { city?: string } & Record<string, unknown>, preferredLocations: string[]): number {
  const jobCity = String(jobLocation.city ?? '').toLowerCase();
  if (!jobCity || preferredLocations.length === 0) return 50; // neutral
  const matched = preferredLocations.some(loc => jobCity.includes(loc.toLowerCase()));
  return matched ? 100 : 0;
}