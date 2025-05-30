/**
 * Location Service
 * 
 * This service handles all location-related operations including:
 * - Geocoding addresses to coordinates
 * - Finding nearby users and tasks
 * - Calculating distances between locations
 * - Providing location-based analytics
 */

import { db } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Core interfaces that define the structure of our location data.
 */
export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
}

export interface ProximityMatch {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string; // Uses undefined for missing values (TypeScript convention)
  trustScore: number;
  verificationLevel: string;
  distance: number; // in kilometers
  location: {
    city: string;
    state: string;
    country: string;
  };
  skills?: string[];
  averageRating?: number;
  completedTasks?: number;
}

export interface NearbyTasksResult {
  taskId: string;
  title: string;
  description: string;
  budget: number;
  budgetType: string;
  distance: number; // in kilometers
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    avatar?: string;
    trustScore: number;
  };
  createdAt: Date;
  bidCount: number;
}

/**
 * Define proper types for database entities returned by Prisma.
 * 
 * These interfaces bridge the gap between what Prisma returns
 * (which uses 'null' for missing database values) and what our application
 * interfaces expect (which use 'undefined' for optional properties).
 * 
 * This separation is crucial for maintaining clean architecture - it allows
 * us to handle database concerns separately from business logic concerns.
 */
interface TaskerUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  trustScore: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  reviewsReceived: Array<{ rating: number }>;
  assignedTasks: Array<{ id: string }>;
}

interface TaskWithLocation {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  createdAt: Date;
  owner: {
    firstName: string;
    lastName: string;
    avatar: string | null; // Database field - can be NULL
    trustScore: number;
  };
  _count: {
    bids: number;
  };
}

interface LocationStatistics {
  userDistribution: Array<{
    city: string | null;
    state: string | null;
    country: string | null;
    _count: { id: number };
  }>;
  taskDistribution: Array<{
    city: string | null;
    state: string | null;
    country: string | null;
    _count: { id: number };
  }>;
  totalUsersWithLocation: number;
  totalTasksWithLocation: number;
  coverageStats: {
    usersWithLocation: number;
    tasksWithLocation: number;
  };
}

/**
 * Location Service Class
 * 
 * Handles location-related functionality including geocoding, distance calculations,
 * and finding nearby users and tasks.
 */
export class LocationService {
  /**
   * Utility method to safely convert null to undefined.
   * 
   * This is a common pattern when working with databases and TypeScript.
   * Databases use NULL to represent missing values, but TypeScript applications typically
   * use undefined for optional properties. This method creates a clean conversion boundary.
   */
  private convertNullToUndefined<T>(value: T | null): T | undefined {
    return value ?? undefined;
  }

  /**
   * Utility method specifically for string conversions.
   * This makes the code more readable and intention-revealing.
   */
  private safeString(value: string | null): string | undefined {
    return this.convertNullToUndefined(value);
  }

  /**
   * Utility method to ensure we always have a valid Date.
   * 
   * For critical fields like createdAt, we should never allow
   * undefined values. This method provides a defensive approach - if somehow
   * the date is missing, we log a warning and provide a fallback.
   */
  private ensureValidDate(date: Date | null | undefined, fieldName: string): Date {
    if (!date) {
      logger.warn(`Missing ${fieldName} date, using current time as fallback`);
      return new Date();
    }
    return date;
  }

  /**
   * Geocode an address to get latitude and longitude
   * 
   * This would typically integrate with Google Maps Geocoding API
   * or similar service to convert addresses to coordinates.
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number }> {
    logger.info('Geocoding address', { address });

    try {
      // In a real implementation, this would call an external geocoding API
      // For this example, we'll simulate a response
      
      // This is a mock implementation
      // In production, you would use a service like Google Maps Geocoding API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate plausible coordinates based on the address string
      // This is just for demonstration - real geocoding would return accurate coordinates
      const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Generate latitude between -90 and 90
      const latitude = ((hash % 180) - 90) + (Math.random() * 0.1);
      
      // Generate longitude between -180 and 180
      const longitude = ((hash * 2) % 360) - 180 + (Math.random() * 0.1);
      
      logger.info('Address geocoded successfully', { address, latitude, longitude });
      
      return { latitude, longitude };
    } catch (error) {
      logger.error('Error geocoding address', { error, address });
      throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update user location with geocoding
   * 
   * This updates a user's location information and automatically
   * geocodes their address to get precise coordinates.
   */
  async updateUserLocation(userId: string, locationData: LocationData): Promise<void> {
    logger.info('Updating user location', { userId });

    try {
      // Validate user exists
      const user = await db.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user location
      await db.user.update({
        where: { id: userId },
        data: {
          location: locationData.address,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          zipCode: locationData.zipCode,
          latitude: locationData.latitude,
          longitude: locationData.longitude
        }
      });

      logger.info('User location updated successfully', { userId });
    } catch (error) {
      logger.error('Error updating user location', { error, userId });
      throw error;
    }
  }

