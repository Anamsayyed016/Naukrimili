export interface AdminDashboardStats {
  totalUsers: number;
  activeJobs: number;
  totalApplications: number;
  newUsersToday: number;
  revenueStats?: {
    daily: number;
    monthly: number;
    yearly: number;
  };
}

export interface AdminUserManagement {
  users: {
    total: number;
    jobseekers: number;
    employers: number;
    admins: number;
    blocked: number;
  };
  verificationPending: number;
  reportedUsers: number;
}

export interface AdminJobStats {
  total: number;
  active: number;
  expired: number;
  featured: number;
  reported: number;
  byCategory: {
    [key: string]: number;
  };
  byLocation: {
    [key: string]: number;
  };
}

export interface AdminApplicationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  conversion: {
    rate: number;
    byJobType: {
      [key: string]: number;
    };
  };
}

export interface AdminUserActivity {
  userId: string;
  name: string;
  email: string;
  action: string;
  timestamp: string;
  details?: any;
  ip?: string;
}

export interface AdminAuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  resource: string;
  details: any;
  timestamp: string;
  ip: string;
}

export interface AdminReportedContent {
  id: string;
  type: 'job' | 'user' | 'company' | 'review';
  reportedBy: string;
  reason: string;
  details: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  timestamp: string;
  resolution?: {
    action: string;
    note: string;
    by: string;
    date: string;
  };
}

export interface AdminSettings {
  general: {
    siteName: string;
    maintenance: boolean;
    registrationOpen: boolean;
  };
  email: {
    provider: string;
    fromEmail: string;
    templates: {
      [key: string]: {
        subject: string;
        body: string;
      };
    };
  };
  jobPostings: {
    requireApproval: boolean;
    maxDuration: number;
    featuredCost: number;
  };
  security: {
    maxLoginAttempts: number;
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
    };
    twoFactorEnabled: boolean;
  };
}
