/**
 * Design System Configuration
 * 
 * This file defines the central design system for the application, including colors,
 * typography, spacing, and other design tokens. It serves as a single source of truth
 * for all visual elements, ensuring consistency across the application.
 */

// Color palette with proper semantic naming
export const colors = {
  // Brand colors
  primary: {
    DEFAULT: 'hsl(185, 76%, 35%)', // #15919B - Main brand color
    dark: 'hsl(192, 84%, 26%)',     // #0C6478 - Darker brand shade
    light: 'hsl(188, 60%, 92%)',    // #E8F6F8 - Lighter brand shade
    accent: 'hsl(177, 92%, 43%)',   // #09D1C7 - Accent/highlight color
  },
  
  // Status colors
  success: 'hsl(159, 61%, 46%)',    // #2EBD8E
  error: 'hsl(354, 70%, 54%)',      // #DC3545
  warning: 'hsl(37, 90%, 51%)',     // #F39C12
  info: 'hsl(200, 70%, 50%)',       // #2A93D5
  
  // Text colors
  text: {
    primary: 'hsl(206, 33%, 16%)',  // #1A2B34 - High contrast text
    secondary: 'hsl(220, 14%, 46%)', // #6B7280 - Secondary information
    muted: 'hsl(215, 16%, 55%)',    // #7B8794 - Less important text
    inverse: 'hsl(0, 0%, 100%)',    // #FFFFFF - Text on dark backgrounds
  },
  
  // Background colors
  background: {
    primary: 'hsl(0, 0%, 100%)',    // #FFFFFF - Main background
    secondary: 'hsl(210, 40%, 98%)', // #F8FAFC - Secondary background
    tertiary: 'hsl(210, 38%, 95%)',  // #F0F4F8 - Tertiary background
  },
  
  // Surface colors (for cards, modals, etc.)
  surface: 'hsl(210, 40%, 98%)',    // #F8FAFC
  
  // Border colors
  border: {
    DEFAULT: 'hsl(220, 13%, 91%)',  // #E5E7EB - Default border
    light: 'hsl(220, 14%, 96%)',    // #F1F2F4 - Lighter border
    dark: 'hsl(218, 11%, 65%)',     // #9CA3AF - Darker border
  },
  
  // State colors
  state: {
    hover: 'hsla(185, 76%, 35%, 0.1)', // Primary with 10% opacity
    focus: 'hsla(185, 76%, 35%, 0.2)', // Primary with 20% opacity
    pressed: 'hsla(185, 76%, 35%, 0.3)', // Primary with 30% opacity
    selected: 'hsla(185, 76%, 35%, 0.15)', // Primary with 15% opacity
    disabled: 'hsl(220, 14%, 96%)', // #F1F2F4
  },
  
  // Overlay colors
  overlay: {
    light: 'hsla(0, 0%, 0%, 0.1)', // Black with 10% opacity
    medium: 'hsla(0, 0%, 0%, 0.3)', // Black with 30% opacity
    dark: 'hsla(0, 0%, 0%, 0.5)', // Black with 50% opacity
  },
  
  // Social media colors
  social: {
    facebook: '#1877F2',
    twitter: '#1DA1F2',
    google: '#EA4335',
    linkedin: '#0A66C2',
  },
  
  // Color adjustments for dark mode
  dark: {
    background: {
      primary: 'hsl(210, 25%, 8%)',   // #0F1419
      secondary: 'hsl(210, 23%, 12%)', // #161C23
      tertiary: 'hsl(210, 20%, 16%)',  // #1D252F
    },
    surface: 'hsl(206, 29%, 16%)',    // #1C2C35
    text: {
      primary: 'hsl(210, 40%, 98%)',  // #F8FAFC
      secondary: 'hsl(215, 20%, 75%)', // #B0B8C4
      muted: 'hsl(215, 16%, 65%)',    // #9AA6B4
      inverse: 'hsl(206, 33%, 16%)',  // #1A2B34
    },
    border: {
      DEFAULT: 'hsl(213, 15%, 30%)',  // #404B5A
      light: 'hsl(213, 15%, 35%)',    // #4B5769
      dark: 'hsl(213, 15%, 25%)',     // #353F4B
    },
    state: {
      hover: 'hsla(187, 73%, 50%, 0.15)', // Dark mode primary with 15% opacity
      focus: 'hsla(187, 73%, 50%, 0.25)', // Dark mode primary with 25% opacity
      pressed: 'hsla(187, 73%, 50%, 0.35)', // Dark mode primary with 35% opacity
      selected: 'hsla(187, 73%, 50%, 0.2)', // Dark mode primary with 20% opacity
      disabled: 'hsl(210, 15%, 20%)', // #283039
    },
    primary: {
      DEFAULT: 'hsl(187, 73%, 50%)', // #26C6DA - Dark mode primary
    },
  },
};

