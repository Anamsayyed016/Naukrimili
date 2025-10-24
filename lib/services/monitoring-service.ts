/**
 * Advanced Monitoring and Logging Service
 * 
 * Senior-level implementation with:
 * - Performance monitoring
 * - Error tracking and alerting
 * - API usage analytics
 * - Database query monitoring
 * - Health checks and metrics
 */

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  userAgent?: string;
  ip?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: number;
}

interface ErrorLog {
  error: Error;
  context: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
    timestamp: Date;
    stack?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface APIMetrics {
  endpoint: string;
  method: string;
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  lastRequest: Date;
  successCount: number;
  errorCount: number;
}

interface DatabaseMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  rowsAffected?: number;
  error?: string;
}

export class MonitoringService {
  private static performanceMetrics: PerformanceMetrics[] = [];
  private static errorLogs: ErrorLog[] = [];
  private static apiMetrics: Map<string, APIMetrics> = new Map();
  private static databaseMetrics: DatabaseMetrics[] = [];
  private static healthChecks: Map<string, { status: 'healthy' | 'unhealthy'; lastCheck: Date; error?: string }> = new Map();

  /**
   * Log performance metrics
   */
  static logPerformance(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date()
    };

    this.performanceMetrics.push(fullMetrics);

    // Keep only last 1000 entries to prevent memory leaks
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    // Update API metrics
    this.updateAPIMetrics(fullMetrics);

    // Log slow requests
    if (fullMetrics.duration > 5000) { // 5 seconds
      console.warn(`🐌 Slow request detected: ${fullMetrics.method} ${fullMetrics.endpoint} took ${fullMetrics.duration}ms`);
    }

