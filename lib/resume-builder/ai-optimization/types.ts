/**
 * Resume AI Optimization — shared types
 */

export type ExperienceLevel =
  | 'fresher'
  | 'student'
  | 'experienced'
  | 'senior'
  | string;

export interface OptimizeResumeRequest {
  targetRole: string;
  industry?: string;
  experienceLevel?: ExperienceLevel;
  jobDescription: string;
  formData: Record<string, unknown>;
}

export interface SkillGapItem {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SummarySuggestion {
  current: string;
  suggested: string;
  rationale: string;
}

export interface ExperienceBulletSuggestion {
  experienceIndex: number;
  original: string;
  improved: string;
  rationale: string;
}

export interface ProjectSuggestion {
  title: string;
  description: string;
  forFresher: boolean;
}

export interface OptimizationReport {
  success: boolean;
  atsScore: number;
  roleMatchPercent: number;
  targetRole: string;
  experienceLevel: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  missingSkills: string[];
  skillGaps: SkillGapItem[];
  qualityIssues: string[];
  summary: SummarySuggestion;
  experienceBullets: ExperienceBulletSuggestion[];
  suggestedProjects: ProjectSuggestion[];
  suggestedCertifications: string[];
  suggestedSkills: string[];
  atsKeywords: string[];
  roleSpecificRecommendations: string[];
  fresherGuidance: string[];
  recruiterNotes: string[];
  provider: string;
  cached: boolean;
}

export interface RecruiterAnalysisJSON {
  qualityIssues?: string[];
  skillGaps?: Array<{ skill: string; priority: string; reason: string }>;
  roleSpecificRecommendations?: string[];
  fresherGuidance?: string[];
  recruiterNotes?: string[];
  summary?: { suggested: string; rationale: string };
  experienceBullets?: Array<{
    experienceIndex: number;
    improved: string;
    rationale: string;
  }>;
  suggestedCertifications?: string[];
}
