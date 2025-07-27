/**
 * Error monitoring and alerting system
 * Handles error tracking, alerting, and integration with external services
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'critical';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    environment: string;
    version: string;
  };
  tags?: Record<string, string>;
  fingerprint?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: {
    type: 'error_rate' | 'error_count' | 'specific_error' | 'performance';
    threshold: number;
    timeWindow: number; // minutes
    pattern?: string;
  };
  actions: {
    type: 'email' | 'webhook' | 'log';
    config: Record<string, any>;
  }[];
  enabled: boolean;
}

class ErrorMonitoringService {
  private errors: ErrorReport[] = [];
  private alertRules: AlertRule[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private maxErrors = 1000; // Keep last 1000 errors in memory

  constructor() {
    this.setupDefaultAlertRules();
    
    // Start periodic error analysis
    if (process.env.NODE_ENV === 'production') {
      this.startPeriodicAnalysis();
    }
  }

  private setupDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: {
          type: 'error_rate',
          threshold: 5, // 5% error rate
          timeWindow: 15 // 15 minutes
        },
        actions: [
          {
            type: 'email',
            config: {
              to: process.env.ALERT_EMAIL || 'admin@example.com',
              subject: 'High Error Rate Alert'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'critical_errors',
        name: 'Critical Errors',
        condition: {
          type: 'error_count',
          threshold: 1, // Any critical error
          timeWindow: 5,
          pattern: 'critical'
        },
        actions: [
          {
            type: 'webhook',
            config: {
              url: process.env.ALERT_WEBHOOK_URL,
              method: 'POST'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'payment_errors',
        name: 'Payment Processing Errors',
        condition: {
          type: 'specific_error',
          threshold: 1,
          timeWindow: 10,
          pattern: 'stripe|payment|subscription'
        },
        actions: [
          {
            type: 'email',
            config: {
              to: process.env.ALERT_EMAIL || 'admin@example.com',
              subject: 'Payment Error Alert - Immediate Attention Required'
            }
          }
        ],
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        condition: {
          type: 'performance',
          threshold: 5000, // 5 seconds
          timeWindow: 10
        },
        actions: [
          {
            type: 'log',
            config: {
              level: 'warn'
            }
          }
        ],
        enabled: true
      }
    ];
  }

  /**
   * Report an error to the monitoring system
   */
  reportError(
    error: Error | string,
    context: Partial<ErrorReport['context']> = {},
    level: ErrorReport['level'] = 'error',
    tags?: Record<string, string>
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'object' && error.stack ? error.stack : undefined;
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp,
      level,
      message: errorMessage,
      stack,
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        ...context
      },
      tags,
      fingerprint: this.generateFingerprint(errorMessage, stack)
    };

    // Store error
    this.errors.push(errorReport);
    
    // Maintain error limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log error
    logger.error('Error reported to monitoring', {
      errorId,
      message: errorMessage,
      level,
      context,
      tags,
      type: 'error_monitoring'
    });

    // Send to external services
    this.sendToExternalServices(errorReport);

    // Check alert rules
    this.checkAlertRules(errorReport);

    // Record metric
    monitoring.recordMetric('error_reported', 1, 'count', {
      level,
      fingerprint: errorReport.fingerprint
    });

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateFingerprint(message: string, stack?: string): string {
    const crypto = require('crypto');
    const content = stack || message;
    
    // Create a fingerprint based on the error message and first few lines of stack
    const lines = content.split('\n').slice(0, 3).join('\n');
    return crypto.createHash('md5').update(lines).digest('hex');
  }

  private async sendToExternalServices(errorReport: ErrorReport): Promise<void> {
    try {
      // Send to Sentry if configured
      if (process.env.SENTRY_DSN) {
        await this.sendToSentry(errorReport);
      }

      // Send to custom error tracking service
      if (process.env.CUSTOM_ERROR_ENDPOINT) {
        await this.sendToCustomService(errorReport);
      }
    } catch (error) {
      logger.error('Failed to send error to external services', {
        error: error.message,
        originalErrorId: errorReport.id,
        type: 'external_service_error'
      });
    }
  }

  private async sendToSentry(errorReport: ErrorReport): Promise<void> {
    // This would integrate with Sentry SDK
    // For now, just log that we would send to Sentry
    logger.debug('Would send error to Sentry', {
      errorId: errorReport.id,
      fingerprint: errorReport.fingerprint
    });
  }

  private async sendToCustomService(errorReport: ErrorReport): Promise<void> {
    const endpoint = process.env.CUSTOM_ERROR_ENDPOINT;
    if (!endpoint) return;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ERROR_SERVICE_API_KEY}`
        },
        body: JSON.stringify(errorReport)
      });

      if (!response.ok) {
        throw new Error(`Error service responded with ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send to custom error service', {
        error: error.message,
        endpoint
      });
    }
  }

  private checkAlertRules(errorReport: ErrorReport): void {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const cooldownKey = `${rule.id}_${errorReport.fingerprint}`;
      const lastAlert = this.alertCooldowns.get(cooldownKey);
      const cooldownPeriod = 300000; // 5 minutes
      
      if (lastAlert && Date.now() - lastAlert < cooldownPeriod) {
        continue;
      }

      if (this.shouldTriggerAlert(rule, errorReport)) {
        this.triggerAlert(rule, errorReport);
        this.alertCooldowns.set(cooldownKey, Date.now());
      }
    }
  }

  private shouldTriggerAlert(rule: AlertRule, errorReport: ErrorReport): boolean {
    const timeWindow = rule.condition.timeWindow * 60 * 1000; // Convert to milliseconds
    const cutoffTime = Date.now() - timeWindow;
    
    const recentErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > cutoffTime
    );

    switch (rule.condition.type) {
      case 'error_rate':
        // Calculate error rate (simplified - would need total requests)
        const totalRequests = 100; // This would come from monitoring
        const errorRate = (recentErrors.length / totalRequests) * 100;
        return errorRate > rule.condition.threshold;

      case 'error_count':
        const matchingErrors = rule.condition.pattern
          ? recentErrors.filter(e => 
              e.level === rule.condition.pattern || 
              e.message.toLowerCase().includes(rule.condition.pattern.toLowerCase())
            )
          : recentErrors;
        return matchingErrors.length >= rule.condition.threshold;

      case 'specific_error':
        if (!rule.condition.pattern) return false;
        const pattern = rule.condition.pattern.toLowerCase();
        return errorReport.message.toLowerCase().includes(pattern) ||
               errorReport.stack?.toLowerCase().includes(pattern) ||
               Object.values(errorReport.tags || {}).some(tag => 
                 tag.toLowerCase().includes(pattern)
               );

      case 'performance':
        // This would check response time metrics
        const slowRequests = monitoring.getMetrics('http_response_time')
          .filter(m => 
            new Date(m.timestamp).getTime() > cutoffTime &&
            m.value > rule.condition.threshold
          );
        return slowRequests.length > 0;

      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, errorReport: ErrorReport): Promise<void> {
    logger.warn('Alert triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      errorId: errorReport.id,
      type: 'alert_triggered'
    });

    for (const action of rule.actions) {
      try {
        await this.executeAlertAction(action, rule, errorReport);
      } catch (error) {
        logger.error('Failed to execute alert action', {
          actionType: action.type,
          ruleId: rule.id,
          error: error.message,
          type: 'alert_action_error'
        });
      }
    }
  }

  private async executeAlertAction(
    action: AlertRule['actions'][0],
    rule: AlertRule,
    errorReport: ErrorReport
  ): Promise<void> {
    switch (action.type) {
      case 'email':
        await this.sendAlertEmail(action.config, rule, errorReport);
        break;

      case 'webhook':
        await this.sendAlertWebhook(action.config, rule, errorReport);
        break;

      case 'log':
        logger[action.config.level || 'warn']('Alert triggered', {
          rule: rule.name,
          error: errorReport.message,
          type: 'alert_log'
        });
        break;
    }
  }

  private async sendAlertEmail(
    config: any,
    rule: AlertRule,
    errorReport: ErrorReport
  ): Promise<void> {
    // This would integrate with your email service
    logger.info('Would send alert email', {
      to: config.to,
      subject: config.subject,
      rule: rule.name,
      errorId: errorReport.id
    });
  }

  private async sendAlertWebhook(
    config: any,
    rule: AlertRule,
    errorReport: ErrorReport
  ): Promise<void> {
    if (!config.url) return;

    const payload = {
      alert: {
        rule: rule.name,
        ruleId: rule.id,
        triggeredAt: new Date().toISOString()
      },
      error: {
        id: errorReport.id,
        message: errorReport.message,
        level: errorReport.level,
        timestamp: errorReport.timestamp,
        context: errorReport.context
      }
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with ${response.status}`);
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 3600000): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    errorsByFingerprint: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ message: string; count: number; fingerprint: string }>;
  } {
    const cutoffTime = Date.now() - timeWindow;
    const recentErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > cutoffTime
    );

    const errorsByLevel: Record<string, number> = {};
    const errorsByFingerprint: Record<string, number> = {};

    recentErrors.forEach(error => {
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + 1;
      errorsByFingerprint[error.fingerprint] = (errorsByFingerprint[error.fingerprint] || 0) + 1;
    });

    const topErrors = Object.entries(errorsByFingerprint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([fingerprint, count]) => {
        const error = recentErrors.find(e => e.fingerprint === fingerprint);
        return {
          message: error?.message || 'Unknown error',
          count,
          fingerprint
        };
      });

    // Simplified error rate calculation
    const totalRequests = 1000; // This would come from actual request metrics
    const errorRate = (recentErrors.length / totalRequests) * 100;

    return {
      totalErrors: recentErrors.length,
      errorsByLevel,
      errorsByFingerprint,
      errorRate: Math.round(errorRate * 100) / 100,
      topErrors
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errors.slice(-limit).reverse();
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
    logger.info('Error history cleared');
  }

  private startPeriodicAnalysis(): void {
    // Run error analysis every 5 minutes
    setInterval(() => {
      const stats = this.getErrorStats();
      
      if (stats.totalErrors > 0) {
        logger.info('Periodic error analysis', {
          ...stats,
          type: 'error_analysis'
        });
      }
    }, 300000); // 5 minutes
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Convenience functions
export const reportError = (
  error: Error | string,
  context?: Partial<ErrorReport['context']>,
  level?: ErrorReport['level'],
  tags?: Record<string, string>
): string => {
  return errorMonitoring.reportError(error, context, level, tags);
};

export const reportCriticalError = (
  error: Error | string,
  context?: Partial<ErrorReport['context']>,
  tags?: Record<string, string>
): string => {
  return errorMonitoring.reportError(error, context, 'critical', tags);
};

export const reportWarning = (
  message: string,
  context?: Partial<ErrorReport['context']>,
  tags?: Record<string, string>
): string => {
  return errorMonitoring.reportError(message, context, 'warning', tags);
};