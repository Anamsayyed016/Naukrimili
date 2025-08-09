export interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

export class SafeLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, context?: LogContext): void {
    try {
      console.log(`[INFO] ${message}`, context || {});
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    try {
      console.error(`[ERROR] ${message}`, { error, ...(context || {}) });
    } catch (logError) {
      console.error('Logger error:', logError);
    }
  }

  warn(message: string, context?: LogContext): void {
    try {
      console.warn(`[WARN] ${message}`, context || {});
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  debug(message: string, context?: LogContext): void {
    try {
      if (this.isDevelopment) {
        console.debug(`[DEBUG] ${message}`, context || {});
      }
    } catch (error) {
      console.error('Logger error:', error);
    }
  }
}

export const safeLogger = new SafeLogger();