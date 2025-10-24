// Consolidated JobApplication interface - Single source of truth
export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  userId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  
  // Basic application details
  coverLetter?: string;
  resumeUrl?: string;
  resumeId?: string;
  notes?: string;
  employerNotes?: string;
  
  // Interview details
  interviewScheduled?: Date;
  interviewLocation?: string;
  interviewType?: 'phone' | 'video' | 'in-person' | 'onsite';
  
  // Job details
  salary?: number;
  expectedStartDate?: Date;
  
  // Application state
  isWithdrawn: boolean;
  withdrawnAt?: Date;
  withdrawnReason?: string;
  
  // Enhanced features
  documents?: {
    resume: {
      url: string;
      filename: string;
      uploadDate: string;
    };
    coverLetter?: {
      url: string;
      filename: string;
      uploadDate: string;
    };
    additional?: Array<{
      url: string;
      filename: string;
      type: string;
      uploadDate: string;
    }>;
  };
  
  assessment?: {
    score?: number;
    feedback?: string;
    completedDate?: string;
    status: 'pending' | 'completed' | 'expired';
  };
  
  interviews?: Array<{
    id: string;
    type: 'phone' | 'video' | 'onsite';
    scheduledFor: string;
    duration: number;
    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
    feedback?: {
      rating: number;
      comments: string;
      strengths: string[];
      weaknesses: string[];
    };
    location?: string;
    interviewers?: string[];
  }>;
  
  communication: {
    lastContactDate?: string;
    nextFollowUp?: string;
    history: Array<{
      date: string;
      type: 'email' | 'phone' | 'message';
      direction: 'incoming' | 'outgoing';
      content: string;
    }>;
  };
  
  timeline: {
    submitted: string;
    reviewed?: string;
    shortlisted?: string;
    interviewed?: string;
    offered?: string;
    accepted?: string;
    rejected?: string;
  };
  
  feedback?: {
    internal?: {
      rating: number;
      comments: string;
      reviewerId: string;
      date: string;
    };
    candidate?: {
      rating: number;
      comments: string;
      date: string;
    };
  };
  
  metadata: {
    source: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
    completeness: number;
  };
}

export type ApplicationStatus = 
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'under_review'
  | 'shortlisted'
  | 'interview-scheduled'
  | 'interviewed'
  | 'offer-extended'
  | 'offered'
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