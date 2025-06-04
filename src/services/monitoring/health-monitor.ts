/**
 * Health Monitoring Service
 *
 * Monitors application health including server connectivity, API status,
 * and real-time connection health with the backend.
 */

import React from 'react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  details?: Record<string, any>;
}

interface ServiceHealth {
  api: HealthStatus;
  database: HealthStatus;
  websocket: HealthStatus;
  overall: HealthStatus;
}

interface HealthCheckResult {
  service: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  timestamp: number;
  error?: string;
}

class HealthMonitor {
  private healthStatus: ServiceHealth;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(health: ServiceHealth) => void> = [];
  private isMonitoring: boolean = false;

  constructor() {
    this.healthStatus = {
      api: { status: 'healthy', timestamp: Date.now() },
      database: { status: 'healthy', timestamp: Date.now() },
      websocket: { status: 'healthy', timestamp: Date.now() },
      overall: { status: 'healthy', timestamp: Date.now() },
    };
  }

  // === MONITORING CONTROL ===
  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    this.performHealthCheck();

    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
  }

  // === HEALTH CHECKS ===
  private async performHealthCheck(): Promise<void> {
    try {
      const [apiHealth, dbHealth, wsHealth] = await Promise.allSettled([
        this.checkAPIHealth(),
        this.checkDatabaseHealth(),
        this.checkWebSocketHealth(),
      ]);

      // Update API health
      if (apiHealth.status === 'fulfilled') {
        this.updateServiceHealth('api', apiHealth.value);
      } else {
        this.updateServiceHealth('api', {
          status: 'unhealthy',
          timestamp: Date.now(),
          details: { error: apiHealth.reason?.message },
        });
      }

      // Update Database health
      if (dbHealth.status === 'fulfilled') {
        this.updateServiceHealth('database', dbHealth.value);
      } else {
        this.updateServiceHealth('database', {
          status: 'unhealthy',
          timestamp: Date.now(),
          details: { error: dbHealth.reason?.message },
        });
      }

      // Update WebSocket health
      if (wsHealth.status === 'fulfilled') {
        this.updateServiceHealth('websocket', wsHealth.value);
      } else {
        this.updateServiceHealth('websocket', {
          status: 'unhealthy',
          timestamp: Date.now(),
          details: { error: wsHealth.reason?.message },
        });
      }

      // Update overall health
      this.updateOverallHealth();
      this.notifyListeners();

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private async checkAPIHealth(): Promise<HealthStatus> {
    const startTime = performance.now();

    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          status: responseTime > 2000 ? 'degraded' : 'healthy',
          timestamp: Date.now(),
          details: {
            responseTime,
            serverHealth: data,
          },
        };
      } else {
        return {
          status: 'unhealthy',
          timestamp: Date.now(),
          details: {
            responseTime,
            statusCode: response.status,
            statusText: response.statusText,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private async checkDatabaseHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch('/api/health/database', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          status: data.status === 'connected' ? 'healthy' : 'degraded',
          timestamp: Date.now(),
          details: data,
        };
      } else {
        return {
          status: 'unhealthy',
          timestamp: Date.now(),
          details: {
            statusCode: response.status,
          },
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : 'Database check failed',
        },
      };
    }
  }

  private async checkWebSocketHealth(): Promise<HealthStatus> {
    // This would integrate with your WebSocket connection
    // For now, we'll simulate a check
    try {
      // Check if WebSocket is connected (this would be your actual WebSocket instance)
      const isConnected = this.isWebSocketConnected();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        details: {
          connected: isConnected,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : 'WebSocket check failed',
        },
      };
    }
  }

  private isWebSocketConnected(): boolean {
    // This would check your actual WebSocket connection
    // For now, return true as a placeholder
    return true;
  }

  // === HEALTH STATUS MANAGEMENT ===
  private updateServiceHealth(service: keyof Omit<ServiceHealth, 'overall'>, health: HealthStatus): void {
    this.healthStatus[service] = health;
  }

  private updateOverallHealth(): void {
    const services = [this.healthStatus.api, this.healthStatus.database, this.healthStatus.websocket];
    
    const hasUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasDegraded = services.some(s => s.status === 'degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    this.healthStatus.overall = {
      status: overallStatus,
      timestamp: Date.now(),
      details: {
        services: {
          api: this.healthStatus.api.status,
          database: this.healthStatus.database.status,
          websocket: this.healthStatus.websocket.status,
        },
      },
    };
  }

  // === PUBLIC API ===
  public getHealthStatus(): ServiceHealth {
    return { ...this.healthStatus };
  }

  public isHealthy(): boolean {
    return this.healthStatus.overall.status === 'healthy';
  }

  public isDegraded(): boolean {
    return this.healthStatus.overall.status === 'degraded';
  }

  public isUnhealthy(): boolean {
    return this.healthStatus.overall.status === 'unhealthy';
  }

  // === EVENT LISTENERS ===
  public onHealthChange(callback: (health: ServiceHealth) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.healthStatus);
      } catch (error) {
        console.error('Health listener error:', error);
      }
    });
  }

  // === MANUAL CHECKS ===
  public async checkServiceHealth(service: string): Promise<HealthCheckResult> {
    const startTime = performance.now();

    try {
      const response = await fetch(`/api/health/${service}`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      const endTime = performance.now();

      return {
        service,
        status: response.ok ? 'up' : 'down',
        responseTime: endTime - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      const endTime = performance.now();

      return {
        service,
        status: 'down',
        responseTime: endTime - startTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Singleton instance
export const healthMonitor = new HealthMonitor();

// React Hook for health monitoring
export const useHealthMonitor = () => {
  const [health, setHealth] = React.useState<ServiceHealth>(healthMonitor.getHealthStatus());

  React.useEffect(() => {
    const unsubscribe = healthMonitor.onHealthChange(setHealth);
    return unsubscribe;
  }, []);

  return {
    health,
    isHealthy: healthMonitor.isHealthy(),
    isDegraded: healthMonitor.isDegraded(),
    isUnhealthy: healthMonitor.isUnhealthy(),
    startMonitoring: healthMonitor.startMonitoring.bind(healthMonitor),
    stopMonitoring: healthMonitor.stopMonitoring.bind(healthMonitor),
  };
};

export default healthMonitor;
