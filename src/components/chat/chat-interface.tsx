import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { formatDateHeader, formatTime } from '@/services/date';
import { User } from '@/types';
import { Send as SendIcon } from '@mui/icons-material';
import { Avatar, Box, Button, CircularProgress, Divider, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

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
        email: 'user@example.com'
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 2 }}
          onClick={() => setError(null)}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  // Show empty state
  if (messages.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          No messages yet. Start a conversation!
        </Typography>
        
        {isConnected && (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </Box>
        )}
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {Object.entries(messagesByDate).map(([dateString, dateMessages]) => (
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
            {dateMessages.map((message: any) => {
              const isSentByMe = message.senderId === user?.id || message.authorId === user?.id;
              const messageTime = new Date(message.timestamp ?? message.createdAt ?? Date.now());
              
              return (
                <Box 
                  key={message.id} 
                  sx={{
                    display: 'flex',
                    justifyContent: isSentByMe ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  {!isSentByMe && (
                    <Avatar 
                      sx={{ mr: 1, width: 32, height: 32 }}
                      src={otherUser?.avatar ?? undefined}
                    >
                      {otherUser?.firstName?.charAt(0) ?? '?'}
                    </Avatar>
                  )}
                  
                  <Box sx={{ maxWidth: '70%' }}>
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
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 0.5, 
                        color: 'text.secondary',
                        textAlign: isSentByMe ? 'right' : 'left'
                      }}
                    >
                      {formatTime(messageTime)}
                    </Typography>
                  </Box>
                  
                  {isSentByMe && (
                    <Avatar 
                      sx={{ ml: 1, width: 32, height: 32 }}
                      src={user?.avatar ?? undefined}
                    >
                      {user?.firstName?.charAt(0) ?? '?'}
                    </Avatar>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mb: 2 }}>
            <Avatar 
              sx={{ mr: 1, width: 32, height: 32 }}
              src={otherUser?.avatar ?? undefined}
            >
              {otherUser?.firstName?.charAt(0) ?? '?'}
            </Avatar>
            
            <Paper 
              elevation={1}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}
            >
              <Typography variant="body2">Typing...</Typography>
            </Paper>
          </Box>
        )}
      </Box>
      
      {/* Message input */}
      {isConnected && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              sx={{ mr: 1 }}
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              Send
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
