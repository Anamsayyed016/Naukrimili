export interface EmployerDashboardStats {
  totalJobPostings: number;
  activeJobPostings: number;
  totalApplications: number;
  newApplications: number;
  totalHires: number;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  status: 'draft' | 'published' | 'closed';
  publishDate?: string;
  closingDate?: string;
  applicationsCount: number;
}

export interface Candidate {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  applicationDate: string;
  status: 'new' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  resumeUrl: string;
  rating?: number;
  notes?: string;
}

export interface InterviewSchedule {
  id: string;
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  dateTime: string;
  type: 'onsite' | 'remote' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled';
  feedback?: string;
}

export interface EmployerDashboardData {
  stats: EmployerDashboardStats;
  recentJobPostings: JobPosting[];
  recentApplications: Candidate[];
  upcomingInterviews: InterviewSchedule[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  size: string;
  location: string;
  logo?: string;
  website?: string;
  description: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}
