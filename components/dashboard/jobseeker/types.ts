export interface DashboardStats {
  totalApplications: number;
  activeApplications: number;
  interviewInvites: number;
  totalBookmarks: number;
  totalResumes: number;
  profileCompletion: number;
}

export interface JobRecommendation {
  id: string | number;
  title: string;
  company: string | { name?: string };
  companyLogo?: string | null;
  location: string;
  jobType?: string;
  salary?: string;
  isRemote?: boolean;
  matchScore: number;
  matchReasons?: string[];
  createdAt?: string;
  description?: string;
}

export interface ProfileUser {
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  phone?: string | null;
  skills?: string[];
}

export function resolveCompanyName(company: JobRecommendation['company']): string {
  if (!company) return 'Company';
  if (typeof company === 'string') return company;
  return company.name || 'Company';
}

export function extractSkillsFromParsedData(parsedData: Record<string, unknown> | null | undefined): string[] {
  if (!parsedData) return [];
  const raw = parsedData.skills ?? parsedData.extractedSkills;
  if (Array.isArray(raw)) {
    return raw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  }
  return [];
}

export function extractCareerTitles(parsedData: Record<string, unknown> | null | undefined): string[] {
  if (!parsedData) return [];
  const titles = new Set<string>();

  const recommended = parsedData.recommendedJobTitles;
  if (Array.isArray(recommended)) {
    recommended.forEach((t) => {
      if (typeof t === 'string' && t.trim()) titles.add(t.trim());
    });
  }

  const suggestions = parsedData.jobSuggestions;
  if (Array.isArray(suggestions)) {
    suggestions.forEach((item) => {
      if (typeof item === 'string' && item.trim()) {
        titles.add(item.trim());
      } else if (item && typeof item === 'object' && 'title' in item) {
        const title = (item as { title?: string }).title;
        if (title?.trim()) titles.add(title.trim());
      }
    });
  }

  return Array.from(titles).slice(0, 8);
}
