export interface Company {
  id: string;
  name: string;
  description: string;
  industry: string;
  size: CompanySize;
  founded: number;
  website: string;
  logo?: string;
  location: CompanyLocation;
  contact: CompanyContact;
  socialMedia: CompanySocialMedia;
  benefits: string[];
  culture: CompanyCulture;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CompanySize = 
  | 'startup' 
  | 'small' 
  | 'medium' 
  | 'large' 
  | 'enterprise';

export interface CompanyLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isRemote: boolean;
  remotePolicy?: string;
}

export interface CompanyContact {
  email: string;
  phone?: string;
  contactPerson?: string;
  hrEmail?: string;
  supportEmail?: string;
}

export interface CompanySocialMedia {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface CompanyCulture {
  values: string[];
  mission: string;
  vision: string;
  workStyle: 'collaborative' | 'independent' | 'hybrid';
  diversity: boolean;
  inclusion: boolean;
  workLifeBalance: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CompanyProfile extends Company {
  stats: CompanyStats;
  reviews: CompanyReview[];
  awards: CompanyAward[];
  news: CompanyNews[];
  jobOpenings: number;
}

export interface CompanyStats {
  totalEmployees: number;
  totalJobs: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  averageResponseTime: number;
  retentionRate: number;
  growthRate: number;
}

export interface CompanyReview {
  id: string;
  companyId: string;
  reviewerId: string;
  rating: number;
  pros: string[];
  cons: string[];
  review: string;
  position: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'internship';
  duration: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface CompanyAward {
  id: string;
  companyId: string;
  name: string;
  category: string;
  year: number;
  description: string;
  issuer: string;
  logo?: string;
}

export interface CompanyNews {
  id: string;
  companyId: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: Date;
  source: string;
  url?: string;
  image?: string;
  tags: string[];
}
