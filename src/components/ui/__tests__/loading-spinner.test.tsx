/**
 * Loading Spinner Component Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner, PageLoading, InlineLoading } from '../loading-spinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
    
    // Check for screen reader text
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Custom loading message" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading message');
    expect(screen.getByText('Custom loading message')).toHaveClass('sr-only');
  });

  it('applies size classes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    
    let spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-4', 'w-4');
    
    rerender(<LoadingSpinner size="lg" />);
    spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-12', 'w-12');
    
    rerender(<LoadingSpinner size="xl" />);
    spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-16', 'w-16');
  });

  it('applies color classes correctly', () => {
    const { rerender } = render(<LoadingSpinner color="primary" />);
    
    let spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('border-primary-500');
    
    rerender(<LoadingSpinner color="neutral" />);
    spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('border-neutral-500');
    
    rerender(<LoadingSpinner color="white" />);
    spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('border-white');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });

  it('has proper animation classes', () => {
    render(<LoadingSpinner />);
    
    const spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('animate-spin');
  });
});

describe('PageLoading', () => {
  it('renders with default message', () => {
    render(<PageLoading />);
    
    // Check for visible text (not screen reader text)
    expect(screen.getByText('Loading...', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<PageLoading message="Loading dashboard data..." />);
    
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });

  it('has proper layout structure', () => {
    render(<PageLoading />);
    
    const text = screen.getByText('Loading...', { selector: 'p' });
    const container = text.parentElement?.parentElement;
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'min-h-[400px]');
    
    const textContainer = text.parentElement;
    expect(textContainer).toHaveClass('text-center');
  });

  it('uses large spinner size', () => {
    render(<PageLoading />);
    
    const spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-12', 'w-12');
  });

  it('has proper typography styling', () => {
    render(<PageLoading />);
    
    const message = screen.getByText('Loading...', { selector: 'p' });
    expect(message).toHaveClass('mt-4', 'text-neutral-600', 'font-primary');
  });
});

describe('InlineLoading', () => {
  it('renders with default message and size', () => {
    render(<InlineLoading />);
    
    expect(screen.getByText('Loading...', { selector: 'span.text-neutral-600' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<InlineLoading message="Saving..." />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<InlineLoading size="md" />);
    
    const spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-8', 'w-8');
  });

  it('has proper inline layout', () => {
    render(<InlineLoading />);
    
    const container = screen.getByText('Loading...', { selector: 'span.text-neutral-600' }).parentElement;
    expect(container).toHaveClass('flex', 'items-center', 'space-x-2');
  });

  it('has proper text styling', () => {
    render(<InlineLoading />);
    
    const message = screen.getByText('Loading...', { selector: 'span.text-neutral-600' });
    expect(message).toHaveClass('text-neutral-600', 'text-sm');
  });

  it('uses small spinner by default', () => {
    render(<InlineLoading />);
    
    const spinnerDiv = screen.getByRole('status').firstChild;
    expect(spinnerDiv).toHaveClass('h-4', 'w-4');
  });
});

describe('Accessibility', () => {
  it('all components have proper ARIA labels', () => {
    const { rerender } = render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
    
    rerender(<PageLoading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
    
    rerender(<InlineLoading />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
  });

  it('all components provide screen reader text', () => {
    const { rerender } = render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
    
    rerender(<PageLoading />);
    // PageLoading has visible text, not sr-only
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    rerender(<InlineLoading />);
    // InlineLoading has visible text, not sr-only
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('supports custom aria labels', () => {
    render(<LoadingSpinner label="Processing request" />);
    
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing request');
    expect(screen.getByText('Processing request')).toHaveClass('sr-only');
  });
});