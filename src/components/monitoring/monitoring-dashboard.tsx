/**
 * Monitoring Dashboard Component
 * 
 * Real-time monitoring dashboard showing application health, performance metrics,
 * and server connectivity status.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useHealthMonitor } from '@/services/monitoring/health-monitor';
import { performanceMonitor } from '@/services/monitoring/performance-monitor';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    RefreshCw,
    Server,
    TrendingDown,
    TrendingUp,
    Wifi
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface PerformanceStats {
  totalMetrics: number;
  averageAPIResponseTime: number;
  slowestAPI: any;
  averageComponentRenderTime: number;
  slowestComponent: any;
}

export const MonitoringDashboard: React.FC = () => {
  const { health, isDegraded, isUnhealthy, startMonitoring, stopMonitoring } = useHealthMonitor();
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Update performance stats every 5 seconds
    const updateStats = () => {
      const stats = performanceMonitor.getMetricsSummary();
      setPerformanceStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleStartMonitoring = () => {
    startMonitoring(10000); // Check every 10 seconds
    setIsMonitoring(true);
  };

  const handleStopMonitoring = () => {
    stopMonitoring();
    setIsMonitoring(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    let variant: 'default' | 'secondary' | 'destructive';
    if (status === 'healthy') {
      variant = 'default';
    } else if (status === 'degraded') {
      variant = 'secondary';
    } else {
      variant = 'destructive';
    }

    return (
      <Badge variant={variant} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatResponseTime = (time: number) => {
    return `${Math.round(time)}ms`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time application health and performance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isMonitoring ? 'animate-spin' : ''}`} />
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusIcon(health.overall.status)}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">System Status:</span>
                {getStatusBadge(health.overall.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                Last updated: {formatTimestamp(health.overall.timestamp)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              API Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(health.api.status)}
              </div>
              {health.api.details?.responseTime && (
                <div className="flex items-center justify-between">
                  <span>Response Time:</span>
                  <span className="font-mono text-sm">
                    {formatResponseTime(health.api.details.responseTime)}
                  </span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Last check: {formatTimestamp(health.api.timestamp)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(health.database.status)}
              </div>
              <div className="text-xs text-muted-foreground">
                Last check: {formatTimestamp(health.database.timestamp)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WebSocket Health */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-4 w-4" />
              WebSocket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                {getStatusBadge(health.websocket.status)}
              </div>
              <div className="text-xs text-muted-foreground">
                Last check: {formatTimestamp(health.websocket.timestamp)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      {performanceStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Metrics</p>
                <p className="text-2xl font-bold">{performanceStats.totalMetrics}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Avg API Response</p>
                <p className="text-2xl font-bold">
                  {formatResponseTime(performanceStats.averageAPIResponseTime)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Avg Render Time</p>
                <p className="text-2xl font-bold">
                  {formatResponseTime(performanceStats.averageComponentRenderTime)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium">Monitoring</p>
                <p className="text-2xl font-bold text-green-500">
                  {isMonitoring ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            {performanceStats.slowestAPI && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Slowest API Call
                  </h4>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">
                        {performanceStats.slowestAPI.method} {performanceStats.slowestAPI.endpoint}
                      </span>
                      <span className="font-bold text-red-500">
                        {formatResponseTime(performanceStats.slowestAPI.responseTime)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {performanceStats.slowestComponent && (
              <div className="space-y-2 mt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                  Slowest Component
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">
                      {performanceStats.slowestComponent.componentName}
                    </span>
                    <span className="font-bold text-orange-500">
                      {formatResponseTime(performanceStats.slowestComponent.renderTime)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {(isDegraded || isUnhealthy) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.api.status !== 'healthy' && (
                <div className="flex items-center gap-2 text-yellow-800">
                  <Server className="h-4 w-4" />
                  <span>API server is experiencing issues</span>
                </div>
              )}
              {health.database.status !== 'healthy' && (
                <div className="flex items-center gap-2 text-yellow-800">
                  <Database className="h-4 w-4" />
                  <span>Database connectivity issues detected</span>
                </div>
              )}
              {health.websocket.status !== 'healthy' && (
                <div className="flex items-center gap-2 text-yellow-800">
                  <Wifi className="h-4 w-4" />
                  <span>WebSocket connection is unstable</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonitoringDashboard;
