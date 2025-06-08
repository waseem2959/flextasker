// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html'
  ],
  // Enable JIT mode for faster builds and smaller CSS
  mode: 'jit',
  theme: {
    extend: {
      colors: {
        // Project-map aligned primary colors (teal-to-mint gradient)
        primary: {
          950: 'rgb(var(--color-primary-950))',
          900: 'rgb(var(--color-primary-900))',
          800: 'rgb(var(--color-primary-800))',
          700: 'rgb(var(--color-primary-700))',
          600: 'rgb(var(--color-primary-600))',
          500: 'rgb(var(--color-primary-500))',
          400: 'rgb(var(--color-primary-400))',
          300: 'rgb(var(--color-primary-300))',
          200: 'rgb(var(--color-primary-200))',
          100: 'rgb(var(--color-primary-100))',
          50: 'rgb(var(--color-primary-50))',
          DEFAULT: 'rgb(var(--color-primary-500))',
        },

        // Neutral palette with teal undertones
        neutral: {
          900: 'rgb(var(--color-neutral-900))',
          800: 'rgb(var(--color-neutral-800))',
          700: 'rgb(var(--color-neutral-700))',
          600: 'rgb(var(--color-neutral-600))',
          500: 'rgb(var(--color-neutral-500))',
          400: 'rgb(var(--color-neutral-400))',
          300: 'rgb(var(--color-neutral-300))',
          200: 'rgb(var(--color-neutral-200))',
          100: 'rgb(var(--color-neutral-100))',
          50: 'rgb(var(--color-neutral-50))',
          0: 'rgb(var(--color-neutral-0))',
        },

        // Semantic colors
        success: {
          700: 'rgb(var(--color-success-700))',
          500: 'rgb(var(--color-success-500))',
          300: 'rgb(var(--color-success-300))',
          100: 'rgb(var(--color-success-100))',
          DEFAULT: 'rgb(var(--color-success-500))',
        },
        error: {
          700: 'rgb(var(--color-error-700))',
          500: 'rgb(var(--color-error-500))',
          300: 'rgb(var(--color-error-300))',
          100: 'rgb(var(--color-error-100))',
          DEFAULT: 'rgb(var(--color-error-500))',
        },
        warning: {
          700: 'rgb(var(--color-warning-700))',
          500: 'rgb(var(--color-warning-500))',
          300: 'rgb(var(--color-warning-300))',
          100: 'rgb(var(--color-warning-100))',
          DEFAULT: 'rgb(var(--color-warning-500))',
        },
        info: {
          700: 'rgb(var(--color-info-700))',
          500: 'rgb(var(--color-info-500))',
          300: 'rgb(var(--color-info-300))',
          100: 'rgb(var(--color-info-100))',
          DEFAULT: 'rgb(var(--color-info-500))',
        },

        // Legacy compatibility (maintain existing functionality)
        text: {
          primary: 'rgb(var(--color-text-primary))',
          secondary: 'rgb(var(--color-text-secondary))',
          muted: 'rgb(var(--color-text-muted))',
          inverse: 'rgb(var(--color-text-inverse))',
        },
        background: 'rgb(var(--color-bg-primary))',
        surface: 'rgb(var(--color-bg-secondary))',
        border: 'rgb(var(--color-border))',
      },
      spacing: {
        // Design system spacing (8px base unit)
        0: 'var(--space-0)',
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        32: 'var(--space-32)',
        // Legacy compatibility
        '4.5': '1.125rem',
        '18': '4.5rem'
      },
      fontFamily: {
        // Project-map dual-typeface system
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        // Legacy compatibility
        primary: 'var(--font-body)',
        display: 'var(--font-heading)'
      },
      fontSize: {
        // Perfect Fourth scale (1.333 ratio)
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
      },
      lineHeight: {
        tight: 'var(--line-height-tight)',
        base: 'var(--line-height-base)',
        relaxed: 'var(--line-height-relaxed)',
        // Legacy compatibility
        normal: 'var(--line-height-base)',
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-base)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-base)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
      },
      transitionDuration: {
        fast: '100ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
    }
  },
  plugins: [],
  // Optimize for production
  corePlugins: {
    // Disable unused core plugins to reduce CSS size
    preflight: true,
    container: false, // We use custom container classes
  },
  // Purge unused styles in production
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
      './index.html'
    ],
    options: {
      safelist: [
        // Keep dynamic classes that might be generated
        /^bg-/,
        /^text-/,
        /^border-/,
        /^hover:/,
        /^focus:/,
      ]
    }
  }
}
