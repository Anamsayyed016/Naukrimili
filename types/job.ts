export interface Job {
  id: string;
  title: string;
  description: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    website?: string;
}
}}
}
  location: {
  ;
    city: string;
    state?: string;
    country: string;
    type: 'onsite' | 'remote' | 'hybrid'
}
}
  employmentDetails: {
  ;
    type: 'full-time' | 'part-time' | 'contract' | 'internship';
    schedule?: string;
    workHours?: string;
    overtime?: boolean;
}
}
  compensation: {
  ;
    salary?: {
      min: number;
      max: number;
      currency: string;
      period: 'hourly' | 'monthly' | 'yearly'
}
}
    benefits?: string[];
    equity?: string;
    bonus?: string}
  requirements: {
  ;
    education?: string[];
    experience: string;
    skills: string[];
    certifications?: string[];
    languages?: {
      name: string;
      level: 'basic' | 'intermediate' | 'fluent' | 'native'
}
}[]}
  responsibilities: string[];
  status: {
  ;
    isActive: boolean;
    isVerified: boolean;
    isFeatured: boolean;
    closingDate?: string;
}
}
  applicationProcess: {
  ;
    type: 'direct' | 'email' | 'external';
    url?: string;
    email?: string;
    instructions?: string;
    requiredDocuments?: string[];
}
}
  metadata: {
  ;
    postedDate: string;
    lastModified: string;
    views: number;
    applications: number;
    source?: string;
}
    tags?: string[];}
}