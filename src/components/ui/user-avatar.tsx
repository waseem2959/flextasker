import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export type UserStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

const statusColors: Record<UserStatus, string> = {
  online: 'bg-[hsl(142,72%,29%)]',
  offline: 'bg-[hsl(220,14%,46%)]',
  away: 'bg-[hsl(38,92%,50%)]',
  busy: 'bg-[hsl(354,70%,54%)]',
  invisible: 'bg-transparent border-2 border-[hsl(220,14%,46%)]'
};

export type UserAvatarProps = Readonly<{
  src?: string;
  alt?: string;
  fallback: string;
  status?: UserStatus;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  statusClassName?: string;
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  onClick?: () => void;
  statusText?: string;
}>

export function UserAvatar({
  src,
  alt,
  fallback,
  status,
  showStatus = false,
  size = 'md',
  className,
  statusClassName,
  statusPosition = 'bottom-right',
  onClick,
  statusText,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };

  // Get size class for avatar
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'md':
        return 'h-10 w-10';
      case 'lg':
        return 'h-14 w-14';
      case 'xl':
        return 'h-20 w-20';
      default:
        return 'h-10 w-10';
    }
  };

  // Get size class for status indicator
  const getStatusSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-2 w-2';
      case 'md':
        return 'h-3 w-3';
      case 'lg':
        return 'h-4 w-4';
      case 'xl':
        return 'h-5 w-5';
      default:
        return 'h-3 w-3';
    }
  };

  // Get position class for status indicator
  const getStatusPositionClass = () => {
    switch (statusPosition) {
      case 'bottom-right':
        return 'bottom-0 right-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'top-right':
        return 'top-0 right-0';
      case 'top-left':
        return 'top-0 left-0';
      default:
        return 'bottom-0 right-0';
    }
  };

  // Get font size for avatar fallback
  const getFallbackFontSize = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm';
      case 'lg':
        return 'text-base';
      case 'xl':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  // Color generation for fallback background based on name
  const generateColor = (name: string) => {
    const hues = [196, 220, 38, 354, 142]; // Using our design guide colors
    let hash = 0;
    
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hues[Math.abs(hash) % hues.length];
    return `hsl(${hue}, 80%, 85%)`;
  };

  return (
    <div className="relative inline-block">
      <Avatar 
        className={cn(
          getSizeClass(),
          onClick && 'cursor-pointer hover:opacity-90',
          className
        )}
        onClick={onClick}
      >
        {src && !imageError ? (
          <AvatarImage 
            src={src} 
            alt={alt ?? fallback} 
            onError={handleImageError}
          />
        ) : null}
        <AvatarFallback 
          className={cn(
            getFallbackFontSize(),
            'font-medium text-[hsl(206,33%,16%)]'
          )}
          style={{ backgroundColor: generateColor(fallback) }}
        >
          {getInitials(fallback)}
        </AvatarFallback>
      </Avatar>
      
      {showStatus && status && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span 
                className={cn(
                  'absolute rounded-full ring-2 ring-white',
                  getStatusSizeClass(),
                  getStatusPositionClass(),
                  statusColors[status],
                  statusClassName
                )}
              />
            </TooltipTrigger>
            {statusText && (
              <TooltipContent>
                <p>{statusText}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export default UserAvatar;
