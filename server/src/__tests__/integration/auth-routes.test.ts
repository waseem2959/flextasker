/**
 * Auth Routes Integration Tests
 * 
 * Integration tests for authentication endpoints including registration, login, and token management.
 */

import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from '../../utils/test-utils';
import { UserRole } from '../../../../shared/types/enums';

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await cleanupTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.USER,
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Password should not be included in response
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '',
        lastName: '',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('Validation failed'),
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should prevent duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'First',
        lastName: 'User',
      };

      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...userData, firstName: 'Second' })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('already exists'),
          code: 'CONFLICT_ERROR',
        },
      });
    });

    it('should enforce password complexity', async () => {
      const weakPasswords = [
        'password', // No uppercase, no numbers
        'PASSWORD', // No lowercase, no numbers
        'Password', // No numbers
        '12345678', // No letters
        'Pass1', // Too short
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password,
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@example.com',
        password: 'Password123!',
        firstName: 'Login',
        lastName: 'User',
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: testUser.id,
            email: testUser.email,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('Invalid'),
          code: 'AUTHENTICATION_ERROR',
        },
      });
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('Invalid'),
          code: 'AUTHENTICATION_ERROR',
        },
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: '',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const user = await createTestUser({
        email: 'refresh@example.com',
        password: 'Password123!',
        firstName: 'Refresh',
        lastName: 'User',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'Password123!',
        });

      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // New tokens should be different from the original
      expect(response.body.data.tokens.accessToken).not.toBe(refreshToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
        },
      });
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await createTestUser({
        email: 'logout@example.com',
        password: 'Password123!',
        firstName: 'Logout',
        lastName: 'User',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'Password123!',
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
      userId = loginResponse.body.data.user.id;
    });

    it('should logout authenticated user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should reject unauthenticated logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
        },
      });
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await createTestUser({
        email: 'forgot@example.com',
        password: 'Password123!',
        firstName: 'Forgot',
        lastName: 'User',
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset email sent'),
      });
    });

    it('should handle non-existent email gracefully', async () => {
      // For security, we don't reveal if email exists or not
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset email sent'),
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const loginData = {
        email: 'ratelimit@example.com',
        password: 'WrongPassword123!',
      };

      // Make multiple failed login attempts
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send(loginData)
      );

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
