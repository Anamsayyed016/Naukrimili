export interface User {
  id: string;
  email: string;
  name: string;
  role: 'jobseeker' | 'employer' | 'admin';
  profile: {
    avatar?: string;
    phone?: string;
    location?: {
      city: string;
      state?: string;
      country: string;
    };
    title?: string;
    bio?: string;
    company?: {
      id: string;
      name: string;
      role: string;
    };
    website?: string;
    social?: {
      linkedin?: string;
      twitter?: string;
      github?: string;
    };
  };
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'connections';
      resumeVisibility: 'public' | 'private' | 'recruiters';
      contactPermissions: string[];
    };
    jobPreferences?: {
      roles: string[];
      locations: string[];
      salary?: {
        minimum: number;
        currency: string;
      };
      remoteOnly: boolean;
      employmentTypes: string[];
    };
  };
  account: {
    status: 'active' | 'inactive' | 'suspended' | 'deleted';
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    completionStatus: {
      profile: number;
      resume?: number;
      verification: number;
    };
  };
  security?: {
    mfaEnabled: boolean;
    passwordLastChanged?: string;
    loginAttempts: number;
    lastPasswordReset?: string;
  };
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    status: 'active' | 'canceled' | 'expired';
    startDate: string;
    endDate?: string;
    features: string[];
  };
}
