/**
 * Email Service
 * 
 * This service handles all email-related operations including:
 * - Email template management
 * - Sending verification emails
 * - Sending notification emails
 * - Sending marketing communications
 */

import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

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

/**
 * Email Service Class
 * 
 * Handles email communications including templating, sending verification emails,
 * notifications, and marketing communications.
 */
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    // Initialize the email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST ?? 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT ?? '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER ?? 'user@example.com',
        pass: process.env.EMAIL_PASSWORD ?? 'password'
      }
    });

    // Register Handlebars helpers
    handlebars.registerHelper('formatDate', function(date: Date) {
      return date ? new Date(date).toLocaleDateString() : '';
    });

    handlebars.registerHelper('formatCurrency', function(amount: number) {
      return amount ? `$${amount.toFixed(2)}` : '$0.00';
    });

    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });

    handlebars.registerHelper('neq', function(a, b) {
      return a !== b;
    });
  }

  /**
   * Send an email
   */
  async sendEmail(to: string, template: EmailTemplate): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM ?? 'Flextasker <noreply@flextasker.com>',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { to });
    } catch (error) {
      logger.error('Error sending email', { error, to });
      throw error;
    }
  }

  /**
   * Load a template from the filesystem
   */
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    // Check if template is already cached
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    try {
      // Load template from file
      const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Compile template
      const compiledTemplate = handlebars.compile(templateContent);
      
      // Cache template
      this.templateCache.set(templateName, compiledTemplate);
      
      return compiledTemplate;
    } catch (error) {
      logger.error('Error loading email template', { error, templateName });
      throw error;
    }
  }

  /**
   * Render a template with data
   */
  private async renderTemplate(templateName: string, data: EmailData): Promise<EmailTemplate> {
    try {
      // Load and compile template
      const template = await this.loadTemplate(templateName);
      
      // Add default data
      const templateData = {
        platformName: 'Flextasker',
        supportEmail: 'support@flextasker.com',
        frontendUrl: process.env.FRONTEND_URL ?? 'https://flextasker.com',
        ...data
      };
      
      // Render HTML
      const html = template(templateData);
      
      // Generate plain text version
      const text = this.htmlToText(html);
      
      // Get subject from first <title> tag in HTML
      const titleRegex = /<title>(.*?)<\/title>/;
      const subjectMatch = titleRegex.exec(html);
      const subject = subjectMatch ? subjectMatch[1] : 'Flextasker Notification';
      
      return { subject, html, text };
    } catch (error) {
      logger.error('Error rendering email template', { error, templateName });
      throw error;
    }
  }

  /**
   * Convert HTML to plain text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Send a welcome email
   */
  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    logger.info('Sending welcome email', { to });
    
    const template = await this.renderTemplate('welcome', { firstName });
    await this.sendEmail(to, template);
  }

  /**
   * Send an email verification email
   */
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    logger.info('Sending verification email', { to });
    
    const verificationUrl = `${process.env.FRONTEND_URL ?? 'https://flextasker.com'}/verify-email?token=${token}`;
    
    const template = await this.renderTemplate('verification', {
      verificationUrl,
      expirationHours: 24
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a password reset email
   */
  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    logger.info('Sending password reset email', { to });
    
    const resetUrl = `${process.env.FRONTEND_URL ?? 'https://flextasker.com'}/reset-password?token=${token}`;
    
    const template = await this.renderTemplate('password-reset', {
      resetUrl,
      expirationHours: 1
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a task notification email
   */
  async sendTaskNotificationEmail(to: string, firstName: string, taskTitle: string, notificationType: string): Promise<void> {
    logger.info('Sending task notification email', { to, notificationType });
    
    const template = await this.renderTemplate('task-notification', {
      firstName,
      taskTitle,
      notificationType
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a bid notification email
   */
  async sendBidNotificationEmail(to: string, firstName: string, taskTitle: string, notificationType: string): Promise<void> {
    logger.info('Sending bid notification email', { to, notificationType });
    
    const template = await this.renderTemplate('bid-notification', {
      firstName,
      taskTitle,
      notificationType
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a review notification email
   */
  async sendReviewNotificationEmail(to: string, firstName: string, reviewerName: string, rating: number): Promise<void> {
    logger.info('Sending review notification email', { to, rating });
    
    // Generate stars display (e.g., "★★★☆☆" for rating 3)
    const starsDisplay = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    
    const template = await this.renderTemplate('review-notification', {
      firstName,
      reviewerName,
      rating,
      starsDisplay
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a dispute notification email
   */
  async sendDisputeNotificationEmail(to: string, firstName: string, taskTitle: string, disputeType: string): Promise<void> {
    logger.info('Sending dispute notification email', { to, disputeType });
    
    const template = await this.renderTemplate('dispute-notification', {
      firstName,
      taskTitle,
      disputeType
    });
    
    await this.sendEmail(to, template);
  }

  /**
   * Send a weekly digest email
   */
  async sendWeeklyDigestEmail(to: string, firstName: string, data: {
    newTasks: number;
    activeBids: number;
    completedTasks: number;
    earnings: number;
    featuredTasks: Array<{
      title: string;
      budget: number;
      url: string;
    }>;
  }): Promise<void> {
    logger.info('Sending weekly digest email', { to });
    
    const template = await this.renderTemplate('weekly-digest', {
      firstName,
      newTasks: data.newTasks,
      activeBids: data.activeBids,
      completedTasks: data.completedTasks,
      earnings: data.earnings,
      featuredTasks: data.featuredTasks
    });
    
    await this.sendEmail(to, template);
  }
}

// Export singleton instance
export const emailService = new EmailService();
