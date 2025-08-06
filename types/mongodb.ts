import { Document, Model } from 'mongoose';
import { Job } from './job';
import { User } from './user';
import { JobApplication } from './job-application';
import { Resume } from './resume';

export interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete {
  deletedAt?: Date;
  isDeleted: boolean;
}

export type MongoDocument<T> = T & Document & WithTimestamps & SoftDelete;

export interface MongoModel<T> extends Model<MongoDocument<T>> {
  paginate(query: Record<string, unknown>, options: PaginationOptions): Promise<PaginatedResult<T>>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string | string[];
}

export interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface MongoIndexes {
  [key: string]: 1 | -1 | string;
}

export interface MongooseQueryOptions {
  lean?: boolean;
  populate?: string | string[];
  select?: string | string[];
  sort?: Record<string, 1 | -1>;
}

// Collection-specific types
export type JobDocument = MongoDocument<Job>;
export type UserDocument = MongoDocument<User>;
export type JobApplicationDocument = MongoDocument<JobApplication>;
export type ResumeDocument = MongoDocument<Resume>;

export interface JobModel extends MongoModel<Job> {
  searchByKeywords(keywords: string[]): Promise<Job[]>;
  findByLocation(location: string, radius: number): Promise<Job[]>;
}

export interface UserModel extends MongoModel<User> {
  findByEmail(email: string): Promise<UserDocument | null>;
  updateProfile(id: string, data: Partial<User>): Promise<UserDocument>;
}

export interface JobApplicationModel extends MongoModel<JobApplication> {
  findByJobAndUser(jobId: string, userId: string): Promise<JobApplicationDocument | null>;
  updateStatus(id: string, status: string): Promise<JobApplicationDocument>;
}

export interface ResumeModel extends MongoModel<Resume> {
  findByUser(userId: string): Promise<ResumeDocument[]>;
  setDefault(id: string): Promise<ResumeDocument>;
}
