/**
 * CSRF Protection Module
 * 
 * This module provides Cross-Site Request Forgery (CSRF) protection for the application.
 * It uses double-submit cookie pattern for CSRF protection.
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { logger } from '../logger';
import { monitorError } from '../monitoring';

// CSRF token options
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_TOKEN_LENGTH = 32; // bytes

// Routes that should be exempt from CSRF protection
const EXEMPT_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/health',
  '/health/readiness'
];

// HTTP methods that don't require CSRF protection
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Generates a random CSRF token
 */
function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to set CSRF token cookie
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip for non-browser requests
  const userAgent = req.get('user-agent') || '';
  const isBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
  
  if (!isBrowser) {
    return next();
  }
  
  // Generate token
  const token = generateCsrfToken();
  
  // Set token in cookie - secure in production, accessible by JavaScript
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JavaScript needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Store token in request for other middleware to use
  req.csrfToken = token;
  
  next();
}

/**
 * Middleware to validate CSRF token
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Skip validation for safe methods
  if (SAFE_METHODS.includes(req.method)) {
    return next();
  }
  
  // Skip validation for exempt routes
  if (EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
    return next();
  }
  
  // Get tokens from cookie and header
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);
  
  // Validate tokens
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logger.warn('CSRF validation failed', {
      path: req.path,
      ip: req.ip,
      cookieExists: !!cookieToken,
      headerExists: !!headerToken,
      tokensMatch: cookieToken === headerToken,
      user: req.user?.id
    });
    
    // Return 403 Forbidden
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

/**
 * Express middleware that combines setting and validating CSRF tokens
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    // For GET requests, only set the token
    if (SAFE_METHODS.includes(req.method)) {
      setCsrfToken(req, res, next);
    } else {
      // For unsafe methods, validate token first
      validateCsrfToken(req, res, (err?: any) => {
        if (err) return next(err);
        
        // After validation, refresh the token
        setCsrfToken(req, res, next);
      });
    }
  } catch (error) {
    monitorError(error, { 
      component: 'csrfProtection',
      path: req.path,
      method: req.method
    });
    next(error);
  }
}
