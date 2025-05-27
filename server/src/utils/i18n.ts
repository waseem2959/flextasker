/**
 * Internationalization (i18n) Support
 * 
 * This module provides translation and internationalization utilities
 * for supporting multiple languages in the application.
 */

import { Request, Response, NextFunction } from 'express';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { logger } from './logger';
import { config } from './config';

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'ar'];
export const DEFAULT_LANGUAGE = 'en';

// Language namespaces
export const NAMESPACES = ['common', 'errors', 'emails', 'tasks', 'user'];

/**
 * Initialize i18next with backends and middleware
 */
export async function initializeI18n(): Promise<typeof i18next> {
  try {
    // Create locales directory if it doesn't exist
    const localesPath = path.join(process.cwd(), 'locales');
    if (!existsSync(localesPath)) {
      await fs.mkdir(localesPath, { recursive: true });
      
      // Create subdirectories for each language
      for (const lang of SUPPORTED_LANGUAGES) {
        await fs.mkdir(path.join(localesPath, lang), { recursive: true });
      }
      
      // Create default translation files if they don't exist
      await createDefaultTranslations(localesPath);
    }
    
    // Initialize i18next
    await i18next
      .use(Backend)
      .use(middleware.LanguageDetector)
      .init({
        backend: {
          loadPath: path.join(localesPath, '{{lng}}/{{ns}}.json')
        },
        fallbackLng: DEFAULT_LANGUAGE,
        preload: SUPPORTED_LANGUAGES,
        saveMissing: config.NODE_ENV !== 'production',
        debug: config.NODE_ENV === 'development',
        ns: NAMESPACES,
        defaultNS: 'common',
        interpolation: {
          escapeValue: false // React already escapes values
        },
        detection: {
          // Order of detection
          order: ['cookie', 'header', 'querystring'],
          // Look for 'lang' in query string
          lookupQuerystring: 'lang',
          // Look for 'Accept-Language' header
          lookupHeader: 'accept-language',
          // Look for 'i18next' cookie
          lookupCookie: 'i18next',
          // Cache language selection
          caches: ['cookie']
        }
      });
    
    logger.info('Internationalization (i18n) initialized', {
      languages: SUPPORTED_LANGUAGES,
      defaultLanguage: DEFAULT_LANGUAGE,
      namespaces: NAMESPACES
    });
    
    return i18next;
  } catch (error) {
    logger.error('Failed to initialize i18n', { error });
    throw error;
  }
}

/**
 * Create i18n middleware for Express
 */
export function createI18nMiddleware() {
  return middleware.handle(i18next);
}

/**
 * Language detection middleware
 * Sets language based on user preferences or request
 */
export function languageMiddleware(req: Request, res: Response, next: NextFunction) {
  // If user is authenticated and has a language preference, use that
  if (req.user?.language && SUPPORTED_LANGUAGES.includes(req.user.language)) {
    req.language = req.user.language;
  }
  
  // Set Content-Language header
  res.set('Content-Language', req.language || DEFAULT_LANGUAGE);
  
  next();
}

/**
 * Create default translation files
 */
