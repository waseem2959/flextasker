-- Performance Optimization Indexes Migration
-- This migration creates indexes to improve query performance based on
-- common access patterns identified in the application.

-- ============================================================================
-- USER TABLE INDEXES
-- ============================================================================

-- Index for email lookups (authentication, uniqueness checks)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email 
ON "User"(email);

-- Index for active user filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active 
ON "User"(isActive) 
WHERE isActive = true;

-- Index for user creation date (sorting, analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created 
ON "User"(createdAt DESC);

-- Composite index for name-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_name 
ON "User"(firstName, lastName);

-- Index for user role filtering (if role column exists)
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
-- ON "User"(role);

-- ============================================================================
-- TASK TABLE INDEXES
-- ============================================================================

-- Index for task status filtering (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status 
ON "Task"(status);

-- Index for category-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_category 
ON "Task"(categoryId);

-- Index for task owner lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_owner 
ON "Task"(userId);

-- Index for assigned user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assigned 
ON "Task"(assignedUserId) 
WHERE assignedUserId IS NOT NULL;

-- Index for task creation date (sorting, pagination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created 
ON "Task"(createdAt DESC);

-- Index for budget-based filtering and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_budget 
ON "Task"(budget);

-- Index for location-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_location 
ON "Task"(location);

-- Composite index for status + creation date (common combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_created 
ON "Task"(status, createdAt DESC);

-- Composite index for category + status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_category_status 
ON "Task"(categoryId, status);

-- Index for budget range queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_budget_range 
ON "Task"(budget) 
WHERE budget > 0;

-- ============================================================================
-- BID TABLE INDEXES
-- ============================================================================

-- Index for task-based bid lookups (most common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_task 
ON "Bid"(taskId);

-- Index for user's bid history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_user 
ON "Bid"(userId);

-- Index for bid status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_status 
ON "Bid"(status);

-- Index for bid creation date (sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_created 
ON "Bid"(createdAt DESC);

-- Composite index for task + status (common combination)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_task_status 
ON "Bid"(taskId, status);

-- Composite index for user + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_user_status 
ON "Bid"(userId, status);

-- Index for bid amount (sorting, filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_amount 
ON "Bid"(amount);

-- ============================================================================
-- REVIEW TABLE INDEXES
-- ============================================================================

-- Index for subject (reviewed user) lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_subject 
ON "Review"(subjectId);

-- Index for author (reviewer) lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_author 
ON "Review"(authorId);

-- Index for task-related reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_task 
ON "Review"(taskId);

-- Index for rating-based filtering and sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_rating 
ON "Review"(rating);

-- Index for review creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_created 
ON "Review"(createdAt DESC);

-- Composite index for subject + rating (average calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_subject_rating 
ON "Review"(subjectId, rating);

-- ============================================================================
-- CATEGORY TABLE INDEXES
-- ============================================================================

-- Index for active categories
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active 
ON "Category"(isActive) 
WHERE isActive = true;

-- Index for category name (searching, sorting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_name 
ON "Category"(name);

-- ============================================================================
-- NOTIFICATION TABLE INDEXES (if exists)
-- ============================================================================

-- Index for user notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user 
ON "Notification"(userId) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification');

-- Index for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON "Notification"(userId, isRead) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification') 
AND isRead = false;

-- Index for notification creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created 
ON "Notification"(createdAt DESC) 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Notification');

-- ============================================================================
-- FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Full-text search index for task titles and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_fulltext 
ON "Task" USING gin(to_tsvector('english', title || ' ' || description));

-- Full-text search index for user names
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fulltext 
ON "User" USING gin(to_tsvector('english', firstName || ' ' || lastName));

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Index for open tasks only (most frequently queried)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_open 
ON "Task"(createdAt DESC) 
WHERE status = 'OPEN';

-- Index for completed tasks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_completed 
ON "Task"(createdAt DESC) 
WHERE status = 'COMPLETED';

-- Index for pending bids
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_pending 
ON "Bid"(createdAt DESC) 
WHERE status = 'PENDING';

-- Index for accepted bids
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bids_accepted 
ON "Bid"(taskId) 
WHERE status = 'ACCEPTED';

-- ============================================================================
-- STATISTICS AND MAINTENANCE
-- ============================================================================

-- Update table statistics after creating indexes
ANALYZE "User";
ANALYZE "Task";
ANALYZE "Bid";
ANALYZE "Review";
ANALYZE "Category";

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to identify unused indexes
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    index_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        pg_size_pretty(pg_relation_size(s.indexrelid))::text as index_size
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    WHERE s.schemaname = 'public'
    AND s.idx_scan = 0
    AND NOT i.indisunique
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_users_email IS 'Optimizes user authentication and email uniqueness checks';
COMMENT ON INDEX idx_tasks_status IS 'Optimizes task filtering by status (most common query)';
COMMENT ON INDEX idx_bids_task IS 'Optimizes bid lookups for specific tasks';
COMMENT ON INDEX idx_reviews_subject IS 'Optimizes user rating and review calculations';
COMMENT ON INDEX idx_tasks_fulltext IS 'Enables full-text search on task titles and descriptions';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Performance optimization indexes have been created successfully.';
    RAISE NOTICE 'Use get_index_usage_stats() to monitor index performance.';
    RAISE NOTICE 'Use get_unused_indexes() to identify unused indexes.';
END $$;
