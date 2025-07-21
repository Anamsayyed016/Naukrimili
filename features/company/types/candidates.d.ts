export type CandidateStatus = 'new' | 'reviewed' | 'interview' | 'hired' | 'rejected';

export interface Candidate {
  id: string;
  name: string;
  resumeScore: number; // 0-100
  status: CandidateStatus;
  appliedDate: Date;
} 