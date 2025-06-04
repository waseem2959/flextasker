/**
 * Push Notification Service
 * 
 * This service handles all push notification operations including:
 * - Sending notifications to mobile devices
 * - Managing device tokens
 * - Handling notification delivery status
 */

import { prisma as db } from '../utils/database-utils';
import { logger } from '../utils/logger';

// Using require for firebase-admin to avoid TypeScript declaration issues
const firebase = require('firebase-admin');

// Type definitions for JSON handling
type InputJsonValue =
  | string
  | number
  | boolean
  | { [key: string]: InputJsonValue }
  | InputJsonValue[];

// Create type definitions to help TypeScript understand the Firebase API
type FirebaseApp = {
  messaging: () => {
    send: (message: any) => Promise<any>;
    sendMulticast: (message: any) => Promise<any>;
  };
  apps: any[];
};

// Type definitions for better type safety
export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deviceToken: string;
}

/**
 * Push Notification Service Class
 * 
 * Handles sending push notifications to mobile devices using Firebase Cloud Messaging.
 */
export class PushNotificationService {
  private readonly firebaseApp: FirebaseApp | null = null;
  private readonly initialized: boolean = false;

  constructor() {
    // Initialize Firebase Admin SDK
    try {
      if (firebase.apps.length === 0) {
        this.firebaseApp = firebase.initializeApp({
          credential: firebase.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
        this.initialized = true;
        logger.info('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = firebase.apps[0];
        this.initialized = true;
        logger.info('Using existing Firebase Admin SDK instance');
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error });
      this.firebaseApp = null as any;
    }
  }

  /**
   * Send a push notification to a single device
   */
  async sendPushNotification(
    deviceToken: string,
    message: string,
    data?: Record<string, any>
  ): Promise<NotificationResult> {
    logger.info('Sending push notification', { deviceToken });

    if (!this.isConfigured()) {
      logger.error('Push notification service not properly configured');
      return {
        success: false,
        error: 'Push notification service not configured',
        deviceToken: deviceToken
      };
    }

    try {
      // Prepare notification payload
      const normalizedPayload: PushNotificationPayload = {
        title: 'Flextasker',
        body: message,
        data: data || {},
        imageUrl: undefined
      };

      const payload: any = {
        token: deviceToken,
        notification: {
          title: normalizedPayload.title,
          body: normalizedPayload.body,
          imageUrl: normalizedPayload.imageUrl
        },
        data: this.stringifyData(normalizedPayload.data),
        android: {
          priority: 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      // Send the message
      const response = await this.firebaseApp!.messaging().send(payload);

      logger.info('Push notification sent successfully', { 
        deviceToken,
        messageId: response
      });

      return {
        success: true,
        messageId: response,
        deviceToken
      };
    } catch (error) {
      logger.error('Failed to send push notification', { error, deviceToken });

      // Check if token is invalid
      if (this.isInvalidTokenError(error)) {
        // Remove invalid token from database
        this.removeInvalidToken(deviceToken).catch(err => {
          logger.error('Failed to remove invalid token', { err, deviceToken });
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        deviceToken
      };
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendPushNotifications(
    deviceTokens: string[],
    message: string,
    data?: Record<string, any>
  ): Promise<NotificationResult[]> {
    logger.info('Sending push notifications to multiple devices', { 
      deviceCount: deviceTokens.length 
    });

    if (!this.isConfigured()) {
      logger.error('Push notification service not properly configured');
      return deviceTokens.map(token => ({
        success: false,
        error: 'Push notification service not configured',
        deviceToken: token
      }));
    }

    // Deduplicate tokens
    const uniqueTokens = [...new Set(deviceTokens)];

    // Send notifications in batches to avoid rate limiting
    const results: NotificationResult[] = [];
    const batchSize = 500; // FCM has a limit of 500 messages per batch

    for (let i = 0; i < uniqueTokens.length; i += batchSize) {
      const batch = uniqueTokens.slice(i, i + batchSize);
      
      // Create a batch of messages
      const normalizedPayload: PushNotificationPayload = {
        title: 'Flextasker',
        body: message,
        data: data || {},
        imageUrl: undefined
      };

      const messages = batch.map(token => ({
        token,
        notification: {
          title: normalizedPayload.title,
          body: normalizedPayload.body,
          imageUrl: normalizedPayload.imageUrl
        },
        data: this.stringifyData(normalizedPayload.data),
        android: {
          priority: 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              badge: 1,
              sound: 'default'
            }
          }
        }
      }));

      try {
        if (!this.firebaseApp) {
          throw new Error('Firebase app not initialized');
        }
        
        // Send the batch
        const sendPromises = messages.map(message => this.firebaseApp!.messaging().send(message));
        const responses = await Promise.all(sendPromises);

        // Process results
        responses.forEach((resp: any, index: number) => {
          const token = batch[index];
          
          if (resp.success) {
            results.push({
              success: true,
              messageId: resp.messageId,
              deviceToken: token
            });
          } else {
            results.push({
              success: false,
              error: resp.error?.message ?? 'Unknown error',
              deviceToken: token
            });

            // Check if token is invalid
            if (this.isInvalidTokenError(resp.error)) {
              // Remove invalid token from database
              this.removeInvalidToken(token).catch(err => {
                logger.error('Failed to remove invalid token', { err, token });
              });
            }
          }
        });

        logger.info(`Push notification batch sent`, {
          success: results.filter(r => r.success).length,
          failure: results.filter(r => !r.success).length
        });
      } catch (error) {
        logger.error('Failed to send batch of push notifications', { error });
        
        // Mark all as failed in this batch
        batch.forEach(token => {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            deviceToken: token
          });
        });
      }
    }

    return results;
  }

  /**
   * Register a device token for a user
   */
  async registerDeviceToken(userId: string, deviceToken: string, deviceInfo?: Record<string, any>): Promise<void> {
    logger.info('Registering device token', { userId, deviceToken });

    try {
      // Check if token already exists for this user
      const existingToken = await db.userDevice.findFirst({
        where: {
          userId,
          token: deviceToken
        }
      });

      const safeDeviceInfo = this.safeJsonValue(deviceInfo || {});

      if (existingToken) {
        // Update last used timestamp
        await db.userDevice.update({
          where: { id: existingToken.id },
          data: {
            lastUsed: new Date(),
            deviceInfo: safeDeviceInfo
          }
        });

        logger.info('Updated existing device token', { userId, deviceToken });
      } else {
        // Create new token record with required fields
        await db.userDevice.create({
          data: {
            userId,
            token: deviceToken,
            deviceId: `device_${Date.now()}_${Math.random().toString(36).slice(2)}`, // Generate a unique device ID
            platform: (deviceInfo?.platform as string) || 'unknown',
            deviceInfo: safeDeviceInfo,
            lastUsed: new Date()
          }
        });

        logger.info('Registered new device token', { userId, deviceToken });
      }
    } catch (error) {
      logger.error('Failed to register device token', { error, userId, deviceToken });
      throw error;
    }
  }

  /**
   * Unregister a device token
   */
  async unregisterDeviceToken(userId: string, deviceToken: string): Promise<void> {
    logger.info('Unregistering device token', { userId, deviceToken });

    try {
      // Delete token record
      await db.userDevice.deleteMany({
        where: {
          userId,
          token: deviceToken
        }
      });

      logger.info('Unregistered device token', { userId, deviceToken });
    } catch (error) {
      logger.error('Failed to unregister device token', { error, userId, deviceToken });
      throw error;
    }
  }

  /**
   * Get all device tokens for a user
   */
  async getUserDeviceTokens(userId: string): Promise<string[]> {
    try {
      // Query device tokens from database
      const devices = await db.userDevice.findMany({
        where: { userId },
        select: { token: true }
      });

      return devices.map((d: any) => d.token);
    } catch (error) {
      logger.error('Failed to get user device tokens', { error, userId });
      throw error;
    }
  }

  /**
   * Check if the push notification service is properly configured
   */
  isConfigured(): boolean {
    return this.initialized && this.firebaseApp !== null;
  }

  /**
   * Helper method to convert data object to string values
   * FCM requires all data values to be strings
   */
  private stringifyData(data: Record<string, any> | undefined): Record<string, string> {
    if (!data) {
      return {};
    }
    
    const safeData = this.safeJsonValue(data);
    return Object.entries(safeData).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : JSON.stringify(value);
      return acc;
    }, {});
  }

  /**
   * Check if an error is related to an invalid token
   */
  private isInvalidTokenError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message ?? error.toString();
    return (
      errorMessage.includes('registration-token-not-registered') ??
      errorMessage.includes('invalid-registration-token') ??
      errorMessage.includes('invalid-argument')
    );
  }

  /**
   * Remove an invalid token from the database
   */
  private async removeInvalidToken(token: string): Promise<void> {
    try {
      // Find all records with this token and remove them
      const result = await db.userDevice.deleteMany({
        where: { token }
      });

      logger.info(`Removed invalid device token`, { token, count: result.count });
    } catch (error) {
      logger.error(`Failed to remove invalid token`, { token, error });
    }
  }

  /**
   * Safely convert any data to Prisma-compatible JSON value
   */
  private safeJsonValue(value: any): InputJsonValue {
    if (!value || typeof value !== 'object') {
      return {};
    }

    // Convert any non-serializable values to strings and ensure Prisma compatibility
    const result: { [key: string]: InputJsonValue } = {};
    
    for (const [key, val] of Object.entries(value)) {
      if (val === undefined) {
        continue;
      }
      
      if (val === null) {
        continue;
      }
      
      if (typeof val === 'function') {
        result[key] = val.toString();
        continue;
      }
      
      if (Array.isArray(val)) {
        result[key] = val.map(item => {
          if (item === null || item === undefined) return '';
          return typeof item === 'object' ? JSON.stringify(item) : String(item);
        }).filter(Boolean);
        continue;
      }
      
      if (typeof val === 'object') {
        result[key] = JSON.stringify(val);
        continue;
      }
      
      if (['string', 'number', 'boolean'].includes(typeof val)) {
        result[key] = val as string | number | boolean;
        continue;
      }
      
      result[key] = String(val);
    }
    
    return result;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
