/**
 * Input Sanitization Module
 * 
 * This module provides utilities for sanitizing and validating user input
 * to prevent security vulnerabilities like injection attacks.
 */

import type { Request, NextFunction } from 'express'; // Removed unused Response import
import { ValidationError } from '../error-utils';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize JSDOM and DOMPurify
const { window } = new JSDOM('');
const purify = DOMPurify(window as unknown as Window & typeof globalThis);



/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Configure DOMPurify options with proper typing
  const options: DOMPurify.Config = {
    // Allowed HTML tags
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'ul', 'ol', 'li',
      'b', 'i', 'strong', 'em', 'strike', 'code', 'hr',
      'a', 'span'
    ],
    
    // Allowed HTML attributes
    ALLOWED_ATTR: ['href', 'title', 'class', 'style', 'target', 'rel'],
    
    // Forbidden HTML tags
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    
    // Forbidden HTML attributes
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onmouseout'],
    
    // Additional attributes to allow
    ADD_ATTR: ['target', 'rel'],
    
    // Security settings
    KEEP_CONTENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    IN_PLACE: false,
    ALLOW_DATA_ATTR: false,
    WHOLE_DOCUMENT: false,
    RETURN_TRUSTED_TYPE: false,
    FORBID_CONTENTS: [],
    ALLOW_ARIA_ATTR: true,
    
    // Custom URI validation using ALLOWED_URI_REGEXP with type assertion
    ALLOWED_URI_REGEXP: /^(https?:\/\/|\/|#|mailto:|tel:)/i as unknown as RegExp,
    
    // Custom element handling - disable custom elements for security
    CUSTOM_ELEMENT_HANDLING: {
      tagNameCheck: null,
      attributeNameCheck: null,
      allowCustomizedBuiltInElements: false
    }
  };

  try {
    return purify.sanitize(html, options);
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '';
  }
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
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    
    const value = obj[key];
    
    // Handle string values
    if (typeof value === 'string') {
      sanitized[key] = htmlFields.includes(key) 
        ? sanitizeHtml(value) 
        : sanitizeText(value);
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'object') {
          return sanitizeObject(item, htmlFields);
        }
        if (typeof item === 'string') {
          return sanitizeText(item);
        }
        return item;
      });
      continue;
    }
    
    // Handle objects
    if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, htmlFields);
      continue;
    }
    
    // Keep non-string values as is
    sanitized[key] = value;
  }
  
  return sanitized;
}

/**
 * Middleware to sanitize request body
 * @param htmlFields Fields that should be sanitized as HTML
 */
export function sanitizeBody(htmlFields: string[] = []) {
  return (req: Request, _res: unknown, next: NextFunction): void => {
    if (req.body) {
      req.body = sanitizeObject(req.body, htmlFields);
    }
    next();
  };
}

/**
 * Middleware to sanitize request query parameters
 */
export function sanitizeQuery() {
  return (req: Request, _res: unknown, next: NextFunction): void => {
    if (req.query) {
      req.query = sanitizeObject(req.query as Record<string, unknown>);
    }
    next();
  };
}

/**
 * Validates that required fields are present
 * @param requiredFields Fields that must be present and non-empty
 */
export function validateRequiredFields(requiredFields: string[]) {
  return (req: Request, _res: unknown, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string; code?: string }> = [];
    
    for (const field of requiredFields) {
      // Check if field exists and is not empty
      const fieldValue = req.body?.[field];
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        errors.push({
          field,
          message: 'This field is required',
          code: `MISSING_${field.toUpperCase()}`
        });
      }
    }
    
    if (errors.length > 0) {
      const error = new ValidationError('Validation failed', { errors });
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
  return (req: Request, _res: unknown, next: NextFunction): void => {
    const email = req.body?.[emailField];
    if (!email) return next();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new ValidationError('Invalid email format', {
        errors: [{
          field: emailField,
          message: 'Please enter a valid email address',
          code: 'INVALID_EMAIL'
        }]
      });
      return next(error);
    }
    
    next();
  };
}

/**
 * Validates password strength
 * @param passwordField Name of the password field
 * @param minLength Minimum password length
 */
function createPasswordError(field: string, message: string, code: string) {
  return new ValidationError('Password validation failed', {
    errors: [{
      field,
      message,
      code
    }]
  });
}

export function validatePassword(passwordField: string = 'password', minLength: number = 8) {
  return (req: Request, _res: unknown, next: NextFunction): void => {
    const password = req.body?.[passwordField];
    
    if (!password) {
      return next(createPasswordError(
        passwordField,
        'Password is required',
        'PASSWORD_REQUIRED'
      ));
    }
    
    // Check password length
    if (password.length < minLength) {
      return next(createPasswordError(
        passwordField,
        `Password must be at least ${minLength} characters long`,
        'PASSWORD_TOO_SHORT'
      ));
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
      return next(createPasswordError(
        passwordField,
        'Password must contain at least one number',
        'PASSWORD_MISSING_NUMBER'
      ));
    }
    
    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
      return next(createPasswordError(
        passwordField,
        'Password must contain at least one letter',
        'PASSWORD_MISSING_LETTER'
      ));
    }
    
    next();
  };
}
