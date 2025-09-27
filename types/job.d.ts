export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  salary_formatted?: string;
  type: string;
  description: string;
  postedAt: string;
  redirect_url?: string;
  source_url?: string;
  source?: string;
  is_remote?: boolean;
  is_featured?: boolean;
  jobType?: string;
  experienceLevel?: string;
  skills?: string[] | string;
  isExternal?: boolean;
  applyUrl?: string;
}

export interface DisplayJob extends Job {
  salaryFormatted: string;
  timeAgo: string;
  isUrgent: boolean;
  isRemote: boolean;
  jobType: string;
}