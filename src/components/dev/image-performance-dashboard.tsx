/**
 * Image Performance Dashboard
 * 
 * Development component for monitoring image optimization metrics.
 * Only shown in development mode.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Camera, 
  TrendingDown, 
  TrendingUp, 
  Zap,
  X,
  Download,
  RefreshCw
} from 'lucide-react';
import { imagePerformanceMonitor, type PerformanceStats } from '@/services/images/image-performance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ImagePerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ImagePerformanceDashboard: React.FC<ImagePerformanceDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to performance updates
    const unsubscribe = imagePerformanceMonitor.subscribe(setStats);
    
    // Get initial stats
    setStats(imagePerformanceMonitor.getStats());

    return unsubscribe;
  }, []);

  const handleExport = () => {
    const data = imagePerformanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-performance-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    imagePerformanceMonitor.clear();
  };

  if (!stats) return null;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getPerformanceColor = (value: number, thresholds: [number, number]): string => {
    if (value <= thresholds[0]) return 'text-green-600';
    if (value <= thresholds[1]) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Image Performance</h3>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalImages}
                </div>
                <div className="text-xs text-gray-500">Total Images</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getPerformanceColor(stats.averageLoadTime, [1000, 2500])}`}>
                  {formatTime(stats.averageLoadTime)}
                </div>
                <div className="text-xs text-gray-500">Avg Load Time</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-lg font-semibold ${getPerformanceColor(100 - stats.successRate, [5, 15])}`}>
                  {stats.successRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">
                  {formatBytes(stats.lazyLoadingSavings * 1024)}
                </div>
                <div className="text-xs text-gray-500">Saved (Lazy)</div>
              </div>
            </div>

            {/* Format breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Formats Used</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(stats.formatBreakdown).map(([format, count]) => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex-1 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Expanded view */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                  {/* Recommendations */}
                  {stats.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Recommendations
                      </h4>
                      <div className="space-y-1">
                        {stats.recommendations.map((rec, index) => (
                          <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start space-x-1">
                            <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slowest images */}
                  {stats.slowestImages.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Slowest Images
                      </h4>
                      <div className="space-y-1">
                        {stats.slowestImages.slice(0, 3).map((img, index) => (
                          <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-red-600 font-medium">
                                {formatTime(img.loadTime)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {img.format}
                              </Badge>
                            </div>
                            <div className="text-gray-600 dark:text-gray-400 truncate">
                              {img.src.split('/').pop() || img.src}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Web Vitals */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Web Vitals Impact
                    </h4>
                    <div className="space-y-1">
                      {imagePerformanceMonitor.getWebVitals().imageRelatedIssues.map((issue, index) => (
                        <div key={index} className="text-xs text-orange-600 dark:text-orange-400 flex items-start space-x-1">
                          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))}
                      {imagePerformanceMonitor.getWebVitals().imageRelatedIssues.length === 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 flex items-center space-x-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>No major issues detected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Performance Monitor Toggle
 * Keyboard shortcut component for toggling the dashboard
 */
export const ImagePerformanceToggle: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+Shift+I (or Cmd+Shift+I on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.code === 'KeyI') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <ImagePerformanceDashboard
      isVisible={isVisible}
      onClose={() => setIsVisible(false)}
    />
  );
};

export default ImagePerformanceDashboard;