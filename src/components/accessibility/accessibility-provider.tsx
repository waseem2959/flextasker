/**
 * Accessibility Provider
 * 
 * Comprehensive accessibility provider with ARIA management, keyboard navigation,
 * screen reader support, and accessibility features for UAE market compliance.
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import { i18nService, SupportedLanguage } from '../../../shared/services/i18n-service';
import { ariaService } from '../../../shared/services/aria-service';

export interface AccessibilitySettings {
  // Visual accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorMode: 'light' | 'dark' | 'auto';
  
  // Motor accessibility
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  clickDelay: number; // in milliseconds
  
  // Cognitive accessibility
  simplifiedInterface: boolean;
  showHelp: boolean;
  autoComplete: boolean;
  
  // Audio accessibility
  soundEffects: boolean;
  voiceNavigation: boolean;
  
  // Language and cultural
  language: SupportedLanguage;
  textDirection: 'ltr' | 'rtl';
  culturalPreferences: {
    useLocalDateFormat: boolean;
    useLocalNumberFormat: boolean;
    useLocalCurrency: boolean;
  };
}

export interface AccessibilityState {
  settings: AccessibilitySettings;
  capabilities: {
    screenReader: boolean;
    touch: boolean;
    keyboard: boolean;
    voice: boolean;
  };
  announcements: string[];
}

export interface AccessibilityActions {
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  focus: (element: HTMLElement | string) => void;
  skipToContent: () => void;
  skipToNavigation: () => void;
  openAccessibilityMenu: () => void;
  resetToDefaults: () => void;
}

interface AccessibilityContextType {
  state: AccessibilityState;
  actions: AccessibilityActions;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: ReactNode;
  initialSettings?: Partial<AccessibilitySettings>;
}

// Default accessibility settings
const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  colorMode: 'auto',
  keyboardNavigation: true,
  focusIndicators: true,
  clickDelay: 0,
  simplifiedInterface: false,
  showHelp: true,
  autoComplete: true,
  soundEffects: false,
  voiceNavigation: false,
  language: 'en',
  textDirection: 'ltr',
  culturalPreferences: {
    useLocalDateFormat: true,
    useLocalNumberFormat: true,
    useLocalCurrency: true
  }
};

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialSettings = {}
}) => {
  // Initialize ARIA service
  useEffect(() => {
    ariaService.initialize();
    return () => ariaService.destroy();
  }, []);

  // Load settings from localStorage or use defaults
  const loadSettings = useCallback((): AccessibilitySettings => {
    try {
      const saved = localStorage.getItem('flextasker_accessibility_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        return { ...defaultSettings, ...parsedSettings, ...initialSettings };
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
    }
    return { ...defaultSettings, ...initialSettings };
  }, [initialSettings]);

  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings);
  const [capabilities, setCapabilities] = useState({
    screenReader: false,
    touch: false,
    keyboard: false,
    voice: false
  });
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Detect user capabilities
  useEffect(() => {
    const detectCapabilities = () => {
      const newCapabilities = {
        screenReader: window.navigator.userAgent.includes('NVDA') || 
                     window.navigator.userAgent.includes('JAWS') || 
                     !!window.speechSynthesis,
        touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        keyboard: true, // Assume keyboard is always available
        voice: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      };
      
      setCapabilities(newCapabilities);
    };

    detectCapabilities();
  }, []);

  // Detect system preferences
  useEffect(() => {
    const detectSystemPreferences = () => {
      const updates: Partial<AccessibilitySettings> = {};

      // Detect prefers-reduced-motion
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updates.reducedMotion = true;
      }

      // Detect prefers-color-scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        updates.colorMode = 'dark';
      }

      // Detect high contrast mode
      if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrast = true;
      }

      // Detect language from i18n service
      updates.language = i18nService.getCurrentLanguage();
      updates.textDirection = i18nService.getTextDirection();

      if (Object.keys(updates).length > 0) {
        updateSettings(updates);
      }
    };

    detectSystemPreferences();

    // Listen for system preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-contrast: high)')
    ];

    const handleMediaChange = () => detectSystemPreferences();
    
    mediaQueries.forEach(mq => {
      if (mq.addEventListener) {
        mq.addEventListener('change', handleMediaChange);
      } else {
        // Fallback for older browsers
        mq.addListener(handleMediaChange);
      }
    });

    return () => {
      mediaQueries.forEach(mq => {
        if (mq.removeEventListener) {
          mq.removeEventListener('change', handleMediaChange);
        } else {
          mq.removeListener(handleMediaChange);
        }
      });
    };
  }, []);

  // Apply settings to document
  useEffect(() => {
    const applySettings = () => {
      const root = document.documentElement;
      
      // Font size
      const fontSizeMap = {
        small: '14px',
        medium: '16px',
        large: '18px',
        'extra-large': '20px'
      };
      root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize]);

      // High contrast
      if (settings.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      // Reduced motion
      if (settings.reducedMotion) {
        root.classList.add('reduced-motion');
      } else {
        root.classList.remove('reduced-motion');
      }

      // Color mode
      root.setAttribute('data-theme', settings.colorMode);

      // Text direction
      root.dir = settings.textDirection;
      root.lang = settings.language;

      // Focus indicators
      if (settings.focusIndicators) {
        root.classList.add('focus-indicators');
      } else {
        root.classList.remove('focus-indicators');
      }

      // Simplified interface
      if (settings.simplifiedInterface) {
        root.classList.add('simplified-interface');
      } else {
        root.classList.remove('simplified-interface');
      }
    };

    applySettings();
  }, [settings]);

  // Save settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flextasker_accessibility_settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save accessibility settings:', error);
    }
  }, [settings]);

  // Update settings function
  const updateSettings = useCallback((newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);
    
    // Use ARIA service for announcements
    const mappedPriority = priority === 'assertive' ? 'high' : 'medium';
    ariaService.announce(message, mappedPriority);
    
    // Clean up announcements after delay
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a !== message));
    }, 2000);
  }, []);

  // Focus management
  const focus = useCallback((element: HTMLElement | string) => {
    let targetElement: HTMLElement | null = null;
    
    if (typeof element === 'string') {
      targetElement = document.querySelector(element);
    } else {
      targetElement = element;
    }
    
    if (targetElement) {
      targetElement.focus();
      
      // Scroll into view if needed
      targetElement.scrollIntoView({
        behavior: settings.reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      });
    }
  }, [settings.reducedMotion]);

  // Skip link functions
  const skipToContent = useCallback(() => {
    const mainContent = document.querySelector('main, [role="main"], #main-content');
    if (mainContent instanceof HTMLElement) {
      focus(mainContent);
      announce(i18nService.translate('accessibility.skippedToContent'));
    }
  }, [focus, announce]);

  const skipToNavigation = useCallback(() => {
    const navigation = document.querySelector('nav, [role="navigation"], #main-navigation');
    if (navigation instanceof HTMLElement) {
      focus(navigation);
      announce(i18nService.translate('accessibility.skippedToNavigation'));
    }
  }, [focus, announce]);

  // Open accessibility menu
  const openAccessibilityMenu = useCallback(() => {
    const accessibilityMenu = document.querySelector('#accessibility-menu');
    if (accessibilityMenu instanceof HTMLElement) {
      focus(accessibilityMenu);
      announce(i18nService.translate('accessibility.menuOpened'));
    }
  }, [focus, announce]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(defaultSettings);
    announce(i18nService.translate('accessibility.settingsReset'));
  }, [announce]);

  // Keyboard event handling
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Global keyboard shortcuts
      if (event.altKey) {
        switch (event.key) {
          case 'c':
            event.preventDefault();
            skipToContent();
            break;
          case 'n':
            event.preventDefault();
            skipToNavigation();
            break;
          case 'a':
            event.preventDefault();
            openAccessibilityMenu();
            break;
          case 'h':
            event.preventDefault();
            updateSettings({ showHelp: !settings.showHelp });
            break;
        }
      }

      // Escape key handling
      if (event.key === 'Escape') {
        // Close any open modals or menus
        const openModals = document.querySelectorAll('[role="dialog"][aria-hidden="false"]');
        openModals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            const closeButton = modal.querySelector('[data-close], .close, [aria-label*="close" i]');
            if (closeButton instanceof HTMLElement) {
              closeButton.click();
            }
          }
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation, settings.showHelp, skipToContent, skipToNavigation, openAccessibilityMenu, updateSettings]);

  // Create context value
  const contextValue: AccessibilityContextType = {
    state: {
      settings,
      capabilities,
      announcements
    },
    actions: {
      updateSettings,
      announce,
      focus,
      skipToContent,
      skipToNavigation,
      openAccessibilityMenu,
      resetToDefaults
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Skip links */}
      <div className="skip-links">
        <button
          className="skip-link"
          onClick={skipToContent}
          onKeyDown={(e) => e.key === 'Enter' && skipToContent()}
        >
          {i18nService.translate('accessibility.skipToContent')}
        </button>
        <button
          className="skip-link"
          onClick={skipToNavigation}
          onKeyDown={(e) => e.key === 'Enter' && skipToNavigation()}
        >
          {i18nService.translate('accessibility.skipToNavigation')}
        </button>
      </div>

      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {children}
    </AccessibilityContext.Provider>
  );
};

// Hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Helper hook for common accessibility patterns
export const useAccessibilityHelper = () => {
  const { state, actions } = useAccessibility();

  const getAriaLabel = useCallback((key: string, params?: Record<string, any>) => {
    return i18nService.translate(`aria.${key}`, params);
  }, []);

  const getAccessibleName = useCallback((element: HTMLElement) => {
    return element.getAttribute('aria-label') || 
           element.getAttribute('aria-labelledby') || 
           element.textContent || 
           element.getAttribute('title') || 
           '';
  }, []);

  const createFocusTrap = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    firstElement.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // ARIA utilities from aria service
  const createFormFieldAria = useCallback((config: {
    id: string;
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    invalid?: boolean;
  }) => {
    return ariaService.createFormFieldAria(config);
  }, []);

  const createButtonAria = useCallback((config: {
    label?: string;
    describedBy?: string;
    pressed?: boolean;
    expanded?: boolean;
    hasPopup?: boolean;
    controls?: string;
    disabled?: boolean;
    loading?: boolean;
  }) => {
    return ariaService.createButtonAria(config);
  }, []);

  const createNavigationAria = useCallback((config: {
    label: string;
    current?: boolean;
    expanded?: boolean;
    hasSubmenu?: boolean;
    level?: number;
    setSize?: number;
    posInSet?: number;
  }) => {
    return ariaService.createNavigationAria(config);
  }, []);

  const createTableAria = useCallback((config: {
    caption?: string;
    rowCount?: number;
    colCount?: number;
    sortable?: boolean;
    sortColumn?: number;
    sortDirection?: 'ascending' | 'descending';
  }) => {
    return ariaService.createTableAria(config);
  }, []);

  const createModalAria = useCallback((config: {
    title: string;
    describedBy?: string;
    modal?: boolean;
  }) => {
    return ariaService.createModalAria(config);
  }, []);

  const createListAria = useCallback((config: {
    label?: string;
    multiselectable?: boolean;
    orientation?: 'horizontal' | 'vertical';
    setSize?: number;
  }) => {
    return ariaService.createListAria(config);
  }, []);

  const manageFocus = useCallback((config: {
    container: HTMLElement;
    activeIndex: number;
    items: HTMLElement[];
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical';
  }) => {
    return ariaService.manageFocus(config);
  }, []);

  return {
    settings: state.settings,
    capabilities: state.capabilities,
    getAriaLabel,
    getAccessibleName,
    createFocusTrap,
    announce: actions.announce,
    focus: actions.focus,
    // ARIA service utilities
    createFormFieldAria,
    createButtonAria,
    createNavigationAria,
    createTableAria,
    createModalAria,
    createListAria,
    manageFocus
  };
};

export default AccessibilityProvider;