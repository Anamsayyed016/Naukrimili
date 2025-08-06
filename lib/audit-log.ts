import { env } from './env';

interface AuditEvent {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class AuditLogger {
  private logs: AuditEvent[] = [];
  private maxLogs = 10000;

  log(event: Omit<AuditEvent, 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.logs.push(auditEvent);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log to console in development
    if (env.NODE_ENV === 'development') {}

    // Alert on critical events
    if (event.severity === 'critical') {
      this.alertCriticalEvent(auditEvent);
    }
  }

  private alertCriticalEvent(event: AuditEvent): void {
    console.error('CRITICAL SECURITY EVENT:', event);
    // In production: send to monitoring service
  }

  getRecentLogs(limit: number = 100): AuditEvent[] {
    return this.logs.slice(-limit);
  }

  getLogsByUser(userId: string, limit: number = 100): AuditEvent[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  getFailedAttempts(action: string, timeWindow: number = 3600000): AuditEvent[] {
    const cutoff = Date.now() - timeWindow;
    return this.logs.filter(log => 
      log.action === action && 
      !log.success && 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}

export const auditLogger = new AuditLogger();

// Security event types
export const SecurityEvents = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  ACCOUNT_LOCKED: 'account_locked',
  FILE_UPLOAD: 'file_upload',
  FILE_UPLOAD_REJECTED: 'file_upload_rejected',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  CSRF_VIOLATION: 'csrf_violation',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  DATA_EXPORT: 'data_export',
  ADMIN_ACTION: 'admin_action',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  TWO_FACTOR_DISABLED: 'two_factor_disabled',
} as const;

// Helper functions
export function logSecurityEvent(
  action: string,
  resource: string,
  success: boolean,
  options: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: Record<string, any>;
    severity?: AuditEvent['severity'];
  } = {}
): void {
  auditLogger.log({
    action,
    resource,
    success,
    userId: options.userId,
    ip: options.ip || 'unknown',
    userAgent: options.userAgent || 'unknown',
    details: options.details,
    severity: options.severity || 'medium'
  });
}

export function logAuthEvent(
  action: string,
  success: boolean,
  userId?: string,
  ip?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent(action, 'authentication', success, {
    userId,
    ip,
    details,
    severity: success ? 'low' : 'high'
  });
}

export function logFileEvent(
  action: string,
  success: boolean,
  userId: string,
  filename: string,
  ip?: string
): void {
  logSecurityEvent(action, 'file', success, {
    userId,
    ip,
    details: { filename },
    severity: success ? 'low' : 'medium'
  });
}