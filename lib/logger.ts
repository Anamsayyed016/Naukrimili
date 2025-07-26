import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

class Logger {
  private isDevelopment = env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      ...(error && { stack: error.stack })
    };
    
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](entry);
    } else {
      // In production, send to logging service
      this.sendToLoggingService(entry);
    }
  }
  
  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;
    
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  private sendToLoggingService(entry: LogEntry): void {
    // In production, integrate with logging service (e.g., Winston, Pino, etc.)
    if (entry.level === 'error') {
      console.error(JSON.stringify(entry));
    }
  }
  
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }
  
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }
  
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }
  
  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, context, error);
  }
}

export const logger = new Logger();

// Replace console methods in production
if (env.NODE_ENV === 'production') {
  console.log = () => {}; // Disable console.log in production
  console.debug = () => {};
  console.info = (message: string) => logger.info(message);
  console.warn = (message: string) => logger.warn(message);
  console.error = (message: string) => logger.error(message);
}