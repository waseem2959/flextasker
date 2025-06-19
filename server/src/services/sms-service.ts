/**
 * SMS Service
 * 
 * This service handles all SMS-related operations including:
 * - Phone number verification
 * - Task notifications
 * - Security alerts
 * - Marketing messages
 */

import { logger } from '../utils/logger';
import { Twilio } from 'twilio';

// Type definitions for better type safety and code documentation
interface SMSRecipient {
  phoneNumber: string;
  firstName: string;
}

type TaskNotificationType = 'bid_accepted' | 'task_completed' | 'payment_received' | 'urgent_message';
type SecurityAlertType = 'login_attempt' | 'password_changed' | 'suspicious_activity';

// Custom error class for SMS-specific failures
class SMSError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'SMSError';
  }
}

/**
 * SMS Service Class
 * 
 * Handles SMS communications, primarily for phone number verification and
 * urgent notifications that need immediate attention.
 */
export class SMSService {
  // Mark these as readonly since they're never reassigned after construction
  // This prevents accidental modification and makes the code more predictable
  private readonly client: Twilio;
  private readonly fromNumber: string;

  constructor() {
    // Validate environment variables before using them
    // This defensive approach prevents runtime failures from configuration issues
    const accountSid = this.validateEnvironmentVariable('TWILIO_ACCOUNT_SID');
    const authToken = this.validateEnvironmentVariable('TWILIO_AUTH_TOKEN');
    const phoneNumber = this.validateEnvironmentVariable('TWILIO_PHONE_NUMBER');

    // Initialize Twilio client with validated configuration
    this.client = new Twilio(accountSid, authToken);
    this.fromNumber = phoneNumber;
    
    // Don't call async operations in constructor - we'll provide a separate init method
    // This follows the principle that constructors should be fast and synchronous
  }

