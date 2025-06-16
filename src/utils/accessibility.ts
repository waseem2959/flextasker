/**
 * Accessibility Utilities
 * 
 * This file provides utilities to enhance application accessibility,
 * following WCAG guidelines and best practices.
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /**
   * Whether the focus trap is active
   */
  active?: boolean;
  
  /**
   * Whether to initially focus the first focusable element
   * @default true
   */
  initialFocus?: boolean;
  
  /**
   * Element to focus when trap is deactivated
   */
  returnFocusTo?: HTMLElement | null;
  
  /**
   * Callback when a key is pressed within the trap
   */
  onKeyDown?: (event: KeyboardEvent) => void;
  
  /**
   * Callback when focus leaves the trap and is returned to the first/last element
   */
  onFocusRetained?: () => void;
}

/**
 * List of focusable element selectors
 */
export const FOCUSABLE_ELEMENTS = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
  'audio[controls]:not([tabindex="-1"])',
  'video[controls]:not([tabindex="-1"])',
].join(',');

/**
 * Get all focusable elements within a container element
 */
export function getFocusableElements(element: HTMLElement): HTMLElement[] {
  return Array.from(element.querySelectorAll(FOCUSABLE_ELEMENTS));
}

/**
 * Focus the first focusable element within a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[0].focus();
  }
}

/**
 * Focus the last focusable element within a container
 */
export function focusLastElement(container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  if (focusable.length > 0) {
    focusable[focusable.length - 1].focus();
  }
}

/**
 * Focus any element (alias for backward compatibility)
 */
export function focusElement(element: HTMLElement): void {
  element.focus();
}

/**
 * Announce to screen reader (alias for backward compatibility)
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  announce(message, politeness);
}

/**
 * Trap focus within container (simplified version for backward compatibility)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    return () => {};
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  firstElement.focus();

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Check if an element is focused
 */
export function isElementFocused(element: Element): boolean {
  return element === document.activeElement;
}

/**
 * Check if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const { display, visibility } = window.getComputedStyle(element);
  
  if (display === 'none' || visibility === 'hidden') {
    return false;
  }
  
  // Check for aria-hidden
  if (element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // Check if parent elements hide this element
  let parent = element.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (
      parentStyle.display === 'none' || 
      parentStyle.visibility === 'hidden' ||
      parent.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }
    parent = parent.parentElement;
  }
  
  return true;
}

/**
 * Get an element's accessible name as exposed to assistive technology
 * Simplified implementation of the accessible name calculation algorithm
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check aria-labelledby
  const labelledby = element.getAttribute('aria-labelledby');
  if (labelledby) {
    return labelledby
      .split(' ')
      .map(id => {
        const labelElement = document.getElementById(id);
        return labelElement ? labelElement.textContent : '';
      })
      .filter(Boolean)
      .join(' ');
  }
  
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    return ariaLabel;
  }
  
  // Check for label element (for form controls)
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) {
        return label.textContent ?? '';
      }
    }
    
    // Check for wrapping label
    let parent = element.parentElement;
    while (parent) {
      if (parent.tagName === 'LABEL') {
        // Get text excluding the form control itself
        const clone = parent.cloneNode(true) as HTMLElement;
        Array.from(clone.querySelectorAll('input, textarea, select')).forEach(el => {
          el.parentNode?.removeChild(el);
        });
        return clone.textContent ?? '';
      }
      parent = parent.parentElement;
    }
  }
  
  // Check for title attribute
  if (element.title) {
    return element.title;
  }
  
  // For buttons, links, etc. use text content
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLAnchorElement ||
    element.getAttribute('role') === 'button'
  ) {
    return element.textContent ?? '';
  }
  
  // No accessible name found
  return '';
}

/**
 * Check if an element has an accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  return getAccessibleName(element).trim().length > 0;
}

/**
 * Hook to trap focus within a container
 */
