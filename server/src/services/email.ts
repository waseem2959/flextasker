import { logger } from '@/utils/logger';
import fs from 'fs/promises';
import handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import path from 'path';

/**
 * Email service - this is like the corporate communications department that
 * handles all outgoing email communications. It manages templates, sending
 * verification emails, notifications, and marketing communications.
 * 
 * Think of this as having a professional email system that can send
 * beautifully formatted emails for different purposes using templates.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  firstName?: string;
  platformName?: string;
  supportEmail?: string;
  frontendUrl?: string;
  verificationUrl?: string;
  expirationHours?: number;
  resetUrl?: string;
  taskTitle?: string;
  notificationType?: string;
  reviewerName?: string;
  rating?: number;
  starsDisplay?: string;
  disputeType?: string;
  newTasks?: number;
  activeBids?: number;
  completedTasks?: number;
  earnings?: number;
  featuredTasks?: Array<{
    title: string;
    budget: number;
    url: string;
  }>;
}

export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    // Create email transporter with SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Connection timeout and socket timeout
      connectionTimeout: 60000,
      socketTimeout: 60000,
    });

    // Initialize connection verification in a separate method
    this.initializeConnection();
  }

  /**
   * Initialize and verify email service connection
   * Moved out of constructor to avoid async operations in constructor
   */
  private initializeConnection(): void {
    // Use setImmediate to defer the async operation
    setImmediate(async () => {
      await this.verifyConnection();
    });
  }

  /**
   * Verify email service connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  /**
   * Load and compile email template with caching
   */
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check cache first
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(process.cwd(), 'src', 'templates', 'email', `${templateName}.hbs`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Compile template
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Cache for future use
      this.templateCache.set(templateName, compiledTemplate);
      
      return compiledTemplate;
    } catch (error) {
      logger.error(`Failed to load email template ${templateName}:`, error);
      throw new Error(`Email template ${templateName} not found`);
    }
  }

  /**
   * Send email using template
   */
  private async sendTemplateEmail(
    to: string,
    templateName: string,
    subject: string,
    data: EmailData
  ): Promise<void> {
    try {
      const template = await this.loadTemplate(templateName);
      const html = template(data);

      // Create plain text version by stripping HTML tags
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      await this.transporter.sendMail({
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
        text,
      });

      logger.info('Email sent successfully:', {
        to,
        template: templateName,
        subject,
      });

    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    await this.sendTemplateEmail(
      email,
      'welcome',
      'Welcome to FLEXTASKER! 🚀',
      {
        firstName,
        platformName: 'FLEXTASKER',
        supportEmail: process.env.FROM_EMAIL,
        frontendUrl: process.env.FRONTEND_URL,
      }
    );
  }

  /**
   * Send email verification link
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<void> {
    await this.sendTemplateEmail(
      email,
      'email-verification',
      'Verify Your Email Address',
      {
        verificationUrl,
        platformName: 'FLEXTASKER',
        expirationHours: 24,
      }
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, firstName: string, resetUrl: string): Promise<void> {
    await this.sendTemplateEmail(
      email,
      'password-reset',
      'Reset Your Password',
      {
        firstName,
        resetUrl,
        platformName: 'FLEXTASKER',
        expirationHours: 1,
      }
    );
  }

  /**
   * Send task notification emails
   */
  async sendTaskNotificationEmail(
    email: string, 
    firstName: string, 
    taskTitle: string, 
    notificationType: 'new_bid' | 'bid_accepted' | 'task_completed' | 'payment_received'
  ): Promise<void> {
    const subjects = {
      new_bid: `New Bid Received: ${taskTitle}`,
      bid_accepted: `Your Bid Was Accepted: ${taskTitle}`,
      task_completed: `Task Completed: ${taskTitle}`,
      payment_received: `Payment Received: ${taskTitle}`,
    };

    await this.sendTemplateEmail(
      email,
      'task-notification',
      subjects[notificationType],
      {
        firstName,
        taskTitle,
        notificationType,
        platformName: 'FLEXTASKER',
        frontendUrl: process.env.FRONTEND_URL,
      }
    );
  }

  /**
   * Send review notification email
   */
  async sendReviewNotificationEmail(
    email: string,
    firstName: string,
    reviewerName: string,
    taskTitle: string,
    rating: number
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      'review-notification',
      `New Review Received: ${rating} Stars`,
      {
        firstName,
        reviewerName,
        taskTitle,
        rating,
        starsDisplay: '★'.repeat(rating) + '☆'.repeat(5 - rating),
        platformName: 'FLEXTASKER',
        frontendUrl: process.env.FRONTEND_URL,
      }
    );
  }

  /**
   * Send dispute notification email
   */
  async sendDisputeNotificationEmail(
    email: string,
    firstName: string,
    taskTitle: string,
    disputeType: 'created' | 'resolved'
  ): Promise<void> {
    const subjects = {
      created: `Dispute Created: ${taskTitle}`,
      resolved: `Dispute Resolved: ${taskTitle}`,
    };

    await this.sendTemplateEmail(
      email,
      'dispute-notification',
      subjects[disputeType],
      {
        firstName,
        taskTitle,
        disputeType,
        platformName: 'FLEXTASKER',
        supportEmail: process.env.FROM_EMAIL,
        frontendUrl: process.env.FRONTEND_URL,
      }
    );
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummaryEmail(
    email: string,
    firstName: string,
    summaryData: {
      newTasks: number;
      activeBids: number;
      completedTasks: number;
      earnings: number;
      featuredTasks: Array<{
        title: string;
        budget: number;
        url: string;
      }>;
    }
  ): Promise<void> {
    await this.sendTemplateEmail(
      email,
      'weekly-summary',
      'Your Weekly FLEXTASKER Summary',
      {
        firstName,
        ...summaryData,
        platformName: 'FLEXTASKER',
        frontendUrl: process.env.FRONTEND_URL,
      }
    );
  }

  /**
   * Send bulk email to multiple recipients (for announcements)
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    templateName: string,
    data: EmailData
  ): Promise<void> {
    try {
      const template = await this.loadTemplate(templateName);
      const html = template(data);
      const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

      // Send emails in batches to avoid overwhelming the SMTP server
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        batches.push(recipients.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const emailPromises = batch.map(email => 
          this.transporter.sendMail({
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: email,
            subject,
            html,
            text,
          })
        );

        await Promise.all(emailPromises);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info('Bulk email sent successfully:', {
        recipients: recipients.length,
        template: templateName,
        subject,
      });

    } catch (error) {
      logger.error('Failed to send bulk email:', error);
      throw error;
    }
  }
}