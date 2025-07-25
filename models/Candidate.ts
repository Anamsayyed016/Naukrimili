import mongoose from 'mongoose';

export interface ICandidate {
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  skills: string[];
  experience?: number;
  currentPosition?: string;
  expectedSalary?: number;
  location?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'hired';
  appliedDate: Date;
  updatedAt: Date;
  avatar?: string;
}

const CandidateSchema = new mongoose.Schema<ICandidate>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  resume: String,
  skills: [{ type: String }],
  experience: Number,
  currentPosition: String,
  expectedSalary: Number,
  location: String,
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  appliedDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  avatar: String
}, {
  timestamps: true
});

CandidateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Candidate = mongoose.models.Candidate || 
  mongoose.model<ICandidate>('Candidate', CandidateSchema);