export function useFocusTrap(options: FocusTrapOptions = {}): {
  ref: React.RefObject<HTMLElement | null>;
} {
  const {
    active = true,
    initialFocus = true,
    returnFocusTo = null,
    onKeyDown,
    onFocusRetained,
  } = options;
  
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<Element | null>(null);
  
  // Save previously focused element when trap activates
  useEffect(() => {
    if (active) {
      previousFocusRef.current = document.activeElement;
      
      // Set initial focus if requested
      if (initialFocus && containerRef.current) {
        focusFirstElement(containerRef.current);
      }
      
      return () => {
        // Return focus when trap deactivates
        if (returnFocusTo) {
          returnFocusTo.focus();
        } else if (previousFocusRef.current && 'focus' in previousFocusRef.current) {
          (previousFocusRef.current as HTMLElement).focus();
        }
      };
    }
  }, [active, initialFocus, returnFocusTo]);
  
  // Helper function to handle tab navigation within focus trap
  const handleTabNavigation = useCallback(
    (event: KeyboardEvent, focusableElements: HTMLElement[]) => {
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        // If shift+tab from first element, move focus to last element
        event.preventDefault();
        lastElement.focus();
        if (onFocusRetained) onFocusRetained();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        // If tab from last element, move focus to first element
        event.preventDefault();
        firstElement.focus();
        if (onFocusRetained) onFocusRetained();
      }
    },
    [onFocusRetained]
  );

  // Handle keydown events for focus trap
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || !containerRef.current) return;

      // Call provided keydown handler if it exists
      if (onKeyDown) {
        onKeyDown(event);
      }

      // Handle Tab key navigation
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(containerRef.current);
        handleTabNavigation(event, focusableElements);
      }

      // Handle Escape key to close modal/dialog
      if (event.key === 'Escape') {
        // Can be handled by the component
      }
    },
    [active, onKeyDown, handleTabNavigation]
  );
  
  // Add event listeners
  useEffect(() => {
    if (active && containerRef.current) {
      containerRef.current.addEventListener('keydown', handleKeyDown);
      
      return () => {
        containerRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [active, handleKeyDown]);
  
  return { ref: containerRef };
}

/**
 * Announce a message to screen readers using aria-live
 */
export function announce(
  message: string, 
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  // Check if we already have an announcement container
  let container = document.getElementById('screen-reader-announcer');
  
  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.id = 'screen-reader-announcer';
    container.setAttribute('aria-live', politeness);
    container.setAttribute('aria-atomic', 'true');
    
    // Hide visually but keep available to screen readers
    Object.assign(container.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    
    document.body.appendChild(container);
  }
  
  // Update aria-live politeness if different from current
  if (container.getAttribute('aria-live') !== politeness) {
    container.setAttribute('aria-live', politeness);
  }
  
  // Temporarily clear contents to ensure announcement is made
  // even if the same message is announced twice in a row
  container.textContent = '';
  
  // Delay setting the message to ensure the clear takes effect
  setTimeout(() => {
    container.textContent = message;
  }, 50);
}

/**
 * Hook for managing ARIA live announcements
 */
export function useAnnounce() {
  return {
    /**
     * Announce a message with polite politeness
     */
    polite: useCallback((message: string) => announce(message, 'polite'), []),
    
    /**
     * Announce a message with assertive politeness
     */
    assertive: useCallback((message: string) => announce(message, 'assertive'), []),
  };
}

/**
 * Check if the user is navigating with a keyboard
 */
export function useKeyboardNavigation() {
  const isNavigatingWithKeyboardRef = useRef<boolean>(false);
  
  useEffect(() => {
    const handleFirstTab = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isNavigatingWithKeyboardRef.current = true;
        document.body.classList.add('keyboard-navigation');
        
        // Remove the event listener after first tab detected
        window.removeEventListener('keydown', handleFirstTab);
      }
    };
    
    const handleMouseDown = () => {
      if (isNavigatingWithKeyboardRef.current) {
        isNavigatingWithKeyboardRef.current = false;
        document.body.classList.remove('keyboard-navigation');
      }
    };
    
    window.addEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return {
    isNavigatingWithKeyboard: () => isNavigatingWithKeyboardRef.current,
  };
}

/**
 * Skip navigation link component props
 */
export interface SkipLinkProps {
  /**
   * ID of the target element to skip to
   */
  targetId: string;
  
  /**
   * Text content for the skip link
   * @default "Skip to main content"
   */
  text?: string;
  
  /**
   * CSS class name for the skip link
   */
  className?: string;
}

/**
 * Generate styles for a skip navigation link
 */
export function getSkipLinkStyles(visible: boolean): React.CSSProperties {
  return {
    position: 'absolute',
    top: visible ? '0.5rem' : '-999px',
    left: visible ? '0.5rem' : '-999px',
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '0.5rem 1rem',
    zIndex: 9999,
    textDecoration: 'none',
    fontWeight: 'bold',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
    borderRadius: '4px',
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    // When focused but not visible, ensure it's still accessible
    // but doesn't take up space in the layout
    ...(visible ? {} : { height: '1px', width: '1px', overflow: 'hidden' }),
  };
}

/**
 * Accessibility audit for a DOM element
 */
export interface AccessibilityAuditResult {
  /**
   * Whether the element passes all checks
   */
  passes: boolean;
  
  /**
   * List of issues found
   */
  issues: {
    severity: 'error' | 'warning' | 'info';
    message: string;
    element: HTMLElement;
    wcagCriteria?: string;
    solution?: string;
  }[];
}

/**
 * Perform basic accessibility audit on an element
 */
export function auditAccessibility(element: HTMLElement): AccessibilityAuditResult {
  const issues: AccessibilityAuditResult['issues'] = [];
  
  // Function to add an issue
  const addIssue = (
    severity: 'error' | 'warning' | 'info',
    message: string,
    targetElement: HTMLElement,
    wcagCriteria?: string,
    solution?: string
  ) => {
    issues.push({
      severity,
      message,
      element: targetElement,
      wcagCriteria,
      solution
    });
  };
  
  // Check images for alt text
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('alt')) {
      addIssue(
        'error',
        'Image is missing alt text',
        img as HTMLElement,
        'WCAG 1.1.1 (A)',
        'Add appropriate alt text that describes the image content or purpose. Use empty alt="" for decorative images.'
      );
    }
  });
  
  // Check buttons and links for accessible names
  const buttons = element.querySelectorAll('button, [role="button"]');
  buttons.forEach(button => {
    if (!hasAccessibleName(button as HTMLElement)) {
      addIssue(
        'error',
        'Button has no accessible name',
        button as HTMLElement,
        'WCAG 4.1.2 (A)',
        'Add text content, aria-label, or aria-labelledby to provide an accessible name.'
      );
    }
  });
  
  const links = element.querySelectorAll('a');
  links.forEach(link => {
    if (!hasAccessibleName(link as HTMLElement)) {
      addIssue(
        'error',
        'Link has no accessible name',
        link as HTMLElement,
        'WCAG 4.1.2 (A)',
        'Add meaningful text content, aria-label, or aria-labelledby to the link.'
      );
    }
    
    // Check for vague link text
    const linkText = link.textContent?.trim().toLowerCase() ?? '';
    if (['click here', 'read more', 'more', 'link', 'here'].includes(linkText)) {
      addIssue(
        'warning',
        'Link text is not descriptive',
        link as HTMLElement,
        'WCAG 2.4.4 (A)',
        'Use more descriptive link text that indicates the purpose or destination of the link.'
      );
    }
  });
  
  // Check form controls for labels
  const formControls = element.querySelectorAll('input, select, textarea');
  formControls.forEach(control => {
    // Skip hidden inputs, submit buttons, etc.
    if (
      control instanceof HTMLInputElement && 
      ['hidden', 'submit', 'button', 'reset'].includes(control.type)
    ) {
      return;
    }
    
    if (!hasAccessibleName(control as HTMLElement)) {
      addIssue(
        'error',
        'Form control has no accessible name',
        control as HTMLElement,
        'WCAG 4.1.2 (A)',
        'Associate a label element with the input using the "for" attribute, or add aria-label/aria-labelledby.'
      );
    }
  });
  
  // Check heading hierarchy
  const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    const level = parseInt(current.tagName.substring(1), 10);
    
    if (i > 0) {
      const previous = headings[i - 1];
      const previousLevel = parseInt(previous.tagName.substring(1), 10);
      
      if (level > previousLevel + 1) {
        addIssue(
          'warning',
          `Heading level skipped from h${previousLevel} to h${level}`,
          current as HTMLElement,
          'WCAG 1.3.1 (A)',
          `Ensure heading levels are properly nested. Change this heading to h${previousLevel + 1} or add an intermediate heading.`
        );
      }
    }
  }
  
  // Check for appropriate color contrast (simplified check)
  // This is just a placeholder - a real implementation would do actual contrast calculations
  const colorWarning = 'This element may have insufficient color contrast. Use a color contrast analyzer tool to verify.';
  const colorSolution = 'Ensure text has a contrast ratio of at least 4.5:1 against its background (3:1 for large text).';
  
  // Check for potential color contrast issues with text elements
  const textElements = element.querySelectorAll('p, span, div, a, h1, h2, h3, h4, h5, h6');
  textElements.forEach(el => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const bgColor = styles.backgroundColor;
    
    // If both text and background colors are specified, flag as a potential issue
    // In a real implementation, we would calculate the actual contrast ratio
    if (color !== 'rgb(0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
      addIssue(
        'info',
        colorWarning,
        el as HTMLElement,
        'WCAG 1.4.3 (AA)',
        colorSolution
      );
    }
  });
  
  return {
    passes: issues.length === 0,
    issues
  };
}

export default {
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
  getSkipLinkStyles,
  auditAccessibility,
};
