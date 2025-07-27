/**
 * KPI tracking and analytics system
 * Handles business metrics, user analytics, and conversion tracking
 */

import { logger } from './logger';
import { monitoring } from './monitoring';

export interface UserEvent {
  userId?: string;
  sessionId: string;
  event: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface ConversionFunnel {
  step: string;
  users: number;
  conversionRate?: number;
}

export interface KPIMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  
  // Subscription metrics
  totalSubscriptions: number;
  activeSubscriptions: number;
  conversionRate: number;
  churnRate: number;
  monthlyRecurringRevenue: number;
  
  // Feature usage
  searchesPerformed: number;
  favoritesAdded: number;
  pdfDownloads: number;
  shoppingListsCreated: number;
  
  // Performance metrics
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

class AnalyticsService {
  private events: UserEvent[] = [];
  private kpiCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 300000; // 5 minutes

  constructor() {
    // Start periodic KPI calculation in production
    if (process.env.NODE_ENV === 'production' && 
        process.env.ENABLE_ANALYTICS === 'true') {
      this.startPeriodicKPICalculation();
    }
  }

  /**
   * Track user event
   */
  trackEvent(event: Omit<UserEvent, 'timestamp'>): void {
    const userEvent: UserEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.push(userEvent);
    
    // Keep only last 10000 events to prevent memory leaks
    if (this.events.length > 10000) {
      this.events.shift();
    }

    // Log important events
    if (this.isImportantEvent(event.event)) {
      logger.info('Important user event tracked', {
        event: event.event,
        userId: event.userId,
        properties: event.properties,
        type: 'user_analytics'
      });
    }

    // Record metric for monitoring
    monitoring.recordUserAction(event.event, event.userId || 'anonymous');

    // Send to external analytics if configured
    this.sendToExternalAnalytics(userEvent);
  }

  private isImportantEvent(event: string): boolean {
    const importantEvents = [
      'user_signup',
      'subscription_created',
      'subscription_cancelled',
      'premium_feature_used',
      'payment_completed',
      'payment_failed'
    ];
    return importantEvents.includes(event);
  }

  private async sendToExternalAnalytics(event: UserEvent): Promise<void> {
    try {
      // Google Analytics 4 integration
      if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
        await this.sendToGA4(event);
      }

      // Custom analytics endpoint
      if (process.env.CUSTOM_ANALYTICS_ENDPOINT) {
        await this.sendToCustomEndpoint(event);
      }
    } catch (error) {
      logger.error('Failed to send event to external analytics', {
        event: event.event,
        error: error.message,
        type: 'analytics_error'
      });
    }
  }

  private async sendToGA4(event: UserEvent): Promise<void> {
    // This would integrate with Google Analytics 4 Measurement Protocol
    // Implementation depends on your specific GA4 setup
    logger.debug('Would send to GA4', { event: event.event });
  }

