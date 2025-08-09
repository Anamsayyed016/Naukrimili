import * as Env from './env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

class Logger {
  private isDevelopment = (Env as any).env?.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      stack: error && this.isDevelopment ? error.stack : undefined,
    };

    if (this.isDevelopment) {
      // eslint-disable-next-line no-console
      console[level](`${level.toUpperCase()}: ${message}`, entry.context ?? {}, entry.stack ?? '');
    } else {
      if (level === 'error' || level === 'warn') {
        const sanitizedEntry = { ...entry, context: this.sanitizeContext(entry.context) };
        // eslint-disable-next-line no-console
        console[level](JSON.stringify(sanitizedEntry));
      }
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined;
    const sanitized: Record<string, unknown> = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
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
if ((Env as any).env?.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.debug = () => {};
  console.info = (message?: any, ...optionalParams: any[]) => logger.info(String(message), { optionalParams });
  console.warn = (message?: any, ...optionalParams: any[]) => logger.warn(String(message), { optionalParams });
  console.error = (message?: any, ...optionalParams: any[]) => logger.error(String(message), { optionalParams });
}