import mongoose from 'mongoose';

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
  interviews?: {
    id: string;
    date: Date;
    type: 'phone' | 'video' | 'onsite';
    status: 'scheduled' | 'completed' | 'cancelled';
    feedback?: string;
    interviewer?: string;
  }[];
  education?: {
    degree: string;
    institution: string;
    year: number;
  }[];
}

const CandidateSchema = new mongoose.Schema<ICandidate>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  resume: String,
  skills: [{ type: String }],
  experience: Number,
  currentPosition: String,
  currentCompany: String,
  expectedSalary: Number,
  location: String,
  status: { 
    type: String, 
    enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'],
    default: 'new'
  },
  jobId: String,
  notes: String,
  appliedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  avatar: String,
  rating: Number,
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  interviews: [{
    id: String,
    date: Date,
    type: { type: String, enum: ['phone', 'video', 'onsite'] },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'] },
    feedback: String,
    interviewer: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }]
}, {
  timestamps: true
});

CandidateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Candidate = mongoose.models.Candidate || 
  mongoose.model<ICandidate>('Candidate', CandidateSchema);
