type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isDebug = process.env.DEBUG === 'true';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (level === 'debug' && !this.isDebug) return false;
    return level === 'warn' || level === 'error';
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const entry = this.formatMessage('debug', message, context);
      console.debug('🐛', entry.message, context ? entry.context : '');
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      const entry = this.formatMessage('info', message, context);
      console.info('ℹ️', entry.message, context ? entry.context : '');
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      const entry = this.formatMessage('warn', message, context);
      console.warn('⚠️', entry.message, context ? entry.context : '');
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const entry = this.formatMessage('error', message, {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      console.error('❌', entry.message, entry.context);
    }
  }
}

export const logger = new Logger();
export default logger;