/**
 * Environment utilities for safe access to environment variables
 * Works in both Vite and Jest environments
 */

export const isDev = () => {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'development';
  }
  return false;
};

export const isTest = () => {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'test';
  }
  return false;
};

export const isProd = () => {
  if (typeof process !== 'undefined') {
    return process.env.NODE_ENV === 'production';
  }
  return false;
};

export const getEnv = () => {
  return {
    DEV: isDev(),
    PROD: isProd(),
    MODE: process.env.NODE_ENV || 'development',
    VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3000/api',
    VITE_SOCKET_URL: process.env.VITE_SOCKET_URL || 'http://localhost:3000'
  };
};