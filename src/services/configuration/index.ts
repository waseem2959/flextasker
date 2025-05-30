/**
 * Configuration Services Index
 * 
 * This file exports all configuration-related services in a structured way.
 * It provides a centralized entry point for accessing configuration functionality.
 */

// Export the feature management service
import { featureManager } from './featureManager';

export { featureManager };

// Default export for convenience
export default { featureManager };
