/**
 * Performance monitoring types
 */

export interface RequestMetric {
  endpoint: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: number;
  success: boolean;
  cached: boolean;
  size: number;
  retryCount: number;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  callCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  p95Duration: number;
  cacheHitRate: number;
  lastCalled: Date;
}

export interface PerformanceThresholds {
  slow: number;
  verySlow: number;
  timeout: number;
  maxRetries: number;
  maxSize: number;
}

/**
 * Request parameters for recording API metrics
 */
export interface RecordRequestParams {
  endpoint: string;
  method: string;
  startTime: number;
  status: number;
  success: boolean;
  cached?: boolean;
  size?: number;
  retryCount?: number;
}

export interface PerformanceMonitoringHook {
  startTiming: (endpoint: string, method: string) => number;
  recordRequest: (params: RecordRequestParams) => RequestMetric;
  getPerformanceScore: () => number;
  getAllEndpointStats: () => EndpointStats[];
  getSlowestEndpoints: (limit?: number) => EndpointStats[];
  getLeastReliableEndpoints: (limit?: number) => EndpointStats[];
  getEndpointStats: (endpoint: string, method: string) => EndpointStats | undefined;
}
