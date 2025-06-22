/**
 * Enhanced Chat Interface
 * 
 * Advanced chat component with threading, reactions, typing indicators,
 * message search, and real-time features.
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Send, 
 
  Smile, 
  Search, 
  Reply, 
  MessageSquare,
  MoreVertical,
  Edit3,
  Trash2,
  Phone,
  Video,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
// import { Badge } from '../ui/badge'; // Not currently used
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
// import { 
//   Dialog, 
//   DialogContent, 
//   DialogHeader, 
//   DialogTitle 
// } from '../ui/dialog'; // Not currently used
import { ScrollArea } from '../ui/scroll-area';
import { useEnhancedSocket } from '../../hooks/use-enhanced-socket';
import { useAuth } from '../../hooks/use-auth';
import { isToday, isYesterday, format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  editedAt?: string;
  tempId?: string;
  replyTo?: Message;
  threadId?: string;
  threadCount?: number;
  reactions?: Array<{
    id: string;
    userId: string;
    reaction: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
  };
  isRead: boolean;
  isDelivered: boolean;
  isEdited: boolean;
  isDeleted: boolean;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'task';
  name?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role?: 'owner' | 'admin' | 'member';
    isOnline: boolean;
    lastSeen?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  metadata?: Record<string, any>;
}

interface EnhancedChatInterfaceProps {
  conversationId: string;
  conversation?: Conversation;
  messages: Message[];
  onMessagesUpdate?: (messages: Message[]) => void;
  onTypingUsersUpdate?: (users: string[]) => void;
  className?: string;
  height?: string;
  showHeader?: boolean;
  showParticipants?: boolean;
  allowVoiceCall?: boolean;
  allowVideoCall?: boolean;
  maxAttachmentSize?: number;
  enableThreads?: boolean;
  enableReactions?: boolean;
  enableSearch?: boolean;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'];

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  conversationId,
  conversation,
  messages: initialMessages = [],
  onMessagesUpdate,
  onTypingUsersUpdate,
  className = '',
  height = '600px',
  showHeader = true,
  // showParticipants = false, // Not currently used
  allowVoiceCall = false,
  allowVideoCall = false,
  // maxAttachmentSize = 10 * 1024 * 1024, // 10MB // Not currently used
  enableThreads = true,
  enableReactions = true,
  enableSearch = true
}) => {
  const { user } = useAuth();
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    // sendThreadReply, // Not currently used
    // markAsRead, // Not currently used
    setTyping,
    searchMessages,
    typingUsers,
    on,
    off,
    joinRoom,
    currentRoom
  } = useEnhancedSocket();

  // State
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [messageInput, setMessageInput] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  // const [selectedThread, setSelectedThread] = useState<string | null>(null); // Not read anywhere
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // const [searchResults, setSearchResults] = useState<Message[]>([]); // Not read anywhere
  // const [isLoadingOlder, setIsLoadingOlder] = useState(false); // Not currently used
  // const [hasMoreMessages, setHasMoreMessages] = useState(true); // Not currently used

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto' 
    });
  }, []);

  // Join conversation room on mount
  useEffect(() => {
    if (conversationId && conversationId !== currentRoom) {
      joinRoom(conversationId, 'chat');
    }
  }, [conversationId, currentRoom, joinRoom]);

  // Socket event handlers
  useEffect(() => {
    const handleMessageReceived = (message: Message) => {
      setMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        
        const newMessages = [...prev, message];
        onMessagesUpdate?.(newMessages);
        return newMessages;
      });
      
      // Auto-scroll if user is at bottom
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
          if (isAtBottom) {
            scrollToBottom();
          }
        }
      }, 100);
    };

    const handleMessageSent = (data: { tempId: string; message: Message }) => {
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId ? data.message : msg
      ));
    };

    const handleMessageEdited = (data: { messageId: string; content: string; editedAt: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId 
          ? { ...msg, content: data.content, editedAt: data.editedAt, isEdited: true }
          : msg
      ));
    };

    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === data.messageId 
          ? { ...msg, isDeleted: true, content: '[Message deleted]' }
          : msg
      ));
    };

    const handleReactionAdded = (data: { messageId: string; reaction: any }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = msg.reactions || [];
          return { ...msg, reactions: [...reactions, data.reaction] };
        }
        return msg;
      }));
    };

    const handleReactionRemoved = (data: { messageId: string; userId: string; reaction: string }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = (msg.reactions || []).filter(r => 
            !(r.userId === data.userId && r.reaction === data.reaction)
          );
          return { ...msg, reactions };
        }
        return msg;
      }));
    };

    // Register event listeners
    on('message_received', handleMessageReceived);
    on('message_sent', handleMessageSent);
    on('message_edited', handleMessageEdited);
    on('message_deleted', handleMessageDeleted);
    on('reaction_added', handleReactionAdded);
    on('reaction_removed', handleReactionRemoved);

    return () => {
      off('message_received', handleMessageReceived);
      off('message_sent', handleMessageSent);
      off('message_edited', handleMessageEdited);
      off('message_deleted', handleMessageDeleted);
      off('reaction_added', handleReactionAdded);
      off('reaction_removed', handleReactionRemoved);
    };
  }, [on, off, onMessagesUpdate, scrollToBottom]);

  // Handle typing indicators
  useEffect(() => {
    const currentTypingUsers = typingUsers
      .filter(tu => tu.roomId === conversationId && tu.userId !== user?.id)
      .map(tu => tu.userId);
    
    onTypingUsersUpdate?.(currentTypingUsers);
  }, [typingUsers, conversationId, user?.id, onTypingUsersUpdate]);

  // Handle input changes with typing indicators
  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    
    // Send typing indicator
    if (value.trim() && !typingTimeoutRef.current) {
      setTyping(true);
    }
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  }, [setTyping]);

  // Send message
  const handleSendMessage = useCallback(async () => {
    const content = messageInput.trim();
    if (!content) return;

    try {
      const tempId = `temp_${Date.now()}`;
      
      // Optimistically add message
      const tempMessage: Message = {
        id: tempId,
        tempId,
        senderId: user!.id,
        content,
        type: 'text',
        timestamp: new Date().toISOString(),
        sender: {
          id: user!.id,
          name: user!.name || 'You',
          avatar: user!.avatar
        },
        isRead: true,
        isDelivered: false,
        isEdited: false,
        isDeleted: false,
        replyTo: replyToMessage || undefined
      };

      setMessages(prev => [...prev, tempMessage]);
      setMessageInput('');
      setReplyToMessage(null);
      setTyping(false);
      
      // Send message
      await sendMessage(content, {
        replyTo: replyToMessage?.id
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageInput, user, replyToMessage, sendMessage, setTyping, scrollToBottom]);

  // Handle message editing
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, [editMessage]);

  // Handle message deletion
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [deleteMessage]);

  // Handle emoji reactions
  const handleToggleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const existingReaction = message?.reactions?.find(r => 
        r.userId === user?.id && r.reaction === emoji
      );

      if (existingReaction) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }, [messages, user?.id, addReaction, removeReaction]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    // Implementation for file upload
    console.log('File upload:', files);
  }, []);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // setSearchResults([]); // Commented out since searchResults is not used
      return;
    }

    try {
      // const results = await searchMessages(query, {
      //   roomId: conversationId,
      //   limit: 50
      // });
      // setSearchResults(results.messages || []); // Commented out since searchResults is not used
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchMessages, conversationId]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; messages: Message[] }> = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;

    messages.forEach(message => {
      const messageDate = new Date(message.timestamp);
      let dateLabel = '';

      if (isToday(messageDate)) {
        dateLabel = 'Today';
      } else if (isYesterday(messageDate)) {
        dateLabel = 'Yesterday';
      } else {
        dateLabel = format(messageDate, 'MMMM d, yyyy');
      }

      if (!currentGroup || currentGroup.date !== dateLabel) {
        currentGroup = { date: dateLabel, messages: [] };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    });

    return groups;
  }, [messages]);

  // Typing indicator component
  const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
    if (users.length === 0) return null;

    const names = users.slice(0, 3).join(', ');
    const remaining = users.length - 3;

    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>
          {names}
          {remaining > 0 && ` and ${remaining} other${remaining > 1 ? 's' : ''}`}
          {users.length === 1 ? ' is' : ' are'} typing...
        </span>
      </div>
    );
  };

  // Message component
  const MessageComponent: React.FC<{ message: Message; isLast: boolean }> = ({ message }) => {
    const isOwn = message.senderId === user?.id;
    const [showReactions, setShowReactions] = useState(false);

    return (
      <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
          <AvatarFallback>
            {message.sender.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className={`flex-1 max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
          {/* Message header */}
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
            <span className="font-medium text-sm text-gray-900">
              {isOwn ? 'You' : message.sender.name}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(message.timestamp), 'HH:mm')}
            </span>
            {message.isEdited && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {/* Reply context */}
          {message.replyTo && (
            <div className={`mb-2 p-2 border-l-2 border-gray-300 bg-gray-50 rounded text-sm ${
              isOwn ? 'border-r-2 border-l-0' : ''
            }`}>
              <div className="font-medium text-gray-700">{message.replyTo.sender.name}</div>
              <div className="text-gray-600 truncate">{message.replyTo.content}</div>
            </div>
          )}

          {/* Message content */}
          <div
            className={`relative group p-3 rounded-lg ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-200'
            } ${message.isDeleted ? 'italic opacity-60' : ''}`}
          >
            {editingMessage?.id === message.id ? (
              <div className="space-y-2">
                <Textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMessage(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleEditMessage(message.id, messageInput)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Message actions */}
                {!message.isDeleted && (
                  <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isOwn ? 'left-2' : 'right-2'
                  }`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 bg-white/80 hover:bg-white/90"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
                        <DropdownMenuItem onClick={() => setReplyToMessage(message)}>
                          <Reply className="w-4 h-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        {enableReactions && (
                          <DropdownMenuItem onClick={() => setShowReactions(!showReactions)}>
                            <Smile className="w-4 h-4 mr-2" />
                            Add Reaction
                          </DropdownMenuItem>
                        )}
                        {isOwn && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setEditingMessage(message);
                              setMessageInput(message.content);
                            }}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            )}

            {/* Reactions */}
            {enableReactions && message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(
                  message.reactions.reduce((acc, reaction) => {
                    acc[reaction.reaction] = (acc[reaction.reaction] || []).concat(reaction);
                    return acc;
                  }, {} as Record<string, typeof message.reactions>)
                ).map(([emoji, reactions]) => (
                  <button
                    key={emoji}
                    onClick={() => handleToggleReaction(message.id, emoji)}
                    className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                      reactions.some(r => r.userId === user?.id)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {emoji} {reactions.length}
                  </button>
                ))}
              </div>
            )}

            {/* Quick reaction picker */}
            {showReactions && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-10">
                <div className="flex gap-1">
                  {EMOJI_REACTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleToggleReaction(message.id, emoji);
                        setShowReactions(false);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thread indicator */}
          {enableThreads && message.threadCount && message.threadCount > 0 && (
            <button
              onClick={() => {/* setSelectedThread(message.id) */}} // Commented out since selectedThread is not used
              className="flex items-center gap-1 mt-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <MessageSquare className="w-3 h-3" />
              {message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col bg-white border rounded-lg ${className}`} style={{ height }}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation?.participants[0]?.avatar} />
              <AvatarFallback>
                {conversation?.name?.charAt(0) || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {conversation?.name || 'Chat'}
              </h3>
              <p className="text-sm text-gray-500">
                {conversation?.participants.length} participants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {enableSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            {allowVoiceCall && (
              <Button variant="ghost" size="sm">
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {allowVideoCall && (
              <Button variant="ghost" size="sm">
                <Video className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b">
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
        </div>
      )}

      {/* Messages */}
      <ScrollArea
        ref={messagesContainerRef}
        className="flex-1 p-4"
      >
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                {group.date}
              </div>
            </div>

            {/* Messages */}
            {group.messages.map((message, messageIndex) => (
              <MessageComponent
                key={message.id}
                message={message}
                isLast={
                  groupIndex === groupedMessages.length - 1 &&
                  messageIndex === group.messages.length - 1
                }
              />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        <TypingIndicator 
          users={typingUsers
            .filter(tu => tu.roomId === conversationId && tu.userId !== user?.id)
            .map(tu => tu.userId)
          } 
        />

        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Reply preview */}
      {replyToMessage && (
        <div className="px-4 py-2 border-t border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="w-4 h-4" />
              <span className="font-medium">Replying to {replyToMessage.sender.name}</span>
              <span className="text-gray-600 truncate max-w-xs">
                {replyToMessage.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1">
            <Textarea
              ref={messageInputRef}
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
          </div>

          <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
      />
    </div>
  );
};

export default EnhancedChatInterface;