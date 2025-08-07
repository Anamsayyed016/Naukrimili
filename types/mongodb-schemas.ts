import {
  Document, Schema
}
} from 'mongoose';

export interface IUser extends Document {
  ;
  email: string;
  password: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  lastLogin?: Date;
  socialProfiles?: {
    linkedin?: string;
    github?: string;
}
    twitter?: string}
}
export interface ICompany extends Document {
  ;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  industry: string;
  size: string;
  founded?: number;
  headquarters?: string;
  ownerId: Schema.Types.ObjectId;
  employees: Schema.Types.ObjectId[];
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
}
}
  createdAt: Date;
  updatedAt: Date}
export interface IJob extends Document {
  ;
  title: string;
  company: Schema.Types.ObjectId;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: string
}
}
  skills: string[];
  experience: string;
  education?: string;
  benefits?: string[];
  status: 'draft' | 'published' | 'closed';
  postedBy: Schema.Types.ObjectId;
  postedDate: Date;
  closingDate?: Date;
  applications: Schema.Types.ObjectId[];
  views: number;
  createdAt: Date;
  updatedAt: Date}
export interface IApplication extends Document {
  ;
  job: Schema.Types.ObjectId;
  applicant: Schema.Types.ObjectId;
  resume: string;
  coverLetter?: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted';
  appliedDate: Date;
  lastUpdated: Date;
  notes?: string;
  rating?: number;
  interviewDate?: Date;
  additionalDocuments?: {
    name: string;
    url: string
}
}[]}
export interface IResume extends Document {
  ;
  userId: Schema.Types.ObjectId;
  url: string;
  filename: string;
  isDefault: boolean;
  uploadDate: Date;
  lastModified: Date;
  parsed?: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
      description: string
}
}[];
    education: {
  ;
      degree: string;
      institution: string;
      year: string
}
}[]}}
export interface INotification extends Document {
  ;
  recipient: Schema.Types.ObjectId;
  type: 'application' | 'interview' | 'message' | 'system';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
  expiresAt?: Date;
}
}
export interface IMessage extends Document {
  ;
  sender: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  subject: string;
  content: string;
  read: boolean;
  attachments?: {
    name: string;
    url: string
}
}[];
  createdAt: Date;
  thread?: Schema.Types.ObjectId}
export interface IJobAlert extends Document {
  ;
  user: Schema.Types.ObjectId;
  keywords: string[];
  location?: string;
  jobTypes?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency: string
}
}
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'paused';
  lastSent?: Date;
  createdAt: Date;
  updatedAt: Date}