/**
 * OAuth2 Authentication Providers
 * 
 * This module handles authentication via third-party OAuth providers like
 * Google, Facebook, GitHub, etc. It provides a unified interface for
 * working with different OAuth providers.
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import passport, { AuthenticateOptions } from 'passport';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as GithubStrategy, Profile as GithubProfile } from 'passport-github2';
import { Profile as GoogleProfile, Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';
import { logger } from './logger';

// Type for user returned from Prisma
type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  [key: string]: any; // Allow additional properties
};

// Type for OAuth verify callback - now used consistently
type OAuthVerifyCallback = (error: Error | null, user?: User | false, info?: any) => void;

// Type for passport authenticate callback
type AuthenticateCallback = (err: Error | null, user?: Express.User | false, info?: any) => void;

// Initialize Prisma client
const prisma = new PrismaClient();

// Supported OAuth providers
export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  GITHUB = 'github'
}

// OAuth provider config interface
interface OAuthProviderConfig {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
  enabled: boolean;
}

// User profile from OAuth provider
export interface OAuthUserProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  profilePictureUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Initialize OAuth providers
 */
export function initializeOAuthProviders(): void {
  try {
    // Configure supported providers
    const providers = getEnabledProviders();
    
    // Setup passport strategies for each enabled provider
    for (const [providerName, providerConfig] of Object.entries(providers)) {
      if (!providerConfig.enabled) continue;
      
      switch (providerName as OAuthProvider) {
        case OAuthProvider.GOOGLE:
          setupGoogleStrategy(providerConfig);
          break;
        case OAuthProvider.FACEBOOK:
          setupFacebookStrategy(providerConfig);
          break;
        case OAuthProvider.GITHUB:
          setupGithubStrategy(providerConfig);
          break;
      }
    }
    
    // Serialize and deserialize user
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });
    
    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id }
        });
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
    
    logger.info('OAuth providers initialized', {
      enabledProviders: Object.entries(providers)
        .filter(([_, config]) => config.enabled)
        .map(([name]) => name)
    });
  } catch (error) {
    logger.error('Failed to initialize OAuth providers', { error });
    throw error;
  }
}

/**
 * Get configuration for all OAuth providers
 */
function getEnabledProviders(): Record<OAuthProvider, OAuthProviderConfig> {
  const baseUrl = config.BASE_URL || `http://localhost:${config.PORT || 3000}`;
  
  return {
    [OAuthProvider.GOOGLE]: {
      clientID: config.GOOGLE_CLIENT_ID ?? '',
      clientSecret: config.GOOGLE_CLIENT_SECRET ?? '',
      callbackURL: `${baseUrl}/api/auth/google/callback`,
      scope: ['profile', 'email'],
      enabled: Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET)
    },
    [OAuthProvider.FACEBOOK]: {
      clientID: config.FACEBOOK_CLIENT_ID ?? '',
      clientSecret: config.FACEBOOK_CLIENT_SECRET ?? '',
      callbackURL: `${baseUrl}/api/auth/facebook/callback`,
      scope: ['email', 'public_profile'],
      enabled: Boolean(config.FACEBOOK_CLIENT_ID && config.FACEBOOK_CLIENT_SECRET)
    },
    [OAuthProvider.GITHUB]: {
      clientID: config.GITHUB_CLIENT_ID ?? '',
      clientSecret: config.GITHUB_CLIENT_SECRET ?? '',
      callbackURL: `${baseUrl}/api/auth/github/callback`,
      scope: ['user:email'],
      enabled: Boolean(config.GITHUB_CLIENT_ID && config.GITHUB_CLIENT_SECRET)
    }
  };
}

/**
 * Setup Google OAuth strategy
 */
