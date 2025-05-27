/**
 * Mock Service Worker Setup
 * 
 * This file configures MSW to intercept API requests during tests and development,
 * providing consistent mock responses without requiring an actual backend.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

// Create the MSW server instance with our request handlers
export const server = setupServer(...handlers);

// Start the server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers after each test (important for test isolation)
afterEach(() => server.resetHandlers());

// Clean up after all tests are complete
afterAll(() => server.close());
