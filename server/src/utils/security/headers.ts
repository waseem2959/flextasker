/**
 * Security Headers Module
 * 
 * This module provides middleware to set security headers for the application.
 * These headers help protect against various attacks like XSS, clickjacking, etc.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to set security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy (CSP)
  // Helps prevent XSS attacks by controlling what resources can be loaded
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://randomuser.me",
    "connect-src 'self' https://api.flextasker.com",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // X-XSS-Protection
  // Enables browser's XSS protection (redundant with CSP, but good for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // X-Content-Type-Options
  // Prevents browsers from MIME-sniffing a response from the declared content-type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // Prevents clickjacking attacks by restricting who can put this site in an iframe
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Referrer-Policy
  // Controls how much referrer information is included with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  // Restricts which browser features the site can use
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  
  // Strict-Transport-Security (HSTS)
  // Forces browsers to use HTTPS for a specified period
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Cache-Control
  // Prevents sensitive information from being cached
  if (req.method === 'GET') {
    // Allow caching for static assets
    if (req.path.startsWith('/assets/') || req.path.startsWith('/static/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path.startsWith('/api/')) {
      // No caching for API responses
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  } else {
    // No caching for non-GET requests
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

/**
 * Sets appropriate CORS headers for API routes
 * @param allowedOrigins Array of allowed origins
 */
export function corsHeaders(allowedOrigins: string[] = ['http://localhost:3000']) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const origin = req.headers.origin;
    
    // Check if the origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      // In development, allow any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-XSRF-TOKEN');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    
    next();
  };
}
