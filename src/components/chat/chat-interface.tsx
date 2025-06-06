import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { formatDate } from '@/lib/utils';
import { User, UserRole } from '@/types';
import { Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface ChatInterfaceProps {
  readonly otherUserId?: string;
}

export default function ChatInterface({ otherUserId: propOtherUserId }: ChatInterfaceProps) {
  const { id: paramOtherId } = useParams<{ id: string }>();
  const otherUserId = propOtherUserId ?? paramOtherId;
  
  const { user } = useAuth();

  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const {
    messages,
    typingUsers,
    isLoading,
    error: chatError,
    sendMessage,
    handleTyping
  } = useChat(otherUserId ?? '');
  
  // Get other user details
  useEffect(() => {
    if (otherUserId) {
      // Mock user data for now
      setOtherUser({
        id: otherUserId,
        firstName: 'Chat',
        lastName: 'User',
        email: 'user@example.com',
        username: 'otheruser',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isSuspended: false
      } as User);
    }
  }, [otherUserId]);
  
  // Handle chat errors
  useEffect(() => {
    if (chatError) {
      setError(chatError.message);
    }
  }, [chatError]);
  
  // Send a message
  const handleSendMessage = async () => {
    if (!isConnected || !otherUserId || !newMessage.trim()) return;
    
    try {
      // Using the consolidated API
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  };
  
  // Handle input changes and typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };
  
  // Handle enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Group messages by date
  const messagesByDate: { [date: string]: any[] } = {};
  (messages as any[]).forEach(message => {
    const messageDate = new Date(message.timestamp ?? message.createdAt ?? Date.now());
    const dateString = messageDate.toDateString();
    
    if (!messagesByDate[dateString]) {
      messagesByDate[dateString] = [];
    }
    
    messagesByDate[dateString].push(message);
  });
  
  // Check if user is connected
  const isConnected = !!user && !!otherUserId;
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => setError(null)}>
          Retry
        </Button>
      </div>
    );
  }
  
  // Show empty state
  if (messages.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 mb-6">
          No messages yet. Start a conversation!
        </p>

        {isConnected && (
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="flex items-center space-x-1"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {Object.entries(messagesByDate).map(([dateString, dateMessages]) => (
          <div key={dateString} className="mb-4">
            {/* Date header */}
            <div className="flex justify-center mb-4 relative">
              <Separator className="absolute w-full top-1/2" />
              <span className="bg-background px-4 text-xs text-gray-500 relative">
                {formatDate(new Date(dateString), 'header')}
              </span>
            </div>
            
            {/* Messages for this date */}
            {dateMessages.map((message: any) => {
              const isSentByMe = message.senderId === (user as any)?.id || message.authorId === (user as any)?.id;
              const messageTime = new Date(message.timestamp ?? message.createdAt ?? Date.now());

              return (
                <div
                  key={message.id}
                  className={`flex mb-4 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSentByMe && (
                    <Avatar className="mr-2 h-8 w-8">
                      <AvatarFallback>
                        {(otherUser as any)?.firstName?.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="max-w-[70%]">
                    <div
                      className={`p-3 rounded-lg shadow-sm ${
                        isSentByMe
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>

                    <p
                      className={`text-xs text-gray-500 mt-1 ${
                        isSentByMe ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatDate(messageTime, 'time')}
                    </p>
                  </div>

                  {isSentByMe && (
                    <Avatar className="ml-2 h-8 w-8">
                      <AvatarFallback>
                        {(user as any)?.firstName?.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center ml-2 mb-4">
            <Avatar className="mr-2 h-8 w-8">
              <AvatarFallback>
                {(otherUser as any)?.firstName?.charAt(0) ?? '?'}
              </AvatarFallback>
            </Avatar>

            <div className="p-3 rounded-lg shadow-sm bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Message input */}
      {isConnected && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="flex items-center space-x-1"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
