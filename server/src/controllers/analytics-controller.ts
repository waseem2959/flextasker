/**
 * Analytics Controller
 * 
 * REST API endpoints for analytics, business intelligence, and reporting.
 * Provides real-time metrics, historical analysis, and predictive insights.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { analyticsEngine } from '../services/analytics/analytics-engine';
import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../../src/services/monitoring/error-tracking';
import { cacheManager } from '../../src/services/cache/cache-manager';

// Validation schemas
const trackEventSchema = z.object({
  eventType: z.string().min(1).max(50),
  eventName: z.string().min(1).max(100),
  properties: z.record(z.any()).optional(),
  context: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    platform: z.string().optional(),
    referrer: z.string().optional(),
    utm: z.object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional()
    }).optional()
  }).optional()
});

const analyticsQuerySchema = z.object({
  metrics: z.array(z.string()).min(1),
  dimensions: z.array(z.string()).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'like']),
    value: z.any()
  })).optional(),
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
    granularity: z.enum(['minute', 'hour', 'day', 'week', 'month'])
  }),
  groupBy: z.array(z.string()).optional(),
  orderBy: z.array(z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  })).optional(),
  limit: z.number().positive().max(10000).optional()
});

const cohortAnalysisSchema = z.object({
  cohortType: z.enum(['registration', 'first_task', 'first_payment']),
  periodType: z.enum(['daily', 'weekly', 'monthly']),
  periods: z.number().positive().max(52),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const predictiveAnalyticsSchema = z.object({
  modelType: z.enum(['churn_prediction', 'ltv_prediction', 'task_success_rate', 'demand_forecasting']),
  features: z.record(z.any())
});

const reportSchema = z.object({
  reportType: z.enum(['executive', 'operational', 'financial', 'user_behavior']),
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  format: z.enum(['json', 'pdf', 'csv']).default('json'),
  filters: z.record(z.any()).optional()
});

class AnalyticsController {
  /**
   * Track analytics event
   */
  async trackEvent(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const eventData = trackEventSchema.parse(req.body);
      const userId = req.user?.id;
      const sessionId = req.sessionId || req.ip;

      // Extract context from request
      const context = {
        userAgent: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip,
        platform: this.detectPlatform(req.get('User-Agent') || ''),
        referrer: req.get('Referer'),
        ...eventData.context
      };

      await analyticsEngine.trackEvent(
        userId || 'anonymous',
        sessionId,
        eventData.eventType,
        eventData.eventName,
        eventData.properties || {},
        context
      );

      timer();
      res.status(200).json({
        success: true,
        eventId: `${eventData.eventType}.${eventData.eventName}`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'trackEvent'
        }
      });

      res.status(400).json({
        error: 'Failed to track event',
        details: error instanceof z.ZodError ? error.errors : 'Invalid event data'
      });
    }
  }

  /**
   * Execute analytics query
   */
  async executeQuery(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const queryData = analyticsQuerySchema.parse(req.body);
      
      // Check cache first
      const cacheKey = `analytics:query:${Buffer.from(JSON.stringify(queryData)).toString('base64')}`;
      const cached = await cacheManager.get(cacheKey);
      
      if (cached) {
        timer();
        return res.json({
          ...cached,
          cached: true
        });
      }

      const result = await analyticsEngine.executeQuery(queryData);

      // Cache for 5 minutes
      await cacheManager.set(cacheKey, result, {
        ttl: 300,
        tags: ['analytics', 'query']
      });

      timer();
      res.json({
        ...result,
        cached: false
      });

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'executeQuery'
        }
      });

      res.status(400).json({
        error: 'Query execution failed',
        details: error instanceof z.ZodError ? error.errors : 'Invalid query format'
      });
    }
  }

  /**
   * Get business metrics dashboard
   */
  async getBusinessMetrics(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({
          error: 'Start and end dates are required'
        });
      }

      const timeRange = {
        start: new Date(start as string),
        end: new Date(end as string)
      };

      // Check cache
      const cacheKey = `business-metrics:${start}:${end}`;
      const cached = await cacheManager.get(cacheKey);
      
      if (cached) {
        timer();
        return res.json(cached);
      }

      const metrics = await analyticsEngine.getBusinessMetrics(timeRange);

      // Cache for 10 minutes
      await cacheManager.set(cacheKey, metrics, {
        ttl: 600,
        tags: ['analytics', 'business-metrics']
      });

      timer();
      res.json(metrics);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getBusinessMetrics'
        }
      });

      res.status(500).json({
        error: 'Failed to fetch business metrics'
      });
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const realtimeData = await analyticsEngine.getRealtimeAnalytics();

      timer();
      res.json(realtimeData);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getRealtimeAnalytics'
        }
      });

      res.status(500).json({
        error: 'Failed to fetch real-time analytics'
      });
    }
  }

  /**
   * Perform cohort analysis
   */
  async performCohortAnalysis(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const analysisData = cohortAnalysisSchema.parse(req.body);
      
      const analysis = {
        ...analysisData,
        startDate: new Date(analysisData.startDate),
        endDate: new Date(analysisData.endDate)
      };

      // Check cache
      const cacheKey = `cohort-analysis:${Buffer.from(JSON.stringify(analysis)).toString('base64')}`;
      const cached = await cacheManager.get(cacheKey);
      
      if (cached) {
        timer();
        return res.json(cached);
      }

      const result = await analyticsEngine.performCohortAnalysis(analysis);

      // Cache for 1 hour
      await cacheManager.set(cacheKey, result, {
        ttl: 3600,
        tags: ['analytics', 'cohort']
      });

      timer();
      res.json(result);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'performCohortAnalysis'
        }
      });

      res.status(400).json({
        error: 'Cohort analysis failed',
        details: error instanceof z.ZodError ? error.errors : 'Invalid analysis parameters'
      });
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const predictionData = predictiveAnalyticsSchema.parse(req.body);
      
      const result = await analyticsEngine.getPredictiveAnalytics(
        predictionData.modelType,
        predictionData.features
      );

      timer();
      res.json(result);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getPredictiveAnalytics'
        }
      });

      res.status(400).json({
        error: 'Predictive analytics failed',
        details: error instanceof z.ZodError ? error.errors : 'Invalid prediction parameters'
      });
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const reportData = reportSchema.parse(req.body);
      
      const timeRange = {
        start: new Date(reportData.timeRange.start),
        end: new Date(reportData.timeRange.end)
      };

      // Check cache for JSON reports
      const cacheKey = `report:${reportData.reportType}:${Buffer.from(JSON.stringify(reportData)).toString('base64')}`;
      
      if (reportData.format === 'json') {
        const cached = await cacheManager.get(cacheKey);
        if (cached) {
          timer();
          return res.json(cached);
        }
      }

      const report = await analyticsEngine.generateReport(
        reportData.reportType,
        timeRange,
        reportData.format
      );

      // Cache JSON reports for 30 minutes
      if (reportData.format === 'json') {
        await cacheManager.set(cacheKey, report, {
          ttl: 1800,
          tags: ['analytics', 'report', reportData.reportType]
        });
      }

      timer();
      
      // Set appropriate content type for different formats
      if (reportData.format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportData.reportType}_report.pdf"`);
      } else if (reportData.format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${reportData.reportType}_report.csv"`);
      }

      res.json(report);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'generateReport'
        }
      });

      res.status(400).json({
        error: 'Report generation failed',
        details: error instanceof z.ZodError ? error.errors : 'Invalid report parameters'
      });
    }
  }

  /**
   * Get funnel analysis
   */
  async getFunnelAnalysis(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const { steps, timeRange, groupBy } = req.query;
      
      if (!steps || !timeRange) {
        return res.status(400).json({
          error: 'Steps and time range are required'
        });
      }

      const funnelSteps = (steps as string).split(',');
      const [start, end] = (timeRange as string).split(',');

      // Check cache
      const cacheKey = `funnel:${steps}:${timeRange}:${groupBy || 'none'}`;
      const cached = await cacheManager.get(cacheKey);
      
      if (cached) {
        timer();
        return res.json(cached);
      }

      const funnelData = await this.calculateFunnelAnalysis(
        funnelSteps,
        { start: new Date(start), end: new Date(end) },
        groupBy as string
      );

      // Cache for 15 minutes
      await cacheManager.set(cacheKey, funnelData, {
        ttl: 900,
        tags: ['analytics', 'funnel']
      });

      timer();
      res.json(funnelData);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getFunnelAnalysis'
        }
      });

      res.status(500).json({
        error: 'Funnel analysis failed'
      });
    }
  }

  /**
   * Get user journey analysis
   */
  async getUserJourney(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const { userId, sessionId, timeRange } = req.query;
      
      if (!userId && !sessionId) {
        return res.status(400).json({
          error: 'Either userId or sessionId is required'
        });
      }

      const journey = await this.analyzeUserJourney(
        userId as string,
        sessionId as string,
        timeRange ? {
          start: new Date((timeRange as string).split(',')[0]),
          end: new Date((timeRange as string).split(',')[1])
        } : undefined
      );

      timer();
      res.json(journey);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getUserJourney'
        }
      });

      res.status(500).json({
        error: 'User journey analysis failed'
      });
    }
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(req: Request, res: Response): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const { testId, metric } = req.query;
      
      if (!testId || !metric) {
        return res.status(400).json({
          error: 'Test ID and metric are required'
        });
      }

      const results = await this.calculateABTestResults(
        testId as string,
        metric as string
      );

      timer();
      res.json(results);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          controller: 'AnalyticsController',
          action: 'getABTestResults'
        }
      });

      res.status(500).json({
        error: 'A/B test analysis failed'
      });
    }
  }

  // Private helper methods

  private detectPlatform(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private async calculateFunnelAnalysis(
    steps: string[],
    timeRange: { start: Date; end: Date },
    groupBy?: string
  ): Promise<any> {
    // Implementation for funnel analysis
    return {
      steps,
      timeRange,
      groupBy,
      data: [],
      conversionRates: [],
      dropoffPoints: []
    };
  }

  private async analyzeUserJourney(
    userId?: string,
    sessionId?: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    // Implementation for user journey analysis
    return {
      userId,
      sessionId,
      timeRange,
      events: [],
      touchpoints: [],
      paths: [],
      insights: []
    };
  }

  private async calculateABTestResults(
    testId: string,
    metric: string
  ): Promise<any> {
    // Implementation for A/B test analysis
    return {
      testId,
      metric,
      variants: [],
      results: {
        winner: null,
        confidence: 0,
        improvement: 0,
        significance: false
      },
      recommendations: []
    };
  }
}

export const analyticsController = new AnalyticsController();
export default analyticsController;