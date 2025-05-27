/**
 * User Service
 * 
 * This service provides business logic for user-related operations.
 * It uses caching to improve performance for frequently accessed data.
 */

import { PrismaClient } from '@prisma/client';
import { cacheService, CachePrefix } from '../utils/cache';
import { logger } from '../utils/logger';
import { ErrorType } from '../utils/error-types';
import { UserRole } from '../../../shared/types/enums';
import { recordAuditEvent, AuditEventType } from '../utils/audit-trail';
import { AccessAuditLogEntry, CreateAuditLogEntry } from '../utils/audit-trail-types';
import { measureDbQuery, measureCacheOperation } from '../middleware/performance-profiler';
import { validateWithZod } from '../utils/validation-utils';
import { ValidationSchemas } from '../utils/validation-schemas';
import { withTransaction } from '../utils/db-transaction';
import { isFeatureEnabled } from '../utils/feature-flags';
// Import pagination utilities when needed
import { serviceRegistry, ServiceType } from '../utils/service-registry';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Hash a password
 */
async function hashPassword(password: string): Promise<string> {
  try {
    const bcrypt = await import('bcrypt');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Failed to hash password', { error });
    throw new UserError(
      'Password processing error',
      ErrorType.SERVER_ERROR,
      500
    );
  }
}

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  USER_DETAIL: 60 * 10,      // 10 minutes
  USER_LIST: 60 * 5,         // 5 minutes
  USER_STATS: 60 * 30,       // 30 minutes
  USER_RATINGS: 60 * 15,     // 15 minutes
  POPULAR_USERS: 60 * 60     // 1 hour
};

/**
 * Custom error class for user-related errors
 */
export class UserError extends Error {
  type: ErrorType;
  statusCode: number;

  constructor(message: string, type: ErrorType, statusCode: number) {
    super(message);
    this.name = 'UserError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * User service for user-related operations
 */
export class UserService {
  /**
   * Get a user by ID with caching
   */
  public async getUserById(userId: string, includeDetails = false): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}${includeDetails ? ':detailed' : ''}`;
      
      // Try to get from cache first with performance measurement
      const cachedUser = await measureCacheOperation('getUserById.cache', async () => {
        return await cacheService.get<any>(cacheKey);
      });
      
      if (cachedUser) {
        logger.debug('Cache hit for user', { userId });
        return cachedUser;
      }
      
      // Feature flag for extended user profile information
      const includeExtendedProfile = await isFeatureEnabled('extended-user-profiles');
      
      // Cache miss, fetch from database with performance measurement
      const user = await measureDbQuery('getUserById.db', async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          include: includeDetails ? {
            tasks: {
              where: { status: { not: 'DRAFT' } },
              take: 5,
              orderBy: { createdAt: 'desc' }
            },
            assignedTasks: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            },
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                reviewer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            },
            // Include extended profile data if the feature is enabled
            ...includeExtendedProfile && includeDetails ? {
              notifications: {
                take: 10,
                where: { read: false },
                orderBy: { createdAt: 'desc' }
              },
              bids: {
                take: 5,
                orderBy: { submittedAt: 'desc' }
              }
            } : {}
          } : undefined
        });
      });
      
      if (user) {
        // Exclude sensitive information
        const { passwordHash, ...safeUserData } = user;
        
        // Record audit event for sensitive data access
        if (includeDetails) {
          await recordAuditEvent({
            entityType: 'user',
            entityId: userId,
            action: AuditEventType.ACCESS,
            userId: 'system',  // Will be replaced with actual user ID from request context in production
            requestId: '',
            ipAddress: '',
            userAgent: '',
            metadata: {
              accessType: 'detailed-view',
              includeExtendedProfile
            }
          } as AccessAuditLogEntry);
        }
        
        // Cache the result with performance measurement
        await measureCacheOperation('getUserById.setCache', async () => {
          await cacheService.set(cacheKey, safeUserData, CACHE_TTL.USER_DETAIL);
        });
        
        logger.debug('Cached user', { userId });
        return safeUserData;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get user', { userId, error });
      throw error;
    }
  }

  /**
   * Get users with filtering and pagination support
   */
  public async getUsers(filters: any = {}, page = 1, limit = 10): Promise<any> {
    try {
      const { role, search, minRating, verified, sortBy = 'createdAt', sortDir = 'desc' } = filters;
      
      // Build cache key from filters
      const cacheKey = `${CachePrefix.LIST}users:${JSON.stringify({
        role, search, minRating, verified, sortBy, sortDir, page, limit
      })}`;
      
      // Try to get from cache first
      const cachedResult = await cacheService.get<any>(cacheKey);
      if (cachedResult) {
        logger.debug('Cache hit for users list');
        return cachedResult;
      }
      
      // Build filter conditions
      const where: any = {};
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (minRating) {
        where.averageRating = { gte: parseFloat(minRating) };
      }
      
      if (verified !== undefined) {
        where.emailVerified = verified === 'true' || verified === true;
      }
      
      // Build sort options
      const orderBy: any = {};
      orderBy[sortBy] = sortDir;
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute queries in parallel
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            averageRating: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.user.count({ where })
      ]);
      
      const result = {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL.USER_LIST);
      logger.debug('Cached users list', { count: users.length, total });
      
      return result;
    } catch (error) {
      logger.error('Failed to get users', { error });
      throw error;
    }
  }

  /**
   * Update a user's profile
   */
  public async updateUser(userId: string, updates: any): Promise<any> {
    try {
      // Get existing user to ensure it exists
      const existingUser = await this.getUserById(userId);
      
      if (!existingUser) {
        throw new UserError('User not found', ErrorType.NOT_FOUND, 404);
      }
      
      // Never allow updates to these fields through this method
      const { password, email, role, ...safeUpdates } = updates;
      
      // Update user in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: safeUpdates,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          skills: true,
          averageRating: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Invalidate related caches
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}*`);
      await cacheService.deletePattern(`${CachePrefix.LIST}users:*`);
      
