/**
 * API Versioning System
 * 
 * This module provides utilities for implementing API versioning,
 * allowing for graceful evolution of the API without breaking existing clients.
 */

import { Request, Response, NextFunction, Router } from 'express';
import semver from 'semver';
import { logger } from './logger';
import { sendError } from './api-response';
import { ErrorType } from '../../../shared/types/errors';

// API version format: v{MAJOR}.{MINOR}
export const API_VERSION_REGEX = /v(\d+)\.(\d+)/;

// Current API version
export const CURRENT_API_VERSION = 'v1.0';

// Map of API versions to their support status
export enum VersionStatus {
  CURRENT = 'current',       // Latest stable version
  SUPPORTED = 'supported',   // Older but still supported version
  DEPRECATED = 'deprecated', // Supported but will be removed in future
  SUNSET = 'sunset'          // No longer supported, returns error
}

// Version support configuration
export const API_VERSIONS: Record<string, {
  status: VersionStatus;
  sunsetDate?: Date; // When the version will no longer be supported
  message?: string;  // Custom message about this version
}> = {
  'v1.0': {
    status: VersionStatus.CURRENT,
    message: 'Current stable API version'
  },
  'v0.9': {
    status: VersionStatus.SUPPORTED,
    message: 'Previous API version, fully supported'
  },
  'v0.8': {
    status: VersionStatus.DEPRECATED,
    sunsetDate: new Date('2023-12-31'),
    message: 'Deprecated: Will be removed after December 31, 2023. Please migrate to v1.0.'
  },
  'v0.7': {
    status: VersionStatus.SUNSET,
    message: 'This API version is no longer supported. Please upgrade to v1.0.'
  }
};

/**
 * Extract API version from request
 * 
 * Attempts to extract version from:
 * 1. URL path (/api/v1.0/users)
 * 2. Accept header (Accept: application/json; version=v1.0)
 * 3. Custom header (X-API-Version: v1.0)
 * 
 * @param req Express request
 * @returns The detected API version or null if none found
 */
export function extractApiVersion(req: Request): string | null {
  // Check URL path
  const pathMatch = req.path.match(/\/api\/(v\d+\.\d+)/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  
  // Check Accept header with version parameter
  const acceptHeader = req.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(v\d+\.\d+)/);
    if (versionMatch && versionMatch[1]) {
      return versionMatch[1];
    }
  }
  
  // Check X-API-Version header
  const versionHeader = req.get('X-API-Version');
  if (versionHeader && API_VERSION_REGEX.test(versionHeader)) {
    return versionHeader;
  }
  
  return null;
}

/**
 * Determine the effective API version to use
 * 
 * @param requestedVersion The version requested by the client, or null
 * @returns The version to use for processing the request
 */
export function determineEffectiveVersion(requestedVersion: string | null): string {
  // If no version specified, use current version
  if (!requestedVersion) {
    return CURRENT_API_VERSION;
  }
  
  // Check if requested version exists in our configuration
  if (API_VERSIONS[requestedVersion]) {
    return requestedVersion;
  }
  
  // If not a known version, try to find the closest matching version
  const match = requestedVersion.match(API_VERSION_REGEX);
  if (match) {
    const [, majorStr] = match;
    const requestedMajor = parseInt(majorStr, 10);
    
    // Find all versions with same major version
    const matchingVersions = Object.keys(API_VERSIONS)
      .filter(version => {
        const vMatch = version.match(API_VERSION_REGEX);
        if (vMatch) {
          const [, vMajorStr] = vMatch;
          const vMajor = parseInt(vMajorStr, 10);
          return vMajor === requestedMajor;
        }
        return false;
      })
      .sort((a, b) => {
        // Sort in descending order
        return semver.compare(
          semver.coerce(b) || '0.0.0',
          semver.coerce(a) || '0.0.0'
        );
      });
    
    if (matchingVersions.length > 0) {
      // Return the highest matching major version
      return matchingVersions[0];
    }
  }
  
  // Default to current version if no match found
  return CURRENT_API_VERSION;
}

/**
 * Check if a version is supported
 * 
 * @param version API version to check
 * @returns boolean indicating if the version is supported
 */
export function isVersionSupported(version: string): boolean {
  const versionConfig = API_VERSIONS[version];
  
  if (!versionConfig) {
    return false;
  }
  
  return versionConfig.status !== VersionStatus.SUNSET;
}

/**
 * Middleware to handle API versioning
 * 
 * This middleware:
 * 1. Extracts requested API version
 * 2. Determines the effective version to use
 * 3. Checks if the version is supported
 * 4. Adds version info to the request object
 * 5. Adds version headers to the response
 * 
 * @returns Express middleware
 */
