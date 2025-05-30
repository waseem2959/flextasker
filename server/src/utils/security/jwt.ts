/**
 * JWT Authentication Utilities
 * 
 * This module provides JWT verification and handling functions for authentication.
 */

import jwt from 'jsonwebtoken';
import { logger } from '../logger';

type JwtPayload = {
  userId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
};

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET ?? 'your-default-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY ?? '1d';

// JWT payload type is defined above as JwtPayload

/**
 * Verifies a JWT token and returns the decoded payload
 * 
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyJwt(token: string): JwtPayload {
  try {
    const decoded = (jwt as any).verify(token, JWT_SECRET) as JwtPayload;
    
    // Ensure the payload has the expected structure
    if (!decoded?.userId) {
      throw new Error('Invalid token payload structure');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('JWT verification failed', { error: errorMessage });
    throw new Error('Invalid or expired token');
  }
}

/**
 * Creates a JWT token for a user
 * 
 * @param payload - The data to encode in the token
 * @param expiresIn - Token expiration time (default from environment)
 * @returns The signed JWT token
 */
export function createJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn: string = JWT_EXPIRY): string {
  return (jwt as any).sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Decodes a JWT token without verifying it
 * 
 * @param token - The JWT token to decode
 * @returns The decoded token payload if valid format, null otherwise
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const decoded = (jwt as any).decode(token) as JwtPayload | null;
    if (!decoded) return null;
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('JWT decode failed', { error: errorMessage });
    return null;
  }
}
