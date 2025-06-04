/**
 * Type declarations for i18next
 * This is a simplified version of the actual types to fix TypeScript errors
 */

declare module 'i18next' {
  export interface i18n {
    t: (key: string, options?: any) => string;
    changeLanguage: (lng: string) => Promise<any>;
    language: string;
    use: (plugin: any) => i18n;
    init: (options: InitOptions) => Promise<i18n>;
  }

  export interface InitOptions {
    fallbackLng?: string | string[];
    supportedLngs?: string[];
    defaultNS?: string;
    ns?: string | string[];
    backend?: any;
    detection?: any;
    interpolation?: any;
    react?: any;
    debug?: boolean;
    initImmediate?: boolean;
    [key: string]: any;
  }

  const i18next: i18n;
  export default i18next;
}

declare module 'i18next-browser-languagedetector' {
    
  export default class LanguageDetector {
    constructor(services?: any, options?: any);
    type: string;
    detect: () => string | undefined;
    cacheUserLanguage: (lng: string) => void;
  }
}

declare module 'i18next-http-backend' {
    
  export default class Backend {
    constructor(services?: any, options?: any);
    type: string;
    read: (language: string, namespace: string, callback: Function) => void;
  }
}

declare module 'react-i18next' {
  import { i18n } from 'i18next';
    import React from 'react';

  // Fix ReactI18NextChildren type compatibility
  export type ReactI18NextChildren = React.ReactNode;

  export function useTranslation(ns?: string | string[]): {
    t: (key: string, options?: any) => string;
    i18n: i18n;
    ready: boolean;
  };

  export const initReactI18next: {
    type: string;
  };

  export function Trans(props: any): React.ReactElement;

  export interface WithTranslation {
    t: (key: string, options?: any) => string;
    i18n: i18n;
    tReady: boolean;
  }

  export function withTranslation(ns?: string | string[]): <P>(
    component: React.ComponentType<P & WithTranslation>
  ) => React.FC<P>;
}

// Global type declaration to fix ReactI18NextChildren conflicts
declare global {
  namespace React {
    type ReactI18NextChildren = ReactNode;
  }
}
