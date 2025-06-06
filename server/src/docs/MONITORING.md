# FlexTasker Monitoring & Performance System

This document provides comprehensive information about the monitoring and performance optimization features implemented in FlexTasker.

## 🎯 Overview

The FlexTasker monitoring system provides real-time insights into application performance, security metrics, and system health. It includes automated alerting, performance optimization, and comprehensive dashboards for administrators.

## 📊 Features

### Performance Monitoring
- **Real-time Metrics**: API response times, database query performance, cache hit rates
- **Request Tracking**: Monitor all API requests with detailed timing and success rates
- **User Activity**: Track active users and session patterns
- **Automated Alerts**: Performance degradation detection with configurable thresholds

### Cache Management
- **Redis Distributed Caching**: Production-ready Redis cluster support with fallback
- **Intelligent Caching**: Multi-tier caching strategy with configurable TTL
- **Cache Analytics**: Hit/miss ratios, performance metrics, and optimization recommendations
- **Cache Invalidation**: Smart invalidation patterns for data consistency
- **Automatic Fallback**: Seamless fallback to memory cache when Redis unavailable
- **Cluster Support**: Redis cluster configuration for high availability

### Database Optimization
- **Read Replicas**: Automatic read/write splitting with load balancing
- **Connection Pooling**: Optimized connection management with PgBouncer support
- **Query Performance**: Monitor slow queries and execution patterns
- **Index Recommendations**: Automated suggestions for database optimization
- **Connection Monitoring**: Track database connection pool usage
- **Parallel Query Execution**: Optimized query patterns for better performance
- **Query Result Caching**: Redis-backed intelligent query caching
- **Automatic Failover**: Seamless fallback when read replicas unavailable

### Security Monitoring
- **Rate Limiting**: Comprehensive rate limiting with different tiers
- **Threat Detection**: Suspicious request pattern identification
- **Authentication Monitoring**: Failed login attempts and security events
- **CSRF Protection**: Cross-site request forgery prevention

## 🚀 Quick Start

### Accessing Monitoring Dashboard

1. **Admin Access Required**: All monitoring endpoints require admin privileges
2. **Base URL**: `/api/monitoring/`
3. **Authentication**: Bearer token with admin role

### Basic Health Check
```bash
# Public health check (no auth required)
GET /api/monitoring/health

# Detailed health check (admin only)
GET /api/monitoring/health/detailed
```

### Performance Metrics
```bash
# Get comprehensive metrics
GET /api/monitoring/metrics

# Filter by time period
GET /api/monitoring/metrics?period=24h
```

## 📈 API Endpoints

### Health & Status
- `GET /api/monitoring/health` - Basic health check
- `GET /api/monitoring/health/detailed` - Comprehensive health status

### Performance Metrics
- `GET /api/monitoring/metrics` - Performance dashboard data
- `GET /api/monitoring/alerts` - Current performance alerts
- `GET /api/monitoring/cache` - Cache performance statistics
- `GET /api/monitoring/database` - Database performance metrics
- `GET /api/monitoring/security` - Security metrics and risk assessment

### Database Optimization
- `GET /api/monitoring/connection-pool` - Connection pool metrics and health
- `GET /api/monitoring/database` - Enhanced database performance metrics

### Management
- `POST /api/monitoring/reset` - Reset all metrics (admin only)

## 🔧 Configuration

### Database Configuration
```bash
# Primary Database (Write Operations)
DATABASE_URL="postgresql://user:pass@localhost:5432/flextasker"

# Read Replicas (Read Operations)
DATABASE_READ_URLS="postgresql://user:pass@read1:5432/flextasker,postgresql://user:pass@read2:5432/flextasker"

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_CONNECTION_TIMEOUT=10000
DB_QUERY_TIMEOUT=30000
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=1000
```

### Redis Configuration
```bash
# Single Redis Instance (Development)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_KEY_PREFIX=flextasker:

# Redis Cluster (Production)
REDIS_CLUSTER=true
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
```

### Cache Configuration
```typescript
// Predefined cache configurations
cacheConfigs.short    // 1 minute TTL
cacheConfigs.medium   // 5 minutes TTL
cacheConfigs.long     // 1 hour TTL
cacheConfigs.userSpecific  // User-specific caching
cacheConfigs.public   // Public data caching

// Redis-specific features
await cacheUtils.isRedisAvailable()  // Check Redis connectivity
await redisCache.extend(key, ttl)    // Extend cache TTL
await redisCache.exists(key)         // Check if key exists
```

### Rate Limiting
```typescript
// Rate limit configurations
rateLimiters.api      // 60 requests/minute
rateLimiters.auth     // 5 attempts/15 minutes
rateLimiters.general  // 100 requests/15 minutes
```

