/**
 * Performance Monitor Component
 * 
 * Development-only component for monitoring application performance
 */

import React, { useState } from 'react';
import { usePerformance, useMemoryMonitor, useAsyncPerformance } from '../../hooks/use-performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Clock, CheckCircle, Info } from 'lucide-react';

interface PerformanceMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  minimized?: boolean;
  showMemory?: boolean;
  showRecommendations?: boolean;
}

const PerformanceMonitorComponent: React.FC<PerformanceMonitorProps> = ({
    position = 'bottom-right',
    minimized: initialMinimized = true,
    showRecommendations = true
  }) => {
    const [minimized, setMinimized] = useState(initialMinimized);
    const [activeTab, setActiveTab] = useState('overview');
    
    const { metrics, resetMetrics, getPerformanceReport } = usePerformance({
      componentName: 'PerformanceMonitor',
      enabled: true,
      logToConsole: true
    });

    const { memoryInfo, getMemoryPressure } = useMemoryMonitor();
    const { activeOperations } = useAsyncPerformance();

    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4'
    };

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getPerformanceLevel = () => {
      if (metrics.averageRenderTime > 50) return 'critical';
      if (metrics.averageRenderTime > 20) return 'warning';
      return 'good';
    };

    const performanceLevel = getPerformanceLevel();
    const memoryPressure = getMemoryPressure();

    if (minimized) {
      return (
        <div className={`fixed ${positionClasses[position]} z-[9999]`}>
          <Button
            onClick={() => setMinimized(false)}
            size="sm"
            variant="outline"
            className="rounded-full w-12 h-12 p-0 bg-white shadow-lg"
          >
            <Activity className="h-4 w-4" />
          </Button>
          {(performanceLevel === 'critical' || memoryPressure === 'high') && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-3 h-3 p-0 animate-pulse"
            />
          )}
        </div>
      );
    }

    return (
      <div className={`fixed ${positionClasses[position]} z-[9999] w-96 max-h-[80vh] overflow-hidden`}>
        <Card className="shadow-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance Monitor
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={performanceLevel === 'good' ? 'default' : performanceLevel === 'warning' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {performanceLevel}
                </Badge>
                <Button
                  onClick={() => setMinimized(true)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 text-xs">
                <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                <TabsTrigger value="memory" className="text-xs">Memory</TabsTrigger>
                <TabsTrigger value="operations" className="text-xs">Operations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Renders:</span>
                      <span className="font-mono">{metrics.renderCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Render:</span>
                      <span className="font-mono">{metrics.lastRenderTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Average:</span>
                      <span className="font-mono">{metrics.averageRenderTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Time:</span>
                      <span className="font-mono">{metrics.totalRenderTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Slow Renders:</span>
                      <span className="font-mono text-red-600">
                        {metrics.isSlowRender ? '1' : '0'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Operations:</span>
                      <span className="font-mono">{activeOperations.length}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button 
                    onClick={resetMetrics} 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-6"
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={() => console.log(getPerformanceReport())} 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-6"
                  >
                    Log Report
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="memory" className="space-y-3">
                {memoryInfo.usedJSHeapSize ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Used Heap:</span>
                      <span className="font-mono">{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Heap:</span>
                      <span className="font-mono">{formatBytes(memoryInfo.totalJSHeapSize || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Heap Limit:</span>
                      <span className="font-mono">{formatBytes(memoryInfo.jsHeapSizeLimit || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Pressure:</span>
                      <Badge 
                        variant={memoryPressure === 'low' ? 'default' : memoryPressure === 'medium' ? 'secondary' : 'destructive'}
                        className="text-xs"
                      >
                        {memoryPressure}
                      </Badge>
                    </div>
                    
                    {/* Memory usage bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          memoryPressure === 'high' ? 'bg-red-500' : 
                          memoryPressure === 'medium' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ 
                          width: `${((memoryInfo.usedJSHeapSize || 0) / (memoryInfo.jsHeapSizeLimit || 1)) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">
                    Memory API not available in this browser
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="operations" className="space-y-3">
                <div className="text-xs">
                  <div className="font-medium mb-2">Active Operations:</div>
                  {activeOperations.length > 0 ? (
                    <div className="space-y-1">
                      {activeOperations.map((op, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Clock className="h-3 w-3 animate-spin" />
                          <span>{op}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No active operations</div>
                  )}
                </div>
                
                {showRecommendations && (
                  <div className="text-xs">
                    <div className="font-medium mb-2">Recommendations:</div>
                    <div className="space-y-1">
                      {getPerformanceReport().recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Info className="h-3 w-3 mt-0.5 text-blue-500" />
                          <span className="text-gray-600">{rec}</span>
                        </div>
                      ))}
                      {getPerformanceReport().recommendations.length === 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Performance looks good!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
};

// Export the component conditionally based on environment
export const PerformanceMonitor = process.env.NODE_ENV === 'production' 
  ? () => null 
  : PerformanceMonitorComponent;

export default PerformanceMonitor;