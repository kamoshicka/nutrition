/**
 * Production-ready logging system
 * Supports structured logging with different levels and formats
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;
  private logFormat: 'json' | 'pretty';

  constructor() {
    this.logLevel = this.getLogLevel();
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logFormat = (process.env.LOG_FORMAT as 'json' | 'pretty') || 
                     (this.isProduction ? 'json' : 'pretty');
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLog(entry: LogEntry): string {
    if (this.logFormat === 'json') {
      return JSON.stringify(entry);
    }

    // Pretty format for development
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    let output = `[${timestamp}] ${level} ${entry.message}`;

    if (entry.meta && Object.keys(entry.meta).length > 0) {
      output += ` ${JSON.stringify(entry.meta)}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack && !this.isProduction) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }

    return output;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message,
      meta,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formattedLog = this.formatLog(entry);

    // In production, use appropriate console methods
    // In development, always use console.log for consistent formatting
    if (this.isProduction) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        default:
          console.log(formattedLog);
      }
    } else {
      console.log(formattedLog);
    }

    // Send to external logging service in production
    if (this.isProduction && process.env.ENABLE_ERROR_REPORTING === 'true') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Integration with external logging services (Sentry, LogRocket, etc.)
    try {
      if (process.env.SENTRY_DSN && (entry.level === 'error' || entry.level === 'warn')) {
        // Sentry integration would go here
        // This is a placeholder for actual Sentry integration
      }
    } catch (error) {
      // Fail silently to avoid logging loops
      console.error('Failed to send log to external service:', error);
    }
  }

  error(message: string, meta?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, meta, error);
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, path: string, userId?: string, duration?: number): void {
    this.info('API Request', {
      method,
      path,
      userId,
      duration,
      type: 'api_request'
    });
  }

  apiError(method: string, path: string, error: Error, userId?: string): void {
    this.error('API Error', {
      method,
      path,
      userId,
      type: 'api_error'
    }, error);
  }

  userAction(action: string, userId: string, meta?: Record<string, any>): void {
    this.info('User Action', {
      action,
      userId,
      type: 'user_action',
      ...meta
    });
  }

  subscriptionEvent(event: string, userId: string, subscriptionId?: string, meta?: Record<string, any>): void {
    this.info('Subscription Event', {
      event,
      userId,
      subscriptionId,
      type: 'subscription_event',
      ...meta
    });
  }

  performanceMetric(metric: string, value: number, unit: string, meta?: Record<string, any>): void {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
      type: 'performance_metric',
      ...meta
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, meta?: Record<string, any>, error?: Error) => 
  logger.error(message, meta, error);

export const logWarn = (message: string, meta?: Record<string, any>) => 
  logger.warn(message, meta);

export const logInfo = (message: string, meta?: Record<string, any>) => 
  logger.info(message, meta);

export const logDebug = (message: string, meta?: Record<string, any>) => 
  logger.debug(message, meta);

// Request logging middleware helper
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const { method, url } = req;
    const userId = req.user?.id;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (statusCode >= 400) {
        logger.warn('HTTP Request Failed', {
          method,
          url,
          statusCode,
          duration,
          userId,
          type: 'http_request'
        });
      } else {
        logger.apiRequest(method, url, userId, duration);
      }
    });

    next();
  };
};