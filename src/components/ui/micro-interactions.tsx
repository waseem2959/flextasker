/**
 * Micro-Interactions and Animation Components
 * 
 * Collection of reusable micro-interactions and animations that enhance
 * user experience throughout the application.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

// Enhanced button with multiple micro-interactions
interface AnimatedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
    success: 'bg-success-500 text-white hover:bg-success-600',
    error: 'bg-error-500 text-white hover:bg-error-600'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ 
        scale: disabled ? 1 : 1.02,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.98,
        transition: { duration: 0.1 }
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {/* Ripple effect background */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Loading spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button content */}
      <motion.span
        className={cn('relative', loading && 'opacity-0')}
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
};

// Floating action button with entrance animations
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
  tooltip?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  className,
  tooltip
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn('fixed z-50', positions[position])}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ 
            type: 'spring', 
            stiffness: 260, 
            damping: 20 
          }}
        >
          <motion.button
            className={cn(
              'group relative w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg',
              'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500',
              'flex items-center justify-center transition-colors duration-200',
              className
            )}
            onClick={onClick}
            onHoverStart={() => setShowTooltip(true)}
            onHoverEnd={() => setShowTooltip(false)}
            whileHover={{ 
              scale: 1.1,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2 }}
            >
              {icon}
            </motion.div>

            {/* Tooltip */}
            <AnimatePresence>
              {tooltip && showTooltip && (
                <motion.div
                  className="absolute bottom-full mb-2 px-3 py-1 bg-neutral-900 text-white text-sm rounded whitespace-nowrap"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {tooltip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Staggered list animation
interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => {
  return (
    <motion.div 
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { 
              opacity: 1, 
              y: 0,
              transition: { duration: 0.5, ease: 'easeOut' }
            }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Count up animation for numbers
interface CountUpProps {
  from: number;
  to: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  from,
  to,
  duration = 2,
  className,
  suffix = '',
  prefix = ''
}) => {
  const [count, setCount] = useState(from);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const startValue = from;
    const endValue = to;
    const animationDuration = duration * 1000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOutCubic;
      
      setCount(Math.floor(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// Pulse animation for notifications
interface PulseIndicatorProps {
  color?: 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  color = 'primary',
  size = 'md',
  className
}) => {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500'
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn('relative', className)}>
      <motion.div
        className={cn('rounded-full', colors[color], sizes[size])}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full',
          colors[color],
          sizes[size]
        )}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
};

// Shake animation for form errors
interface ShakeWrapperProps {
  children: React.ReactNode;
  trigger: boolean;
  className?: string;
}

export const ShakeWrapper: React.FC<ShakeWrapperProps> = ({
  children,
  trigger,
  className
}) => {
  const controls = useAnimation();

  useEffect(() => {
    if (trigger) {
      controls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.4, ease: 'easeInOut' }
      });
    }
  }, [trigger, controls]);

  return (
    <motion.div
      className={className}
      animate={controls}
    >
      {children}
    </motion.div>
  );
};

// Progress indicator with smooth animations
interface AnimatedProgressProps {
  progress: number;
  color?: 'primary' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  color = 'primary',
  size = 'md',
  showLabel = false,
  className
}) => {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500'
  };

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className={cn('bg-neutral-200 rounded-full overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', colors[color])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <motion.div
          className="absolute right-0 top-full mt-1 text-xs text-neutral-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {Math.round(progress)}%
        </motion.div>
      )}
    </div>
  );
};

// Hover lift effect for cards
interface HoverLiftProps {
  children: React.ReactNode;
  liftAmount?: number;
  className?: string;
}

export const HoverLift: React.FC<HoverLiftProps> = ({
  children,
  liftAmount = 4,
  className
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{
        y: -liftAmount,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default {
  AnimatedButton,
  FloatingActionButton,
  StaggeredList,
  CountUp,
  PulseIndicator,
  ShakeWrapper,
  AnimatedProgress,
  HoverLift
};