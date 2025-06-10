/**
 * Type declarations for cookie-parser module
 * This file provides TypeScript type definitions for the cookie-parser module
 * since @types/cookie-parser is not installed in this project
 */

declare module 'cookie-parser' {
  import { RequestHandler } from 'express';
  
  /**
   * Create a middleware for parsing cookies
   * 
   * @param secret - Secret(s) used to sign cookies
   * @param options - Cookie parser options
   */
  function cookieParser(
    secret?: string | string[], 
    options?: cookieParser.CookieParseOptions
  ): RequestHandler;
  
  namespace cookieParser {
    interface CookieParseOptions {
      decode?(val: string): string;
    }
  }
  
  export = cookieParser;
}
