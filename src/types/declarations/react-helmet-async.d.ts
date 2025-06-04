/**
 * Type declarations for react-helmet-async
 * This file provides TypeScript types for the react-helmet-async package.
 */

declare module 'react-helmet-async' {
  import React from 'react';
  
  export interface HelmetProps {
    /**
     * Whether to defer updates to the title until after the component mounts
     */
    defer?: boolean;
    
    /**
     * Whether to encode special characters in the title
     */
    encodeSpecialCharacters?: boolean;
    
    /**
     * Children elements (meta tags, title, etc.)
     */
    children?: React.ReactNode;
    
    /**
     * HTML attributes
     */
    htmlAttributes?: React.HTMLAttributes<HTMLHtmlElement>;
    
    /**
     * Body attributes
     */
    bodyAttributes?: React.HTMLAttributes<HTMLBodyElement>;
    
    /**
     * Title tag
     */
    title?: string;
    
    /**
     * Base tag
     */
    base?: React.BaseHTMLAttributes<HTMLBaseElement>;
    
    /**
     * Meta tags
     */
    meta?: React.MetaHTMLAttributes<HTMLMetaElement>[];
    
    /**
     * Link tags
     */
    link?: React.LinkHTMLAttributes<HTMLLinkElement>[];
    
    /**
     * Script tags
     */
    script?: React.ScriptHTMLAttributes<HTMLScriptElement>[];
    
    /**
     * NoScript tags
     */
    noscript?: React.HTMLAttributes<HTMLElement>[];
    
    /**
     * Style tags
     */
    style?: React.StyleHTMLAttributes<HTMLStyleElement>[];
    
    /**
     * Priority attributes for SSR
     */
    prioritizeSeoTags?: boolean;
    
    /**
     * Callback when a Helmet instance is rendered
     */
    onChangeClientState?: (newState: any, addedTags: any, removedTags: any) => void;
    
    [key: string]: any;
  }
  
  export class Helmet extends React.Component<HelmetProps> {
    static renderStatic(): {
      base: any;
      bodyAttributes: any;
      htmlAttributes: any;
      link: any;
      meta: any;
      noscript: any;
      script: any;
      style: any;
      title: any;
    };
  }
  
  export interface ProviderProps {
    context?: object;
    children: React.ReactNode;
  }
  
  export class HelmetProvider extends React.Component<ProviderProps> {}
}
