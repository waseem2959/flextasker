/**
 * API Performance Monitoring Panel
 * 
 * A developer tool component that displays real-time API performance metrics,
 * including response times, success rates, and performance insights.
 * Only visible in development mode or when explicitly enabled.
 */

import { useState, useEffect, useMemo } from 'react';
import { usePerformanceMonitoring } from '@/services/analytics/performance-monitor';
import { useRateLimiter } from '@/services/api/rate-limiter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, XCircle, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const API_PERFORMANCE_KEY = 'flextasker-api-performance-visible';

/**
 * Format milliseconds to a human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get color class based on value
 */
function getColorForValue(value: number, thresholds: [number, number, number, number]): string {
  const [danger, warning, info, success] = thresholds;
  
  if (value <= danger) return 'text-red-500';
  if (value <= warning) return 'text-amber-500';
  if (value <= info) return 'text-blue-500';
  return 'text-green-500';
}

/**
 * Performance score indicator component
 */
function PerformanceScore({ score }: { score: number }) {
  const colorClass = useMemo(() => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  }, [score]);
  
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold">{score}</div>
      <Progress value={score} className="w-32 h-2" indicatorClassName={colorClass} />
      <div className="text-xs text-muted-foreground mt-1">API Performance Score</div>
    </div>
  );
}

/**
 * Endpoint statistics table component
 */
function EndpointStatsTable({ 
  stats, 
  title, 
  description 
}: { 
  stats: Array<any>;
  title: string;
  description: string;
}) {
  if (!stats.length) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No data available yet. Make some API calls first.
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Endpoint</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Avg Time</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Calls</TableHead>
              <TableHead>Last Called</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={`${stat.method}-${stat.endpoint}`}>
                <TableCell className="font-mono text-xs">{stat.endpoint}</TableCell>
                <TableCell>
                  <Badge variant={
                    stat.method === 'GET' ? 'default' :
                    stat.method === 'POST' ? 'outline' :
                    stat.method === 'PUT' ? 'secondary' :
                    'destructive'
                  }>
                    {stat.method}
                  </Badge>
                </TableCell>
                <TableCell className={getColorForValue(stat.averageDuration, [3000, 1000, 500, 0])}>
                  {formatDuration(stat.averageDuration)}
                </TableCell>
                <TableCell className={getColorForValue(stat.successRate * 100, [0, 50, 90, 98])}>
                  {(stat.successRate * 100).toFixed(0)}%
                </TableCell>
                <TableCell>{stat.callCount}</TableCell>
                <TableCell className="text-xs">
                  {new Date(stat.lastCalled).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Rate limiting status component
 */
function RateLimitingStatus() {
  const rateLimiter = useRateLimiter();
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    if (!rateLimiter.isRateLimited()) return;
    
    const interval = setInterval(() => {
      setCountdown(rateLimiter.getTimeUntilRateLimitExpires());
      if (rateLimiter.getTimeUntilRateLimitExpires() <= 0) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [rateLimiter]);
  
  if (!rateLimiter.isRateLimited() && rateLimiter.getQueueLength() === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-950/20">
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Rate Limiter Status
            </CardTitle>
            <Badge variant="outline" className="text-green-700 bg-green-100 dark:bg-green-950/50">
              Normal
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            API requests are processing normally.
            {rateLimiter.getDegradationLevel() > 0 && (
              <div className="mt-1 text-amber-600">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Degradation Level: {rateLimiter.getDegradationLevel()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
            Rate Limiting Active
          </CardTitle>
          <Badge variant="outline" className="text-amber-700 bg-amber-100 dark:bg-amber-950/50">
            {rateLimiter.isRateLimited() ? 'Limited' : 'Queueing'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rateLimiter.isRateLimited() && (
            <div className="text-sm">
              <Clock className="h-3 w-3 inline mr-1" />
              Rate limit expires in: {formatDuration(countdown)}
            </div>
          )}
          {rateLimiter.getQueueLength() > 0 && (
            <div className="text-sm">
              <RefreshCw className="h-3 w-3 inline mr-1" />
              Queued requests: {rateLimiter.getQueueLength()}
            </div>
          )}
          <div className="text-sm">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Degradation Level: {rateLimiter.getDegradationLevel()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * API Performance Panel Component
 */
export function ApiPerformancePanel() {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(API_PERFORMANCE_KEY) === 'true' || import.meta.env.DEV;
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const { monitor } = usePerformanceMonitoring();
  const [performanceScore, setPerformanceScore] = useState(100);
  const [endpointStats, setEndpointStats] = useState<Array<any>>([]);
  const [slowEndpoints, setSlowEndpoints] = useState<Array<any>>([]);
  const [unreliableEndpoints, setUnreliableEndpoints] = useState<Array<any>>([]);
  
  // Update stats periodically
  useEffect(() => {
    if (!isVisible) return;
    
    const updateStats = () => {
      setPerformanceScore(monitor.getPerformanceScore());
      setEndpointStats(monitor.getAllEndpointStats());
      setSlowEndpoints(monitor.getSlowestEndpoints(5));
      setUnreliableEndpoints(monitor.getLeastReliableEndpoints(5));
    };
    
    // Initial update
    updateStats();
    
    // Set up interval
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [isVisible, monitor]);
  
  // Save visibility preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_PERFORMANCE_KEY, isVisible.toString());
  }, [isVisible]);
  
  // Only render in development or when explicitly enabled
  if (!isVisible && !import.meta.env.DEV) {
    return null;
  }
  
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-background/80 backdrop-blur-sm"
          onClick={() => setIsVisible(true)}
        >
          Show API Performance
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed bottom-0 right-0 w-full md:w-auto max-w-full z-50">
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className="rounded-t-lg border bg-background/95 backdrop-blur-sm shadow-lg md:w-[650px] max-h-[calc(100vh-4rem)] overflow-hidden"
      >
        <CollapsibleTrigger asChild>
          <div className="p-3 flex items-center justify-between border-b cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center">
              <h3 className="text-sm font-semibold mr-3">API Performance Monitor</h3>
              <PerformanceScore score={performanceScore} />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
              >
                <XCircle className="h-4 w-4" />
              </Button>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="max-h-[500px] overflow-y-auto p-4">
          <Tabs defaultValue="endpoints">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="endpoints">All Endpoints</TabsTrigger>
              <TabsTrigger value="slow">Slow Endpoints</TabsTrigger>
              <TabsTrigger value="issues">Rate Limiting</TabsTrigger>
            </TabsList>
            
            <TabsContent value="endpoints" className="space-y-4">
              <EndpointStatsTable 
                stats={endpointStats} 
                title="All API Endpoints" 
                description="Performance statistics for all API endpoints" 
              />
            </TabsContent>
            
            <TabsContent value="slow" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <EndpointStatsTable 
                  stats={slowEndpoints} 
                  title="Slowest Endpoints" 
                  description="The 5 slowest API endpoints based on average response time" 
                />
                
                <EndpointStatsTable 
                  stats={unreliableEndpoints} 
                  title="Least Reliable Endpoints" 
                  description="The 5 least reliable API endpoints based on success rate" 
                />
              </div>
            </TabsContent>
            
            <TabsContent value="issues" className="space-y-4">
              <RateLimitingStatus />
              
              <Card>
                <CardHeader>
                  <CardTitle>Offline Request Queue</CardTitle>
                  <CardDescription>Status of requests queued while offline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="py-4 text-center text-muted-foreground">
                    <div className="font-mono text-xl mb-1">0</div>
                    <div className="text-sm">Requests in queue</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default ApiPerformancePanel;
