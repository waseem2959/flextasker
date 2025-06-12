/**
 * Input Component Tests
 * 
 * Tests for the Input UI component including variants, validation, and interactions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-10');
      expect(input).toHaveClass('w-full');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter your name" />);
      
      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });

    it('should render with default value', () => {
      render(<Input defaultValue="Default text" />);
      
      const input = screen.getByDisplayValue('Default text');
      expect(input).toBeInTheDocument();
    });

    it('should render with controlled value', () => {
      render(<Input value="Controlled text" onChange={() => {}} />);
      
      const input = screen.getByDisplayValue('Controlled text');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('should render as text input by default', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      // Input without explicit type defaults to text in browsers
      expect(input).toBeInTheDocument();
    });

    it('should render as email input', () => {
      render(<Input type="email" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render as password input', () => {
      render(<Input type="password" />);

      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render as number input', () => {
      render(<Input type="number" />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render as search input', () => {
      render(<Input type="search" />);
      
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });
  });

  describe('States', () => {
    it('should be enabled by default', () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
      expect(input).not.toHaveAttribute('readonly');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('should be readonly when readonly prop is true', () => {
      render(<Input readOnly />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
    });

    it('should be required when required prop is true', () => {
      render(<Input required />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });

  describe('Styling', () => {
    it('should apply default styling classes', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('flex');
      expect(input).toHaveClass('h-10');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('border');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-2');
    });

    it('should apply custom className', () => {
      render(<Input className="custom-input-class" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input-class');
      expect(input).toHaveClass('border'); // Should still have default classes
    });

    it('should apply focus styles', async () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:border-[hsl(185,76%,35%)]');
      expect(input).toHaveClass('focus:ring-2');
    });
  });

  describe('Interactions', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');
      
      expect(input).toHaveValue('Hello World');
    });

    it('should call onChange when value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'test');
      
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
    });

    it('should call onFocus when focused', async () => {
      const handleFocus = jest.fn();
      render(<Input onFocus={handleFocus} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = jest.fn();
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.tab(); // Move focus away
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const handleKeyDown = jest.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      
      const input = screen.getByRole('textbox');
      await userEvent.type(input, '{enter}');
      
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should show validation state with aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should associate with error message via aria-describedby', () => {
      render(
        <div>
          <Input aria-describedby="error-message" />
          <div id="error-message">This field is required</div>
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should handle pattern validation', () => {
      render(<Input pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}');
    });

    it('should handle min and max length', () => {
      render(<Input minLength={3} maxLength={10} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minlength', '3');
      expect(input).toHaveAttribute('maxlength', '10');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', async () => {
      render(<Input />);
      
      const input = screen.getByRole('textbox');
      await userEvent.tab();
      
      expect(input).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Search products" />);
      
      const input = screen.getByLabelText('Search products');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <div>
          <label id="input-label">Username</label>
          <Input aria-labelledby="input-label" />
        </div>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-labelledby', 'input-label');
    });

    it('should not be focusable when disabled', () => {
      render(<Input disabled />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      
      // Try to focus - should not work
      input.focus();
      expect(input).not.toHaveFocus();
    });
  });

  describe('Form Integration', () => {
    it('should work with form submission', async () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return formData.get('username');
      });
      
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      );
      
      const submitButton = screen.getByRole('button');
      await userEvent.click(submitButton);
      
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('should reset with form reset', async () => {
      render(
        <form>
          <Input name="username" defaultValue="initial" />
          <button type="reset">Reset</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      const resetButton = screen.getByRole('button');
      
      // Change the value
      await userEvent.clear(input);
      await userEvent.type(input, 'changed');
      expect(input).toHaveValue('changed');
      
      // Reset the form
      await userEvent.click(resetButton);
      expect(input).toHaveValue('initial');
    });
  });

  describe('Number Input Specific', () => {
    it('should handle number input with min and max', () => {
      render(<Input type="number" min={0} max={100} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should handle step attribute', () => {
      render(<Input type="number" step={0.1} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.1');
    });
  });

  describe('File Input Specific', () => {
    it('should handle file input', () => {
      render(<Input type="file" />);
      
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'file');
    });

    it('should handle multiple file selection', () => {
      render(<Input type="file" multiple />);
      
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('should handle file type restrictions', () => {
      render(<Input type="file" accept=".jpg,.png,.gif" />);
      
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.jpg,.png,.gif');
    });
  });
});
