export interface HomePageJob {
  id: number | string;
  sourceId?: string | null;
  source?: string;
  title: string;
  company: string | null;
  companyLogo?: string | null;
  location: string | null;
  country?: string;
  salary: string | null;
  jobType: string | null;
  experienceLevel?: string | null;
  isRemote: boolean;
  isFeatured: boolean;
  sector?: string | null;
}

export interface HomePageCompany {
  id: string;
  name: string;
  logo?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  sector?: string | null;
  isGlobal?: boolean;
  jobCount: number;
}
