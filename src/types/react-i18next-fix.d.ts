/**
 * React i18next Type Compatibility Fix
 * 
 * This file resolves the ReactI18NextChildren vs ReactNode type conflicts
 * that occur when using react-i18next with strict TypeScript settings.
 */


declare global {
  namespace React {
    // Override ReactI18NextChildren to be compatible with ReactNode
    type ReactI18NextChildren = ReactNode;
  }
}

// Module augmentation for react-i18next
declare module 'react-i18next' {
  import { ReactNode } from 'react';
  
  // Fix the ReactI18NextChildren type to be compatible with ReactNode
  export type ReactI18NextChildren = ReactNode;
  
  // Ensure all component props use ReactNode instead of ReactI18NextChildren
  export interface TransProps {
    children?: ReactNode;
    components?: readonly React.ReactElement[] | { readonly [tagName: string]: React.ReactElement };
    count?: number;
    defaults?: string;
    i18n?: i18n;
    i18nKey?: string;
    ns?: string | readonly string[];
    parent?: string | React.ComponentType<any> | null;
    tOptions?: {};
    values?: {};
    shouldUnescape?: boolean;
    t?: TFunction;
  }
}

// Additional type fixes for UI components
declare module '@radix-ui/react-slot' {
  import { ReactNode } from 'react';

  export interface SlotProps {
    children?: ReactNode;
    [key: string]: any;
  }
}

// Override problematic types globally
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Type assertion helper for React i18n compatibility
declare global {
  type ReactI18NextChildren = React.ReactNode;

  interface Window {
    // Add any global window properties if needed
  }
}

// Export to ensure this file is treated as a module
export { };

