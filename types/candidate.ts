export interface ICandidate {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  skills: string[];
  experience?: number;
  currentPosition?: string;
  currentCompany?: string;
  expectedSalary?: number;
  location?: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  jobId?: string;
  notes?: string;
  appliedDate: Date;
  updatedAt: Date;
  avatar?: string;
  rating?: number;
  metadata?: Record<string, any>;
  interviews?: Array<{
    id: string;
    date: Date;
    type: 'phone' | 'video' | 'onsite';
    status: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    interviewer?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
}