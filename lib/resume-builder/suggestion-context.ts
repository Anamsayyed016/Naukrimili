/**
 * Shared resume-builder context for inline AI suggestions (form + ATS routes).
 */

export interface ResumeSuggestionContextInput {
  formData: Record<string, unknown>;
  currentSection?: string;
  currentField?: string;
  projectName?: string;
  technologies?: string[];
  userInput?: string;
  isProjectDescription?: boolean;
}

export function buildResumeSuggestionContext(
  input: ResumeSuggestionContextInput
): Record<string, unknown> {
  const { formData } = input;
  const skills = Array.isArray(formData.skills)
    ? (formData.skills as unknown[]).map((s) => String(s)).filter(Boolean)
    : [];

  const experience = Array.isArray(formData.experience) ? formData.experience : [];
  const education = Array.isArray(formData.education) ? formData.education : [];
  const projects = Array.isArray(formData.projects) ? formData.projects : [];

  const experienceSummary = experience
    .slice(0, 4)
    .map((exp: Record<string, unknown>) => {
      const company = String(exp.company || exp.Company || '');
      const title = String(exp.position || exp.title || exp.Position || '');
      return `${title} at ${company}`.trim();
    })
    .filter(Boolean)
    .join('; ');

  const projectNames = projects
    .map((p: Record<string, unknown>) => String(p.name || p.title || ''))
    .filter(Boolean);

  const techFromProjects = projects
    .flatMap((p: Record<string, unknown>) => {
      const t = p.technologies;
      if (Array.isArray(t)) return t.map(String);
      if (typeof t === 'string') return t.split(/[,;]/).map((s) => s.trim());
      return [];
    })
    .filter(Boolean);

  return {
    jobTitle: String(formData.jobTitle || formData.title || ''),
    industry: String(formData.industry || ''),
    experienceLevel: String(formData.experienceLevel || 'experienced'),
    skills,
    summary: String(formData.summary || formData.bio || ''),
    experienceLevelLabel: String(formData.experienceLevel || 'experienced'),
    existingExperience: experienceSummary,
    existingProjects: projectNames,
    projectTechnologies: input.technologies?.length
      ? input.technologies
      : techFromProjects.slice(0, 8),
    currentProjectName: input.projectName || '',
    currentSection: input.currentSection || '',
    currentField: input.currentField || '',
    userInput: input.userInput || '',
    isProjectDescription: !!input.isProjectDescription,
    educationCount: education.length,
    experienceCount: experience.length,
    templateType: 'resume-builder',
  };
}
