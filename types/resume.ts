export interface Resume {
  id: string;
  userId: string;
  basics: {
    name: string;
    email: string;
    phone?: string;
    location: {
      address?: string;
      city: string;
      state?: string;
      country: string;
      postalCode?: string;
    };
    summary: string;
    website?: string;
    profiles?: {
      network: string;
      url: string;
      username: string;
    }[];
  };
  work: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current?: boolean;
    summary: string;
    highlights?: string[];
    location?: string;
  }[];
  education: {
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate?: string;
    grade?: string;
    courses?: string[];
  }[];
  skills: {
    name: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    keywords?: string[];
    yearsOfExperience?: number;
  }[];
  projects?: {
    name: string;
    description: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: string;
    endDate?: string;
    url?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
    url?: string;
    validUntil?: string;
  }[];
  languages?: {
    language: string;
    fluency: 'basic' | 'conversational' | 'fluent' | 'native';
  }[];
  interests?: {
    name: string;
    keywords?: string[];
  }[];
  references?: {
    name: string;
    reference: string;
    position?: string;
    company?: string;
    contact?: string;
  }[];
  metadata: {
    theme?: string;
    format?: string;
    lastUpdated: string;
    visibility: 'public' | 'private' | 'hidden';
    completeness?: number;
    parsedData?: any;
  };
}
