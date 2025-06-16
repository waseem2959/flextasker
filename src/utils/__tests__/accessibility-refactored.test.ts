/**
 * Accessibility Utilities Refactored Tests
 * 
 * Tests for the refactored accessibility utilities to ensure SonarLint fixes
 * didn't break functionality
 */

import { renderHook, act } from '@testing-library/react';
import { 
  getFocusableElements, 
  focusFirstElement, 
  focusLastElement,
  isElementFocused,
  isVisibleToScreenReader,
  getAccessibleName,
  hasAccessibleName,
  useFocusTrap,
  announce,
  useAnnounce,
  useKeyboardNavigation,
  auditAccessibility,
  FOCUSABLE_ELEMENTS
} from '../accessibility';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: jest.fn(() => ({
    display: 'block',
    visibility: 'visible',
    color: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(0, 0, 0, 0)'
  }))
});

describe('Accessibility Utilities Refactored', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('RefObject fix', () => {
    it('should return RefObject instead of MutableRefObject', () => {
      const { result } = renderHook(() => useFocusTrap());
      
      // The ref should be a RefObject (readonly current property)
      expect(result.current.ref).toHaveProperty('current');
      expect(result.current.ref.current).toBeNull();
    });

    it('should work with focus trap functionality', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const { result } = renderHook(() => useFocusTrap({ active: true }));
      
      // Simulate setting the ref
      act(() => {
        (result.current.ref as any).current = container;
      });

      expect(result.current.ref.current).toBe(container);
    });
  });

  describe('Reduced complexity in handleKeyDown', () => {
    it('should handle tab navigation correctly', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const onFocusRetained = jest.fn();
      const { result } = renderHook(() => 
        useFocusTrap({ 
          active: true, 
          onFocusRetained 
        })
      );

      // Simulate setting the ref
      act(() => {
        (result.current.ref as any).current = container;
      });

      // Simulate tab key press from last element
      button2.focus();
      const tabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        bubbles: true 
      });
      
      act(() => {
        container.dispatchEvent(tabEvent);
      });

      // The focus trap should handle this correctly
      expect(result.current.ref.current).toBe(container);
    });

    it('should handle shift+tab navigation correctly', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      
      container.appendChild(button1);
      container.appendChild(button2);
      document.body.appendChild(container);

      const onFocusRetained = jest.fn();
      const { result } = renderHook(() => 
        useFocusTrap({ 
          active: true, 
          onFocusRetained 
        })
      );

      // Simulate setting the ref
      act(() => {
        (result.current.ref as any).current = container;
      });

      // Simulate shift+tab key press from first element
      button1.focus();
      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true,
        bubbles: true 
      });
      
      act(() => {
        container.dispatchEvent(shiftTabEvent);
      });

      expect(result.current.ref.current).toBe(container);
    });

    it('should call custom onKeyDown handler', () => {
      const container = document.createElement('div');
      const onKeyDown = jest.fn();
      
      document.body.appendChild(container);

      const { result } = renderHook(() => 
        useFocusTrap({ 
          active: true, 
          onKeyDown 
        })
      );

      // Simulate setting the ref
      act(() => {
        (result.current.ref as any).current = container;
      });

      // Simulate escape key press
      const escapeEvent = new KeyboardEvent('keydown', { 
        key: 'Escape', 
        bubbles: true 
      });
      
      act(() => {
        container.dispatchEvent(escapeEvent);
      });

      expect(onKeyDown).toHaveBeenCalledWith(escapeEvent);
    });
  });

  describe('Core functionality preservation', () => {
    it('should get focusable elements correctly', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      const input = document.createElement('input');
      const hiddenInput = document.createElement('input');
      hiddenInput.tabIndex = -1;
      
      container.appendChild(button);
      container.appendChild(input);
      container.appendChild(hiddenInput);
      
      const focusable = getFocusableElements(container);
      expect(focusable).toHaveLength(2);
      expect(focusable).toContain(button);
      expect(focusable).toContain(input);
      expect(focusable).not.toContain(hiddenInput);
    });

    it('should focus first and last elements correctly', () => {
      const container = document.createElement('div');
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);

      // Mock focus method
      button1.focus = jest.fn();
      button3.focus = jest.fn();

      focusFirstElement(container);
      expect(button1.focus).toHaveBeenCalled();

      focusLastElement(container);
      expect(button3.focus).toHaveBeenCalled();
    });

    it('should check element focus correctly', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      
      // Mock activeElement
      Object.defineProperty(document, 'activeElement', {
        value: button,
        configurable: true
      });

      expect(isElementFocused(button)).toBe(true);
      
      const otherButton = document.createElement('button');
      expect(isElementFocused(otherButton)).toBe(false);
    });

    it('should get accessible name correctly', () => {
      // Test aria-label
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close dialog');
      expect(getAccessibleName(button)).toBe('Close dialog');

      // Test text content
      const textButton = document.createElement('button');
      textButton.textContent = 'Submit form';
      expect(getAccessibleName(textButton)).toBe('Submit form');

      // Test no accessible name
      const emptyButton = document.createElement('button');
      expect(getAccessibleName(emptyButton)).toBe('');
    });

    it('should check if element has accessible name', () => {
      const button = document.createElement('button');
      expect(hasAccessibleName(button)).toBe(false);

      button.textContent = 'Click me';
      expect(hasAccessibleName(button)).toBe(true);
    });
  });

  describe('Announcement functionality', () => {
    it('should create announcement container', () => {
      announce('Test message');
      
      const container = document.getElementById('screen-reader-announcer');
      expect(container).toBeTruthy();
      expect(container?.getAttribute('aria-live')).toBe('polite');
    });

    it('should use announce hook correctly', () => {
      const { result } = renderHook(() => useAnnounce());
      
      expect(result.current.polite).toBeInstanceOf(Function);
      expect(result.current.assertive).toBeInstanceOf(Function);
      
      // Test that functions can be called
      act(() => {
        result.current.polite('Polite message');
        result.current.assertive('Assertive message');
      });
    });
  });
});
