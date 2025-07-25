export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'interviewed' | 'offered' | 'accepted' | 'rejected';
  documents: {
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
    additional?: {
      url: string;
      filename: string;
      type: string;
      uploadDate: string;
    }[];
  };
  assessment?: {
    score?: number;
    feedback?: string;
    completedDate?: string;
    status: 'pending' | 'completed' | 'expired';
  };
  interviews?: {
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
  }[];
  communication: {
    lastContactDate?: string;
    nextFollowUp?: string;
    history: {
      date: string;
      type: 'email' | 'phone' | 'message';
      direction: 'incoming' | 'outgoing';
      content: string;
    }[];
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
