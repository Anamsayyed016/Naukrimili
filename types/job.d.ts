export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  postedAt: string;
  redirect_url?: string;
}

export interface DisplayJob extends Job {
  salaryFormatted: string;
  timeAgo: string;
  isUrgent: boolean;
  isRemote: boolean;
  jobType: string;
}
