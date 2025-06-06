/**
 * Components Barrel Export
 * 
 * Centralized export point for all application components.
 * Organized by feature and complexity level for optimal tree-shaking.
 */

// === UI COMPONENTS (Atomic Design) ===
export * from './ui';

// === LAYOUT COMPONENTS ===
export * from './layout/Layout';

// === FEATURE COMPONENTS ===

// Authentication & User Management
export * from './protected-route';

// Task Management
export * from './task/task-card';
export * from './task/task-creation-wizard';
export * from './task/task-form';
export * from './task/task-list';

// Homepage Components
export * from './homepage/hero-section';

// Dashboard Components
export * from './dashboard/dashboard-stats';

// Notifications
export * from './notifications/notification-bell';

// Chat Components
export * from './chat/chat-interface';

// Status Components
export * from './status/connection-status';

// Monitoring Components
export * from './monitoring/monitoring-dashboard';

// === ENHANCED MARKETPLACE COMPONENTS ===
// Re-export enhanced UI components for easy access
export { CategoryGrid, CompactCategoryGrid, LargeCategoryGrid } from './ui/category-grid';
export { CompactPriceRangeSlider, PriceRangeSlider } from './ui/price-range-slider';
export { CompactProgressIndicator, ProgressIndicator } from './ui/progress-indicator';

// Search Components
export { AdvancedSearchFilters } from './search/advanced-search-filters';
export { AISearchEngine } from './search/ai-search-engine';
export { GeospatialSearch } from './search/geospatial-search';
export { LocationSearch } from './search/location-search';
export { TaskSearchInterface } from './search/task-search-interface';

// User Profile Components
export { PortfolioDisplay, SkillsDisplay, SkillsPortfolio } from './user/skills-portfolio';
export { TrustScore, VerificationBadge, VerificationBadges } from './user/verification-badges';

// Payment Components
export { CommissionCalculator } from './payment/commission-calculator';
export { EscrowService } from './payment/escrow-service';
export { PaymentMethodSelector } from './payment/payment-method-selector';

// Trust & Safety Components
export { FraudDetection } from './trust/fraud-detection';
export { IdentityVerification } from './trust/identity-verification';
export { ReviewDisplay, ReviewForm } from './trust/review-system';

// Integration Examples
export { Phase1IntegrationExample } from '../examples/phase-1-integration-example';
export { Phase2IntegrationExample } from '../examples/phase-2-integration-example';
export { Phase3IntegrationExample } from '../examples/phase-3-integration-example';

