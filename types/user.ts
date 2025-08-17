export type UserRole = 'jobseeker' | 'employer' | 'admin'

export interface UserCompany {
  id: string
  name: string
  role: string
}

export interface UserSocial {
  linkedin?: string
  twitter?: string
  github?: string
}

export interface UserLocation {
  city: string
  state?: string
  country: string
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
    frequency: 'immediate' | 'daily' | 'weekly'
  }
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections'
    resumeVisibility: 'public' | 'private' | 'recruiters'
    contactPermissions: string[]
  }
  jobPreferences?: {
    roles: string[]
    locations: string[]
    salary?: {
      minimum: number
      currency: string
    }
    remoteOnly: boolean
    employmentTypes: string[]
  }
}

export interface UserAccount {
  status: 'active' | 'inactive' | 'suspended' | 'deleted'
  emailVerified: boolean
  phoneVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  completionStatus: {
    profile: number
    resume?: number
    verification: number
  }
}

export interface UserSecurity {
  mfaEnabled: boolean
  passwordLastChanged?: string
  loginAttempts: number
  lastPasswordReset?: string
}

export interface UserSubscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'canceled' | 'expired'
  startDate: string
  endDate?: string
  features: string[]
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  profile: {
    avatar?: string
    phone?: string
    location?: UserLocation
    title?: string
    bio?: string
    company?: UserCompany
    website?: string
    social?: UserSocial
  }
  preferences: UserPreferences
  account: UserAccount
  security?: UserSecurity
  subscription?: UserSubscription
}

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  profilePicture?: string;
  isVerified?: boolean;
  isActive?: boolean;
  resumes?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
}

export interface UserStats {
  totalApplications: number;
  applicationsThisMonth: number;
  interviewsScheduled: number;
  offersReceived: number;
  profileViews: number;
  resumeDownloads: number;
  responseRate: number;
  averageResponseTime: number;
  jobMatches: number;
  savedJobs: number;
  lastActivity: Date;
}