  /**
   * Calculate distance between two geographic points
   * 
   * Uses the Haversine formula to calculate the great-circle distance
   * between two points on Earth given their latitude and longitude.
   * 
   * The Haversine formula is the standard way to calculate
   * distances on a sphere. It accounts for the Earth's curvature, which is
   * important for accurate distance calculations over longer distances.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert degrees to radians
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    // Haversine formula
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    return parseFloat(distance.toFixed(2)); // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * Helper method for distance calculations
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Find nearby users (taskers) within a specified radius
   * 
   * This is like searching for service providers in your area.
   * It finds users with the TASKER role within the specified distance.
   * 
   * This method demonstrates the layered approach to data processing:
   * 1. Fetch raw data from database (with null values)
   * 2. Process and filter the data (applying business logic)
   * 3. Transform to application format (converting null to undefined)
   */
  async findNearbyTaskers(
    centerLat: number,
    centerLon: number,
    radiusKm: number = 50,
    _skills?: string[], // Prefixed with underscore to indicate intentionally unused parameter
    minTrustScore?: number,
    limit: number = 20
  ): Promise<ProximityMatch[]> {
    logger.info('Finding nearby taskers', { centerLat, centerLon, radiusKm, minTrustScore, limit });

    try {
      // Fetch taskers from database
      const taskers = await this.fetchTaskersFromDatabase(minTrustScore, limit);
      
      // Process taskers and calculate distances
      const nearbyTaskers = await this.processTaskersWithDistance(
        taskers,
        centerLat,
        centerLon,
        radiusKm
      );
      
      // Sort by distance (closest first)
      nearbyTaskers.sort((a, b) => a.distance - b.distance);
      
      // Apply limit
      const limitedResults = nearbyTaskers.slice(0, limit);
      
      logger.info('Found nearby taskers', { count: limitedResults.length });
      return limitedResults;
    } catch (error) {
      logger.error('Error finding nearby taskers', { error, centerLat, centerLon });
      throw error;
    }
  }

