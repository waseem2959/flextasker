/**
 * RTL Layout Component
 * 
 * Responsive layout component that adapts to RTL/LTR text directions
 * with proper spacing, alignment, and visual adjustments for Arabic/English.
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { i18nService } from '../../../shared/services/i18n-service';

interface RTLLayoutProps {
  children: React.ReactNode;
  className?: string;
  asChild?: boolean;
  enableTransition?: boolean;
}

interface RTLContainerProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  direction?: 'row' | 'column';
}

interface RTLTextProps {
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'auto' | 'left' | 'center' | 'right';
}

interface RTLGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

/**
 * Main RTL Layout wrapper that sets direction and base styles
 */
export const RTLLayout: React.FC<RTLLayoutProps> = ({
  children,
  className = '',
  asChild = false,
  enableTransition = true
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const baseClasses = cn(
    'w-full',
    isRTL ? 'rtl' : 'ltr',
    isRTL ? 'text-right' : 'text-left',
    enableTransition && 'transition-all duration-300 ease-in-out',
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(baseClasses, children.props.className),
      dir: isRTL ? 'rtl' : 'ltr'
    });
  }

  return (
    <div className={baseClasses} dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
};

/**
 * RTL-aware container with flexible layout options
 */
export const RTLContainer: React.FC<RTLContainerProps> = ({
  children,
  className = '',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  direction = 'row'
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const spacingClasses = {
    none: '',
    sm: direction === 'row' ? 'space-x-2' : 'space-y-2',
    md: direction === 'row' ? 'space-x-4' : 'space-y-4',
    lg: direction === 'row' ? 'space-x-6' : 'space-y-6',
    xl: direction === 'row' ? 'space-x-8' : 'space-y-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col';

  // Adjust spacing for RTL
  const rtlSpacing = isRTL && direction === 'row' && spacing !== 'none' 
    ? spacingClasses[spacing].replace('space-x-', 'space-x-reverse space-x-')
    : spacingClasses[spacing];

  return (
    <div className={cn(
      'flex',
      directionClass,
      alignClasses[align],
      justifyClasses[justify],
      rtlSpacing,
      className
    )}>
      {children}
    </div>
  );
};

/**
 * RTL-aware text component with proper typography scaling
 */
export const RTLText: React.FC<RTLTextProps> = ({
  children,
  className = '',
  size = 'base',
  weight = 'normal',
  align = 'auto'
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const getAlignClass = () => {
    if (align === 'auto') {
      return isRTL ? 'text-right' : 'text-left';
    }
    return `text-${align}`;
  };

  // Arabic text often needs slightly different line height and letter spacing
  const arabicTypography = isRTL ? 'leading-relaxed tracking-wide' : '';

  return (
    <span className={cn(
      sizeClasses[size],
      weightClasses[weight],
      getAlignClass(),
      arabicTypography,
      className
    )}>
      {children}
    </span>
  );
};

/**
 * RTL-aware grid component
 */
export const RTLGrid: React.FC<RTLGridProps> = ({
  children,
  className = '',
  cols = 1,
  gap = 'md',
  responsive = true
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const colsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  };

  const responsiveClasses = responsive ? {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  } : colsClasses;

  return (
    <div className={cn(
      'grid',
      responsive ? responsiveClasses[cols] : colsClasses[cols],
      gapClasses[gap],
      isRTL ? 'rtl' : 'ltr',
      className
    )}>
      {children}
    </div>
  );
};

/**
 * RTL-aware flex spacer component
 */
export const RTLSpacer: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return <div className={cn('flex-1', className)} />;
};

/**
 * RTL-aware icon wrapper that flips directional icons
 */
interface RTLIconProps {
  children: React.ReactNode;
  className?: string;
  flip?: boolean; // Whether to flip the icon in RTL mode
}

export const RTLIcon: React.FC<RTLIconProps> = ({
  children,
  className = '',
  flip = false
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const shouldFlip = flip && isRTL;

  return (
    <span className={cn(
      shouldFlip && 'scale-x-[-1]',
      'inline-flex items-center justify-center',
      className
    )}>
      {children}
    </span>
  );
};

/**
 * RTL-aware form field wrapper
 */
interface RTLFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
}

export const RTLField: React.FC<RTLFieldProps> = ({
  label,
  error,
  required = false,
  children,
  className = '',
  labelClassName = '',
  errorClassName = ''
}) => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className={cn(
          'block text-sm font-medium text-gray-700 mb-2',
          isRTL ? 'text-right' : 'text-left',
          labelClassName
        )}>
          {label}
          {required && (
            <span className={cn(
              'text-red-500',
              isRTL ? 'mr-1' : 'ml-1'
            )}>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className={cn(
          'mt-2 text-sm text-red-600',
          isRTL ? 'text-right' : 'text-left',
          errorClassName
        )}>
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Utility hook for RTL-aware styling
 */
export const useRTL = () => {
  const [isRTL, setIsRTL] = useState(i18nService.isRTL());

  useEffect(() => {
    const handleLanguageChange = () => {
      setIsRTL(i18nService.isRTL());
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const getMarginClass = (side: 'left' | 'right', size: string) => {
    const actualSide = isRTL ? (side === 'left' ? 'right' : 'left') : side;
    return `m${actualSide[0]}-${size}`;
  };

  const getPaddingClass = (side: 'left' | 'right', size: string) => {
    const actualSide = isRTL ? (side === 'left' ? 'right' : 'left') : side;
    return `p${actualSide[0]}-${size}`;
  };

  const getBorderClass = (side: 'left' | 'right', size: string = '') => {
    const actualSide = isRTL ? (side === 'left' ? 'right' : 'left') : side;
    return `border-${actualSide}${size ? `-${size}` : ''}`;
  };

  return {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'text-right' : 'text-left',
    getMarginClass,
    getPaddingClass,
    getBorderClass,
    oppositeDirection: isRTL ? 'ltr' : 'rtl'
  };
};

export default RTLLayout;