      return updatedUser;
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      logger.error('Failed to update user', { userId, error });
      throw error;
    }
  }

  /**
   * Create a new user with validation and audit trail
   */
  public async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    try {
      // Validate user data against schema
      const validationResult = validateWithZod(ValidationSchemas.User.create, {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role ?? UserRole.USER
      });
      
      if (!validationResult.success) {
        throw new UserError(
          'Invalid user data: ' + validationResult.errors?.issues.map(i => i.message).join(', '),
          ErrorType.VALIDATION,
          400
        );
      }
      
      // Use transaction for atomicity
      return await withTransaction(async (tx) => {
        // Check if user with the same email already exists
        const existingUser = await measureDbQuery('checkExistingUser', async () => {
          return await tx.user.findUnique({
            where: { email: userData.email }
          });
        });
        
        if (existingUser) {
          throw new UserError(
            'User with this email already exists',
            ErrorType.CONFLICT,
            409
          );
        }
        
        // Generate password hash
        const passwordHash = await hashPassword(userData.password);
        
        // Check if email verification is required based on feature flag
        const requireEmailVerification = await isFeatureEnabled('require-email-verification');
        
        // Create user
        const newUser = await measureDbQuery('createUser', async () => {
          return await tx.user.create({
            data: {
              email: userData.email,
              passwordHash,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role ?? UserRole.USER,
              emailVerified: !requireEmailVerification, // Skip verification if feature is disabled
              phoneVerified: false,
              trustScore: 0
            }
          });
        });
        
        // Record audit event
        await recordAuditEvent({
          entityType: 'user',
          entityId: newUser.id,
          action: AuditEventType.CREATE,
          userId: 'system', // system action for self-registration
          requestId: userData.requestId ?? '',
          ipAddress: userData.ipAddress ?? '',
          userAgent: userData.userAgent ?? '',
          newValues: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role ?? UserRole.USER
          },
          metadata: {
            requireEmailVerification
          }
        } as CreateAuditLogEntry, tx);
        
        // Remove sensitive information
        const { passwordHash: _, ...safeUserData } = newUser;
        
        // Invalidate cache
        await measureCacheOperation('invalidateUserCache', async () => {
          await cacheService.delete(`${CachePrefix.USER}count`);
        });
        
        // Register user with service registry if enabled
        if (await isFeatureEnabled('service-discovery')) {
          serviceRegistry.registerService({
            name: `user-${newUser.id}`,
            type: ServiceType.USER_SERVICE,
            host: 'internal',
            port: 0,
            url: '',
            healthCheckUrl: '',
            status: ServiceType.UP,
            metadata: {
              userId: newUser.id,
              role: newUser.role,
              createdAt: newUser.createdAt
            }
          });
        }
        
        return safeUserData;
      });
    } catch (error) {
      if (error instanceof UserError) {
        throw error;
      }
      
      logger.error('Failed to create user', { email: userData.email, error });
      throw new UserError(
        'Failed to create user',
        ErrorType.SERVER_ERROR,
        500
      );
    }
  }

  /**
   * Get user ratings and reviews with caching
   */
  public async getUserRatings(userId: string, page = 1, limit = 10): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:ratings:${page}:${limit}`;
      
      // Try to get from cache first
      const cachedRatings = await cacheService.get<any>(cacheKey);
      if (cachedRatings) {
        logger.debug('Cache hit for user ratings', { userId });
        return cachedRatings;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      // Execute queries in parallel
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            task: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }),
        prisma.review.count({ where: { userId } })
      ]);
      
      // Calculate average rating
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : 0;
      
      const result = {
        reviews,
        averageRating,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result, CACHE_TTL.USER_RATINGS);
      logger.debug('Cached user ratings', { userId, count: reviews.length });
      
      return result;
    } catch (error) {
      logger.error('Failed to get user ratings', { userId, error });
      throw error;
    }
  }

  /**
   * Get top rated taskers with caching
   */
  public async getTopRatedTaskers(limit = 5): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.LIST}top-taskers:${limit}`;
      
      // Try to get from cache first
      const cachedTaskers = await cacheService.get<any[]>(cacheKey);
      if (cachedTaskers) {
        logger.debug('Cache hit for top rated taskers');
        return cachedTaskers;
      }
      
      // Get top rated taskers
      const taskers = await prisma.user.findMany({
        where: {
          role: UserRole.TASKER,
          averageRating: { gt: 0 }
        },
        orderBy: {
          averageRating: 'desc'
        },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          bio: true,
          averageRating: true,
          skills: true,
          _count: {
            select: {
              assignedTasks: true,
              reviews: true
            }
          }
        }
      });
      
      // Cache the result
      await cacheService.set(cacheKey, taskers, CACHE_TTL.POPULAR_USERS);
      logger.debug('Cached top rated taskers', { count: taskers.length });
      
      return taskers;
    } catch (error) {
      logger.error('Failed to get top rated taskers', { error });
      throw error;
    }
  }

  /**
   * Get user statistics with caching
   */
  public async getUserStats(userId: string): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:stats`;
      
      // Try to get from cache first
      const cachedStats = await cacheService.get<any>(cacheKey);
      if (cachedStats) {
        logger.debug('Cache hit for user stats', { userId });
        return cachedStats;
      }
      
      // Execute queries in parallel
      const [
        tasksPosted,
        tasksAssigned,
        reviewsReceived,
        bidsMade,
        bidsAccepted,
        user
      ] = await Promise.all([
        prisma.task.count({ where: { ownerId: userId } }),
        prisma.task.count({ where: { assigneeId: userId } }),
        prisma.review.count({ where: { userId } }),
        prisma.bid.count({ where: { bidderId: userId } }),
        prisma.bid.count({ 
          where: { 
            bidderId: userId,
            status: 'ACCEPTED'
          } 
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { 
            averageRating: true,
            createdAt: true
          }
        })
      ]);
      
      // Calculate derived metrics
      const stats = {
        tasksPosted,
        tasksAssigned,
        reviewsReceived,
        bidsMade,
        bidsAccepted,
        bidSuccessRate: bidsMade > 0 ? (bidsAccepted / bidsMade) * 100 : 0,
        averageRating: user?.averageRating ?? 0,
        accountAge: user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0 // in days
      };
      
      // Cache the result
      await cacheService.set(cacheKey, stats, CACHE_TTL.USER_STATS);
      logger.debug('Cached user stats', { userId });
      
      return stats;
    } catch (error) {
      logger.error('Failed to get user stats', { userId, error });
      throw error;
    }
  }

  /**
   * Check if a username or email is already taken
   */
  public async checkUserAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true }
      });
      
      return { available: !user };
    } catch (error) {
      logger.error('Failed to check user availability', { email, error });
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();

export default userService;