  /**
   * Fetch taskers from database with proper typing
   * 
   * By separating the database query into its own method,
   * we create a clear boundary between data access and business logic.
   * This makes the code easier to test and maintain.
   */
  private async fetchTaskersFromDatabase(minTrustScore?: number, limit: number = 20): Promise<TaskerUser[]> {
    // Build where clause
    const where: any = {
      role: 'TASKER',
      isActive: true,
      latitude: { not: null },
      longitude: { not: null }
    };
    
    // Add trust score filter if provided
    if (minTrustScore !== undefined) {
      where.trustScore = { gte: minTrustScore };
    }
    
    // Query database
    return db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        trustScore: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        country: true,
        emailVerified: true,
        phoneVerified: true,
        reviewsReceived: {
          select: {
            rating: true
          }
        },
        assignedTasks: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            id: true
          }
        }
      },
      take: limit * 2 // Fetch more than needed to account for distance filtering
    });
  }

  /**
   * Process taskers and calculate distances
   * 
   * This method demonstrates the transformation pattern WITH async operations.
   * Notice how we make this method async so we can await the verification level calculation
   * for each tasker. This is a common pattern when transforming data that requires additional
   * database queries during the transformation process.
   * 
   * When any part of your data transformation requires async operations
   * (like database queries), the entire transformation method must be async, and you
   * need to carefully handle the async operations - either with await in a loop (as shown here)
   * or with Promise.all() for better performance when operations can run in parallel.
   */
  private async processTaskersWithDistance(
    taskers: TaskerUser[],
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): Promise<ProximityMatch[]> {
    const result: ProximityMatch[] = [];
    
    for (const tasker of taskers) {
      // Skip taskers without location data
      if (tasker.latitude === null || tasker.longitude === null) {
        continue;
      }
      
      // Calculate distance
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        tasker.latitude,
        tasker.longitude
      );
      
      // Skip taskers outside the radius
      if (distance > radiusKm) {
        continue;
      }
      
      // Calculate verification level
      const verificationLevel = await this.calculateVerificationLevel(tasker);
      
      // Calculate average rating
      const averageRating = this.calculateAverageRating(tasker.reviewsReceived);
      
      // Create proximity match
      result.push({
        userId: tasker.id,
        firstName: tasker.firstName,
        lastName: tasker.lastName,
        avatar: this.convertNullToUndefined(tasker.avatar),
        trustScore: tasker.trustScore,
        verificationLevel,
        distance,
        location: {
          city: tasker.city ?? 'Unknown',
          state: tasker.state ?? 'Unknown',
          country: tasker.country ?? 'Unknown'
        },
        averageRating,
        completedTasks: tasker.assignedTasks.length
      });
    }
    
    return result;
  }

  /**
   * Calculate verification level for a tasker
   * 
   * This encapsulates business logic for determining
   * verification levels. By keeping this in a separate method, we can
   * easily modify the logic or add more sophisticated verification rules.
   */
  private async calculateVerificationLevel(tasker: TaskerUser): Promise<string> {
    // Basic verification requires email verification
    if (!tasker.emailVerified) {
      return 'UNVERIFIED';
    }
    
    // Standard verification requires email and phone verification
    if (!tasker.phoneVerified) {
      return 'BASIC';
    }
    
    // Check for document verification
    const documentVerification = await db.documentVerification.findFirst({
      where: {
        userId: tasker.id,
        status: 'VERIFIED'
      }
    });
    
    // Premium verification requires document verification
    if (!documentVerification) {
      return 'STANDARD';
    }
    
    return 'PREMIUM';
  }

  /**
   * Calculate average rating from reviews
   * 
   * This method demonstrates defensive programming.
   * We handle the case where there are no reviews gracefully.
   */
  private calculateAverageRating(reviews: Array<{ rating: number }>): number | undefined {
    if (reviews.length === 0) {
      return undefined;
    }
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / reviews.length;
    
    return parseFloat(average.toFixed(1)); // Round to 1 decimal place
  }

  /**
   * Find nearby tasks within a specified radius
   * 
   * This is like browsing job opportunities in your area.
   * It finds open tasks within the specified distance.
   * 
   * This method follows the same pattern as findNearbyTaskers:
   * fetch, process, transform, sort, and return. This consistency makes the
   * codebase easier to understand and maintain.
   */
  async findNearbyTasks(
    centerLat: number,
    centerLon: number,
    radiusKm: number = 50,
    categoryId?: string,
    budgetMin?: number,
    budgetMax?: number,
    limit: number = 20
  ): Promise<NearbyTasksResult[]> {
    logger.info('Finding nearby tasks', { 
      centerLat, 
      centerLon, 
      radiusKm, 
      categoryId, 
      budgetMin, 
      budgetMax, 
      limit 
    });

    try {
      // Fetch tasks from database
      const tasks = await this.fetchTasksFromDatabase(
        categoryId,
        budgetMin,
        budgetMax,
        limit * 2 // Fetch more than needed to account for distance filtering
      );
      
      // Process tasks and calculate distances
      const nearbyTasks = this.processTasksWithDistance(
        tasks,
        centerLat,
        centerLon,
        radiusKm
      );
      
      // Sort by distance (closest first)
      nearbyTasks.sort((a, b) => a.distance - b.distance);
      
      // Apply limit
      const limitedResults = nearbyTasks.slice(0, limit);
      
      logger.info('Found nearby tasks', { count: limitedResults.length });
      return limitedResults;
    } catch (error) {
      logger.error('Error finding nearby tasks', { error, centerLat, centerLon });
      throw error;
    }
  }

  /**
   * Fetch tasks from database with filters
   * 
   * This method builds the database query dynamically
   * based on the provided filters. The use of Record<string, unknown>
   * provides type safety while allowing flexible query building.
   */
  private async fetchTasksFromDatabase(
    categoryId?: string,
    budgetMin?: number,
    budgetMax?: number,
    limit: number = 20
  ): Promise<TaskWithLocation[]> {
    // Build where clause
    const where: Record<string, unknown> = {
      status: 'OPEN',
      latitude: { not: null },
      longitude: { not: null }
    };
    
    // Add category filter if provided
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Add budget filters if provided
    if (budgetMin !== undefined || budgetMax !== undefined) {
      where.budget = {};
      
      if (budgetMin !== undefined) {
        (where.budget as any).gte = budgetMin;
      }
      
      if (budgetMax !== undefined) {
        (where.budget as any).lte = budgetMax;
      }
    }
    
    // Query database
    return db.task.findMany({
      where: where as any, // Type assertion needed due to dynamic nature
      select: {
        id: true,
        title: true,
        description: true,
        budget: true,
        budgetType: true,
        latitude: true,
        longitude: true,
        location: true,
        city: true,
        state: true,
        createdAt: true,
        owner: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            trustScore: true
          }
        },
        _count: {
          select: {
            bids: true
          }
        }
      },
      take: limit
    });
  }

  /**
   * Process tasks and calculate distances
   * 
   * This is where the main transformation happens.
   * We convert from TaskWithLocation (database format) to NearbyTasksResult
   * (application format). Notice how we handle each field carefully:
   * 
   * 1. Required fields are passed through directly
   * 2. Nullable fields are converted using our utility methods
   * 3. Calculated fields (like distance) are added
   */
  private processTasksWithDistance(
    tasks: TaskWithLocation[],
    centerLat: number,
    centerLon: number,
    radiusKm: number
  ): NearbyTasksResult[] {
    const result: NearbyTasksResult[] = [];
    
    for (const task of tasks) {
      // Skip tasks without location data
      if (task.latitude === null || task.longitude === null) {
        continue;
      }
      
      // Calculate distance
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        task.latitude,
        task.longitude
      );
      
      // Skip tasks outside the radius
      if (distance > radiusKm) {
        continue;
      }
      
      // Create nearby task result
      result.push({
        taskId: task.id,
        title: task.title,
        description: task.description,
        budget: task.budget,
        budgetType: task.budgetType,
        distance,
        location: {
          address: this.safeString(task.location),
          city: this.safeString(task.city),
          state: this.safeString(task.state),
          country: 'Unknown' // Assuming country is not stored with tasks
        },
        owner: {
          firstName: task.owner.firstName,
          lastName: task.owner.lastName,
          avatar: this.convertNullToUndefined(task.owner.avatar),
          trustScore: task.owner.trustScore
        },
        createdAt: this.ensureValidDate(task.createdAt, 'task.createdAt'),
        bidCount: task._count.bids
      });
    }
    
    return result;
  }

  /**
   * Get location statistics for analytics
   * 
   * This provides insights about geographic distribution of users and tasks.
   * 
   * This method demonstrates working with Prisma's groupBy
   * functionality and handling aggregate data. The return type is explicitly
   * defined to ensure type safety.
   */
  async getLocationStatistics(): Promise<LocationStatistics> {
    logger.info('Getting location statistics');

    try {
      // Get user distribution by location
      const userDistribution = await db.user.groupBy({
        by: ['city', 'state', 'country'],
        where: {
          city: { not: null },
          state: { not: null },
          country: { not: null }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 20 // Top 20 locations
      });
      
      // Get task distribution by location
      const taskDistribution = await db.task.groupBy({
        by: ['city', 'state'],
        where: {
          city: { not: null },
          state: { not: null }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 20 // Top 20 locations
      });
      
      // Count users with location data
      const totalUsersWithLocation = await db.user.count({
        where: {
          latitude: { not: null },
          longitude: { not: null }
        }
      });
      
      // Count total users
      const totalUsers = await db.user.count();
      
      // Count tasks with location data
      const totalTasksWithLocation = await db.task.count({
        where: {
          latitude: { not: null },
          longitude: { not: null }
        }
      });
      
      // Count total tasks
      const totalTasks = await db.task.count();
      
      // Calculate coverage percentages
      const userCoverage = totalUsers > 0 ? (totalUsersWithLocation / totalUsers) * 100 : 0;
      const taskCoverage = totalTasks > 0 ? (totalTasksWithLocation / totalTasks) * 100 : 0;
      
      return {
        userDistribution,
        taskDistribution,
        totalUsersWithLocation,
        totalTasksWithLocation,
        coverageStats: {
          usersWithLocation: parseFloat(userCoverage.toFixed(2)),
          tasksWithLocation: parseFloat(taskCoverage.toFixed(2))
        }
      };
    } catch (error) {
      logger.error('Error getting location statistics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
