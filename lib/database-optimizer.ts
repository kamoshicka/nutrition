/**
 * Database query optimization and performance monitoring
 * Provides query optimization, connection pooling, and performance tracking
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

export interface QueryMetrics {
  query: string;
  duration: number;
  rowsAffected?: number;
  timestamp: string;
}

export interface ConnectionPoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
}

class DatabaseOptimizer {
  private queryCache: Map<string, any> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private cacheEnabled: boolean = false;
  private cacheTTL: number = 300000; // 5 minutes

  constructor() {
    this.cacheEnabled = process.env.ENABLE_QUERY_CACHE === 'true';
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10);
    this.cacheTTL = parseInt(process.env.QUERY_CACHE_TTL || '300000', 10);
  }

  /**
   * Wrap database queries with performance monitoring and caching
   */
  async executeQuery<T>(
    db: any,
    query: string,
    params: any[] = [],
    options: {
      cache?: boolean;
      cacheKey?: string;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = options.cacheKey || this.generateCacheKey(query, params);
    
    // Check cache first
    if (this.cacheEnabled && options.cache !== false) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug('Query served from cache', { 
          query: this.sanitizeQuery(query),
          cacheKey 
        });
        return cached;
      }
    }

    try {
      // Execute query with timeout
      const timeout = options.timeout || 30000; // 30 seconds default
      const queryPromise = this.executeWithMethod(db, query, params);
      
      const result = await Promise.race([
        queryPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), timeout)
        )
      ]) as T;

      const duration = Date.now() - startTime;
      
      // Record metrics
      this.recordQueryMetrics({
        query: this.sanitizeQuery(query),
        duration,
        rowsAffected: Array.isArray(result) ? result.length : undefined,
        timestamp: new Date().toISOString()
      });

      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          query: this.sanitizeQuery(query),
          duration,
          params: this.sanitizeParams(params),
          type: 'slow_query'
        });
      }

      // Cache result if enabled
      if (this.cacheEnabled && options.cache !== false && this.isCacheable(query)) {
        this.setCache(cacheKey, result);
      }

      // Record performance metric
      monitoring.recordDatabaseQuery(this.getQueryType(query), duration);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Database query failed', {
        query: this.sanitizeQuery(query),
        duration,
        error: error.message,
        type: 'query_error'
      });

      throw error;
    }
  }

  private async executeWithMethod(db: any, query: string, params: any[]): Promise<any> {
    const queryType = this.getQueryType(query);
    
    switch (queryType) {
      case 'SELECT':
        return params.length > 0 ? db.all(query, params) : db.all(query);
      case 'INSERT':
      case 'UPDATE':
      case 'DELETE':
        return params.length > 0 ? db.run(query, params) : db.run(query);
      default:
        return params.length > 0 ? db.run(query, params) : db.run(query);
    }
  }

  private getQueryType(query: string): string {
    const trimmed = query.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('CREATE')) return 'CREATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    return 'OTHER';
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from query for logging
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret='***'");
  }

  private sanitizeParams(params: any[]): any[] {
    // Remove sensitive data from parameters
    return params.map(param => {
      if (typeof param === 'string' && param.length > 50) {
        return param.substring(0, 50) + '...';
      }
      return param;
    });
  }

  private generateCacheKey(query: string, params: any[]): string {
    const crypto = require('crypto');
    const key = query + JSON.stringify(params);
    return crypto.createHash('md5').update(key).digest('hex');
  }

  private getFromCache(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    // Limit cache size to prevent memory leaks
    if (this.queryCache.size > 1000) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private isCacheable(query: string): boolean {
    const queryType = this.getQueryType(query);
    // Only cache SELECT queries
    return queryType === 'SELECT';
  }

  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics.shift();
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number;
    averageResponseTime: number;
    slowQueries: number;
    queryTypeBreakdown: Record<string, number>;
    recentSlowQueries: QueryMetrics[];
  } {
    const totalQueries = this.queryMetrics.length;
    const averageResponseTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    
    const queryTypeBreakdown: Record<string, number> = {};
    this.queryMetrics.forEach(m => {
      const type = this.getQueryType(m.query);
      queryTypeBreakdown[type] = (queryTypeBreakdown[type] || 0) + 1;
    });

    const recentSlowQueries = this.queryMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .slice(-10); // Last 10 slow queries

    return {
      totalQueries,
      averageResponseTime,
      slowQueries,
      queryTypeBreakdown,
      recentSlowQueries
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    logger.info('Query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    // This is a simplified implementation
    // In a real application, you'd track hit/miss rates
    return {
      size: this.queryCache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: JSON.stringify([...this.queryCache.entries()]).length
    };
  }

  /**
   * Optimize database indexes based on query patterns
   */
  async analyzeAndOptimize(db: any): Promise<void> {
    logger.info('Starting database optimization analysis');

    try {
      // Analyze query patterns
      const stats = this.getQueryStats();
      
      // Check for missing indexes on frequently queried columns
      const frequentQueries = this.queryMetrics
        .filter(m => this.getQueryType(m.query) === 'SELECT')
        .slice(-100); // Last 100 SELECT queries

      // Suggest indexes based on WHERE clauses (simplified)
      const suggestions = this.generateIndexSuggestions(frequentQueries);
      
      if (suggestions.length > 0) {
        logger.info('Database optimization suggestions', {
          suggestions,
          type: 'optimization_suggestions'
        });
      }

      // Run ANALYZE to update SQLite statistics
      await db.exec('ANALYZE');
      
      logger.info('Database optimization analysis completed', {
        totalQueries: stats.totalQueries,
        averageResponseTime: stats.averageResponseTime,
        slowQueries: stats.slowQueries
      });

    } catch (error) {
      logger.error('Database optimization analysis failed', {
        error: error.message,
        type: 'optimization_error'
      });
    }
  }

  private generateIndexSuggestions(queries: QueryMetrics[]): string[] {
    const suggestions: string[] = [];
    
    // This is a simplified implementation
    // In a real application, you'd parse SQL queries to identify
    // frequently used WHERE clauses and suggest appropriate indexes
    
    const commonPatterns = [
      { pattern: /WHERE\s+user_id\s*=/, suggestion: 'CREATE INDEX IF NOT EXISTS idx_user_id ON table_name(user_id)' },
      { pattern: /WHERE\s+email\s*=/, suggestion: 'CREATE INDEX IF NOT EXISTS idx_email ON users(email)' },
      { pattern: /WHERE\s+created_at\s*>/, suggestion: 'CREATE INDEX IF NOT EXISTS idx_created_at ON table_name(created_at)' },
    ];

    queries.forEach(query => {
      commonPatterns.forEach(({ pattern, suggestion }) => {
        if (pattern.test(query.query) && !suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      });
    });

    return suggestions;
  }
}

// Create singleton instance
export const dbOptimizer = new DatabaseOptimizer();

// Helper function to wrap database operations
export async function withOptimizedQuery<T>(
  db: any,
  query: string,
  params: any[] = [],
  options?: {
    cache?: boolean;
    cacheKey?: string;
    timeout?: number;
  }
): Promise<T> {
  return dbOptimizer.executeQuery<T>(db, query, params, options);
}