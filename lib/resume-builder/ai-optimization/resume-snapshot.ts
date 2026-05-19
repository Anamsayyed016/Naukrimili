/**
 * Normalize builder formData into text + sections for AI / semantic matching
 */

export interface ResumeSnapshot {
  summary: string;
  skills: string[];
  experienceTexts: string[];
  educationTexts: string[];
  projectsTexts: string[];
  resumeText: string;
  jobTitle: string;
  industry: string;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildResumeSnapshot(formData: Record<string, unknown>): ResumeSnapshot {
  const summary =
    str(formData.summary) ||
    str(formData.bio) ||
    str(formData.objective) ||
    '';

  const skills = Array.isArray(formData.skills)
    ? formData.skills
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
    : [];

  const experienceTexts: string[] = [];
  if (Array.isArray(formData.experience)) {
    for (const exp of formData.experience) {
      if (!exp || typeof exp !== 'object') continue;
      const e = exp as Record<string, unknown>;
      const role = str(e.role) || str(e.title) || str(e.position);
      const company = str(e.company) || str(e.employer);
      const desc = str(e.description);
      const duration = str(e.duration) || str(e.dates);
      const parts = [role, company, duration, desc].filter(Boolean);
      if (parts.length) experienceTexts.push(parts.join(' — '));
    }
  }

  const educationTexts: string[] = [];
  if (Array.isArray(formData.education)) {
    for (const edu of formData.education) {
      if (!edu || typeof edu !== 'object') continue;
      const e = edu as Record<string, unknown>;
      const degree = str(e.degree);
      const school = str(e.school) || str(e.institution);
      const year = str(e.year) || str(e.graduationYear);
      const parts = [degree, school, year].filter(Boolean);
      if (parts.length) educationTexts.push(parts.join(', '));
    }
  }

  const projectsTexts: string[] = [];
  if (Array.isArray(formData.projects)) {
    for (const proj of formData.projects) {
      if (!proj || typeof proj !== 'object') continue;
      const p = proj as Record<string, unknown>;
      const title = str(p.title) || str(p.name);
      const desc = str(p.description);
      if (title || desc) projectsTexts.push([title, desc].filter(Boolean).join(': '));
    }
  }

  const resumeText = [
    summary,
    skills.join(', '),
    experienceTexts.join('\n'),
    educationTexts.join('\n'),
    projectsTexts.join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    summary,
    skills,
    experienceTexts,
    educationTexts,
    projectsTexts,
    resumeText,
    jobTitle: str(formData.jobTitle) || str(formData.title),
    industry: str(formData.industry),
  };
}

export function normalizeExperienceLevel(
  level: string | undefined,
  formData: Record<string, unknown>
): string {
  const raw = (level || str(formData.experienceLevel) || 'experienced').toLowerCase();
  if (raw.includes('fresher') || raw.includes('fresh')) return 'fresher';
  if (raw.includes('student') || raw.includes('intern')) return 'student';
  if (raw.includes('senior') || raw.includes('lead') || raw.includes('executive')) return 'senior';
  return 'experienced';
}

export function snapshotToAtsRequest(
  snapshot: ResumeSnapshot,
  targetRole: string,
  industry: string,
  experienceLevel: string
) {
  return {
    job_title: targetRole || snapshot.jobTitle,
    industry: industry || snapshot.industry,
    experience_level: experienceLevel,
    summary_input: snapshot.summary,
    skills_input: snapshot.skills.join(', '),
    experience_input: snapshot.experienceTexts.join(' '),
    education_input: snapshot.educationTexts.join(' '),
  };
}
