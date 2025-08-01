import mongoose from 'mongoose';
import { ICandidate } from '@/types/candidate';

// Re-export the interface for compatibility
export type { ICandidate };

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