  /**
   * Validate that an environment variable exists and is not empty
   * 
   * This is a defensive programming approach to prevent runtime errors
   * from missing configuration.
   */
  private validateEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
      logger.error(`Missing required environment variable: ${name}`);
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
  }

  /**
   * Send a verification code via SMS
   * 
   * Used primarily for phone number verification during user registration
   * or when a user changes their phone number.
   */
  async sendVerificationSMS(phoneNumber: string, code: string): Promise<void> {
    logger.info('Sending verification SMS', { phoneNumber });

    try {
      // Format phone number if needed
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Prepare message content
      const message = `Your Flextasker verification code is: ${code}. This code will expire in 15 minutes.`;
      
      // Send the message
      await this.sendSMS(formattedNumber, message);
      
      logger.info('Verification SMS sent successfully', { phoneNumber });
    } catch (error) {
      logger.error('Failed to send verification SMS', { error, phoneNumber });
      throw new SMSError('Failed to send verification SMS', error);
    }
  }

  /**
   * Send a task notification via SMS
   * 
   * Used for important task-related notifications that require immediate attention,
   * such as bid acceptance, task completion, or payment receipt.
   */
  async sendTaskNotification(
    recipient: SMSRecipient,
    taskTitle: string,
    notificationType: TaskNotificationType
  ): Promise<void> {
    logger.info('Sending task notification SMS', { 
      phoneNumber: recipient.phoneNumber,
      notificationType
    });

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(recipient.phoneNumber);
      
      // Prepare message content based on notification type
      let message: string;
      
      switch (notificationType) {
        case 'bid_accepted':
          message = `Hi ${recipient.firstName}, great news! Your bid for "${taskTitle}" has been accepted. Check your Flextasker app for details.`;
          break;
        case 'task_completed':
          message = `Hi ${recipient.firstName}, the task "${taskTitle}" has been marked as completed. Please review and confirm completion in your Flextasker app.`;
          break;
        case 'payment_received':
          message = `Hi ${recipient.firstName}, you've received a payment for the task "${taskTitle}". The funds will be available in your account shortly.`;
          break;
        case 'urgent_message':
          message = `Hi ${recipient.firstName}, you have an urgent message regarding "${taskTitle}". Please check your Flextasker app as soon as possible.`;
          break;
        default:
          message = `Hi ${recipient.firstName}, there's an update for your task "${taskTitle}". Check your Flextasker app for details.`;
      }
      
      // Send the message
      await this.sendSMS(formattedNumber, message);
      
      logger.info('Task notification SMS sent successfully', { 
        phoneNumber: recipient.phoneNumber,
        notificationType
      });
    } catch (error) {
      logger.error('Failed to send task notification SMS', { 
        error, 
        phoneNumber: recipient.phoneNumber,
        notificationType
      });
      throw new SMSError('Failed to send task notification SMS', error);
    }
  }

  /**
   * Send a security alert via SMS
   * 
   * Used for security-related notifications that require immediate attention,
   * such as suspicious login attempts or password changes.
   */
  async sendSecurityAlert(
    recipient: SMSRecipient,
    alertType: SecurityAlertType,
    details?: Record<string, unknown>
  ): Promise<void> {
    logger.info('Sending security alert SMS', { 
      phoneNumber: recipient.phoneNumber,
      alertType
    });

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(recipient.phoneNumber);
      
      // Prepare message content based on alert type
      let message: string;
      
      switch (alertType) {
        case 'login_attempt': {
          const location = details?.location ? ` from ${details.location}` : '';
          message = `Hi ${recipient.firstName}, we detected a login attempt to your Flextasker account${location}. If this wasn't you, please secure your account immediately.`;
          break;
        }
        case 'password_changed':
          message = `Hi ${recipient.firstName}, your Flextasker account password was recently changed. If you didn't make this change, please contact support immediately.`;
          break;
        case 'suspicious_activity':
          message = `Hi ${recipient.firstName}, we've detected unusual activity on your Flextasker account. Please log in to review recent activity and secure your account if needed.`;
          break;
        default:
          message = `Hi ${recipient.firstName}, there's an important security alert for your Flextasker account. Please log in to review the details.`;
      }
      
      // Send the message
      await this.sendSMS(formattedNumber, message);
      
      logger.info('Security alert SMS sent successfully', { 
        phoneNumber: recipient.phoneNumber,
        alertType
      });
    } catch (error) {
      logger.error('Failed to send security alert SMS', { 
        error, 
        phoneNumber: recipient.phoneNumber,
        alertType
      });
      throw new SMSError('Failed to send security alert SMS', error);
    }
  }

  /**
   * Send a marketing message via SMS
   * 
   * Used for promotional messages, but only to users who have explicitly
   * opted in to marketing communications.
   */
  async sendMarketingMessage(
    recipient: SMSRecipient,
    campaignId: string,
    message: string
  ): Promise<void> {
    logger.info('Sending marketing SMS', { 
      phoneNumber: recipient.phoneNumber,
      campaignId
    });

    try {
      // Format phone number
      const formattedNumber = this.formatPhoneNumber(recipient.phoneNumber);
      
      // Prepare message with personalization and opt-out instructions
      const fullMessage = `Hi ${recipient.firstName}, ${message} Reply STOP to unsubscribe.`;
      
      // Send the message
      await this.sendSMS(formattedNumber, fullMessage);
      
      // Log for analytics
      logger.info('Marketing SMS sent successfully', { 
        phoneNumber: recipient.phoneNumber,
        campaignId
      });
    } catch (error) {
      logger.error('Failed to send marketing SMS', { 
        error, 
        phoneNumber: recipient.phoneNumber,
        campaignId
      });
      throw new SMSError('Failed to send marketing SMS', error);
    }
  }

  /**
   * Core method to send an SMS message
   * 
   * This is the low-level method that handles the actual communication
   * with the Twilio API. All other methods should use this one.
   */
  private async sendSMS(to: string, body: string): Promise<void> {
    try {
      // Validate inputs
      if (!to || !body) {
        throw new Error('Phone number and message body are required');
      }
      
      // Send message via Twilio
      const result = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body
      });
      
      // Log success with message SID for traceability
      logger.debug('SMS sent successfully', { 
        messageSid: result.sid,
        to,
        status: result.status
      });
    } catch (error) {
      // Log detailed error information
      logger.error('Error sending SMS via Twilio', { 
        error,
        to,
        errorCode: error instanceof Error ? (error as any).code : undefined,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      
      // Rethrow with our custom error type
      throw new SMSError('Failed to send SMS message', error);
    }
  }

  /**
   * Format a phone number to ensure it's in E.164 format
   * 
   * This ensures phone numbers are in the internationally recognized format
   * required by most SMS providers (e.g., +12025550123).
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If the number doesn't start with a plus sign, add it
    if (!phoneNumber.startsWith('+')) {
      // If it's a US number without country code, add +1
      if (cleaned.length === 10) {
        cleaned = `1${cleaned}`;
      }
      cleaned = `+${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Check if the SMS service is properly configured
   * 
   * This can be used during application startup to verify that
   * the service is ready to send messages.
   */
  async checkServiceStatus(): Promise<boolean> {
    try {
      // Try to fetch account info as a simple API test
      // Use the account SID that was validated in the constructor
      const accountSid = this.client.accountSid;
      await this.client.api.accounts(accountSid).fetch();
      return true;
    } catch (error) {
      logger.error('SMS service configuration check failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const smsService = new SMSService();
