// Local type definitions since Prisma client is not available;
interface Skill {
  ;
  id: string;
  name: string;
  category: string
}
}
} // interface JobPreferences {
  //   experienceRequired: number //   salaryRange: [number, number] //   location: Record<string, unknown> //
}
}
}
interface SeekerPreferences {
  ;
  totalExperience: number;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  preferredLocations: string[];
}
}
}
interface MatchParams {
  ;
  jobSkills: Skill[];
  seekerSkills: Skill[];
  jobPreferences: {
    experienceRequired: number;
    salaryRange: [number, number];
    location: Record<string, unknown> // Using any for brevity, should match your location type
  
}
}}
}
  seekerPreferences: SeekerPreferences | null}
export function calculateMatchScore({
  jobSkills,
  seekerSkills,
  jobPreferences);
}
  seekerPreferences }
}: MatchParams): number {
  if (!seekerPreferences) return 0 // Skills match (50% of total score);
  const skillsScore = calculateSkillsMatch(jobSkills, seekerSkills) * 0.5 // Experience match (20% of total score);
  const experienceScore = calculateExperienceMatch(jobPreferences.experienceRequired);
    seekerPreferences.totalExperience) * 0.2 // Salary match (20% of total score);
  const salaryScore = calculateSalaryMatch(jobPreferences.salaryRange);
    [seekerPreferences.expectedSalaryMin, seekerPreferences.expectedSalaryMax]) * 0.2 // Location match (10% of total score);
  const locationScore = calculateLocationMatch(;
}
    jobPreferences.location }
    seekerPreferences.preferredLocations) * 0.1;

  return skillsScore + experienceScore + salaryScore + locationScore
}
function calculateSkillsMatch(jobSkills: Skill[], seekerSkills: Skill[]): number {
  ;
  const requiredSkills = new Set(jobSkills.map(s => s.name.toLowerCase()));
  const candidateSkills = new Set(seekerSkills.map(s => s.name.toLowerCase()));
  
  const matchingSkills = [...requiredSkills].filter(skill =>;
    candidateSkills.has(skill)).length;

  return (matchingSkills / requiredSkills.size) * 100
}
}
function calculateExperienceMatch(required: number, actual: number): number {
  ;
  if (actual >= required) return 100;
  if (actual >= required * 0.8) return 80;
  if (actual >= required * 0.6) return 60;
  return Math.max((actual / required) * 50, 0);
}
  }
function calculateSalaryMatch(jobRange: [number, number]);
  expectedRange: [number, number]): number {
  ;
  const [jobMin, jobMax] = jobRange;
  const [expectedMin, expectedMax] = expectedRange;

  if (jobMax >= expectedMin && jobMin <= expectedMax) { // Ranges overlap - good match;
    return 100
}
} // Calculate how far off the ranges are;
  const difference = Math.min(;
    Math.abs(jobMin - expectedMax),
    Math.abs(jobMax - expectedMin)) // Normalize the difference (assuming 5 LPA difference is maximum mismatch);
  const normalizedDiff = Math.min(difference / 500000, 1);
  return Math.max((1 - normalizedDiff) * 100, 0);
function calculateLocationMatch(jobLocation: Record<string, unknown>, preferredLocations: string[]): number {
  // Simple location matching - can be enhanced with actual geocoding;
  const jobCity = jobLocation.city.toLowerCase();
  const matchingLocation = preferredLocations.some(loc =>;
    jobCity.includes(loc.toLowerCase()));

  return matchingLocation ? 100 : 0
}
}