### Performance Thresholds
```typescript
// Alert thresholds (configurable)
slowQueryThreshold: 1000ms
cacheHitRateThreshold: 70%
apiResponseTimeThreshold: 2000ms
errorRateThreshold: 5%
```

## 📊 Metrics Collected

### API Metrics
- Total requests
- Success/failure rates
- Average response times
- Requests per minute
- Active user count

### Cache Metrics
- Hit/miss ratios
- Cache size and utilization
- Average response times
- Cache invalidation events

### Database Metrics
- Query execution times
- Slow query identification
- Connection pool status
- Query frequency patterns

### Security Metrics
- Rate limit violations
- Authentication failures
- Suspicious request patterns
- CSRF attempt detection

## 🚨 Alerting System

### Alert Types
1. **Performance Alerts**
   - High API response times
   - Low cache hit rates
   - Slow database queries
   - High error rates

2. **Security Alerts**
   - Excessive rate limit hits
   - Suspicious request patterns
   - Authentication anomalies

3. **System Alerts**
   - High memory usage
   - Database connection issues
   - Service unavailability

### Alert Severities
- **Low**: Minor performance degradation
- **Medium**: Noticeable impact on user experience
- **High**: Critical issues requiring immediate attention

## 🔍 Performance Optimization

### Automatic Optimizations
1. **Query Optimization**: Parallel execution for complex queries
2. **Cache Strategy**: Intelligent caching based on request patterns
3. **Connection Pooling**: Optimized database connection management
4. **Memory Management**: Automatic cleanup and garbage collection

### Manual Optimizations
1. **Index Creation**: Apply suggested database indexes
2. **Cache Tuning**: Adjust TTL based on usage patterns
3. **Rate Limit Adjustment**: Modify limits based on traffic patterns

## 📝 Usage Examples

### Monitoring API Performance
```typescript
// Get current performance metrics
const response = await fetch('/api/monitoring/metrics', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const metrics = await response.json();

console.log('Cache Hit Rate:', metrics.data.summary.performance.cacheHitRate);
console.log('API Response Time:', metrics.data.summary.performance.averageApiResponseTime);
```

### Checking for Alerts
```typescript
// Get high-severity alerts
const alerts = await fetch('/api/monitoring/alerts?severity=high', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const alertData = await alerts.json();

if (alertData.data.count > 0) {
  console.log('Critical alerts detected:', alertData.data.alerts);
}
```

### Cache Management
```typescript
// Get cache statistics
const cacheStats = await fetch('/api/monitoring/cache', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const cacheData = await cacheStats.json();

console.log('Cache Hit Rate:', cacheData.data.performance.hitRate);
console.log('Recommendations:', cacheData.data.recommendations);
```

## 🛠 Development & Testing

### Running Tests
```bash
# Run monitoring system tests
npm test -- --testPathPattern=monitoring

# Run cache middleware tests
npm test -- --testPathPattern=cache-middleware

# Run database optimization tests
npm test -- --testPathPattern=database-optimization
```

### Local Development
```bash
# Start with monitoring enabled
npm run dev

# Access monitoring dashboard
curl http://localhost:3000/api/monitoring/health
```

## 🔒 Security Considerations

### Access Control
- All monitoring endpoints require admin authentication
- Rate limiting applied to prevent abuse
- Sensitive data is filtered from public endpoints

### Data Privacy
- User-specific data is anonymized in metrics
- Personal information is excluded from monitoring logs
- Compliance with data protection regulations

## 📚 Integration Examples

### Frontend Integration
```typescript
// React component for monitoring dashboard
const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    fetchMetrics().then(setMetrics);
  }, []);
  
  return (
    <div>
      <MetricsChart data={metrics?.performance} />
      <AlertsList alerts={metrics?.alerts} />
    </div>
  );
};
```

### External Monitoring
```bash
# Prometheus metrics endpoint
GET /api/monitoring/metrics

# Grafana dashboard integration
# Use the metrics API to create custom dashboards
```

## 🚀 Production Deployment

### Environment Variables
```bash
# Monitoring configuration
MONITORING_ENABLED=true
CACHE_TTL_DEFAULT=300
RATE_LIMIT_WINDOW=900000
SLOW_QUERY_THRESHOLD=1000
```

### Scaling Considerations
- Cache can be replaced with Redis for production
- Metrics can be exported to external monitoring systems
- Database optimization recommendations should be applied

## 📞 Support & Troubleshooting

### Common Issues
1. **High Memory Usage**: Check cache size limits and cleanup intervals
2. **Slow Queries**: Review database indexes and query patterns
3. **Rate Limit Issues**: Adjust limits based on legitimate traffic patterns

### Getting Help
- Check the monitoring dashboard for real-time insights
- Review application logs for detailed error information
- Use the alerts system to identify critical issues

---

For more information, see the [API Documentation](./swagger.ts) and [Performance Guide](./PERFORMANCE.md).
