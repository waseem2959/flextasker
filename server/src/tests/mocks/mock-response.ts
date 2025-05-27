/**
 * Mock Response Utilities
 * 
 * This file provides utility functions for creating mock Express response objects
 * for testing controllers and middleware.
 */

import { Response } from 'express';

/**
 * Creates a mock Express response object for testing
 */
export function createMockResponse(): Response {
  const res = {} as Response;
  
  // Status method
  res.status = jest.fn().mockReturnValue(res);
  
  // Response methods
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  
  // Header methods
  res.set = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  
  // Cookie methods
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  
  // Redirect
  res.redirect = jest.fn().mockReturnValue(res);
  
  // Response properties
  res.headersSent = false;
  res.statusCode = 200;
  
  // Method to get data sent to client
  res.getJSONData = function() {
    return (res.json as jest.Mock).mock.calls[0]?.[0];
  };
  
  // Method to get sent status code
  res.getStatusCode = function() {
    return (res.status as jest.Mock).mock.calls[0]?.[0] || res.statusCode;
  };
  
  return res;
}

/**
 * Creates assertions to use with the mock response
 */
export function createResponseAssertions(res: Response) {
  return {
    /**
     * Asserts that the response has the expected status code
     */
    hasStatus: (expectedStatus: number) => {
      const statusCode = (res.status as jest.Mock).mock.calls[0]?.[0] || 200;
      expect(statusCode).toBe(expectedStatus);
    },
    
    /**
     * Asserts that the response contains a success message with the expected data
     */
    isSuccessResponse: (expectedData?: any, expectedMessage?: string) => {
      const data = (res.json as jest.Mock).mock.calls[0]?.[0];
      expect(data).toBeDefined();
      expect(data.success).toBe(true);
      
      if (expectedData) {
        expect(data.data).toEqual(expectedData);
      }
      
      if (expectedMessage) {
        expect(data.message).toBe(expectedMessage);
      }
    },
    
    /**
     * Asserts that the response contains an error message
     */
    isErrorResponse: (expectedMessage?: string, expectedStatus?: number) => {
      const data = (res.json as jest.Mock).mock.calls[0]?.[0];
      expect(data).toBeDefined();
      expect(data.success).toBe(false);
      
      if (expectedMessage) {
        expect(data.message).toBe(expectedMessage);
      }
      
      if (expectedStatus) {
        const statusCode = (res.status as jest.Mock).mock.calls[0]?.[0];
        expect(statusCode).toBe(expectedStatus);
      }
    },
    
    /**
     * Asserts that the response contains validation errors
     */
    hasValidationErrors: (expectedFields?: string[]) => {
      const data = (res.json as jest.Mock).mock.calls[0]?.[0];
      expect(data).toBeDefined();
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
      expect(Array.isArray(data.errors)).toBe(true);
      
      if (expectedFields) {
        const fields = data.errors.map((e: any) => e.field);
        expectedFields.forEach(field => {
          expect(fields).toContain(field);
        });
      }
    }
  };
}
