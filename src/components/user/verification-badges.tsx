/**
 * Verification Badges Component
 * 
 * Trust and verification badge system using enhanced design tokens.
 * Implements project-map specifications for marketplace trust indicators.
 */

import React from 'react';
import { Shield, CheckCircle, Star, Award, Phone, Mail, CreditCard, MapPin, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type VerificationType = 
  | 'identity'
  | 'phone'
  | 'email'
  | 'payment'
  | 'address'
  | 'background-check'
  | 'professional'
  | 'premium'
  | 'top-rated'
  | 'elite';

export interface VerificationStatus {
  type: VerificationType;
  isVerified: boolean;
  verifiedAt?: Date;
  level?: 'basic' | 'standard' | 'premium';
}

interface VerificationBadgeProps {
  verification: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

interface VerificationBadgesProps {
  verifications: VerificationStatus[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical' | 'grid';
  showLabels?: boolean;
  className?: string;
}

// Verification configuration
const VERIFICATION_CONFIG: Record<VerificationType, {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    verified: { bg: string; text: string; border: string };
    unverified: { bg: string; text: string; border: string };
  };
  priority: number; // Higher number = higher priority
}> = {
  'elite': {
    label: 'Elite Tasker',
    description: 'Top 1% of taskers with exceptional performance',
    icon: Award,
    colors: {
      verified: { bg: 'bg-gradient-to-r from-yellow-400 to-orange-500', text: 'text-white', border: 'border-yellow-500' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 10,
  },
  'top-rated': {
    label: 'Top Rated',
    description: 'Consistently high ratings and excellent reviews',
    icon: Star,
    colors: {
      verified: { bg: 'bg-primary-500', text: 'text-white', border: 'border-primary-500' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 9,
  },
  'premium': {
    label: 'Premium',
    description: 'Premium membership with enhanced features',
    icon: Award,
    colors: {
      verified: { bg: 'bg-gradient-to-r from-primary-600 to-primary-400', text: 'text-white', border: 'border-primary-500' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 8,
  },
  'professional': {
    label: 'Professional',
    description: 'Verified professional credentials and qualifications',
    icon: Briefcase,
    colors: {
      verified: { bg: 'bg-primary-300', text: 'text-primary-900', border: 'border-primary-400' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 7,
  },
  'background-check': {
    label: 'Background Check',
    description: 'Passed comprehensive background verification',
    icon: Shield,
    colors: {
      verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 6,
  },
  'identity': {
    label: 'Identity Verified',
    description: 'Government-issued ID verified',
    icon: CheckCircle,
    colors: {
      verified: { bg: 'bg-primary-100', text: 'text-primary-800', border: 'border-primary-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 5,
  },
  'payment': {
    label: 'Payment Verified',
    description: 'Payment method verified and secure',
    icon: CreditCard,
    colors: {
      verified: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 4,
  },
  'address': {
    label: 'Address Verified',
    description: 'Physical address confirmed',
    icon: MapPin,
    colors: {
      verified: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 3,
  },
  'phone': {
    label: 'Phone Verified',
    description: 'Phone number verified via SMS',
    icon: Phone,
    colors: {
      verified: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 2,
  },
  'email': {
    label: 'Email Verified',
    description: 'Email address confirmed',
    icon: Mail,
    colors: {
      verified: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      unverified: { bg: 'bg-neutral-100', text: 'text-neutral-500', border: 'border-neutral-300' },
    },
    priority: 1,
  },
};

/**
 * Individual Verification Badge Component
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verification,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const config = VERIFICATION_CONFIG[verification.type];
  const colors = verification.isVerified ? config.colors.verified : config.colors.unverified;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const BadgeContent = (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border-2 transition-all duration-200",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        verification.isVerified && "shadow-sm hover:shadow-md",
        !verification.isVerified && "opacity-60",
        className
      )}
    >
      <config.icon className={iconSizes[size]} />
      {showLabel && (
        <span className="font-body">
          {config.label}
        </span>
      )}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {BadgeContent}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-neutral-600 mt-1">{config.description}</p>
            {verification.isVerified && verification.verifiedAt && (
              <p className="text-xs text-neutral-500 mt-1">
                Verified {verification.verifiedAt.toLocaleDateString()}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Multiple Verification Badges Component
 */
export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  verifications,
  maxVisible = 5,
  size = 'md',
  layout = 'horizontal',
  showLabels = true,
  className,
}) => {
  // Sort by priority (highest first) and verification status
  const sortedVerifications = [...verifications].sort((a, b) => {
    const configA = VERIFICATION_CONFIG[a.type];
    const configB = VERIFICATION_CONFIG[b.type];
    
    // Verified badges first
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }
    
    // Then by priority
    return configB.priority - configA.priority;
  });

  const visibleVerifications = sortedVerifications.slice(0, maxVisible);
  const hiddenCount = sortedVerifications.length - maxVisible;

  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2',
  };

  return (
    <div className={cn("verification-badges", layoutClasses[layout], className)}>
      {visibleVerifications.map((verification) => (
        <VerificationBadge
          key={verification.type}
          verification={verification}
          size={size}
          showLabel={showLabels}
        />
      ))}
      
      {hiddenCount > 0 && (
        <Badge
          variant="outline"
          className="text-neutral-600 border-neutral-300 bg-neutral-50"
        >
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
};

/**
 * Trust Score Component
 */
interface TrustScoreProps {
  score: number; // 0-100
  verifications: VerificationStatus[];
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const TrustScore: React.FC<TrustScoreProps> = ({
  score,
  verifications,
  size = 'md',
  showDetails = true,
  className,
}) => {
  const verifiedCount = verifications.filter(v => v.isVerified).length;
  const totalCount = verifications.length;
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-primary-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn("trust-score text-center", className)}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Shield className={cn("text-primary-600", size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6')} />
        <span className={cn("font-bold font-heading", sizeClasses[size], getScoreColor(score))}>
          {score}
        </span>
        <span className="text-neutral-500 font-body">/ 100</span>
      </div>
      
      {showDetails && (
        <div className="space-y-1">
          <p className={cn("font-medium", getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-neutral-600 font-body">
            {verifiedCount} of {totalCount} verifications completed
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationBadges;
