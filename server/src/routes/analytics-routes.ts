/**
 * Analytics Routes
 * 
 * Express routes for analytics endpoints including business metrics,
 * predictive analytics, reporting, and real-time analytics.
 */

import { Router } from 'express';
import { analyticsController } from '../controllers/analytics-controller';
import { authMiddleware } from '../middleware/auth-middleware';
import { rateLimiterMiddleware } from '../middleware/rate-limiter-middleware';
import { validationMiddleware } from '../middleware/zod-validation-middleware';
import { z } from 'zod';

const router = Router();

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

// Apply authentication to all routes
router.use(authMiddleware);

// Apply rate limiting
router.use(rateLimiterMiddleware({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 // Block for 60 seconds if exceeded
}));

/**
 * @route   POST /api/analytics/track
 * @desc    Track analytics event
 * @access  Private
 */
router.post('/track', 
  rateLimiterMiddleware({
    points: 1000, // Higher limit for tracking
    duration: 60,
    blockDuration: 60
  }),
  validationMiddleware(trackEventSchema),
  analyticsController.trackEvent
);

/**
 * @route   POST /api/analytics/query
 * @desc    Execute analytics query
 * @access  Private (Admin/Business users)
 */
router.post('/query',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  validationMiddleware(analyticsQuerySchema),
  analyticsController.executeQuery
);

/**
 * @route   GET /api/analytics/business-metrics
 * @desc    Get business metrics dashboard
 * @access  Private (Admin/Business users)
 */
router.get('/business-metrics',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  analyticsController.getBusinessMetrics
);

/**
 * @route   GET /api/analytics/realtime
 * @desc    Get real-time analytics
 * @access  Private (Admin users only)
 */
router.get('/realtime',
  (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  },
  analyticsController.getRealtimeAnalytics
);

/**
 * @route   POST /api/analytics/cohort
 * @desc    Perform cohort analysis
 * @access  Private (Admin/Business users)
 */
router.post('/cohort',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  validationMiddleware(cohortAnalysisSchema),
  analyticsController.performCohortAnalysis
);

/**
 * @route   POST /api/analytics/predictive
 * @desc    Get predictive analytics
 * @access  Private (Admin/Business users)
 */
router.post('/predictive',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  rateLimiterMiddleware({
    points: 10, // Limited requests for ML models
    duration: 60,
    blockDuration: 300 // 5 minute block
  }),
  validationMiddleware(predictiveAnalyticsSchema),
  analyticsController.getPredictiveAnalytics
);

/**
 * @route   POST /api/analytics/report
 * @desc    Generate analytics report
 * @access  Private (Admin/Business users)
 */
router.post('/report',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  rateLimiterMiddleware({
    points: 5, // Very limited for report generation
    duration: 60,
    blockDuration: 300
  }),
  validationMiddleware(reportSchema),
  analyticsController.generateReport
);

/**
 * @route   GET /api/analytics/funnel
 * @desc    Get funnel analysis
 * @access  Private (Admin/Business users)
 */
router.get('/funnel',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  analyticsController.getFunnelAnalysis
);

/**
 * @route   GET /api/analytics/user-journey
 * @desc    Get user journey analysis
 * @access  Private (Admin/Business users)
 */
router.get('/user-journey',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  analyticsController.getUserJourney
);

/**
 * @route   GET /api/analytics/ab-test/:testId
 * @desc    Get A/B test results
 * @access  Private (Admin users only)
 */
router.get('/ab-test/:testId',
  (req, res, next) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  },
  analyticsController.getABTestResults
);

/**
 * @route   GET /api/analytics/dashboard/:dashboardId
 * @desc    Get custom dashboard data
 * @access  Private
 */
router.get('/dashboard/:dashboardId',
  async (req, res) => {
    try {
      const { dashboardId } = req.params;
      const userId = req.user?.id;

      // Check dashboard permissions
      // Implementation would check if user has access to this dashboard
      
      // Return dashboard configuration and data
      res.json({
        dashboardId,
        widgets: [],
        layout: {},
        permissions: [],
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch dashboard data'
      });
    }
  }
);

/**
 * @route   POST /api/analytics/dashboard/:dashboardId
 * @desc    Update custom dashboard
 * @access  Private
 */
router.post('/dashboard/:dashboardId',
  async (req, res) => {
    try {
      const { dashboardId } = req.params;
      const userId = req.user?.id;
      const { widgets, layout, settings } = req.body;

      // Validate dashboard update permissions
      // Save dashboard configuration
      
      res.json({
        success: true,
        dashboardId,
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to update dashboard'
      });
    }
  }
);

/**
 * @route   GET /api/analytics/export/:exportId
 * @desc    Download exported analytics data
 * @access  Private
 */
router.get('/export/:exportId',
  rateLimiterMiddleware({
    points: 3, // Very limited for downloads
    duration: 60,
    blockDuration: 300
  }),
  async (req, res) => {
    try {
      const { exportId } = req.params;
      const userId = req.user?.id;

      // Validate export permissions and generate download
      // Implementation would stream the file or redirect to download URL
      
      res.json({
        downloadUrl: `/downloads/${exportId}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      });

    } catch (error) {
      res.status(500).json({
        error: 'Export not found or expired'
      });
    }
  }
);

/**
 * @route   POST /api/analytics/alerts
 * @desc    Create analytics alert
 * @access  Private (Admin/Business users)
 */
router.post('/alerts',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  async (req, res) => {
    try {
      const { metric, condition, threshold, frequency } = req.body;
      const userId = req.user?.id;

      // Create analytics alert
      // Implementation would save alert configuration
      
      res.json({
        alertId: `alert_${Date.now()}`,
        metric,
        condition,
        threshold,
        frequency,
        status: 'active',
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to create alert'
      });
    }
  }
);

/**
 * @route   GET /api/analytics/alerts
 * @desc    Get user's analytics alerts
 * @access  Private
 */
router.get('/alerts',
  async (req, res) => {
    try {
      const userId = req.user?.id;

      // Fetch user's alerts
      // Implementation would return user's analytics alerts
      
      res.json({
        alerts: [],
        totalCount: 0
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch alerts'
      });
    }
  }
);

/**
 * @route   DELETE /api/analytics/alerts/:alertId
 * @desc    Delete analytics alert
 * @access  Private
 */
router.delete('/alerts/:alertId',
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const userId = req.user?.id;

      // Delete alert with ownership validation
      // Implementation would remove the alert
      
      res.json({
        success: true,
        alertId,
        deletedAt: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete alert'
      });
    }
  }
);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get AI-generated business insights
 * @access  Private (Admin/Business users)
 */
router.get('/insights',
  (req, res, next) => {
    if (!req.user?.role || !['admin', 'business'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  },
  async (req, res) => {
    try {
      const { timeRange, categories } = req.query;

      // Generate AI insights
      // Implementation would use ML models to generate insights
      
      res.json({
        insights: [
          {
            id: 'insight_1',
            type: 'opportunity',
            priority: 'high',
            title: 'Revenue Growth Opportunity',
            description: 'AI analysis suggests potential for 23% revenue increase',
            confidence: 0.87,
            recommendations: [
              'Optimize task matching algorithm',
              'Implement dynamic pricing',
              'Enhance user onboarding'
            ],
            impact: {
              metric: 'Monthly Revenue',
              value: 25000,
              timeframe: 'Next Quarter'
            }
          }
        ],
        generatedAt: new Date().toISOString(),
        modelVersion: 'v2.1'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate insights'
      });
    }
  }
);

export default router;