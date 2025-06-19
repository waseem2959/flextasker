/**
 * Cache Dashboard Component
 * 
 * Administrative dashboard for monitoring and managing cache performance,
 * viewing cache statistics, and controlling cache warming strategies.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  // BarChart3,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Settings,
  TrendingUp,
  Trash2,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useCache } from '../../services/cache/cache-manager';
import { useCacheWarmer } from '../../services/cache/cache-warmer';
import { useQueryCache } from '../../services/cache/query-cache';
import type { CacheStatistics } from '../../services/cache/cache-manager';
import type { WarmingMetrics, UserBehaviorData } from '../../services/cache/cache-warmer';
import type { QueryMetrics } from '../../services/cache/query-cache';

interface CacheDashboardProps {
  className?: string;
}

const CacheDashboard: React.FC<CacheDashboardProps> = ({ className }) => {
  const [cacheStats, setCacheStats] = useState<CacheStatistics | null>(null);
  const [warmingMetrics, setWarmingMetrics] = useState<WarmingMetrics | null>(null);
  const [queryMetrics, setQueryMetrics] = useState<QueryMetrics | null>(null);
  const [userBehavior, setUserBehavior] = useState<UserBehaviorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const cache = useCache();
  const cacheWarmer = useCacheWarmer();
  const queryCache = useQueryCache();

  useEffect(() => {
    loadCacheData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCacheData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheData = async () => {
    try {
      setIsLoading(true);
      
      const [stats, warming, queries, behavior] = await Promise.all([
        cache.getStatistics(),
        cacheWarmer.getMetrics(),
        queryCache.getMetrics(),
        cacheWarmer.getUserBehavior()
      ]);

      setCacheStats(stats);
      setWarmingMetrics(warming);
      setQueryMetrics(queries);
      setUserBehavior(behavior);
    } catch (error) {
      console.error('Failed to load cache data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCacheData();
    setIsRefreshing(false);
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear all cache? This will impact performance until cache is rebuilt.')) {
      await cache.clear();
      await loadCacheData();
    }
  };

  const handleWarmCache = async () => {
    await cacheWarmer.warmNow();
    await loadCacheData();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getHealthStatus = () => {
    if (!cacheStats) return 'unknown';
    
    if (cacheStats.hitRate >= 80) return 'excellent';
    if (cacheStats.hitRate >= 60) return 'good';
    if (cacheStats.hitRate >= 40) return 'warning';
    return 'poor';
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading cache dashboard...</span>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus();

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cache Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage application cache performance</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleWarmCache}
            variant="outline"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Warm Cache
          </Button>
          <Button
            onClick={handleClearCache}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Health</CardTitle>
            {getHealthIcon(healthStatus)}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(healthStatus)}`}>
              {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
            </div>
            <p className="text-xs text-gray-600">
              {cacheStats ? `${cacheStats.hitRate.toFixed(1)}% hit rate` : 'Calculating...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats?.totalEntries || 0}</div>
            <p className="text-xs text-gray-600">
              {formatBytes(cacheStats?.totalSize || 0)} used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Query Performance</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queryMetrics ? formatDuration(queryMetrics.averageResponseTime) : '0ms'}
            </div>
            <p className="text-xs text-gray-600">
              {queryMetrics?.totalQueries || 0} total queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warming Status</CardTitle>
            <Activity className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warmingMetrics?.strategiesExecuted || 0}
            </div>
            <p className="text-xs text-gray-600">
              {warmingMetrics ? `${warmingMetrics.successRate.toFixed(1)}% success rate` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cache Hit Rate */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Hit Rate</CardTitle>
                <CardDescription>Percentage of requests served from cache</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Hit Rate</span>
                    <span>{cacheStats ? `${cacheStats.hitRate.toFixed(1)}%` : '0%'}</span>
                  </div>
                  <Progress value={cacheStats?.hitRate || 0} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cache Hits</span>
                    <div className="font-semibold text-green-600">
                      {queryMetrics?.cacheHits || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache Misses</span>
                    <div className="font-semibold text-red-600">
                      {queryMetrics?.cacheMisses || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Query Statistics</CardTitle>
                <CardDescription>API query performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Total Queries</span>
                    <div className="text-2xl font-bold">{queryMetrics?.totalQueries || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Network Requests</span>
                    <div className="text-2xl font-bold">{queryMetrics?.networkRequests || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Background Refreshes</span>
                    <div className="text-2xl font-bold">{queryMetrics?.backgroundRefreshes || 0}</div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-gray-600">Prefetches</span>
                    <div className="text-2xl font-bold">{queryMetrics?.prefetches || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cache Warming Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Cache Warming Progress</CardTitle>
              <CardDescription>Automated cache warming strategies and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Warming Strategies Executed</span>
                  <Badge variant="outline">
                    {warmingMetrics?.strategiesExecuted || 0} strategies
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Entries Warmed</span>
                    <div className="font-semibold">{warmingMetrics?.totalEntriesWarmed || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Spent</span>
                    <div className="font-semibold">
                      {warmingMetrics ? formatDuration(warmingMetrics.totalTimeSpent) : '0ms'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Success Rate</span>
                    <div className="font-semibold">
                      {warmingMetrics ? `${warmingMetrics.successRate.toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average response times by request type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Query Time</span>
                    <span className="font-mono text-sm">
                      {queryMetrics ? formatDuration(queryMetrics.averageResponseTime) : '0ms'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Warming Time</span>
                    <span className="font-mono text-sm">
                      {warmingMetrics ? formatDuration(warmingMetrics.averageWarmingTime) : '0ms'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Optimization Opportunities</CardTitle>
                <CardDescription>Potential improvements identified</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cacheStats && cacheStats.hitRate < 60 && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm">Low cache hit rate - consider warming more data</span>
                    </div>
                  )}
                  
                  {queryMetrics && queryMetrics.averageResponseTime > 1000 && (
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="text-sm">High response times - optimize query performance</span>
                    </div>
                  )}
                  
                  {cacheStats && cacheStats.totalSize > 100 * 1024 * 1024 && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <HardDrive className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm">Large cache size - consider cleanup strategies</span>
                    </div>
                  )}
                  
                  {(!cacheStats || cacheStats.totalEntries === 0) && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Settings className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="text-sm">Cache is empty - run warming strategies</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Storage Usage by Layer */}
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage by Layer</CardTitle>
                <CardDescription>Cache storage distribution across layers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cacheStats?.storageUsage && (
                  <div className="space-y-3">
                    {Object.entries(cacheStats.storageUsage).map(([layer, size]) => (
                      <div key={layer} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{layer}</span>
                          <span>{formatBytes(size)}</span>
                        </div>
                        <Progress 
                          value={(size / (cacheStats.totalSize || 1)) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Application memory consumption</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Heap Used</span>
                    <span className="font-mono text-sm">
                      {formatBytes(cacheStats?.memoryUsage || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cache Size</span>
                    <span className="font-mono text-sm">
                      {formatBytes(cacheStats?.totalSize || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Entries</span>
                    <span className="font-mono text-sm">
                      {cacheStats?.totalEntries || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Behavior Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>User Behavior Patterns</CardTitle>
                <CardDescription>Insights from user navigation and usage</CardDescription>
              </CardHeader>
              <CardContent>
                {userBehavior ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Device Type</h4>
                      <Badge variant="outline">{userBehavior.deviceType}</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Connection Speed</h4>
                      <Badge variant="outline">{userBehavior.connectionSpeed}</Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Frequent Routes</h4>
                      <div className="space-y-2">
                        {userBehavior.frequentRoutes.slice(0, 5).map((route: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="font-mono">{route.route}</span>
                            <span className="text-gray-600">{route.visits} visits</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No user behavior data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cache Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Cache Efficiency</CardTitle>
                <CardDescription>How well the cache serves user needs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Hit Rate Trend</span>
                    <span className={`text-sm font-medium ${
                      (cacheStats?.hitRate || 0) >= 80 ? 'text-green-600' :
                      (cacheStats?.hitRate || 0) >= 60 ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {cacheStats ? 
                        (cacheStats.hitRate >= 80 ? '↗ Improving' :
                         cacheStats.hitRate >= 60 ? '→ Stable' : '↘ Declining')
                        : 'No data'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bandwidth Saved</span>
                    <span className="text-sm font-medium text-green-600">
                      {warmingMetrics ? formatBytes(warmingMetrics.bandwidthSaved) : '0 B'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Performance Improvement</span>
                    <span className="text-sm font-medium text-blue-600">
                      {warmingMetrics ? `${warmingMetrics.cacheHitImprovement.toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CacheDashboard;