/**
 * Accessible Navbar Component
 * 
 * Enhanced navigation with comprehensive accessibility features:
 * - Proper ARIA attributes and roles
 * - Keyboard navigation support
 * - Focus management
 * - Screen reader compatibility
 * - Mobile-first responsive design
 * - Smooth animations with reduced motion support
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAccessibility } from '../accessibility/accessibility-provider';
import { LanguageSwitcher } from '../ui/language-switcher';
import { ThemeToggle } from '../ui/theme-toggle';
import { i18nService } from '../../../shared/services/i18n-service';

interface NavItem {
  label: string;
  href: string;
  onClick?: () => void;
  isButton?: boolean;
  variant?: 'default' | 'primary';
}

interface AccessibleNavbarProps {
  className?: string;
}

export const AccessibleNavbar: React.FC<AccessibleNavbarProps> = ({ className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // Not read anywhere
  // const [currentLanguage, setCurrentLanguage] = useState(i18nService.getCurrentLanguage()); // Not read anywhere
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state, actions } = useAccessibility();
  const settings = state.settings;
  
  // Refs for focus management
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);
  
  // Navigation items configuration
  const navigationItems: NavItem[] = [
    {
      label: i18nService.translate('navigation.tasks'),
      href: '/tasks'
    },
    {
      label: i18nService.translate('navigation.marketplace'),
      href: '/marketplace'
    },
    {
      label: i18nService.translate('common.help'),
      href: '/help'
    }
  ];

  const authItems: NavItem[] = [
    {
      label: i18nService.translate('common.login'),
      href: '/login',
      isButton: true,
      variant: 'default'
    },
    {
      label: i18nService.translate('common.register'),
      href: '/register',
      isButton: true,
      variant: 'primary'
    }
  ];

  // Handle language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      // setCurrentLanguage(i18nService.getCurrentLanguage()); // Commented out since variable is not used
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !menuButtonRef.current?.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu and manage focus
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    // setActiveDropdown(null); // Commented out since activeDropdown is not used
    
    // Return focus to menu button when closing
    if (menuButtonRef.current) {
      menuButtonRef.current.focus();
    }
    
    // Announce to screen readers
    actions.announce(i18nService.translate('accessibility.navigationClosed'));
  }, [actions]);

  // Open menu and manage focus
  const openMenu = useCallback(() => {
    setIsMenuOpen(true);
    
    // Focus first menu item when opening
    setTimeout(() => {
      if (firstMenuItemRef.current) {
        firstMenuItemRef.current.focus();
      }
    }, 100);
    
    // Announce to screen readers
    actions.announce(i18nService.translate('accessibility.navigationOpened'));
  }, [actions]);

  // Toggle menu with proper focus management
  const toggleMenu = useCallback(() => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isMenuOpen, closeMenu, openMenu]);

  // Handle navigation item click
  const handleNavClick = useCallback((href: string, onClick?: () => void) => {
    if (onClick) {
      onClick();
    } else {
      navigate(href);
    }
    
    if (isMenuOpen) {
      closeMenu();
    }
  }, [navigate, isMenuOpen, closeMenu]);

  // Handle keyboard navigation in mobile menu
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isMenuOpen) return;

    const focusableElements = mobileMenuRef.current?.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;

    const currentIndex = Array.from(focusableElements).indexOf(
      document.activeElement as HTMLElement
    );

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        (focusableElements[nextIndex] as HTMLElement).focus();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
        (focusableElements[prevIndex] as HTMLElement).focus();
        break;
        
      case 'Home':
        event.preventDefault();
        (focusableElements[0] as HTMLElement).focus();
        break;
        
      case 'End':
        event.preventDefault();
        (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
        break;
    }
  }, [isMenuOpen]);

  // Determine if current route is active
  const isActiveRoute = useCallback((href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  }, [location.pathname]);

  // Animation classes based on reduced motion preference
  const animationClasses = settings.reducedMotion 
    ? 'transition-none' 
    : 'transition-all duration-300 ease-in-out';

  return (
    <header 
      className={cn('bg-white shadow-sm border-b border-gray-200', className)}
      role="banner"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav 
          className="flex items-center justify-between h-16 lg:h-20"
          role="navigation"
          aria-label={i18nService.translate('accessibility.mainNavigation')}
        >
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={cn(
                'flex items-center group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg',
                animationClasses
              )}
              aria-label={i18nService.translate('navigation.home')}
            >
              <div className="flex items-baseline">
                <span className="text-3xl font-black tracking-tight">
                  <span className="text-primary-600 inline-flex">
                    <span className={cn(
                      'inline-block origin-bottom',
                      !settings.reducedMotion && 'transform transition-all duration-300 hover:scale-y-110'
                    )}>F</span>
                    <span className={cn(
                      'inline-block origin-bottom',
                      !settings.reducedMotion && 'transform transition-all duration-300 hover:scale-y-110 delay-75'
                    )}>L</span>
                    <span className={cn(
                      'inline-block origin-bottom',
                      !settings.reducedMotion && 'transform transition-all duration-300 hover:scale-y-110 delay-100'
                    )}>E</span>
                    <span className={cn(
                      'inline-block origin-bottom',
                      !settings.reducedMotion && 'transform transition-all duration-300 hover:scale-y-110 delay-150'
                    )}>X</span>
                  </span>
                  <span className="text-gray-900 ml-0.5">TASKER</span>
                </span>
                <span 
                  className={cn(
                    'ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full',
                    !settings.reducedMotion && 'animate-pulse'
                  )}
                  aria-hidden="true"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'px-3 py-2 text-base font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    animationClasses,
                    isActiveRoute(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  )}
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Auth, Theme & Language */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <ThemeToggle />
            <LanguageSwitcher variant="compact" />
            
            {authItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href, item.onClick)}
                className={cn(
                  'px-4 py-2 text-base font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2',
                  animationClasses,
                  item.variant === 'primary'
                    ? 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 hover:shadow-lg transform hover:-translate-y-0.5'
                    : 'text-gray-700 hover:text-primary-600 focus:ring-gray-500'
                )}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMenu}
            className={cn(
              'inline-flex items-center justify-center p-2 text-gray-700 rounded-lg lg:hidden',
              'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
              'hover:bg-gray-100',
              animationClasses
            )}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen 
              ? i18nService.translate('accessibility.closeMenu') 
              : i18nService.translate('accessibility.openMenu')
            }
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className={cn(
            'lg:hidden overflow-hidden border-t border-gray-200',
            animationClasses,
            isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          )}
          aria-hidden={!isMenuOpen}
          onKeyDown={handleKeyDown}
        >
          <div className="py-4 space-y-3">
            {/* Primary Navigation */}
            <div className="space-y-1" role="menu">
              {navigationItems.map((item, index) => (
                <Link
                  key={item.href}
                  ref={index === 0 ? firstMenuItemRef : undefined}
                  to={item.href}
                  onClick={() => handleNavClick(item.href, item.onClick)}
                  className={cn(
                    'block px-4 py-3 text-base font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    animationClasses,
                    isActiveRoute(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                  )}
                  role="menuitem"
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Theme Toggle & Language Switcher */}
            <div className="px-4 py-2 space-y-3">
              <div className="flex items-center justify-center">
                <ThemeToggle />
              </div>
              <LanguageSwitcher variant="compact" className="w-full" />
            </div>

            {/* Auth Buttons */}
            <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
              {authItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href, item.onClick)}
                  className={cn(
                    'block w-full px-4 py-3 text-base font-medium text-center rounded-lg',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    animationClasses,
                    item.variant === 'primary'
                      ? 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                      : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:ring-gray-500'
                  )}
                  type="button"
                  role="menuitem"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AccessibleNavbar;