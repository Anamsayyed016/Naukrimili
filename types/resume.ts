export interface ResumeProfile {
  network: string
  url: string
  username: string
}

export interface ResumeWork {
  company: string
  position: string
  startDate: string
  endDate?: string
  current?: boolean
  summary: string
  highlights?: string[]
  location?: string
}

export interface ResumeEducation {
  institution: string
  area: string
  studyType: string
  startDate: string
  endDate?: string
  grade?: string
  courses?: string[]
}

export interface ResumeSkill {
  name: string
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  keywords?: string[]
  yearsOfExperience?: number
}

export interface ResumeProject {
  name: string
  description: string
  highlights?: string[]
  keywords?: string[]
  startDate?: string
  endDate?: string
  url?: string
}

export interface ResumeCertification {
  name: string
  issuer: string
  date: string
  url?: string
  validUntil?: string
}

export interface ResumeLanguage {
  language: string
  fluency: 'basic' | 'conversational' | 'fluent' | 'native'
}

export interface ResumeInterest {
  name: string
  keywords?: string[]
}

export interface ResumeReference {
  name: string
  reference: string
  position?: string
  company?: string
  contact?: string
}

export interface ResumeMetadata {
  theme?: string
  format?: string
  lastUpdated: string
  visibility: 'public' | 'private' | 'hidden'
  completeness?: number
  parsedData?: Record<string, unknown>
}

export interface Resume {
  id: string
  userId: string
  basics: {
    name: string
    email: string
    phone?: string
    location: {
      address?: string
      city: string
      state?: string
      country: string
      postalCode?: string
    }
    summary: string
    website?: string
    profiles?: ResumeProfile[]
  }
  work: ResumeWork[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  projects?: ResumeProject[]
  certifications?: ResumeCertification[]
  languages?: ResumeLanguage[]
  interests?: ResumeInterest[]
  references?: ResumeReference[]
  metadata: ResumeMetadata
  downloadUrl?: string // Add this for compatibility
  filename?: string // Add this for compatibility
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordMatch: {
    matched: string[];
    missing: string[];
    score: number;
  };
  completeness: {
    overall: number;
    sections: Record<string, number>;
  };
  aiInsights: {
    summary: string;
    recommendations: string[];
    industryFit: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeFilters {
  userId?: string;
  theme?: string;
  visibility?: 'public' | 'private' | 'hidden';
  completeness?: {
    min?: number;
    max?: number;
  };
  hasAnalysis?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
}