    // Log high memory usage
    if (fullMetrics.memoryUsage && fullMetrics.memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      console.warn(`🧠 High memory usage detected: ${Math.round(fullMetrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }

  /**
   * Log errors with context
   */
  static logError(error: Error, context: Partial<ErrorLog['context']> = {}, severity: ErrorLog['severity'] = 'medium'): void {
    const errorLog: ErrorLog = {
      error,
      context: {
        timestamp: new Date(),
        ...context
      },
      severity
    };

    this.errorLogs.push(errorLog);

    // Keep only last 500 entries
    if (this.errorLogs.length > 500) {
      this.errorLogs = this.errorLogs.slice(-500);
    }

    // Log critical errors immediately
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL ERROR:`, {
        message: error.message,
        stack: error.stack,
        context: errorLog.context
      });
    } else if (severity === 'high') {
      console.error(`❌ HIGH SEVERITY ERROR:`, {
        message: error.message,
        context: errorLog.context
      });
    } else {
      console.warn(`⚠️ Error logged:`, {
        message: error.message,
        context: errorLog.context
      });
    }
  }

  /**
   * Log database query performance
   */
  static logDatabaseQuery(query: string, duration: number, success: boolean, rowsAffected?: number, error?: string): void {
    const dbMetrics: DatabaseMetrics = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      success,
      rowsAffected,
      error
    };

    this.databaseMetrics.push(dbMetrics);

    // Keep only last 1000 entries
    if (this.databaseMetrics.length > 1000) {
      this.databaseMetrics = this.databaseMetrics.slice(-1000);
    }

    // Log slow queries
    if (duration > 2000) { // 2 seconds
      console.warn(`🐌 Slow database query detected: ${duration}ms`, {
        query: this.sanitizeQuery(query),
        rowsAffected
      });
    }
  }

  /**
   * Update API metrics
   */
  private static updateAPIMetrics(metrics: PerformanceMetrics): void {
    const key = `${metrics.method}:${metrics.endpoint}`;
    const existing = this.apiMetrics.get(key);

    if (existing) {
      existing.requestCount++;
      existing.averageResponseTime = (existing.averageResponseTime + metrics.duration) / 2;
      existing.lastRequest = metrics.timestamp;
      
      if (metrics.statusCode >= 400) {
        existing.errorCount++;
      } else {
        existing.successCount++;
      }
      
      existing.errorRate = existing.errorCount / existing.requestCount;
    } else {
      this.apiMetrics.set(key, {
        endpoint: metrics.endpoint,
        method: metrics.method,
        requestCount: 1,
        averageResponseTime: metrics.duration,
        errorRate: metrics.statusCode >= 400 ? 1 : 0,
        lastRequest: metrics.timestamp,
        successCount: metrics.statusCode < 400 ? 1 : 0,
        errorCount: metrics.statusCode >= 400 ? 1 : 0
      });
    }
  }

  /**
   * Perform health check
   */
  static async performHealthCheck(service: string, checkFn: () => Promise<boolean>): Promise<void> {
    try {
      const isHealthy = await checkFn();
      this.healthChecks.set(service, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date()
      });
    } catch (error) {
      this.healthChecks.set(service, {
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; method: string; averageTime: number }>;
    errorRate: number;
    memoryUsage: NodeJS.MemoryUsage | null;
  } {
    const totalRequests = this.performanceMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
      : 0;

    // Get slowest endpoints
    const endpointTimes = new Map<string, { total: number; count: number }>();
    this.performanceMetrics.forEach(metric => {
      const key = `${metric.method}:${metric.endpoint}`;
      const existing = endpointTimes.get(key);
      if (existing) {
        existing.total += metric.duration;
        existing.count++;
      } else {
        endpointTimes.set(key, { total: metric.duration, count: 1 });
      }
    });

    const slowestEndpoints = Array.from(endpointTimes.entries())
      .map(([key, data]) => {
        const [method, endpoint] = key.split(':');
        return {
          endpoint,
          method,
          averageTime: data.total / data.count
        };
      })
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 5);

    const errorCount = this.performanceMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

    const latestMetric = this.performanceMetrics[this.performanceMetrics.length - 1];
    const memoryUsage = latestMetric?.memoryUsage || null;

    return {
      totalRequests,
      averageResponseTime,
      slowestEndpoints,
      errorRate,
      memoryUsage
    };
  }

  /**
   * Get error summary
   */
  static getErrorSummary(): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    recentErrors: Array<{ message: string; severity: string; timestamp: Date }>;
  } {
    const totalErrors = this.errorLogs.length;
    const errorsBySeverity = this.errorLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errorLogs
      .slice(-10)
      .map(log => ({
        message: log.error.message,
        severity: log.severity,
        timestamp: log.context.timestamp
      }));

    return {
      totalErrors,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * Get API metrics
   */
  static getAPIMetrics(): APIMetrics[] {
    return Array.from(this.apiMetrics.values());
  }

  /**
   * Get database metrics
   */
  static getDatabaseMetrics(): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: Array<{ query: string; duration: number; timestamp: Date }>;
    errorRate: number;
  } {
    const totalQueries = this.databaseMetrics.length;
    const averageQueryTime = totalQueries > 0 
      ? this.databaseMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;

    const slowQueries = this.databaseMetrics
      .filter(m => m.duration > 1000) // 1 second
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({
        query: m.query,
        duration: m.duration,
        timestamp: m.timestamp
      }));

    const errorCount = this.databaseMetrics.filter(m => !m.success).length;
    const errorRate = totalQueries > 0 ? errorCount / totalQueries : 0;

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      errorRate
    };
  }

  /**
   * Get health status
   */
  static getHealthStatus(): {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    services: Array<{ name: string; status: string; lastCheck: Date; error?: string }>;
  } {
    const services = Array.from(this.healthChecks.entries()).map(([name, status]) => ({
      name,
      status: status.status,
      lastCheck: status.lastCheck,
      error: status.error
    }));

    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    const totalServices = services.length;

    let overall: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyServices === 0) {
      overall = 'healthy';
    } else if (unhealthyServices === totalServices) {
      overall = 'unhealthy';
    } else {
      overall = 'degraded';
    }

    return {
      overall,
      services
    };
  }

  /**
   * Sanitize SQL query for logging
   */
  private static sanitizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/'.*?'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .substring(0, 200); // Limit length
  }

  /**
   * Clear old metrics
   */
  static clearOldMetrics(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > oneHourAgo);
    this.errorLogs = this.errorLogs.filter(e => e.context.timestamp > oneHourAgo);
    this.databaseMetrics = this.databaseMetrics.filter(m => m.timestamp > oneHourAgo);
  }

  /**
   * Get comprehensive metrics
   */
  static getComprehensiveMetrics(): {
    performance: ReturnType<typeof this.getPerformanceSummary>;
    errors: ReturnType<typeof this.getErrorSummary>;
    api: APIMetrics[];
    database: ReturnType<typeof this.getDatabaseMetrics>;
    health: ReturnType<typeof this.getHealthStatus>;
    timestamp: Date;
  } {
    return {
      performance: this.getPerformanceSummary(),
      errors: this.getErrorSummary(),
      api: this.getAPIMetrics(),
      database: this.getDatabaseMetrics(),
      health: this.getHealthStatus(),
      timestamp: new Date()
    };
  }
}
