/**
 * Chat Interface Component
 * 
 * A real-time chat interface for communication between users.
 */

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/use-socket';
import { useAuth } from '../../hooks/use-auth';
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
  const { isConnected, on, getChatMessages, sendChatMessage } = useSocket();
  
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
  
  // Fetch messages
  const fetchMessages = async () => {
    if (!isConnected || !otherUserId) return;
    
    setLoading(true);
    try {
      const data = await getChatMessages(otherUserId);
      
      // Parse dates
      const parsedMessages = data.map((message: any) => ({
        ...message,
        createdAt: new Date(message.createdAt)
      }));
      
      setMessages(parsedMessages);
      setError(null);
      
      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Send a message
  const handleSendMessage = async () => {
    if (!isConnected || !otherUserId || !newMessage.trim()) return;
    
    try {
      await sendChatMessage(otherUserId, newMessage);
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
  
  // Initial fetch and WebSocket setup
  useEffect(() => {
    if (!otherUserId || !isConnected) return;
    
    fetchMessages();
    
    // Listen for new messages
    const handleNewMessage = (message: any) => {
      // Only add messages for this conversation
      if (
        (message.senderId === otherUserId && message.receiverId === user?.id) ||
        (message.senderId === user?.id && message.receiverId === otherUserId)
      ) {
        const parsedMessage = {
          ...message,
          createdAt: new Date(message.createdAt)
        };
        
        setMessages(prev => [...prev, parsedMessage]);
        setTimeout(scrollToBottom, 100);
      }
    };
    
    // Register event listener
    const cleanup = on('chat:newMessage', handleNewMessage);
    
    return cleanup;
  }, [otherUserId, isConnected, user?.id, on]);
  
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
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          // Messages grouped by date
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
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    bgcolor: 'background.default',
                    px: 2,
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  {formatDateHeader(new Date(dateString))}
                </Typography>
              </Box>
              
              {/* Messages for this date */}
              {dateMessages.map((message) => {
                const isSentByMe = message.senderId === user?.id;
                
                return (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: isSentByMe ? 'flex-end' : 'flex-start',
                      mb: 1.5
                    }}
                  >
                    {/* Avatar (only show for received messages) */}
                    {!isSentByMe && (
                      <Avatar
                        src={message.sender.avatar}
                        alt={`${message.sender.firstName} ${message.sender.lastName}`}
                        sx={{ width: 32, height: 32, mr: 1, mt: 0.5 }}
                      />
                    )}
                    
                    {/* Message content */}
                    <Box
                      sx={{
                        maxWidth: '70%',
                        minWidth: '100px'
                      }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isSentByMe ? 'primary.main' : 'background.paper',
                          color: isSentByMe ? 'primary.contrastText' : 'text.primary'
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                      </Paper>
                      
                      {/* Timestamp */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          textAlign: isSentByMe ? 'right' : 'left'
                        }}
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          ))
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Message input */}
      <Paper
        elevation={3}
        component="form"
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <TextField
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          variant="outlined"
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          Send
        </Button>
      </Paper>
    </Box>
  );
}
