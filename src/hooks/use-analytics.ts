/**
 * Analytics Hook
 * 
 * Custom React hook for analytics data fetching, real-time updates,
 * and state management with caching and error handling.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface AnalyticsTimeRange {
  from: Date;
  to: Date;
}

interface BusinessMetrics {
  revenue: {
    total: number;
    growth: number;
    mrr: number;
    arr: number;
    churn: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    retained: number;
    churnRate: number;
  };
  tasks: {
    total: number;
    completed: number;
    success_rate: number;
    avg_completion_time: number;
    avg_budget: number;
  };
  marketplace: {
    supply_demand_ratio: number;
    avg_bids_per_task: number;
    conversion_rate: number;
    time_to_completion: number;
  };
}

interface RealtimeAnalytics {
  activeUsers: number;
  activeTasks: number;
  revenue: number;
  system: {
    cpu: number;
    memory: number;
    requests: number;
  };
  timestamp: string;
}

interface ChartData {
  revenue: Array<{ date: string; amount: number }>;
  users: Array<{ date: string; count: number }>;
  tasks: Array<{ date: string; count: number }>;
  tasksByCategory: Array<{ category: string; count: number }>;
  userDistribution: Array<{ name: string; value: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  revenueBySource: Array<{ source: string; amount: number }>;
  userAcquisition: Array<{ date: string; users: number }>;
  userRetention: Array<{ cohort: string; retention: number }>;
  taskPerformance: Array<{ status: string; count: number }>;
}

interface FunnelData {
  name: string;
  value: number;
  fill: string;
}

interface CohortData {
  cohorts: Array<{
    period: string;
    size: number;
    retention: number[];
  }>;
  insights: string[];
}

interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  timeRange: AnalyticsTimeRange;
  groupBy?: string[];
}

interface UseAnalyticsOptions {
  timeRange: AnalyticsTimeRange;
  metrics: string[];
  realTime?: boolean;
  refreshInterval?: number;
  enableCaching?: boolean;
}

interface UseAnalyticsReturn {
  // Data
  businessMetrics: BusinessMetrics | null;
  realtimeAnalytics: RealtimeAnalytics | null;
  chartData: ChartData | null;
  funnelData: FunnelData[] | null;
  cohortData: CohortData | null;
  
  // State
  isLoadingMetrics: boolean;
  isLoadingCharts: boolean;
  isLoadingRealtime: boolean;
  error: string | null;
  
  // Actions
  refreshData: () => Promise<void>;
  executeQuery: (query: AnalyticsQuery) => Promise<any>;
  trackEvent: (eventType: string, eventName: string, properties?: Record<string, any>) => Promise<void>;
  exportData: (format: 'csv' | 'pdf' | 'excel', reportType: string) => Promise<void>;
  
  // Analytics utilities
  calculateGrowth: (current: number, previous: number) => number;
  formatMetric: (value: number, type: 'currency' | 'percentage' | 'number') => string;
  getInsights: () => string[];
}

export const useAnalytics = (options: UseAnalyticsOptions): UseAnalyticsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [realtimeAnalytics, setRealtimeAnalytics] = useState<RealtimeAnalytics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelData[] | null>(null);
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [isLoadingRealtime, setIsLoadingRealtime] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number; ttl: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Options with defaults
  const {
    timeRange,
    metrics,
    realTime = false,
    refreshInterval = 30000, // 30 seconds
    enableCaching = true
  } = options;

  // API base URL
  const API_BASE = process.env.REACT_APP_API_URL || '/api';

  // Generate cache key
  const generateCacheKey = useCallback((endpoint: string, params?: Record<string, any>) => {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${endpoint}_${paramsStr}`;
  }, []);

  // Check cache
  const getCachedData = useCallback((key: string) => {
    if (!enableCaching) return null;
    
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      cacheRef.current.delete(key);
    }
    
    return null;
  }, [enableCaching]);

  // Set cache
  const setCachedData = useCallback((key: string, data: any, ttl: number = 300000) => {
    if (!enableCaching) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, [enableCaching]);

  // API request helper
  const apiRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {},
    useCache: boolean = true,
    cacheTTL: number = 300000
  ) => {
    const cacheKey = generateCacheKey(endpoint, options.body ? JSON.parse(options.body as string) : undefined);
    
    // Check cache first
    if (useCache) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the result
    if (useCache) {
      setCachedData(cacheKey, data, cacheTTL);
    }
    
    return data;
  }, [generateCacheKey, getCachedData, setCachedData, API_BASE]);

  // Fetch business metrics
  const fetchBusinessMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        start: timeRange.from.toISOString(),
        end: timeRange.to.toISOString()
      });
      
      const data = await apiRequest(`/analytics/business-metrics?${params}`, {}, true, 600000); // 10 min cache
      setBusinessMetrics(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch business metrics';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [timeRange, apiRequest, toast]);

  // Fetch chart data
  const fetchChartData = useCallback(async () => {
    setIsLoadingCharts(true);
    
    try {
      const queries = [
        // Revenue trend
        {
          metrics: ['revenue'],
          timeRange: {
            start: timeRange.from.toISOString(),
            end: timeRange.to.toISOString(),
            granularity: 'day'
          }
        },
        // User growth
        {
          metrics: ['user_registrations'],
          timeRange: {
            start: timeRange.from.toISOString(),
            end: timeRange.to.toISOString(),
            granularity: 'day'
          }
        },
        // Tasks by category
        {
          metrics: ['task_created'],
          dimensions: ['category'],
          timeRange: {
            start: timeRange.from.toISOString(),
            end: timeRange.to.toISOString(),
            granularity: 'day'
          },
          groupBy: ['category']
        }
      ];

      const results = await Promise.all(
        queries.map(query => 
          apiRequest('/analytics/query', {
            method: 'POST',
            body: JSON.stringify(query)
          }, true, 300000) // 5 min cache
        )
      );

      // Process and format chart data
      const processedChartData: ChartData = {
        revenue: results[0]?.data || [],
        users: results[1]?.data || [],
        tasks: [],
        tasksByCategory: results[2]?.data || [],
        userDistribution: [],
        revenueByMonth: [],
        revenueBySource: [],
        userAcquisition: [],
        userRetention: [],
        taskPerformance: []
      };

      setChartData(processedChartData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setIsLoadingCharts(false);
    }
  }, [timeRange, apiRequest]);

  // Fetch realtime analytics
  const fetchRealtimeAnalytics = useCallback(async () => {
    if (!realTime) return;
    
    setIsLoadingRealtime(true);
    
    try {
      const data = await apiRequest('/analytics/realtime', {}, false); // No cache for realtime
      setRealtimeAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch realtime analytics:', error);
    } finally {
      setIsLoadingRealtime(false);
    }
  }, [realTime, apiRequest]);

  // Fetch funnel data
  const fetchFunnelData = useCallback(async () => {
    try {
      const steps = ['task_view', 'task_apply', 'task_bid', 'task_awarded', 'task_completed'];
      const params = new URLSearchParams({
        steps: steps.join(','),
        timeRange: `${timeRange.from.toISOString()},${timeRange.to.toISOString()}`
      });
      
      const data = await apiRequest(`/analytics/funnel?${params}`, {}, true, 600000);
      
      // Format for funnel chart
      const formattedData: FunnelData[] = data.data?.map((item: any, index: number) => ({
        name: item.step,
        value: item.count,
        fill: `hsl(${200 + index * 40}, 70%, 50%)`
      })) || [];
      
      setFunnelData(formattedData);
    } catch (error) {
      console.error('Failed to fetch funnel data:', error);
    }
  }, [timeRange, apiRequest]);

  // Fetch cohort data
  const fetchCohortData = useCallback(async () => {
    try {
      const cohortAnalysis = {
        cohortType: 'registration',
        periodType: 'weekly',
        periods: 12,
        startDate: timeRange.from.toISOString(),
        endDate: timeRange.to.toISOString()
      };
      
      const data = await apiRequest('/analytics/cohort', {
        method: 'POST',
        body: JSON.stringify(cohortAnalysis)
      }, true, 1800000); // 30 min cache
      
      setCohortData(data);
    } catch (error) {
      console.error('Failed to fetch cohort data:', error);
    }
  }, [timeRange, apiRequest]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    // Clear cache for fresh data
    cacheRef.current.clear();
    
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    await Promise.all([
      fetchBusinessMetrics(),
      fetchChartData(),
      fetchFunnelData(),
      fetchCohortData(),
      fetchRealtimeAnalytics()
    ]);
  }, [fetchBusinessMetrics, fetchChartData, fetchFunnelData, fetchCohortData, fetchRealtimeAnalytics]);

  // Execute custom analytics query
  const executeQuery = useCallback(async (query: AnalyticsQuery) => {
    try {
      return await apiRequest('/analytics/query', {
        method: 'POST',
        body: JSON.stringify(query)
      });
    } catch (error) {
      toast({
        title: 'Query Failed',
        description: 'Failed to execute analytics query',
        variant: 'destructive'
      });
      throw error;
    }
  }, [apiRequest, toast]);

  // Track analytics event
  const trackEvent = useCallback(async (
    eventType: string,
    eventName: string,
    properties: Record<string, any> = {}
  ) => {
    try {
      await apiRequest('/analytics/track', {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          eventName,
          properties,
          context: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            referrer: document.referrer
          }
        })
      }, false); // Don't cache tracking events
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }, [apiRequest]);

  // Export analytics data
  const exportData = useCallback(async (
    format: 'csv' | 'pdf' | 'excel',
    reportType: string
  ) => {
    try {
      const reportData = {
        reportType,
        timeRange: {
          start: timeRange.from.toISOString(),
          end: timeRange.to.toISOString()
        },
        format
      };

      const blob = await apiRequest('/analytics/report', {
        method: 'POST',
        body: JSON.stringify(reportData)
      }, false);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Report exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data',
        variant: 'destructive'
      });
    }
  }, [timeRange, apiRequest, toast]);

  // Utility functions
  const calculateGrowth = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }, []);

  const formatMetric = useCallback((value: number, type: 'currency' | 'percentage' | 'number'): string => {
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
    }
  }, []);

  const getInsights = useCallback((): string[] => {
    const insights: string[] = [];
    
    if (businessMetrics) {
      if (businessMetrics.revenue.growth > 10) {
        insights.push('Revenue is growing strongly this period');
      }
      if (businessMetrics.users.churnRate > 5) {
        insights.push('User churn rate is above recommended threshold');
      }
      if (businessMetrics.tasks.success_rate > 90) {
        insights.push('Task completion rate is excellent');
      }
      if (businessMetrics.marketplace.conversion_rate < 2) {
        insights.push('Conversion rate could be improved with better UX');
      }
    }
    
    return insights;
  }, [businessMetrics]);

  // Effects
  
  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Setup realtime updates
  useEffect(() => {
    if (realTime && refreshInterval > 0) {
      realtimeIntervalRef.current = setInterval(() => {
        fetchRealtimeAnalytics();
      }, refreshInterval);

      return () => {
        if (realtimeIntervalRef.current) {
          clearInterval(realtimeIntervalRef.current);
        }
      };
    }
  }, [realTime, refreshInterval, fetchRealtimeAnalytics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      cacheRef.current.clear();
    };
  }, []);

  // Memoized return value
  return useMemo(() => ({
    // Data
    businessMetrics,
    realtimeAnalytics,
    chartData,
    funnelData,
    cohortData,
    
    // State
    isLoadingMetrics,
    isLoadingCharts,
    isLoadingRealtime,
    error,
    
    // Actions
    refreshData,
    executeQuery,
    trackEvent,
    exportData,
    
    // Utilities
    calculateGrowth,
    formatMetric,
    getInsights
  }), [
    businessMetrics,
    realtimeAnalytics,
    chartData,
    funnelData,
    cohortData,
    isLoadingMetrics,
    isLoadingCharts,
    isLoadingRealtime,
    error,
    refreshData,
    executeQuery,
    trackEvent,
    exportData,
    calculateGrowth,
    formatMetric,
    getInsights
  ]);
};

export default useAnalytics;