function setupGoogleStrategy(config: OAuthProviderConfig): void {
  // Skip setup if required config is missing
  if (!config.clientID || !config.clientSecret) {
    logger.warn('Google OAuth is not properly configured. Missing client ID or secret.');
    return;
  }

  // Configure Google OAuth strategy
  const googleStrategy = new GoogleStrategy(
    {
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope,
      passReqToCallback: false
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: OAuthVerifyCallback
    ) => {
      try {
        // Extract profile data with proper null checks
        const userProfile: OAuthUserProfile = {
          provider: OAuthProvider.GOOGLE,
          providerUserId: profile.id,
          email: profile.emails?.[0]?.value ?? '',
          firstName: profile.name?.givenName ?? '',
          lastName: profile.name?.familyName ?? '',
          displayName: profile.displayName ?? profile.emails?.[0]?.value?.split('@')[0] ?? 'User',
          profilePictureUrl: profile.photos?.[0]?.value,
          accessToken,
          refreshToken: refreshToken || undefined
        };
        
        // Find or create user in database
        const user = await findOrCreateOAuthUser(userProfile);
        return done(null, user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process OAuth user';
        logger.error('Google OAuth error', { 
          error: errorMessage, 
          profileId: profile.id,
          provider: OAuthProvider.GOOGLE 
        });
        return done(error instanceof Error ? error : new Error(errorMessage), false);
      }
    }
  );

  // Register the strategy with Passport
  passport.use(googleStrategy);
}

/**
 * Setup Facebook OAuth strategy
 */
function setupFacebookStrategy(config: OAuthProviderConfig): void {
  passport.use(new FacebookStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    profileFields: ['id', 'emails', 'name', 'displayName', 'photos']
  }, async (
    accessToken: string, 
    refreshToken: string, 
    profile: FacebookProfile, 
    done: OAuthVerifyCallback
  ) => {
    try {
      // Extract profile data
      const userProfile: OAuthUserProfile = {
        provider: OAuthProvider.FACEBOOK,
        providerUserId: profile.id,
        email: profile.emails?.[0]?.value ?? '',
        firstName: profile.name?.givenName ?? '',
        lastName: profile.name?.familyName ?? '',
        displayName: profile.displayName ?? '',
        profilePictureUrl: profile.photos?.[0]?.value,
        accessToken,
        refreshToken
      };
      
      // Find or create user
      try {
        const user = await findOrCreateOAuthUser(userProfile);
        done(null, user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process OAuth user';
        logger.error('Facebook OAuth error', { error: errorMessage, profileId: profile.id });
        done(error instanceof Error ? error : new Error(errorMessage), false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process OAuth user';
      logger.error('Facebook OAuth error', { error: errorMessage, profileId: profile.id });
      done(error instanceof Error ? error : new Error(errorMessage), false);
    }
  }));
}

/**
 * Setup GitHub OAuth strategy
 */
function setupGithubStrategy(config: OAuthProviderConfig): void {
  passport.use(new GithubStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    scope: config.scope
  }, async (
    accessToken: string, 
    refreshToken: string, 
    profile: GithubProfile, 
    done: OAuthVerifyCallback
  ) => {
    try {
      // Extract profile data
      const email = profile.emails?.[0]?.value ?? `${profile.username}@github.com`;
      const nameParts = (profile.displayName ?? profile.username ?? '').split(' ');
      
      const userProfile: OAuthUserProfile = {
        provider: OAuthProvider.GITHUB,
        providerUserId: profile.id,
        email,
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') ?? '',
        displayName: profile.displayName ?? profile.username ?? '',
        profilePictureUrl: profile.photos?.[0]?.value,
        accessToken,
        refreshToken
      };
      
      // Find or create user
      try {
        const user = await findOrCreateOAuthUser(userProfile);
        done(null, user);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process OAuth user';
        logger.error('GitHub OAuth error', { error: errorMessage, profileId: profile.id });
        done(error instanceof Error ? error : new Error(errorMessage), false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process OAuth user';
      logger.error('GitHub OAuth error', { error: errorMessage, profileId: profile.id });
      done(error instanceof Error ? error : new Error(errorMessage), false);
    }
  }));
}

/**
 * Find or create a user from OAuth profile
 */
async function findOrCreateOAuthUser(profile: OAuthUserProfile): Promise<User> {
  try {
    // Check if we already have this OAuth account linked
    const existingOAuth = await prisma.oauthAccount.findUnique({
      where: {
        providerUserId_provider: {
          providerUserId: profile.providerUserId,
          provider: profile.provider
        }
      },
      include: {
        user: true
      }
    });
    
    if (existingOAuth) {
      // Update OAuth account with new tokens
      await prisma.oauthAccount.update({
        where: {
          id: existingOAuth.id
        },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken
        }
      });
      
      return existingOAuth.user;
    }
    
    // Check if user exists with the same email
    let user = null;
    if (profile.email) {
      user = await prisma.user.findUnique({
        where: {
          email: profile.email
        }
      });
    }
    
    // If no user exists, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          emailVerified: true, // Auto-verify OAuth users
          profilePicture: profile.profilePictureUrl
        }
      });
      
      logger.info('Created new user from OAuth', {
        userId: user.id,
        provider: profile.provider
      });
    }
    
    // Link the OAuth account to the user
    await prisma.oauthAccount.create({
      data: {
        provider: profile.provider,
        providerUserId: profile.providerUserId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        userId: user.id
      }
    });
    
    return user;
  } catch (error) {
    logger.error('Error in findOrCreateOAuthUser', { error, profile });
    throw error;
  }
}

/**
 * Generate authentication URL for a provider
 */
export function getAuthUrl(provider: OAuthProvider, state?: string): string {
  const providers = getEnabledProviders();
  const providerConfig = providers[provider];
  
  if (!providerConfig.enabled) {
    throw new Error(`OAuth provider ${provider} is not enabled`);
  }
  
  const baseUrl = config.BASE_URL || `http://localhost:${config.PORT || 3000}`;
  const authUrl = `${baseUrl}/api/auth/${provider}`;
  
  if (state) {
    return `${authUrl}?state=${encodeURIComponent(state)}`;
  }
  
  return authUrl;
}

/**
 * Check if a provider is enabled
 */
export function isProviderEnabled(provider: OAuthProvider): boolean {
  const providers = getEnabledProviders();
  return providers[provider]?.enabled || false;
}

/**
 * Get all enabled providers
 */
export function getAvailableProviders(): OAuthProvider[] {
  const providers = getEnabledProviders();
  return Object.entries(providers)
    .filter(([_, config]) => config.enabled)
    .map(([name]) => name as OAuthProvider);
}

/**
 * Handle OAuth callback
 */
export async function handleOAuthCallback(provider: OAuthProvider, req: Request): Promise<User> {
  return new Promise((resolve, reject) => {
    const authenticateCallback: AuthenticateCallback = (err: Error | null, user?: Express.User | false, info?: any) => {
      if (err) {
        reject(err);
      } else if (!user) {
        reject(new Error(info?.message ?? 'Authentication failed'));
      } else {
        resolve(user as User);
      }
    };
    
    const options: AuthenticateOptions = { session: false, failWithError: true };
    passport.authenticate(provider, options, authenticateCallback)(req, req.res!, () => {});
  });
}

export default {
  initializeOAuthProviders,
  getAuthUrl,
  isProviderEnabled,
  getAvailableProviders,
  handleOAuthCallback,
  OAuthProvider
};