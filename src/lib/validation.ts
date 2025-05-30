/**
 * Validation (Legacy Bridge)
 * 
 * IMPORTANT: This file provides backward compatibility with the lib/validation.ts implementation.
 * New code should use the consolidated implementation from utils/validation.ts.
 * 
 * This bridge ensures existing code continues to function while we transition to the improved structure.
 */

// Re-export everything from the utils/validation module
export * from '../utils/validation';

// Log deprecation warning
console.warn(
  'DEPRECATION NOTICE: Using lib/validation.ts is deprecated. ' +
  'Please update imports to use utils/validation.ts instead.'
);
