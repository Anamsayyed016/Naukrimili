export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator' | 'support';
  permissions: string[];
  created_at: string;
  last_login?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number; // seconds
  memory_usage: number; // bytes or MB depending on usage
  cpu_usage: number; // percentage
  active_users: number;
  pending_jobs: number;
}

export interface FraudAlert {
  id: string;
  type: 'fake_job' | 'suspicious_employer' | 'duplicate_profile' | 'payment_fraud';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityId: string;
  entityType: 'job' | 'employer' | 'candidate' | 'payment';
  reportedBy: string;
  reportedAt: string; // ISO datetime
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  metadata: Record<string, unknown>;
}