export function apiVersionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract requested version
    const requestedVersion = extractApiVersion(req);
    
    // Determine effective version
    const effectiveVersion = determineEffectiveVersion(requestedVersion);
    
    // Get version configuration
    const versionConfig = API_VERSIONS[effectiveVersion];
    
    // Check if version is supported
    if (versionConfig && versionConfig.status === VersionStatus.SUNSET) {
      return sendError(
        res,
        {
          type: 'VERSION' as ErrorType,
          message: versionConfig.message || 'This API version is no longer supported',
          code: 'API_VERSION_SUNSET',
          details: {
            requestedVersion: requestedVersion || 'none',
            suggestedVersion: CURRENT_API_VERSION
          }
        },
        410 // Gone
      );
    }
    
    // Extend request with version info
    req.apiVersion = {
      requested: requestedVersion,
      effective: effectiveVersion,
      status: versionConfig?.status || VersionStatus.CURRENT
    };
    
    // Add version headers to response
    res.set('X-API-Version', effectiveVersion);
    res.set('X-API-Version-Status', versionConfig?.status || VersionStatus.CURRENT);
    
    // Add deprecation warning header if applicable
    if (versionConfig?.status === VersionStatus.DEPRECATED) {
      const sunsetDateStr = versionConfig.sunsetDate 
        ? versionConfig.sunsetDate.toISOString()
        : 'future date';
      
      res.set('Deprecation', sunsetDateStr);
      res.set('Sunset', sunsetDateStr);
      res.set('Link', `<${req.protocol}://${req.get('host')}/api/${CURRENT_API_VERSION}>; rel="successor-version"`);
    }
    
    // Log version information
    logger.debug('API version processed', {
      path: req.path,
      requestedVersion: requestedVersion || 'none',
      effectiveVersion,
      status: versionConfig?.status
    });
    
    next();
  };
}

/**
 * Create a versioned router
 * 
 * This function creates a router that only applies to specific API versions.
 * It allows different implementations for different API versions.
 * 
 * @param version API version this router handles
 * @param options Additional options
 * @returns Express router that only applies to the specified version
 */
export function createVersionedRouter(
  version: string,
  options: {
    fallthrough?: boolean; // Whether to call next() when version doesn't match
  } = {}
): Router {
  const router = Router();
  const { fallthrough = false } = options;
  
  // Add middleware to check version
  router.use((req: Request, res: Response, next: NextFunction) => {
    if (req.apiVersion?.effective === version) {
      return next();
    }
    
    if (fallthrough) {
      return next('router');
    }
    
    // If not falling through, return a 404
    sendError(
      res,
      {
        type: ErrorType.NOT_FOUND,
        message: 'API endpoint not found for this version',
        code: 'VERSION_ENDPOINT_NOT_FOUND',
        details: {
          requestedVersion: req.apiVersion?.requested,
          effectiveVersion: req.apiVersion?.effective
        }
      },
      404
    );
    return;
  });
  
  return router;
}

/**
 * Create router middleware to handle multiple API versions
 * 
 * This function allows you to specify different handlers for different API versions.
 * 
 * @param versionHandlers Map of versions to their handlers
 * @returns Express middleware
 */
export function versionedRoute(
  versionHandlers: Record<string, (req: Request, res: Response, next: NextFunction) => void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = req.apiVersion?.effective || CURRENT_API_VERSION;
    
    // Find the exact version handler
    let handler = versionHandlers[version];
    
    // If no exact match, try to find the closest compatible version
    if (!handler) {
      const requestedVerMatch = version.match(API_VERSION_REGEX);
      if (requestedVerMatch) {
        const [, majorStr] = requestedVerMatch;
        const major = parseInt(majorStr, 10);
        
        // Find all versions with the same major number
        const compatibleVersions = Object.keys(versionHandlers)
          .filter(v => {
            const vMatch = v.match(API_VERSION_REGEX);
            if (vMatch) {
              const [, vMajorStr] = vMatch;
              const vMajor = parseInt(vMajorStr, 10);
              return vMajor === major;
            }
            return false;
          })
          .sort((a, b) => {
            // Sort in descending order (newest first)
            return semver.compare(
              semver.coerce(b) || '0.0.0',
              semver.coerce(a) || '0.0.0'
            );
          });
        
        if (compatibleVersions.length > 0) {
          handler = versionHandlers[compatibleVersions[0]];
        }
      }
    }
    
    // Use the current version handler as fallback
    if (!handler && versionHandlers[CURRENT_API_VERSION]) {
      handler = versionHandlers[CURRENT_API_VERSION];
    }
    
    // If we found a handler, call it; otherwise, call next()
    if (handler) {
      return handler(req, res, next);
    }
    
    next();
  };
}

/**
 * Extend Express Request interface to include API version information
 */
declare global {
  namespace Express {
    interface Request {
      apiVersion?: {
        requested: string | null;
        effective: string;
        status: VersionStatus;
      };
    }
  }
}

export default {
  apiVersionMiddleware,
  createVersionedRouter,
  versionedRoute,
  extractApiVersion,
  determineEffectiveVersion,
  isVersionSupported,
  API_VERSIONS,
  CURRENT_API_VERSION,
  VersionStatus
};
