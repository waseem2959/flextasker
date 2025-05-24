import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Encryption utilities for handling passwords and generating secure tokens.
 * These functions help us store passwords securely and create tokens for
 * email verification, password resets, etc.
 */

/**
 * Hash a password using bcrypt - this is one-way encryption
 * Even if someone gets access to our database, they can't see actual passwords
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher number = more secure but slower
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain password with a hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random token for email verification, password reset, etc.
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random numeric code for SMS verification
 */
export const generateNumericCode = (length: number = 6): string => {
  const digits = '0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return result;
};

/**
 * Generate a secure random string for various purposes
 */
export const generateSecureString = (length: number = 16): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return result;
};