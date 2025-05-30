/**
 * Connection Status Indicator
 * 
 * A component that displays the current WebSocket connection status
 * and allows users to manually reconnect if needed.
 */

import { useState, useEffect } from 'react';
import { useRealtimeService } from '@/services/realtime/hooks';
import { ConnectionState } from '@/services/realtime/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, WifiOff } from 'lucide-react';

export function ConnectionStatusIndicator({ showText = true }: Readonly<{ showText?: boolean }>) {
  const { connectionState, reconnect } = useRealtimeService();
  const [showReconnectButton, setShowReconnectButton] = useState(false);
  
  // Show reconnect button only after being in a disconnected state for some time
  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED) {
      const timer = setTimeout(() => {
        setShowReconnectButton(true);
      }, 5000); // Show reconnect button after 5 seconds of being disconnected
      
      return () => clearTimeout(timer);
    } else {
      setShowReconnectButton(false);
    }
  }, [connectionState]);
  
  // Get appropriate status display based on connection state
  const getStatusDisplay = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Connected',
          badgeClass: 'bg-green-500 text-white hover:bg-green-600',
          tooltipText: 'Real-time connection is active'
        };
        
      case ConnectionState.CONNECTING:
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          label: 'Connecting',
          badgeClass: 'bg-blue-500 text-white hover:bg-blue-600',
          tooltipText: 'Establishing real-time connection...'
        };
        
      case ConnectionState.RECONNECTING:
        return {
          icon: <RefreshCw className="h-4 w-4 animate-spin" />,
          label: 'Reconnecting',
          badgeClass: 'bg-amber-500 text-white hover:bg-amber-600',
          tooltipText: 'Attempting to reconnect...'
        };
        
      case ConnectionState.DISCONNECTED:
      default:
        return {
          icon: <WifiOff className="h-4 w-4" />,
          label: 'Disconnected',
          badgeClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
          tooltipText: 'Real-time updates are not available'
        };
    }
  };
  
  const status = getStatusDisplay();
  
  // Handle manual reconnect
  const handleReconnect = () => {
    reconnect();
    setShowReconnectButton(false);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`${status.badgeClass} cursor-default`}>
              <div className="flex items-center space-x-1">
                {status.icon}
                {showText && <span className="ml-1">{status.label}</span>}
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{status.tooltipText}</p>
            {connectionState === ConnectionState.DISCONNECTED && (
              <p className="text-xs text-muted-foreground mt-1">
                {showReconnectButton 
                  ? 'Click to reconnect manually'
                  : 'Automatic reconnect in progress'}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {showReconnectButton && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReconnect}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}
    </div>
  );
}

/**
 * Floating Connection Status Indicator
 * 
 * A version of the connection status indicator that
 * appears as a floating element in the corner of the screen.
 */
export function FloatingConnectionStatus() {
  const { connectionState } = useRealtimeService();
  const [visible, setVisible] = useState(false);
  
  // Only show when disconnected or reconnecting
  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED || 
        connectionState === ConnectionState.RECONNECTING) {
      setVisible(true);
    } else {
      // Hide after a delay when connected
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [connectionState]);
  
  if (!visible) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-background border rounded-lg shadow-lg p-2 flex items-center space-x-2">
        <ConnectionStatusIndicator showText={true} />
        
        {connectionState === ConnectionState.DISCONNECTED && (
          <div className="text-xs text-muted-foreground ml-2 mr-1">
            <AlertCircle className="h-3 w-3 inline mr-1 text-amber-500" />
            Real-time updates unavailable
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatusIndicator;
