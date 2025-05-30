/**
 * Chat Interface Component
 * 
 * A real-time chat interface for communication between users.
 */

import { useState, useEffect, useRef } from 'react';
import { useRealtimeService as useRealtime } from '../../services/realtime/hooks';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { Avatar, Button, TextField, Typography, Paper, Box, CircularProgress, Divider } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface ChatInterfaceProps {
  otherUserId: string;
  otherUserName?: string;
  otherUserAvatar?: string;
}

export function ChatInterface({ otherUserId, otherUserName, otherUserAvatar }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { isConnected } = useRealtime();
  const { messages: chatMessages, isLoading, error: chatError, sendMessage, typingUsers, handleTyping } = useChat(otherUserId);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Use messages from the useChat hook
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      // Parse dates
      const parsedMessages = chatMessages.map((message: any) => ({
        ...message,
        createdAt: new Date(message.createdAt)
      }));
      
      setMessages(parsedMessages);
      setError(null);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    }
  }, [chatMessages]);
  
  // Update loading state based on isLoading from hook
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Update error state based on chatError from hook
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
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Initial setup when connected
  useEffect(() => {
    if (!otherUserId || !isConnected) return;
    
    // No need to fetch messages manually, useChat handles this
    // when joining the conversation
    
  }, [otherUserId, isConnected, user?.id]);
  
  // The useChat hook already handles listening for new messages
  // We just need to scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Format date header
  const formatDateHeader = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    }
  };
  
  // Group messages by date
  const messagesByDate: { [date: string]: Message[] } = {};
  messages.forEach(message => {
    const dateString = message.createdAt.toDateString();
    if (!messagesByDate[dateString]) {
      messagesByDate[dateString] = [];
    }
    messagesByDate[dateString].push(message);
  });
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Chat header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Avatar
          src={otherUserAvatar}
          alt={otherUserName || 'User'}
          sx={{ width: 40, height: 40, mr: 2 }}
        />
        <Typography variant="h6">{otherUserName || 'Chat'}</Typography>
      </Paper>
      
      {/* Messages container */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default'
        }}
      >
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          // Group messages by date
          Object.entries(messagesByDate).map(([dateString, dateMessages]) => (
            <Box key={dateString} sx={{ mb: 2 }}>
              {/* Date header */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 2, 
                  position: 'relative' 
                }}
              >
                <Divider sx={{ position: 'absolute', width: '100%', top: '50%' }} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    bgcolor: 'background.default', 
                    px: 2, 
                    position: 'relative',
                    color: 'text.secondary'
                  }}
                >
                  {formatDateHeader(new Date(dateString))}
                </Typography>
              </Box>
              
              {/* Messages for this date */}
              {dateMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.senderId === user?.id ? 'flex-end' : 'flex-start',
                    mb: 1.5
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      flexDirection: message.senderId === user?.id ? 'row-reverse' : 'row'
                    }}
                  >
                    {message.senderId !== user?.id && (
                      <Avatar
                        src={message.sender?.avatar || otherUserAvatar}
                        alt={message.sender?.firstName || 'User'}
                        sx={{ 
                          width: 32, 
                          height: 32, 
                          mr: message.senderId === user?.id ? 0 : 1,
                          ml: message.senderId === user?.id ? 1 : 0
                        }}
                      />
                    )}
                    <Paper
                      sx={{
                        p: 1.5,
                        px: 2,
                        maxWidth: '70%',
                        borderRadius: 2,
                        bgcolor: message.senderId === user?.id ? 'primary.main' : 'background.paper',
                        color: message.senderId === user?.id ? 'primary.contrastText' : 'text.primary',
                        boxShadow: 1
                      }}
                    >
                      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {message.content}
                      </Typography>
                    </Paper>
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      px: 1.5,
                      color: 'text.secondary'
                    }}
                  >
                    {formatTime(message.createdAt)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              {otherUserName || 'User'} is typing...
            </Typography>
          </Box>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message input */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            if (e.target.value.length > 0) {
              handleTyping();
            }
          }}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!isConnected || !newMessage.trim()}
        >
          Send
        </Button>
      </Paper>
    </Box>
  );
}