  private async sendToCustomEndpoint(event: UserEvent): Promise<void> {
    // Send to custom analytics endpoint
    const endpoint = process.env.CUSTOM_ANALYTICS_ENDPOINT;
    if (!endpoint) return;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Analytics API responded with ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send to custom analytics endpoint', {
        error: error.message,
        endpoint
      });
    }
  }

  /**
   * Calculate KPI metrics
   */
  async calculateKPIs(db: any, timeRange: '24h' | '7d' | '30d' = '30d'): Promise<KPIMetrics> {
    const cacheKey = `kpis_${timeRange}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
      }

      const kpis = await this.calculateKPIMetrics(db, startDate, endDate);
      
      // Cache the results
      this.setCache(cacheKey, kpis);
      
      logger.info('KPIs calculated', {
        timeRange,
        totalUsers: kpis.totalUsers,
        conversionRate: kpis.conversionRate,
        type: 'kpi_calculation'
      });

      return kpis;

    } catch (error) {
      logger.error('Failed to calculate KPIs', {
        error: error.message,
        timeRange,
        type: 'kpi_error'
      });
      throw error;
    }
  }

  private async calculateKPIMetrics(db: any, startDate: Date, endDate: Date): Promise<KPIMetrics> {
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // User metrics
    const totalUsers = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE created_at <= ?',
      [endDateStr]
    );

    const newUsers = await db.get(
      'SELECT COUNT(*) as count FROM users WHERE created_at BETWEEN ? AND ?',
      [startDateStr, endDateStr]
    );

    const activeUsers = await db.get(`
      SELECT COUNT(DISTINCT user_id) as count FROM (
        SELECT user_id FROM favorites WHERE created_at BETWEEN ? AND ?
        UNION
        SELECT user_id FROM shopping_list WHERE created_at BETWEEN ? AND ?
        UNION
        SELECT user_id FROM nutrition_calculations WHERE created_at BETWEEN ? AND ?
      )
    `, [startDateStr, endDateStr, startDateStr, endDateStr, startDateStr, endDateStr]);

    // Subscription metrics
    const totalSubscriptions = await db.get(
      'SELECT COUNT(*) as count FROM subscriptions WHERE created_at <= ?',
      [endDateStr]
    );

    const activeSubscriptions = await db.get(
      'SELECT COUNT(*) as count FROM subscriptions WHERE status = ? AND created_at <= ?',
      ['premium', endDateStr]
    );

    const newSubscriptions = await db.get(
      'SELECT COUNT(*) as count FROM subscriptions WHERE status = ? AND created_at BETWEEN ? AND ?',
      ['premium', startDateStr, endDateStr]
    );

    const cancelledSubscriptions = await db.get(
      'SELECT COUNT(*) as count FROM subscriptions WHERE status = ? AND updated_at BETWEEN ? AND ?',
      ['cancelled', startDateStr, endDateStr]
    );

    // Feature usage metrics
    const searchesPerformed = this.events.filter(e => 
      e.event === 'search_performed' && 
      new Date(e.timestamp) >= startDate && 
      new Date(e.timestamp) <= endDate
    ).length;

    const favoritesAdded = await db.get(
      'SELECT COUNT(*) as count FROM favorites WHERE created_at BETWEEN ? AND ?',
      [startDateStr, endDateStr]
    );

    const pdfDownloads = this.events.filter(e => 
      e.event === 'pdf_downloaded' && 
      new Date(e.timestamp) >= startDate && 
      new Date(e.timestamp) <= endDate
    ).length;

    const shoppingListsCreated = await db.get(
      'SELECT COUNT(DISTINCT user_id) as count FROM shopping_list WHERE created_at BETWEEN ? AND ?',
      [startDateStr, endDateStr]
    );

    // Calculate rates
    const conversionRate = totalUsers.count > 0 
      ? (activeSubscriptions.count / totalUsers.count) * 100 
      : 0;

    const churnRate = activeSubscriptions.count > 0 
      ? (cancelledSubscriptions.count / activeSubscriptions.count) * 100 
      : 0;

    // Estimate MRR (assuming $9.99/month premium plan)
    const monthlyRecurringRevenue = activeSubscriptions.count * 9.99;

    // Performance metrics from monitoring
    const performanceMetrics = this.getPerformanceMetrics();

    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      newUsers: newUsers.count,
      totalSubscriptions: totalSubscriptions.count,
      activeSubscriptions: activeSubscriptions.count,
      conversionRate: Math.round(conversionRate * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue * 100) / 100,
      searchesPerformed,
      favoritesAdded: favoritesAdded.count,
      pdfDownloads,
      shoppingListsCreated: shoppingListsCreated.count,
      averageResponseTime: performanceMetrics.averageResponseTime,
      errorRate: performanceMetrics.errorRate,
      uptime: performanceMetrics.uptime
    };
  }

  private getPerformanceMetrics(): {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  } {
    const metrics = monitoring.getMetrics();
    
    const responseTimeMetrics = metrics.filter(m => m.name === 'http_response_time');
    const averageResponseTime = responseTimeMetrics.length > 0
      ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
      : 0;

    // Calculate error rate from recent events
    const recentEvents = this.events.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 3600000) // Last hour
    );
    const errorEvents = recentEvents.filter(e => e.event.includes('error'));
    const errorRate = recentEvents.length > 0 
      ? (errorEvents.length / recentEvents.length) * 100 
      : 0;

    // Calculate uptime (simplified - in production, use proper uptime monitoring)
    const uptime = 99.9; // Placeholder

    return {
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      uptime
    };
  }

  /**
   * Get conversion funnel analysis
   */
  async getConversionFunnel(db: any): Promise<ConversionFunnel[]> {
    try {
      const steps = [
        { step: 'Visited Site', query: 'SELECT COUNT(DISTINCT user_id) as count FROM users' },
        { step: 'Signed Up', query: 'SELECT COUNT(*) as count FROM users' },
        { step: 'Used Premium Feature', query: `
          SELECT COUNT(DISTINCT user_id) as count FROM (
            SELECT user_id FROM favorites
            UNION
            SELECT user_id FROM nutrition_calculations
            UNION
            SELECT user_id FROM shopping_list
          )
        ` },
        { step: 'Started Subscription', query: 'SELECT COUNT(*) as count FROM subscriptions WHERE status = "premium"' }
      ];

      const funnel: ConversionFunnel[] = [];
      let previousCount = 0;

      for (const [index, step] of steps.entries()) {
        const result = await db.get(step.query);
        const count = result.count;
        
        const conversionRate = index > 0 && previousCount > 0 
          ? (count / previousCount) * 100 
          : 100;

        funnel.push({
          step: step.step,
          users: count,
          conversionRate: Math.round(conversionRate * 100) / 100
        });

        previousCount = count;
      }

      return funnel;

    } catch (error) {
      logger.error('Failed to calculate conversion funnel', {
        error: error.message,
        type: 'funnel_error'
      });
      return [];
    }
  }

  /**
   * Get user cohort analysis
   */
  async getCohortAnalysis(db: any): Promise<any[]> {
    try {
      // Simplified cohort analysis - group users by signup month
      const cohorts = await db.all(`
        SELECT 
          strftime('%Y-%m', created_at) as cohort_month,
          COUNT(*) as users,
          SUM(CASE WHEN s.status = 'premium' THEN 1 ELSE 0 END) as premium_users
        FROM users u
        LEFT JOIN subscriptions s ON u.id = s.user_id
        WHERE u.created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', u.created_at)
        ORDER BY cohort_month
      `);

      return cohorts.map(cohort => ({
        month: cohort.cohort_month,
        totalUsers: cohort.users,
        premiumUsers: cohort.premium_users,
        conversionRate: cohort.users > 0 
          ? Math.round((cohort.premium_users / cohort.users) * 10000) / 100 
          : 0
      }));

    } catch (error) {
      logger.error('Failed to calculate cohort analysis', {
        error: error.message,
        type: 'cohort_error'
      });
      return [];
    }
  }

  private getFromCache(key: string): any | null {
    const cached = this.kpiCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.kpiCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.kpiCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private startPeriodicKPICalculation(): void {
    // Calculate KPIs every hour
    setInterval(async () => {
      try {
        // This would need database connection - implement based on your DB setup
        logger.info('Periodic KPI calculation started');
      } catch (error) {
        logger.error('Periodic KPI calculation failed', {
          error: error.message,
          type: 'periodic_kpi_error'
        });
      }
    }, 3600000); // 1 hour
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(limit: number = 100): UserEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear event cache
   */
  clearEvents(): void {
    this.events = [];
    logger.info('Analytics events cleared');
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Convenience functions for common events
export const trackUserSignup = (userId: string, properties?: Record<string, any>) => {
  analytics.trackEvent({
    userId,
    sessionId: generateSessionId(),
    event: 'user_signup',
    properties
  });
};

export const trackSubscriptionCreated = (userId: string, subscriptionId: string, plan: string) => {
  analytics.trackEvent({
    userId,
    sessionId: generateSessionId(),
    event: 'subscription_created',
    properties: { subscriptionId, plan }
  });
};

export const trackPremiumFeatureUsed = (userId: string, feature: string, properties?: Record<string, any>) => {
  analytics.trackEvent({
    userId,
    sessionId: generateSessionId(),
    event: 'premium_feature_used',
    properties: { feature, ...properties }
  });
};

export const trackSearchPerformed = (userId: string | undefined, query: string, results: number) => {
  analytics.trackEvent({
    userId,
    sessionId: generateSessionId(),
    event: 'search_performed',
    properties: { query: query.substring(0, 100), results } // Limit query length for privacy
  });
};

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}