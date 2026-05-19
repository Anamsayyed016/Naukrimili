/**
 * Heuristic ATS structure score (same logic as FinalizeStep — shared server-side)
 */

export function calculateStructureAtsScore(data: Record<string, unknown>): number {
  let score = 0;

  if (data.firstName || data.name) score += 5;
  if (data.email) score += 10;
  if (data.phone) score += 5;
  if (data.location) score += 5;
  if (data.jobTitle || data.title) score += 10;
  if (data.summary || data.bio) score += 15;

  if (Array.isArray(data.skills) && data.skills.length > 0) {
    score += Math.min(15, data.skills.length * 2);
  }

  if (Array.isArray(data.experience) && data.experience.length > 0) {
    score += Math.min(20, data.experience.length * 5);
  }

  if (Array.isArray(data.education) && data.education.length > 0) {
    score += Math.min(10, data.education.length * 5);
  }

  if (Array.isArray(data.projects) && data.projects.length > 0) score += 2;
  if (Array.isArray(data.certifications) && data.certifications.length > 0) score += 2;
  if (Array.isArray(data.languages) && data.languages.length > 0) score += 1;

  return Math.min(Math.round(score), 100);
}
