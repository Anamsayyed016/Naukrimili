export interface DashboardStats {
  totalApplications: number;
  activeJobs: number;
  savedJobs: number;
  interviewInvites: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  response?: string;
}

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  savedDate: string;
}

export interface Interview {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  dateTime: string;
  location: string;
  type: 'onsite' | 'remote' | 'phone';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentApplications: JobApplication[];
  savedJobs: SavedJob[];
  upcomingInterviews: Interview[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  avatar?: string;
  resumeUrl?: string;
  completionPercentage: number;
}

export interface NotificationType {
  id: string;
  type: 'application' | 'interview' | 'message' | 'system';
  title: string;
  message: string;
  date: string;
  read: boolean;
  link?: string;
}