// Typography system
export const typography = {
  // Font families
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "'Manrope', var(--font-primary)",
    mono: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
  },
  
  // Font weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Font sizes (in rem to support user font size preferences)
  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Line heights
  lineHeights: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing system (in rem)
export const spacing = {
  px: '1px',
  '0': '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',     // 2px
  DEFAULT: '0.5rem',  // 8px
  md: '0.375rem',     // 6px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px
  '3xl': '2rem',      // 32px
  full: '9999px',     // Circle/pill
};

// Shadows
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Focused elements shadow
  focus: '0 0 0 3px rgba(21, 145, 155, 0.4)', // Primary color with 40% opacity
  
  // Dark mode shadows
  dark: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    focus: '0 0 0 3px rgba(38, 198, 218, 0.4)', // Dark mode primary with 40% opacity
  },
};

// Z-index system
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 9999,
};

// Transitions
export const transitions = {
  DEFAULT: 'all 0.2s ease',
  fast: 'all 0.1s ease',
  slow: 'all 0.3s ease',
  
  // Individual property transitions
  colors: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
  opacity: 'opacity 0.2s ease',
  transform: 'transform 0.2s ease',
  shadow: 'box-shadow 0.2s ease',
  
  // Transition timing functions
  timingFunctions: {
    DEFAULT: 'ease',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Media queries
export const media = {
  xs: `@media (min-width: ${breakpoints.xs})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Max-width queries
  maxXs: `@media (max-width: ${parseInt(breakpoints.xs) - 1}px)`,
  maxSm: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
  maxMd: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  maxLg: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  maxXl: `@media (max-width: ${parseInt(breakpoints.xl) - 1}px)`,
  max2xl: `@media (max-width: ${parseInt(breakpoints['2xl']) - 1}px)`,
  
  // Other media queries
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  motion: '@media (prefers-reduced-motion: no-preference)',
  hover: '@media (hover: hover)',
  print: '@media print',
};

// Container sizes
export const containers = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  DEFAULT: '1200px',
};

// Form control sizes
export const formSizes = {
  sm: {
    height: '2rem',    // 32px
    text: typography.sizes.sm,
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
  },
  md: {
    height: '2.5rem',  // 40px
    text: typography.sizes.base,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.DEFAULT,
  },
  lg: {
    height: '3rem',    // 48px
    text: typography.sizes.lg,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
  },
};

// Button sizes
export const buttonSizes = {
  sm: {
    height: formSizes.sm.height,
    text: typography.sizes.sm,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.sm,
  },
  md: {
    height: formSizes.md.height,
    text: typography.sizes.base,
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: borderRadius.DEFAULT,
  },
  lg: {
    height: formSizes.lg.height,
    text: typography.sizes.lg,
    padding: `${spacing.sm} ${spacing.xl}`,
    borderRadius: borderRadius.md,
  },
};

// Assemble and export the complete design system
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  transitions,
  breakpoints,
  media,
  containers,
  formSizes,
  buttonSizes,
};

export default designSystem;
