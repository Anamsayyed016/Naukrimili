import crypto from 'crypto';
import { auditLogger, SecurityEvents } from './audit-log';

interface ConsentRecord {
  userId: string;
  consentType: 'essential' | 'analytics' | 'marketing' | 'functional';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  autoDelete: boolean;
}

// Consent management
const consentStore = new Map<string, ConsentRecord[]>();

export function recordConsent(consent: ConsentRecord): void {
  const userConsents = consentStore.get(consent.userId) || [];
  userConsents.push(consent);
  consentStore.set(consent.userId, userConsents);
  
  auditLogger.log({
    action: 'consent_recorded',
    resource: 'gdpr',
    userId: consent.userId,
    ip: consent.ipAddress,
    userAgent: consent.userAgent,
    success: true,
    severity: 'low',
    details: { consentType: consent.consentType, granted: consent.granted }
  });
}

export function getConsent(userId: string, consentType: ConsentRecord['consentType']): boolean {
  const userConsents = consentStore.get(userId) || [];
  const latestConsent = userConsents
    .filter(c => c.consentType === consentType)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
  return latestConsent?.granted || false;
}

export function withdrawConsent(userId: string, consentType: ConsentRecord['consentType'], ip: string, userAgent: string): void {
  recordConsent({
    userId,
    consentType,
    granted: false,
    timestamp: new Date().toISOString(),
    ipAddress: ip,
    userAgent
  });
}

// Data retention policies
const retentionPolicies: DataRetentionPolicy[] = [
  { dataType: 'user_profile', retentionPeriod: 2555, autoDelete: false }, // 7 years
  { dataType: 'resume_data', retentionPeriod: 1095, autoDelete: true }, // 3 years
  { dataType: 'application_data', retentionPeriod: 730, autoDelete: true }, // 2 years
  { dataType: 'audit_logs', retentionPeriod: 2555, autoDelete: false }, // 7 years
  { dataType: 'session_data', retentionPeriod: 30, autoDelete: true }, // 30 days
];

export function getRetentionPolicy(dataType: string): DataRetentionPolicy | null {
  return retentionPolicies.find(policy => policy.dataType === dataType) || null;
}

export function isDataExpired(dataType: string, createdAt: Date): boolean {
  const policy = getRetentionPolicy(dataType);
  if (!policy) return false;
  
  const expiryDate = new Date(createdAt);
  expiryDate.setDate(expiryDate.getDate() + policy.retentionPeriod);
  
  return new Date() > expiryDate;
}

// Data export for GDPR requests
export interface UserDataExport {
  personalData: Record<string, any>;
  activityData: Record<string, any>;
  consentHistory: ConsentRecord[];
  exportedAt: string;
  exportId: string;
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const exportId = crypto.randomUUID();
  
  // In a real implementation, gather data from all relevant sources
  const exportData: UserDataExport = {
    personalData: {
      // Collect from user profile, resumes, etc.
    },
    activityData: {
      // Collect from audit logs, application history, etc.
    },
    consentHistory: consentStore.get(userId) || [],
    exportedAt: new Date().toISOString(),
    exportId
  };
  
  auditLogger.log({
    action: SecurityEvents.DATA_EXPORT,
    resource: 'gdpr',
    userId,
    ip: 'system',
    userAgent: 'system',
    success: true,
    severity: 'medium',
    details: { exportId }
  });
  
  return exportData;
}

// Data deletion for GDPR requests
export async function deleteUserData(userId: string, reason: string): Promise<void> {
  // In a real implementation, delete from all relevant sources
  // - User profile
  // - Resumes
  // - Applications
  // - Session data
  // - Cached data
  
  // Keep audit trail
  auditLogger.log({
    action: 'data_deletion',
    resource: 'gdpr',
    userId,
    ip: 'system',
    userAgent: 'system',
    success: true,
    severity: 'high',
    details: { reason, deletedAt: new Date().toISOString() }
  });
  
  // Remove consent records
  consentStore.delete(userId);
}

// Cookie consent banner data
export const cookieCategories = {
  essential: {
    name: 'Essential Cookies',
    description: 'Required for basic site functionality',
    required: true,
    cookies: ['session', 'csrf', 'auth']
  },
  functional: {
    name: 'Functional Cookies',
    description: 'Enhance your experience with personalized features',
    required: false,
    cookies: ['preferences', 'language', 'theme']
  },
  analytics: {
    name: 'Analytics Cookies',
    description: 'Help us understand how you use our site',
    required: false,
    cookies: ['google-analytics', 'performance-monitoring']
  },
  marketing: {
    name: 'Marketing Cookies',
    description: 'Used to show you relevant advertisements',
    required: false,
    cookies: ['advertising', 'social-media', 'tracking']
  }
};