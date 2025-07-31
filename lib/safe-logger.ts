interface LogContext {
  message?: string;
  code?: string;
  time?: string;
  [key: string]: any;
}

function truncateString(str: string, maxLength = 1000): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

function sanitizeValue(value: any, depth = 0): any {
  if (depth > 2) return '[Nested Object]';
  
  if (Array.isArray(value)) {
    return value.length > 10 ? 
      `[Array(${value.length})]` : 
      value.map(v => sanitizeValue(v, depth + 1));
  }
  
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: truncateString(value.stack || '')
    };
  }
  
  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, any> = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitizeValue(value[key], depth + 1);
      }
    }
    return sanitized;
  }
  
  if (typeof value === 'string') {
    return truncateString(value);
  }
  
  return value;
}

export const safeLogger = {
  warn(message: string, context?: LogContext) {
    try {
      const sanitizedContext = context ? sanitizeValue(context) : undefined;
      console.warn(message, sanitizedContext);
    } catch (error) {
      console.warn('Logging failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  },
  
  error(message: string, context?: LogContext) {
    try {
      const sanitizedContext = context ? sanitizeValue(context) : undefined;
      console.error(message, sanitizedContext);
    } catch (error) {
      console.error('Logging failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  },
  
  info(message: string, context?: LogContext) {
    try {
      const sanitizedContext = context ? sanitizeValue(context) : undefined;
      console.info(message, sanitizedContext);
    } catch (error) {
      console.info('Logging failed:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
};
