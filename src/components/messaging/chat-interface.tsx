import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import {
    Check,
    CheckCheck,
    Clock,
    MoreVertical,
    Paperclip,
    Phone,
    Send,
    Video
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'file';
  attachments?: {
    url: string;
    name: string;
    type: string;
    size: number;
  }[];
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface ChatInterfaceProps {
  currentUserId: string;
  otherUser: ChatUser;
  messages: Message[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onStartCall?: () => void;
  onStartVideoCall?: () => void;
  className?: string;
}

const MessageStatus: React.FC<{ status: Message['status'] }> = ({ status }) => {
  switch (status) {
    case 'sending':
      return <Clock className="w-3 h-3 text-text-secondary" />;
    case 'sent':
      return <Check className="w-3 h-3 text-text-secondary" />;
    case 'delivered':
      return <CheckCheck className="w-3 h-3 text-text-secondary" />;
    case 'read':
      return <CheckCheck className="w-3 h-3 text-primary-600" />;
    default:
      return null;
  }
};

const MessageBubble: React.FC<{ 
  message: Message; 
  isOwn: boolean; 
  showAvatar: boolean;
  otherUser: ChatUser;
}> = ({ message, isOwn, showAvatar, otherUser }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-end space-x-2 mb-4',
        isOwn ? 'justify-end' : 'justify-start'
      )}
    >
      {!isOwn && showAvatar && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
          <AvatarFallback className="bg-primary-50 text-primary-600 text-xs">
            {otherUser.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      
      {!isOwn && !showAvatar && <div className="w-8" />}
      
      <div className={cn('max-w-xs lg:max-w-md', isOwn && 'order-1')}>
        <div
          className={cn(
            'px-4 py-2 rounded-2xl text-sm',
            isOwn 
              ? 'bg-primary-600 text-white rounded-br-md' 
              : 'bg-surface text-text-primary rounded-bl-md border border-border'
          )}
        >
          <p className="leading-relaxed">{message.content}</p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, index) => (
                <div
                  key={`${message.id}-attachment-${index}`}
                  className={cn(
                    'flex items-center space-x-2 p-2 rounded-lg text-xs',
                    isOwn ? 'bg-primary-500' : 'bg-border/20'
                  )}
                >
                  <Paperclip className="w-3 h-3" />
                  <span className="truncate">{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={cn(
          'flex items-center space-x-1 mt-1 text-xs text-text-secondary',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          <span>{formatTime(message.timestamp)}</span>
          {isOwn && <MessageStatus status={message.status} />}
        </div>
      </div>
    </motion.div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUserId,
  otherUser,
  messages,
  onSendMessage,
  onStartCall,
  onStartVideoCall,
  className
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onSendMessage('', files);
    }
  };

  const getLastSeenText = () => {
    if (otherUser.isOnline) return 'Online';
    if (otherUser.lastSeen) {
      const now = new Date();
      const diff = now.getTime() - otherUser.lastSeen.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    }
    return 'Offline';
  };

  return (
    <Card className={cn('flex flex-col h-full max-h-[600px]', className)}>
      {/* Chat Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
              <AvatarFallback className="bg-primary-50 text-primary-600">
                {otherUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {otherUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-text-primary">
              {otherUser.name}
            </CardTitle>
            <p className="text-sm text-text-secondary">{getLastSeenText()}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onStartCall && (
            <Button variant="ghost" size="sm" onClick={onStartCall}>
              <Phone className="w-4 h-4" />
            </Button>
          )}
          {onStartVideoCall && (
            <Button variant="ghost" size="sm" onClick={onStartVideoCall}>
              <Video className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-1">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId;
            const prevMessage = messages[index - 1];
            const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                otherUser={otherUser}
              />
            );
          })}
        </AnimatePresence>
        
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
              <AvatarFallback className="bg-primary-50 text-primary-600 text-xs">
                {otherUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="bg-surface px-4 py-2 rounded-2xl rounded-bl-md border border-border">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-text-secondary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end space-x-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            aria-label="Upload files"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="resize-none border-border focus:border-primary-600"
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
