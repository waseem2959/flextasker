import { logger } from '@/utils/logger';
import { Twilio } from 'twilio';

/**
 * SMS service - this is like the text messaging department that handles
 * all SMS communications, primarily for phone number verification and
 * urgent notifications that need immediate attention.
 * 
 * This service has been designed with robust error handling, proper type safety,
 * and defensive programming practices to ensure reliable SMS delivery in
 * production environments.
 */

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
   * Initialize the SMS service by verifying configuration
   * This should be called after construction to ensure the service is ready
   * 
   * Separating this from the constructor allows for proper async handling
   * and makes testing easier since you can control when validation occurs
   */
  async initialize(): Promise<void> {
    try {
      await this.verifyConfiguration();
      logger.info('SMS service initialized successfully');
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('SMS service initialization failed:', { error: errorMessage });
      throw new SMSError('Failed to initialize SMS service', error);
    }
  }

  /**
   * Validates that required environment variables are present and non-empty
   * This defensive programming approach prevents runtime failures from configuration issues
   */
  private validateEnvironmentVariable(name: string): string {
    const value = process.env[name];
    
    if (!value || value.trim() === '') {
      throw new Error(`Required environment variable ${name} is not set or is empty`);
    }
    
    return value.trim();
  }

  /**
   * Verify Twilio service configuration
   * This method tests the connection and logs the result for monitoring
   */
  private async verifyConfiguration(): Promise<void> {
    try {
      // Use the validated account SID for the API call
      const accountSid = this.validateEnvironmentVariable('TWILIO_ACCOUNT_SID');
      const account = await this.client.api.accounts(accountSid).fetch();
      
      logger.info('SMS service configured successfully:', {
        accountSid: account.sid,
        status: account.status,
      });
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('SMS service configuration failed:', { error: errorMessage });
      throw error; // Re-throw to let the caller handle it
    }
  }

  /**
   * Safely extract error messages from unknown error types
   * This utility handles TypeScript's unknown error type properly
   */
  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    // For any other type, convert to string safely
    return String(error);
  }

  /**
   * Send SMS message with comprehensive error handling
   * This is the core method that all other SMS methods use
   */
  private async sendSMS(to: string, message: string): Promise<string> {
    try {
      // Validate inputs before processing
      if (!to || !message) {
        throw new SMSError('Phone number and message are required');
      }

      // Ensure phone number is in international format
      const formattedNumber = this.formatPhoneNumber(to);
      
      const messageResult = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
      });

      logger.info('SMS sent successfully:', {
        to: formattedNumber,
        messageSid: messageResult.sid,
        status: messageResult.status,
      });

      return messageResult.sid;

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('Failed to send SMS:', {
        to,
        error: errorMessage,
        messageLength: message.length,
      });
      
      // Wrap the original error for better error handling upstream
      throw new SMSError('Failed to send SMS message', error);
    }
  }

  /**
   * Format phone number to international format
   * This method ensures consistent phone number formatting across the service
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // If number doesn't start with +, add it
    if (!phoneNumber.startsWith('+')) {
      return `+${cleanNumber}`;
    }
    
    return phoneNumber;
  }

  /**
   * Send phone verification code
   * This method creates a standardized verification message
   */
  async sendVerificationCode(phoneNumber: string, code: string): Promise<string> {
    if (!phoneNumber || !code) {
      throw new SMSError('Phone number and verification code are required');
    }

    const message = `Your FLEXTASKER verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send task notification via SMS
   * Uses a message template system for consistent formatting
   */
  async sendTaskNotificationSMS(
    phoneNumber: string,
    firstName: string,
    notificationType: TaskNotificationType,
    taskTitle?: string
  ): Promise<string> {
    // Validate required parameters
    if (!phoneNumber || !firstName || !notificationType) {
      throw new SMSError('Phone number, first name, and notification type are required');
    }

    // Define message templates for different notification types
    const messageTemplates: Record<TaskNotificationType, (firstName: string, taskTitle?: string) => string> = {
      bid_accepted: (name, title) => 
        `Hi ${name}! Your bid for "${title}" has been accepted. Check your FLEXTASKER dashboard for details.`,
      task_completed: (name, title) => 
        `Hi ${name}! The task "${title}" has been marked as completed. Please review and confirm.`,
      payment_received: (name, title) => 
        `Hi ${name}! You've received payment for "${title}". Check your account for details.`,
      urgent_message: (name) => 
        `Hi ${name}! You have an urgent message on FLEXTASKER. Please check your account immediately.`,
    };

    const templateFunction = messageTemplates[notificationType];
    if (!templateFunction) {
      throw new SMSError(`Unknown notification type: ${notificationType}`);
    }

    const message = templateFunction?.(firstName, taskTitle);
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send security alert SMS
   * Handles security-related notifications with appropriate urgency
   */
  async sendSecurityAlertSMS(
    phoneNumber: string,
    firstName: string,
    alertType: SecurityAlertType
  ): Promise<string> {
    if (!phoneNumber || !firstName || !alertType) {
      throw new SMSError('Phone number, first name, and alert type are required');
    }

    const messageTemplates: Record<SecurityAlertType, (firstName: string) => string> = {
      login_attempt: (name) => 
        `Hi ${name}, there was a login attempt to your FLEXTASKER account. If this wasn't you, secure your account immediately.`,
      password_changed: (name) => 
        `Hi ${name}, your FLEXTASKER password has been changed. If you didn't make this change, contact support immediately.`,
      suspicious_activity: (name) => 
        `Hi ${name}, we detected suspicious activity on your FLEXTASKER account. Please check your account and contact support if needed.`,
    };

    const templateFunction = messageTemplates[alertType];
    if (!templateFunction) {
      throw new SMSError(`Unknown alert type: ${alertType}`);
    }

    const message = templateFunction(firstName);
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send appointment reminder SMS
   * Formats date/time appropriately for SMS delivery
   */
  async sendAppointmentReminderSMS(
    phoneNumber: string,
    firstName: string,
    taskTitle: string,
    appointmentTime: Date
  ): Promise<string> {
    if (!phoneNumber || !firstName || !taskTitle || !appointmentTime) {
      throw new SMSError('Phone number, first name, task title, and appointment time are required');
    }

    const timeString = appointmentTime.toLocaleString();
    const message = `Hi ${firstName}! Reminder: You have a scheduled task "${taskTitle}" at ${timeString}. Don't forget to check your FLEXTASKER dashboard.`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send promotional SMS (with opt-out option)
   * Includes required opt-out language for compliance
   */
  async sendPromotionalSMS(
    phoneNumber: string,
    firstName: string,
    promoMessage: string
  ): Promise<string> {
    if (!phoneNumber || !firstName || !promoMessage) {
      throw new SMSError('Phone number, first name, and promotional message are required');
    }

    const message = `Hi ${firstName}! ${promoMessage} Reply STOP to opt out of promotional messages.`;
    
    return await this.sendSMS(phoneNumber, message);
  }

  /**
   * Send bulk SMS to multiple recipients with proper rate limiting
   * This method handles large volumes while respecting API limits
   */
  async sendBulkSMS(
    recipients: SMSRecipient[],
    messageTemplate: string
  ): Promise<void> {
    if (!recipients || recipients.length === 0) {
      throw new SMSError('Recipients array cannot be empty');
    }

    if (!messageTemplate?.includes('{firstName}')) {
      throw new SMSError('Message template is required and must include {firstName} placeholder');
    }

    try {
      // Send SMS in batches to avoid rate limits
      const batchSize = 10;
      const batches: SMSRecipient[][] = [];
      
      // Split recipients into batches
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Process each batch concurrently for better performance
        const smsPromises = batch.map(recipient => {
          const personalizedMessage = messageTemplate.replace('{firstName}', recipient.firstName);
          return this.sendSMS(recipient.phoneNumber, personalizedMessage);
        });

        await Promise.all(smsPromises);
        
        // Delay between batches to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      logger.info('Bulk SMS sent successfully:', {
        recipients: recipients.length,
        batches: batches.length,
      });

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('Failed to send bulk SMS:', {
        recipients: recipients.length,
        error: errorMessage,
      });
      throw new SMSError('Failed to send bulk SMS', error);
    }
  }

  /**
   * Validate phone number format using Twilio's lookup API
   * This provides real-time validation of phone numbers
   */
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber) {
      return false;
    }

    try {
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      // Use Twilio's lookup API to validate the number
      const phoneInfo = await this.client.lookups.v1
        .phoneNumbers(formattedNumber)
        .fetch();

      return phoneInfo.phoneNumber !== null;

    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.warn('Phone number validation failed:', { 
        phoneNumber, 
        error: errorMessage 
      });
      return false;
    }
  }

  /**
   * Get delivery status of an SMS message
   * This allows tracking of message delivery for monitoring
   */
  async getSMSStatus(messageSid: string): Promise<string> {
    if (!messageSid) {
      throw new SMSError('Message SID is required');
    }

    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      logger.error('Failed to get SMS status:', {
        messageSid,
        error: errorMessage,
      });
      return 'unknown';
    }
  }
}