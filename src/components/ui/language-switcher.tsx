/**
 * Language Switcher Component
 * 
 * Interactive language switcher for Arabic/English with smooth transitions,
 * cultural icons, and accessibility features for UAE market.
 */

import React, { useState, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu';
import { Badge } from './badge';
import { cn } from '../../lib/utils';
import { i18nService, SupportedLanguage } from '../../../shared/services/i18n-service';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only';
  showFlags?: boolean;
  showLabels?: boolean;
  className?: string;
  onLanguageChange?: (language: SupportedLanguage) => void;
}

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr'
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇦🇪',
    direction: 'rtl'
  }
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'default',
  showFlags = true,
  showLabels = true,
  className = '',
  onLanguageChange
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18nService.getCurrentLanguage()
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const currentOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    if (language === currentLanguage) return;

    setIsTransitioning(true);
    setIsOpen(false);

    try {
      // Add a brief delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 150));
      
      i18nService.setLanguage(language);
      setCurrentLanguage(language);
      
      // Call callback if provided
      if (onLanguageChange) {
        onLanguageChange(language);
      }

      // Show success feedback
      const event = new CustomEvent('showToast', {
        detail: {
          message: i18nService.translate('notifications.languageChanged'),
          type: 'success'
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsTransitioning(false);
    }
  };

  // Compact variant - just flags or minimal text
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 min-w-[80px]',
              isTransitioning && 'opacity-50 pointer-events-none',
              className
            )}
            disabled={isTransitioning}
          >
            {showFlags && currentOption && (
              <span className="text-lg">{currentOption.flag}</span>
            )}
            {showLabels && currentOption && (
              <span className="text-sm font-medium">
                {currentOption.code.toUpperCase()}
              </span>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[120px]">
          {LANGUAGE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onClick={() => handleLanguageSelect(option.code)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                option.code === currentLanguage && 'bg-accent'
              )}
            >
              {showFlags && (
                <span className="text-lg">{option.flag}</span>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">{option.nativeName}</div>
              </div>
              {option.code === currentLanguage && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'w-10 h-10 p-0',
              isTransitioning && 'opacity-50 pointer-events-none',
              className
            )}
            disabled={isTransitioning}
            aria-label={i18nService.translate('common.changeLanguage')}
          >
            {showFlags && currentOption ? (
              <span className="text-xl">{currentOption.flag}</span>
            ) : (
              <Globe className="w-5 h-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {LANGUAGE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onClick={() => handleLanguageSelect(option.code)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                option.code === currentLanguage && 'bg-accent'
              )}
            >
              <span className="text-lg">{option.flag}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{option.nativeName}</div>
                <div className="text-xs text-muted-foreground">{option.name}</div>
              </div>
              {option.code === currentLanguage && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant - full language switcher
  return (
    <div className={cn('relative', className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'gap-3 min-w-[140px] justify-between',
              isTransitioning && 'opacity-50 pointer-events-none',
              currentOption?.direction === 'rtl' && 'flex-row-reverse'
            )}
            disabled={isTransitioning}
          >
            <div className="flex items-center gap-2">
              {showFlags && currentOption && (
                <span className="text-lg">{currentOption.flag}</span>
              )}
              {showLabels && currentOption && (
                <span className="text-sm font-medium">
                  {currentOption.nativeName}
                </span>
              )}
            </div>
            <ChevronDown className={cn(
              'w-4 h-4 opacity-50 transition-transform',
              isOpen && 'rotate-180'
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="min-w-[200px] p-2"
          side="bottom"
          sideOffset={4}
        >
          <div className="space-y-1">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.code === currentLanguage;
              
              return (
                <DropdownMenuItem
                  key={option.code}
                  onClick={() => handleLanguageSelect(option.code)}
                  className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-accent text-accent-foreground',
                    option.direction === 'rtl' && 'flex-row-reverse text-right'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {showFlags && (
                      <span className="text-xl">{option.flag}</span>
                    )}
                    <div className={cn(
                      'flex-1',
                      option.direction === 'rtl' && 'text-right'
                    )}>
                      <div className="text-sm font-medium">
                        {option.nativeName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {option.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        {i18nService.translate('common.current')}
                      </Badge>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>
          
          {/* Language Direction Indicator */}
          <div className="border-t mt-2 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-3 py-1">
              <span>{i18nService.translate('common.textDirection')}</span>
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5"
              >
                {currentOption?.direction?.toUpperCase() || 'LTR'}
              </Badge>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Loading indicator for transition */}
      {isTransitioning && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

/**
 * Inline Language Toggle - Simple switch for forms or compact layouts
 */
interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onLanguageChange?: (language: SupportedLanguage) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  size = 'md',
  onLanguageChange
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18nService.getCurrentLanguage()
  );

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const toggleLanguage = () => {
    const newLanguage: SupportedLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    i18nService.setLanguage(newLanguage);
    
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  const sizeClasses = {
    sm: 'text-sm gap-2 px-3 py-1.5',
    md: 'text-sm gap-2 px-4 py-2',
    lg: 'text-base gap-3 px-6 py-3'
  };

  const currentOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);
  const otherOption = LANGUAGE_OPTIONS.find(option => option.code !== currentLanguage);

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        sizeClasses[size],
        currentLanguage === 'ar' && 'flex-row-reverse',
        className
      )}
    >
      <span className="text-lg">{currentOption?.flag}</span>
      <span className="font-medium">{currentOption?.nativeName}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-lg">{otherOption?.flag}</span>
    </Button>
  );
};

/**
 * Language Badge - Display current language as a badge
 */
interface LanguageBadgeProps {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline';
  showFlag?: boolean;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({
  className = '',
  variant = 'default',
  showFlag = true
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18nService.getCurrentLanguage()
  );

  useEffect(() => {
    const handleLanguageChange = (event: CustomEvent) => {
      setCurrentLanguage(event.detail.language);
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
    };
  }, []);

  const currentOption = LANGUAGE_OPTIONS.find(option => option.code === currentLanguage);

  return (
    <Badge variant={variant} className={cn('gap-1.5', className)}>
      {showFlag && currentOption && (
        <span className="text-sm">{currentOption.flag}</span>
      )}
      <span>{currentOption?.nativeName}</span>
    </Badge>
  );
};

export default LanguageSwitcher;