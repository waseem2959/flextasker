/**
 * Focus Trap Component
 * 
 * Traps focus within a container for accessibility compliance
 * Used for modals, dropdowns, and other overlay components
 */

import React, { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(', ');

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element
    const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTORS) as NodeListOf<HTMLElement>;
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll(FOCUSABLE_SELECTORS) as NodeListOf<HTMLElement>;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};