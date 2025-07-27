/**
 * Application monitoring and health check system
 * Provides health checks, metrics collection, and system monitoring
 */

import { logger } from './logger';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
      metadata?: Record<string, any>;
    };
  };
  uptime: number;
  version: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

class MonitoringService {
  private startTime: number;
  private metrics: Map<string, MetricData[]> = new Map();
  private healthChecks: Map<string, () => Promise<any>> = new Map();

  constructor() {
    this.startTime = Date.now();
    this.setupDefaultHealthChecks();
  }

  private setupDefaultHealthChecks(): void {
    // Database health check
    this.addHealthCheck('database', async () => {
      const { open } = require('sqlite');
      const sqlite3 = require('sqlite3');
      const path = require('path');

      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'app.db');
      
      try {
        const db = await open({
          filename: dbPath,
          driver: sqlite3.Database
        });
        
        // Simple query to test database connectivity
        await db.get('SELECT 1 as test');
        await db.close();
        
        return { status: 'pass', message: 'Database connection successful' };
      } catch (error) {
        return { 
          status: 'fail', 
          message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}` 
        };
      }
    });

    // Memory usage check
    this.addHealthCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const totalMB = Math.round(memUsage.rss / 1024 / 1024);
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      
      // Warn if memory usage is high (adjust thresholds as needed)
      const memoryThreshold = 512; // MB
      const status = totalMB > memoryThreshold ? 'warn' : 'pass';
      
      return {
        status,
        message: `Memory usage: ${totalMB}MB (heap: ${heapUsedMB}MB)`,
        metadata: {
          rss: totalMB,
          heapUsed: heapUsedMB,
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        }
      };
    });

    // Disk space check (for SQLite database)
    this.addHealthCheck('disk', async () => {
      const fs = require('fs').promises;
      const path = require('path');
      
      try {
        const dataDir = path.join(process.cwd(), 'data');
        const stats = await fs.stat(dataDir);
        
        return {
          status: 'pass',
          message: 'Disk access successful',
          metadata: {
            dataDirectory: dataDir,
            accessible: true
          }
        };
      } catch (error) {
        return {
          status: 'fail',
          message: `Disk access failed: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    });

    // External services check
    this.addHealthCheck('external_services', async () => {
      const checks = [];
      
      // Check Stripe connectivity (if configured)
      if (process.env.STRIPE_SECRET_KEY) {
        try {
          // This would be a simple Stripe API call to test connectivity
          // For now, just check if the key is configured
          checks.push({ service: 'stripe', status: 'configured' });
        } catch (error) {
          checks.push({ service: 'stripe', status: 'error', error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Check Rakuten API (if configured)
      if (process.env.RAKUTEN_APPLICATION_ID) {
        checks.push({ service: 'rakuten', status: 'configured' });
      }
      
      const hasErrors = checks.some(check => check.status === 'error');
      
      return {
        status: hasErrors ? 'warn' : 'pass',
        message: `External services: ${checks.length} configured`,
        metadata: { services: checks }
      };
    });
  }

  addHealthCheck(name: string, check: () => Promise<any>): void {
    this.healthChecks.set(name, check);
  }

  async runHealthChecks(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const checks: HealthCheckResult['checks'] = {};
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    for (const [name, check] of Array.from(this.healthChecks.entries())) {
      const start = Date.now();
      
      try {
        const result = await Promise.race([
          check(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        const duration = Date.now() - start;
        
        checks[name] = {
          ...result,
          duration
        };
        
        if (result.status === 'fail') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'warn' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
        
      } catch (error) {
        const duration = Date.now() - start;
        
        checks[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : String(error),
          duration
        };
        
        overallStatus = 'unhealthy';
        
        logger.error('Health check failed', { 
          check: name, 
          error: error instanceof Error ? error.message : String(error),
          duration 
        });
      }
    }
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      checks,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Log health check results
    if (overallStatus !== 'healthy') {
      logger.warn('Health check completed with issues', { 
        status: overallStatus,
        failedChecks: Object.entries(checks)
          .filter(([_, check]) => check.status === 'fail')
          .map(([name]) => name)
      });
    } else {
      logger.debug('Health check completed successfully', { status: overallStatus });
    }
    
    return result;
  }

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags
    };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(metric);
    
    // Keep only last 1000 metrics per name to prevent memory leaks
    if (metrics.length > 1000) {
      metrics.shift();
    }
    
    logger.performanceMetric(name, value, unit, tags);
  }

  getMetrics(name?: string): MetricData[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    // Return all metrics
    const allMetrics: MetricData[] = [];
    for (const metrics of Array.from(this.metrics.values())) {
      allMetrics.push(...metrics);
    }
    
    return allMetrics.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Convenience methods for common metrics
  recordResponseTime(endpoint: string, duration: number, statusCode: number): void {
    this.recordMetric('http_response_time', duration, 'ms', {
      endpoint,
      status_code: statusCode.toString()
    });
  }

  recordDatabaseQuery(query: string, duration: number): void {
    this.recordMetric('database_query_time', duration, 'ms', {
      query_type: query.split(' ')[0].toLowerCase()
    });
  }

  recordUserAction(action: string, userId: string): void {
    this.recordMetric('user_action', 1, 'count', {
      action,
      user_id: userId
    });
  }

  recordSubscriptionEvent(event: string): void {
    this.recordMetric('subscription_event', 1, 'count', {
      event
    });
  }

  // System resource monitoring
  recordSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.recordMetric('memory_rss', memUsage.rss, 'bytes');
    this.recordMetric('memory_heap_used', memUsage.heapUsed, 'bytes');
    this.recordMetric('memory_heap_total', memUsage.heapTotal, 'bytes');
    this.recordMetric('memory_external', memUsage.external, 'bytes');
    
    // CPU usage (if available)
    const cpuUsage = process.cpuUsage();
    this.recordMetric('cpu_user', cpuUsage.user, 'microseconds');
    this.recordMetric('cpu_system', cpuUsage.system, 'microseconds');
  }

  startPeriodicMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.recordSystemMetrics();
    }, intervalMs);
    
    logger.info('Started periodic system monitoring', { 
      interval: intervalMs,
      type: 'monitoring_start'
    });
  }
}

// Create singleton instance
export const monitoring = new MonitoringService();

// Start periodic monitoring in production
if (process.env.NODE_ENV === 'production' && 
    process.env.ENABLE_PERFORMANCE_MONITORING === 'true') {
  monitoring.startPeriodicMonitoring();
}