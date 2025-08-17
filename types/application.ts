export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  userId: string; // Add this for compatibility
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  employerNotes?: string;
  interviewScheduled?: Date;
  interviewLocation?: string;
  interviewType?: 'phone' | 'video' | 'in-person';
  salary?: number;
  expectedStartDate?: Date;
  isWithdrawn: boolean;
  withdrawnAt?: Date;
  withdrawnReason?: string;
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'shortlisted'
  | 'interview-scheduled'
  | 'interviewed'
  | 'offer-extended'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'expired';

export interface ApplicationFilters {
  status?: ApplicationStatus | ApplicationStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasCoverLetter?: boolean;
  hasResume?: boolean;
  isWithdrawn?: boolean;
  interviewScheduled?: boolean;
  salaryRange?: {
    min: number;
    max: number;
  };
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  recentApplications: number;
  averageResponseTime: number;
  interviewRate: number;
  offerRate: number;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  authorId: string;
  authorType: 'applicant' | 'employer' | 'admin';
  content: string;
  createdAt: Date;
  isPrivate: boolean;
}

export interface ApplicationTimeline {
  applicationId: string;
  events: Array<{
    type: string;
    timestamp: Date;
    description: string;
    metadata?: Record<string, any>;
  }>;
}