async function createDefaultTranslations(localesPath: string): Promise<void> {
  try {
    // Create default English translations
    const englishPath = path.join(localesPath, 'en');
    
    // Common translations
    const commonTranslations = {
      welcome: 'Welcome to FlexTasker',
      footer: {
        copyright: '© {{year}} FlexTasker. All rights reserved.',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service'
      },
      buttons: {
        submit: 'Submit',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        next: 'Next'
      },
      navigation: {
        home: 'Home',
        tasks: 'Tasks',
        dashboard: 'Dashboard',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Log Out'
      }
    };
    
    // Error translations
    const errorTranslations = {
      validation: {
        required: '{{field}} is required',
        email: 'Please enter a valid email address',
        minLength: '{{field}} must be at least {{min}} characters',
        maxLength: '{{field}} must be at most {{max}} characters',
        passwordMatch: 'Passwords do not match',
        invalidCredentials: 'Invalid email or password'
      },
      server: {
        internalError: 'An unexpected error occurred. Please try again later.',
        notFound: 'The requested resource was not found',
        unauthorized: 'You must be logged in to access this resource',
        forbidden: 'You do not have permission to access this resource',
        conflict: 'A conflict occurred with the requested operation'
      }
    };
    
    // Task translations
    const taskTranslations = {
      status: {
        draft: 'Draft',
        open: 'Open',
        assigned: 'Assigned',
        inProgress: 'In Progress',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      priority: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      },
      labels: {
        title: 'Title',
        description: 'Description',
        budget: 'Budget',
        dueDate: 'Due Date',
        category: 'Category',
        status: 'Status',
        createdBy: 'Created By',
        assignedTo: 'Assigned To'
      },
      actions: {
        createTask: 'Create Task',
        editTask: 'Edit Task',
        deleteTask: 'Delete Task',
        assignTask: 'Assign Task',
        completeTask: 'Complete Task',
        cancelTask: 'Cancel Task',
        bidOnTask: 'Bid on Task'
      },
      messages: {
        taskCreated: 'Task created successfully',
        taskUpdated: 'Task updated successfully',
        taskDeleted: 'Task deleted successfully',
        bidPlaced: 'Your bid has been placed successfully',
        bidAccepted: 'Bid accepted successfully',
        taskCompleted: 'Task marked as completed'
      }
    };
    
    // User translations
    const userTranslations = {
      roles: {
        user: 'Client',
        tasker: 'Tasker',
        admin: 'Administrator'
      },
      profile: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        bio: 'Bio',
        skills: 'Skills',
        profilePicture: 'Profile Picture',
        rating: 'Rating',
        memberSince: 'Member Since'
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        forgotPassword: 'Forgot Password',
        resetPassword: 'Reset Password',
        signOut: 'Sign Out',
        verifyEmail: 'Verify Email'
      },
      messages: {
        welcome: 'Welcome to FlexTasker, {{name}}!',
        profileUpdated: 'Your profile has been updated successfully',
        passwordChanged: 'Your password has been changed successfully',
        accountCreated: 'Your account has been created successfully',
        emailVerified: 'Your email has been verified successfully',
        passwordResetSent: 'Password reset instructions have been sent to your email'
      }
    };
    
    // Email translations
    const emailTranslations = {
      common: {
        greeting: 'Hello {{name}},',
        signature: 'The FlexTasker Team',
        footer: 'If you did not request this email, please ignore it or contact support.'
      },
      welcome: {
        subject: 'Welcome to FlexTasker',
        title: 'Welcome to FlexTasker!',
        message: 'Thank you for joining FlexTasker. We\'re excited to have you on board!',
        ctaButton: 'Get Started'
      },
      passwordReset: {
        subject: 'Reset Your Password',
        title: 'Reset Your Password',
        message: 'We received a request to reset your password. Click the button below to create a new password.',
        ctaButton: 'Reset Password',
        expiry: 'This link will expire in 24 hours.'
      },
      taskAssigned: {
        subject: 'Task Assigned: {{taskTitle}}',
        title: 'Task Assigned',
        message: 'You have been assigned a new task: {{taskTitle}}',
        ctaButton: 'View Task'
      },
      bidReceived: {
        subject: 'New Bid on Your Task',
        title: 'New Bid Received',
        message: 'You have received a new bid on your task: {{taskTitle}}',
        ctaButton: 'View Bid'
      }
    };
    
    // Write translation files
    await Promise.all([
      fs.writeFile(
        path.join(englishPath, 'common.json'),
        JSON.stringify(commonTranslations, null, 2)
      ),
      fs.writeFile(
        path.join(englishPath, 'errors.json'),
        JSON.stringify(errorTranslations, null, 2)
      ),
      fs.writeFile(
        path.join(englishPath, 'tasks.json'),
        JSON.stringify(taskTranslations, null, 2)
      ),
      fs.writeFile(
        path.join(englishPath, 'user.json'),
        JSON.stringify(userTranslations, null, 2)
      ),
      fs.writeFile(
        path.join(englishPath, 'emails.json'),
        JSON.stringify(emailTranslations, null, 2)
      )
    ]);
    
    logger.info('Default translations created for English');
    
    // Create placeholder files for other languages
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === 'en') continue; // Skip English as we already created it
      
      const langPath = path.join(localesPath, lang);
      
      // Create empty translation files with the same structure
      await Promise.all(
        NAMESPACES.map(async (ns) => {
          const filePath = path.join(langPath, `${ns}.json`);
          if (!existsSync(filePath)) {
            await fs.writeFile(filePath, '{}');
          }
        })
      );
      
      logger.info(`Placeholder translations created for ${lang}`);
    }
  } catch (error) {
    logger.error('Failed to create default translations', { error });
    throw error;
  }
}

/**
 * Translate message with the given key and options
 */
export function t(key: string, options?: object): string {
  return i18next.t(key, options);
}

/**
 * Get current language
 */
export function getCurrentLanguage(): string {
  return i18next.language || DEFAULT_LANGUAGE;
}

/**
 * Change language
 */
export function changeLanguage(lng: string): Promise<typeof i18next> {
  if (!SUPPORTED_LANGUAGES.includes(lng)) {
    logger.warn(`Unsupported language: ${lng}, falling back to ${DEFAULT_LANGUAGE}`);
    lng = DEFAULT_LANGUAGE;
  }
  
  return i18next.changeLanguage(lng);
}

export default {
  t,
  i18next,
  getCurrentLanguage,
  changeLanguage,
  initializeI18n,
  createI18nMiddleware,
  languageMiddleware,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  NAMESPACES
};
