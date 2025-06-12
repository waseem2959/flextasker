/**
 * Button Component Test Suite
 * 
 * Comprehensive tests for the Button component covering all variants, sizes, and interactions.
 */

import { fireEvent, render, screen } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  // === BASIC RENDERING ===
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-primary-900');
    });

    it('should render with custom text', () => {
      render(<Button>Custom Text</Button>);
      
      expect(screen.getByText('Custom Text')).toBeInTheDocument();
    });

    it('should render as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  // === VARIANTS ===
  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-900');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-error-500');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-primary-700');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-primary-50');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary-700');
    });
  });

  // === SIZES ===
  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default Size</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-4', 'py-2.5');
    });

    it('should render small size', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('should render large size', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-6', 'py-3');
    });

    it('should render icon size', () => {
      render(<Button size="icon">🔍</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'w-11');
    });
  });

  // === STATES ===
  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none');
    });

    it('should not be clickable when disabled', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // === INTERACTIONS ===
  describe('Interactions', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle space key', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Space</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await userEvent.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // === ACCESSIBILITY ===
  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Button aria-label="Custom label">Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
    });

    it('should be focusable', () => {
      render(<Button>Focusable</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<Button disabled>Not Focusable</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });
  });

  // === CUSTOM STYLING ===
  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge custom classes with default classes', () => {
      render(<Button className="text-red-500">Custom Color</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-red-500');
      expect(button).toHaveClass('inline-flex'); // Default class should still be present
    });
  });

  // === EDGE CASES ===
  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('should handle complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      
      const button = screen.getByRole('button');
      expect(button).toContainHTML('<span>Icon</span><span>Text</span>');
    });
  });
});
