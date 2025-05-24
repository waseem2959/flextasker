import { db } from '@/utils/database';
import { logger } from '@/utils/logger';

/**
 * Location service - this is like having a sophisticated GPS and mapping system
 * that helps match users with nearby opportunities, calculates distances,
 * and provides location-based recommendations.
 * 
 * Think of this as the geographic intelligence center that makes our platform
 * location-aware and helps users find work or workers in their area.
 * 
 * EDUCATIONAL NOTE: This service demonstrates proper TypeScript patterns for:
 * 1. Converting between database types (null) and application types (undefined)
 * 2. Creating modular, testable methods
 * 3. Handling optional data safely
 * 4. Maintaining type safety throughout data transformations
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
  distance: number;
  location: {
    address?: string;
    city?: string;
    state?: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    avatar?: string; // Uses undefined for missing values
    trustScore: number;
  };
  createdAt: Date; // Required field - must always be present
  bidCount: number; // Required field - count of bids
}

/**
 * Define proper types for database entities returned by Prisma.
 * 
 * EDUCATIONAL NOTE: These interfaces bridge the gap between what Prisma returns
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
  avatar: string | null; // Database field - can be NULL
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
  createdAt: Date; // This should always exist in the database
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

export class LocationService {
  
  /**
   * Utility method to safely convert null to undefined.
   * 
   * EDUCATIONAL NOTE: This is a common pattern when working with databases and TypeScript.
   * Databases use NULL to represent missing values, but TypeScript applications typically
   * use undefined for optional properties. This method creates a clean conversion boundary.
   */
  private convertNullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
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
   * EDUCATIONAL NOTE: For critical fields like createdAt, we should never allow
   * undefined values. This method provides a defensive approach - if somehow
   * the date is missing, we log a warning and provide a fallback.
   */
  private ensureValidDate(date: Date | null | undefined, fieldName: string): Date {
    return date ?? (() => {
      logger.warn(`Missing ${fieldName} field, using current date as fallback`);
      return new Date();
    })();
  }

  /**
   * Geocode an address to get latitude and longitude
   * 
   * This would typically integrate with Google Maps Geocoding API
   * or similar service to convert addresses to coordinates.
   */
  async geocodeAddress(_address: string): Promise<{ latitude: number; longitude: number }> {
    try {
      // Placeholder return for development
      logger.warn('Geocoding not implemented - using placeholder coordinates');
      return {
        latitude: 40.7128, // NYC coordinates as placeholder
        longitude: -74.0060,
      };
      
    } catch (error) {
      logger.error('Geocoding failed:', error);
      throw new Error('Unable to geocode address');
    }
  }

  /**
   * Update user location with geocoding
   * 
   * This updates a user's location information and automatically
   * geocodes their address to get precise coordinates.
   */
  async updateUserLocation(userId: string, locationData: LocationData): Promise<void> {
    try {
      // If coordinates aren't provided, geocode the address
      let { latitude, longitude } = locationData;
      
      if (!latitude || !longitude) {
        const fullAddress = `${locationData.address}, ${locationData.city}, ${locationData.state}, ${locationData.country} ${locationData.zipCode ?? ''}`;
        const coordinates = await this.geocodeAddress(fullAddress);
        latitude = coordinates.latitude;
        longitude = coordinates.longitude;
      }

      // Update user location in database
      await db.user.update({
        where: { id: userId },
        data: {
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
          country: locationData.country,
          zipCode: locationData.zipCode,
          latitude,
          longitude,
        },
      });

      logger.info('User location updated:', {
        userId,
        city: locationData.city,
        state: locationData.state,
        coordinates: `${latitude}, ${longitude}`,
      });

    } catch (error) {
      logger.error('Failed to update user location:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two geographic points
   * 
   * Uses the Haversine formula to calculate the great-circle distance
   * between two points on Earth given their latitude and longitude.
   * 
   * EDUCATIONAL NOTE: The Haversine formula is the standard way to calculate
   * distances on a sphere. It accounts for the Earth's curvature, which is
   * important for accurate distance calculations over longer distances.
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
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
   * EDUCATIONAL NOTE: This method demonstrates the layered approach to data processing:
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
    try {
      // Step 1: Fetch data from database
      const taskers = await this.fetchTaskersFromDatabase(minTrustScore, limit);
      
      // Step 2: Process data and apply distance filtering
      const nearbyTaskers = await this.processTaskersWithDistance(taskers, centerLat, centerLon, radiusKm);
      
      // Step 3: Sort results by distance, then by trust score
      nearbyTaskers.sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return b.trustScore - a.trustScore;
      });

      // Step 4: Return limited results
      const result = nearbyTaskers.slice(0, limit);

      logger.info('Nearby taskers found:', {
        centerCoordinates: `${centerLat}, ${centerLon}`,
        radius: radiusKm,
        totalFound: result.length,
      });

      return result;

    } catch (error) {
      logger.error('Failed to find nearby taskers:', error);
      throw error;
    }
  }

  /**
   * Fetch taskers from database with proper typing
   * 
   * EDUCATIONAL NOTE: By separating the database query into its own method,
   * we create a clear boundary between data access and business logic.
   * This makes the code easier to test and maintain.
   */
  private async fetchTaskersFromDatabase(minTrustScore?: number, limit: number = 20): Promise<TaskerUser[]> {
    return await db.user.findMany({
      where: {
        role: 'TASKER',
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
        ...(minTrustScore && { trustScore: { gte: minTrustScore } }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true, // This will be string | null from Prisma
        trustScore: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        country: true,
        emailVerified: true,
        phoneVerified: true,
        reviewsReceived: {
          select: { rating: true },
        },
        assignedTasks: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
      take: limit * 3, // Get more than needed to filter by distance
    });
  }

  /**
   * Process taskers and calculate distances
   * 
   * EDUCATIONAL NOTE: This method demonstrates the transformation pattern WITH async operations.
   * Notice how we make this method async so we can await the verification level calculation
   * for each tasker. This is a common pattern when transforming data that requires additional
   * database queries during the transformation process.
   * 
   * ASYNC LEARNING: When any part of your data transformation requires async operations
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
    const nearbyTaskers: ProximityMatch[] = [];

    for (const tasker of taskers) {
      // Skip taskers without valid coordinates
      if (!tasker.latitude || !tasker.longitude) continue;

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        tasker.latitude,
        tasker.longitude
      );

      // Only include taskers within the specified radius
      if (distance <= radiusKm) {
        // ASYNC OPERATION: We await the verification level calculation here
        // because it requires a database query to check for document verification
        const verificationLevel = await this.calculateVerificationLevel(tasker);
        const averageRating = this.calculateAverageRating(tasker.reviewsReceived);

        // Transform database data to application data
        // CRITICAL: Here we convert null to undefined using our utility method
        nearbyTaskers.push({
          userId: tasker.id,
          firstName: tasker.firstName,
          lastName: tasker.lastName,
          avatar: this.safeString(tasker.avatar), // Convert null to undefined
          trustScore: tasker.trustScore,
          verificationLevel, // Now this is a proper string, not a Promise<string>
          distance,
          location: {
            city: tasker.city ?? '', // Use nullish coalescing for required fields
            state: tasker.state ?? '',
            country: tasker.country ?? '',
          },
          averageRating: Math.round(averageRating * 10) / 10,
          completedTasks: tasker.assignedTasks.length,
        });
      }
    }

    return nearbyTaskers;
  }

  /**
   * Calculate verification level for a tasker
   * 
   * EDUCATIONAL NOTE: This encapsulates business logic for determining
   * verification levels. By keeping this in a separate method, we can
   * easily modify the logic or add more sophisticated verification rules.
   */
  private async calculateVerificationLevel(tasker: TaskerUser): Promise<string> {
    let verificationLevel = 'BASIC';
    
    if (tasker.emailVerified && tasker.phoneVerified) {
      verificationLevel = 'STANDARD';
      
      // Check for document verification
      const hasDocVerification = await db.verification.findFirst({
        where: {
          userId: tasker.id,
          status: 'VERIFIED',
        },
      });
      
      if (hasDocVerification) {
        verificationLevel = 'PREMIUM';
      }
    }
    
    return verificationLevel;
  }

  /**
   * Calculate average rating from reviews
   * 
   * EDUCATIONAL NOTE: This method demonstrates defensive programming.
   * We handle the case where there are no reviews gracefully.
   */
  private calculateAverageRating(reviews: Array<{ rating: number }>): number {
    if (reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  /**
   * Find nearby tasks within a specified radius
   * 
   * This is like browsing job opportunities in your area.
   * It finds open tasks within the specified distance.
   * 
   * EDUCATIONAL NOTE: This method follows the same pattern as findNearbyTaskers:
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
    try {
      // Step 1: Fetch tasks from database
      const tasks = await this.fetchTasksFromDatabase(categoryId, budgetMin, budgetMax, limit);
      
      // Step 2: Process and filter by distance
      const nearbyTasks = this.processTasksWithDistance(tasks, centerLat, centerLon, radiusKm);

      // Step 3: Sort by distance, then by creation date (newest first)
      nearbyTasks.sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Step 4: Return limited results
      const result = nearbyTasks.slice(0, limit);

      logger.info('Nearby tasks found:', {
        centerCoordinates: `${centerLat}, ${centerLon}`,
        radius: radiusKm,
        totalFound: result.length,
      });

      return result;

    } catch (error) {
      logger.error('Failed to find nearby tasks:', error);
      throw error;
    }
  }

  /**
   * Fetch tasks from database with filters
   * 
   * EDUCATIONAL NOTE: This method builds the database query dynamically
   * based on the provided filters. The use of Record<string, unknown>
   * provides type safety while allowing flexible query building.
   */
  private async fetchTasksFromDatabase(
    categoryId?: string,
    budgetMin?: number,
    budgetMax?: number,
    limit: number = 20
  ): Promise<TaskWithLocation[]> {
    const whereClause: Record<string, unknown> = {
      status: 'OPEN',
      latitude: { not: null },
      longitude: { not: null },
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (budgetMin !== undefined || budgetMax !== undefined) {
      const budgetFilter: Record<string, number> = {};
      if (budgetMin !== undefined) {
        budgetFilter.gte = budgetMin;
      }
      if (budgetMax !== undefined) {
        budgetFilter.lte = budgetMax;
      }
      whereClause.budget = budgetFilter;
    }

    return await db.task.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true, // This will be string | null from Prisma
            trustScore: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
      take: limit * 3, // Get more than needed to filter by distance
    });
  }

  /**
   * Process tasks and calculate distances
   * 
   * EDUCATIONAL NOTE: This is where the main transformation happens.
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
    const nearbyTasks: NearbyTasksResult[] = [];

    for (const task of tasks) {
      // Skip tasks without valid coordinates
      if (!task.latitude || !task.longitude) continue;

      // Calculate distance
      const distance = this.calculateDistance(
        centerLat,
        centerLon,
        task.latitude,
        task.longitude
      );

      // Only include tasks within the specified radius
      if (distance <= radiusKm) {
        // CRITICAL FIX: Here we properly map all fields instead of using placeholders
        nearbyTasks.push({
          taskId: task.id,
          title: task.title,
          description: task.description,
          budget: Number(task.budget),
          budgetType: task.budgetType,
          distance,
          location: {
            address: this.safeString(task.location), // Convert null to undefined
            city: this.safeString(task.city),
            state: this.safeString(task.state),
          },
          owner: {
            firstName: task.owner.firstName,
            lastName: task.owner.lastName,
            avatar: this.safeString(task.owner.avatar), // Convert null to undefined
            trustScore: task.owner.trustScore,
          },
          // FIXED: Use actual values instead of placeholders
          createdAt: this.ensureValidDate(task.createdAt, 'task.createdAt'),
          bidCount: task._count.bids, // Use actual bid count
        });
      }
    }

    return nearbyTasks;
  }

  /**
   * Get location statistics for analytics
   * 
   * This provides insights about geographic distribution of users and tasks.
   * 
   * EDUCATIONAL NOTE: This method demonstrates working with Prisma's groupBy
   * functionality and handling aggregate data. The return type is explicitly
   * defined to ensure type safety.
   */
  async getLocationStatistics(): Promise<LocationStatistics> {
    try {
      // Get user distribution by location
      const usersByLocation = await db.user.groupBy({
        by: ['city', 'state', 'country'],
        where: {
          isActive: true,
          city: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 20,
      });

      // Get task distribution by location
      const tasksByLocation = await db.task.groupBy({
        by: ['city', 'state', 'country'],
        where: {
          city: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 20,
      });

      // Get total counts
      const totalUsersWithLocation = await db.user.count({
        where: {
          isActive: true,
          latitude: { not: null },
          longitude: { not: null },
        },
      });

      const totalTasksWithLocation = await db.task.count({
        where: {
          latitude: { not: null },
          longitude: { not: null },
        },
      });

      return {
        userDistribution: usersByLocation,
        taskDistribution: tasksByLocation,
        totalUsersWithLocation,
        totalTasksWithLocation,
        coverageStats: {
          usersWithLocation: totalUsersWithLocation,
          tasksWithLocation: totalTasksWithLocation,
        },
      };

    } catch (error) {
      logger.error('Failed to get location statistics:', error);
      throw error;
    }
  }
}