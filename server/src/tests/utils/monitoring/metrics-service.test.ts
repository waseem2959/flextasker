/**
 * Metrics Service Unit Tests
 * 
 * These tests verify the functionality of the unified metrics service
 * that tracks API usage and migration metrics.
 */

import { Request, Response } from 'express';
import { Socket } from 'socket.io';
import metricsService from '../../../utils/monitoring/metrics-service';
import { inMemoryMetrics } from '../../../utils/monitoring/consolidated-metrics';
// Import metrics service and in-memory metrics storage

// Mock console to prevent test output pollution
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock Socket.io socket for WebSocket tests
interface MockSocket extends Partial<Socket> {
  id: string;
  data?: {
    user?: {
      id: string;
      role: string;
    };
  };
  emit: jest.Mock;
}

// This will be used in WebSocket tests
const createSocketForTest = (userId?: string): MockSocket => {
  return {
    id: `socket-${Math.random().toString(36).substring(2, 10)}`,
    data: {
      user: userId ? {
        id: userId,
        role: 'user'
      } : undefined
    },
    emit: jest.fn().mockReturnValue(true)
  };
};

// Mock Express request and response
const createMockRequest = (method: string, url: string): Partial<Request> => {
  return {
    method,
    url,
    originalUrl: url,
    route: {
      path: url.split('?')[0]
    }
  };
};

const createMockResponse = (statusCode = 200): Partial<Response> => {
  const res: Partial<Response> = {
    statusCode,
    end: jest.fn()
  };
  return res;
};

describe('Metrics Service', () => {
  // Reset metrics before each test
  beforeEach(() => {
    // Clear the in-memory metrics directly for testing
    Object.keys(inMemoryMetrics.httpRequests).forEach(key => {
      delete inMemoryMetrics.httpRequests[key];
    });
    Object.keys(inMemoryMetrics.wsEvents).forEach(key => {
      delete inMemoryMetrics.wsEvents[key];
    });
    Object.keys(inMemoryMetrics.errors).forEach(key => {
      delete inMemoryMetrics.errors[key];
    });
  });

  describe('HTTP Metrics', () => {
    test('should track legacy HTTP requests', () => {
      // Act
      metricsService.trackHttpRequest('GET', '/api/tasks/123', 200, 50, 'task');
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.httpRequests);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('GET:/api/tasks/123:legacy'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.httpRequests[key!];
      expect(metricData.count).toBe(1);
      expect(metricData.sum).toBe(50);
      expect(metricData.min).toBe(50);
      expect(metricData.max).toBe(50);
    });
    
    test('should track consolidated HTTP requests', () => {
      // Act
      metricsService.trackHttpRequest('GET', '/api/tasks/consolidated/123', 200, 45, 'task');
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.httpRequests);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('GET:/api/tasks/consolidated/123:consolidated'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.httpRequests[key!];
      expect(metricData.count).toBe(1);
      expect(metricData.sum).toBe(45);
      expect(metricData.min).toBe(45);
      expect(metricData.max).toBe(45);
    });
    
    test('should track HTTP errors', () => {
      // Act
      metricsService.trackHttpRequest('POST', '/api/tasks', 500, 120, 'task');
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.httpRequests);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('POST:/api/tasks:legacy'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.httpRequests[key!];
      expect(metricData.count).toBe(1);
      expect(metricData.sum).toBe(120);
      expect(metricData.min).toBe(120);
      expect(metricData.max).toBe(120);
    });
    
    test('should correctly identify consolidated routes', () => {
      expect(metricsService.isConsolidatedRoute('/api/tasks')).toBe(false);
      expect(metricsService.isConsolidatedRoute('/api/tasks/consolidated')).toBe(true);
      expect(metricsService.isConsolidatedRoute('/api/v2/tasks')).toBe(true);
    });
    
    test('should extract service name from routes', () => {
      expect(metricsService.extractServiceFromRoute('/api/tasks')).toBe('task');
      expect(metricsService.extractServiceFromRoute('/api/bids/123')).toBe('bid');
      expect(metricsService.extractServiceFromRoute('/api/chat/messages')).toBe('chat');
      expect(metricsService.extractServiceFromRoute('/api/notifications/unread')).toBe('notification');
      expect(metricsService.extractServiceFromRoute('/api/reviews/123')).toBe('review');
      expect(metricsService.extractServiceFromRoute('/api/users/profile')).toBe('user');
      expect(metricsService.extractServiceFromRoute('/api/unknown')).toBe('unknown');
    });
  });
  
  describe('WebSocket Metrics', () => {
    test('should track WebSocket events', () => {
      // Create a mock socket
      const mockSocket = createSocketForTest('user-123');
      
      // Act
      metricsService.trackWebSocketEvent('connection', false, 'system', mockSocket.data?.user?.id);
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.wsEvents);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('system:connection:legacy'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.wsEvents[key!];
      expect(metricData.count).toBe(1);
    });
    
    test('should track consolidated WebSocket events', () => {
      // Create a mock socket
      const mockSocket = createSocketForTest('user-456');
      
      // Act
      metricsService.trackWebSocketEvent('bid:created', true, 'bid', mockSocket.data?.user?.id);
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.wsEvents);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('bid:bid:created:consolidated'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.wsEvents[key!];
      expect(metricData.count).toBe(1);
    });
  });
  
  describe('Error Tracking', () => {
    test('should track errors', () => {
      // Act
      metricsService.trackError('chat', 'websocket', true, new Error('Test error'));
      
      // Assert
      const metricsKeys = Object.keys(inMemoryMetrics.errors);
      expect(metricsKeys.length).toBeGreaterThan(0);
      
      // Find the matching key
      const key = metricsKeys.find(k => k.includes('chat:websocket:consolidated'));
      expect(key).toBeDefined();
      
      // Check the metrics data
      const metricData = inMemoryMetrics.errors[key!];
      expect(metricData.count).toBe(1);
    });
  });
  
  describe('HTTP Metrics Middleware', () => {
    test('should track requests via middleware', () => {
      // Arrange
      const req = createMockRequest('GET', '/api/tasks/123') as unknown as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn();
      
      // Set the start time on the request object for duration calculation
      (req as any)._startTime = Date.now();
      
      // Act
      metricsService.httpMetricsMiddleware(req, res, next);
      
      // Execute the modified res.end if it exists
      if (res.end && typeof res.end === 'function') {
        res.end();
      }
      
      // Assert
      expect(next).toHaveBeenCalled();
      
      // Check that metrics were recorded
      const metricsKeys = Object.keys(inMemoryMetrics.httpRequests);
      expect(metricsKeys.length).toBeGreaterThan(0);
    });
  });
});
