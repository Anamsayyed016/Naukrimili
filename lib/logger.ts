import { env } from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: Record<string, unknown> | undefined;
  stack: string | undefined;
}

class Logger {
  private isDevelopment = env.NODE_ENV === 'development';
  
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      stack: error && this.isDevelopment ? error.stack : undefined
    };
    
    if (this.isDevelopment) {
      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m'  // red
      }[level];
      
      console.log(
        `${color}[${entry.timestamp}] ${level.toUpperCase()}\x1b[0m:`,
        entry.message,
        entry.context ? JSON.stringify(entry.context, null, 2) : '',
        error ? `\n${error.stack}` : ''
      );
    } else {
      // In production, only log errors and warnings
      if (level === 'error' || level === 'warn') {
        // Remove sensitive data from production logs
        const sanitizedEntry = {
          ...entry,
          context: this.sanitizeContext(entry.context)
        };
        console[level](JSON.stringify(sanitizedEntry));
      }
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