// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'hsl(var(--color-primary-light))',
          500: 'hsl(var(--color-primary-dark))',
          600: 'hsl(var(--color-primary))',
          700: 'hsl(var(--color-primary-accent))',
          900: '#064B55'
        },
        success: 'hsl(var(--color-success))',
        error: 'hsl(var(--color-error))',
        warning: 'hsl(var(--color-warning))',
        text: {
          primary: 'hsl(var(--color-text-primary))',
          secondary: 'hsl(var(--color-text-secondary))'
        },
        background: 'hsl(var(--color-background))',
        surface: 'hsl(var(--color-surface))',
        border: 'hsl(var(--color-border))'
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4.5': '1.125rem',
        '18': '4.5rem'
      },
      fontFamily: {
        primary: 'var(--font-primary)',
        display: 'var(--font-display)'
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)'
      },
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)'
      },
      borderRadius: {
        'lg': '0.5rem'
      }
    }
  },
  plugins: []
}
