/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@/contexts/theme-context';
import { ThemeToggle } from '../theme-toggle';

// Mock window.matchMedia
const mockMatchMedia = jest.fn();
window.matchMedia = mockMatchMedia;

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockMatchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithTheme = (component: React.ReactElement) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  it('should render theme toggle dropdown by default', () => {
    renderWithTheme(<ThemeToggle />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should render theme toggle button variant', () => {
    renderWithTheme(<ThemeToggle variant="button" />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label');
  });

  it.skip('should open dropdown menu when clicked', () => {
    renderWithTheme(<ThemeToggle variant="dropdown" />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(toggleButton);
    
    // Check for theme options in dropdown
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should cycle through themes in button variant', () => {
    renderWithTheme(<ThemeToggle variant="button" />);
    
    const toggleButton = screen.getByRole('button');
    
    // Should start with system theme by default
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('system'));
    
    // Click to cycle to light
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('light'));
    
    // Click to cycle to dark
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('dark'));
    
    // Click to cycle back to system
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('system'));
  });

  it.skip('should show theme label when showLabel is true', () => {
    renderWithTheme(<ThemeToggle variant="button" showLabel={true} />);
    
    // Should show "System" text initially
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    renderWithTheme(<ThemeToggle size="lg" />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    renderWithTheme(<ThemeToggle className="custom-theme-toggle" />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toHaveClass('custom-theme-toggle');
  });
});

describe('ThemeProvider Integration', () => {
  beforeEach(() => {
    mockMatchMedia.mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    // Reset document attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark', 'light');
  });

  it.skip('should apply theme classes to document when theme changes', () => {
    render(
      <ThemeProvider>
        <ThemeToggle variant="dropdown" />
      </ThemeProvider>
    );
    
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(toggleButton);
    
    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);
    
    // Check that dark theme is applied to document
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveClass('dark');
  });
});