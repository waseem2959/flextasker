/**
 * Theme Context
 * 
 * Provides theme management capabilities to the application, including
 * dark/light mode detection, theme switching, and persistence.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme values
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  isDarkMode: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  isDarkMode: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

// Hook for accessing theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

/**
 * Cookie-based storage for theme preferences
 */
const THEME_COOKIE_NAME = 'flextasker-theme';

/**
 * Get theme from cookie or localStorage
 */
function getSavedTheme(): ThemeMode {
  // Try to get from cookie first
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${THEME_COOKIE_NAME}=`))
    ?.split('=')[1];
    
  if (cookieValue && (cookieValue === 'light' || cookieValue === 'dark' || cookieValue === 'system')) {
    return cookieValue as ThemeMode;
  }
  
  // Fallback to localStorage
  const localValue = localStorage.getItem(THEME_COOKIE_NAME);
  if (localValue && (localValue === 'light' || localValue === 'dark' || localValue === 'system')) {
    return localValue as ThemeMode;
  }
  
  return 'system';
}

/**
 * Save theme preference to cookie and localStorage
 */
function saveTheme(theme: ThemeMode): void {
  // Save to cookie (30 days expiry)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; expires=${expiryDate.toUTCString()}; path=/`;
  
  // Also save to localStorage as fallback
  localStorage.setItem(THEME_COOKIE_NAME, theme);
}

/**
 * Theme Provider Component
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  // Initialize state with saved theme or default
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return getSavedTheme() || defaultTheme;
  });
  
  // Track actual dark/light mode based on theme choice and system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Handle theme changes
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };
  
  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  // Effect to apply theme to document and detect system preference changes
  useEffect(() => {
    // Function to check system dark mode preference
    const checkSystemPreference = () => {
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDarkMode;
    };
    
    // Function to apply theme to document
    const applyTheme = () => {
      const isSystemDarkMode = checkSystemPreference();
      const shouldUseDarkMode = theme === 'dark' || (theme === 'system' && isSystemDarkMode);
      
      // Update state
      setIsDarkMode(shouldUseDarkMode);
      
      // Apply to document
      if (shouldUseDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Apply theme immediately
    applyTheme();
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Modern approach using addEventListener
    const handleChange = () => applyTheme();
    
    // Use the modern API if available, otherwise fall back to the deprecated one
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    theme,
    isDarkMode,
    setTheme,
    toggleTheme
  }), [theme, isDarkMode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
