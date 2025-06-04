/**
 * Test Utilities
 * 
 * Centralized testing utilities and helpers for consistent testing across the application.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
// Note: These imports may need to be adjusted based on actual file structure
// import { ReactQueryProvider } from '@/lib/query-provider';
// import { AuthProvider } from '@/contexts/auth-context';
// import { ThemeProvider } from '@/contexts/theme-context';

// === MOCK DATA ===
export const mockUser = {
  id: 'test-user-1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'USER' as const,
  avatar: 'https://example.com/avatar.jpg',
  createdAt: new Date('2023-01-01'),
  emailVerified: true,
  phoneVerified: false,
};

export const mockTask = {
  id: 'test-task-1',
  title: 'Test Task',
  description: 'This is a test task',
  budget: 100,
  budgetType: 'FIXED' as const,
  category: 'Technology',
  location: 'Test City',
  status: 'OPEN' as const,
  priority: 'MEDIUM' as const,
  createdAt: new Date('2023-01-01'),
  dueDate: new Date('2023-12-31'),
  userId: 'test-user-1',
  user: mockUser,
};

// === TEST PROVIDERS ===
interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// === CUSTOM RENDER ===
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// === UTILITIES ===
export const createMockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const createMockApiError = (message = 'Test error', status = 500) => {
  const error = new Error(message) as any;
  error.response = { status, data: { message } };
  return Promise.reject(error);
};

// === FORM TESTING HELPERS ===
export const fillForm = async (form: HTMLFormElement, data: Record<string, string>) => {
  const { fireEvent } = await import('@testing-library/react');
  
  Object.entries(data).forEach(([name, value]) => {
    const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value } });
    }
  });
};

export const submitForm = async (form: HTMLFormElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.submit(form);
};

// === ASYNC TESTING HELPERS ===
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');
  
  try {
    await waitForElementToBeRemoved(() => screen.queryByTestId('loading-spinner'), {
      timeout: 3000,
    });
  } catch {
    // Loading spinner might not be present
  }
};

// === RE-EXPORTS ===
export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';
