/**
 * Input Sanitization Module
 * 
 * This module provides utilities for sanitizing and validating user input
 * to prevent security vulnerabilities like injection attacks.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { ValidationError } from '../enhanced-errors';
import { ValidationErrorDetail } from '../../../shared/types/errors';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance with jsdom
const window = new JSDOM('').window as any;
const purify = DOMPurify(window);

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify options
  const options = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'ul', 'ol', 'li',
      'b', 'i', 'strong', 'em', 'strike', 'code', 'hr',
      'a', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'class', 'id', 'style', 'title'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true }
  };
  
  // Sanitize HTML
  return purify.sanitize(html, options);
}

/**
 * Sanitizes a text string to prevent injection attacks
 * @param text Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  // Convert to string if not already
  text = String(text);
  
  // Remove potentially dangerous characters
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Sanitizes an object by applying sanitization to all string properties
 * @param obj Object to sanitize
 * @param htmlFields Fields that should be sanitized as HTML
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any, htmlFields: string[] = []): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // Check if this field should be sanitized as HTML
        if (htmlFields.includes(key)) {
          sanitized[key] = sanitizeHtml(value);
        } else {
          sanitized[key] = sanitizeText(value);
        }
      } else if (Array.isArray(value)) {
        // Recursively sanitize arrays
        sanitized[key] = value.map(item => 
          typeof item === 'object' ? sanitizeObject(item, htmlFields) : 
          typeof item === 'string' ? sanitizeText(item) : item
        );
      } else if (value !== null && typeof value === 'object') {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(value, htmlFields);
      } else {
        // Keep non-string values as is
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body
 * @param htmlFields Fields that should be sanitized as HTML
 */
export function sanitizeBody(htmlFields: string[] = []) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, htmlFields);
    }
    next();
  };
}

/**
 * Middleware to sanitize request query parameters
 */
export function sanitizeQuery() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    next();
  };
}

/**
 * Validates that required fields are present
 * @param requiredFields Fields that must be present and non-empty
 */
export function validateRequiredFields(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: ValidationErrorDetail[] = [];
    
    for (const field of requiredFields) {
      // Check if field exists and is not empty
      if (!req.body || req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push({
          field,
          message: 'This field is required',
          code: `MISSING_${field.toUpperCase()}`
        });
      }
    }
    
    if (missingFields.length > 0) {
      const error = ValidationError.fromFieldErrors(missingFields);
      return next(error);
    }
    
    next();
  };
}

/**
 * Validates email format
 * @param emailField Name of the email field
 */
export function validateEmail(emailField: string = 'email') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body?.[emailField];
    
    if (email) {
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!emailRegex.test(email)) {
        const error = ValidationError.fromFieldErrors([{
          field: emailField,
          message: 'Invalid email format',
          code: 'INVALID_EMAIL_FORMAT'
        }]);
        return next(error);
      }
    }
    
    next();
  };
}

/**
 * Validates password strength
 * @param passwordField Name of the password field
 * @param minLength Minimum password length
 */
export function validatePassword(passwordField: string = 'password', minLength: number = 8) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const password = req.body?.[passwordField];
    
    if (password) {
      const errors: ValidationErrorDetail[] = [];
      
      // Check length
      if (password.length < minLength) {
        errors.push({
          field: passwordField,
          message: `Password must be at least ${minLength} characters long`,
          code: 'PASSWORD_TOO_SHORT'
        });
      }
      
      // Check complexity
      if (!/[A-Z]/.test(password)) {
        errors.push({
          field: passwordField,
          message: 'Password must contain at least one uppercase letter',
          code: 'PASSWORD_NO_UPPERCASE'
        });
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push({
          field: passwordField,
          message: 'Password must contain at least one lowercase letter',
          code: 'PASSWORD_NO_LOWERCASE'
        });
      }
      
      if (!/[0-9]/.test(password)) {
        errors.push({
          field: passwordField,
          message: 'Password must contain at least one number',
          code: 'PASSWORD_NO_NUMBER'
        });
      }
      
      if (errors.length > 0) {
        const error = ValidationError.fromFieldErrors(errors);
        return next(error);
      }
    }
    
    next();
  };
}
