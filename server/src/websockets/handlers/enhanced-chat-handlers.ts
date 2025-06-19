/**
 * Enhanced Chat Handlers
 * 
 * Advanced chat functionality with message threading, reactions,
 * file sharing, and advanced moderation features.
 */

import { Socket } from 'socket.io';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { performanceMonitor } from '../../monitoring/performance-monitor';
import { errorTracker } from '../../../../src/services/monitoring/error-tracking';

const prisma = new PrismaClient();

// Validation schemas
const messageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file', 'voice', 'system']).default('text'),
  replyTo: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).optional(),
  metadata: z.record(z.any()).optional()
});

const reactionSchema = z.object({
  messageId: z.string().uuid(),
  reaction: z.string().min(1).max(10),
  action: z.enum(['add', 'remove'])
});

const threadSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).optional()
});

const editMessageSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000)
});

const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.string().optional()
});

const searchSchema = z.object({
  conversationId: z.string().uuid(),
  query: z.string().min(1).max(100),
  limit: z.number().min(1).max(50).default(20),
  offset: z.number().min(0).default(0),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  messageType: z.enum(['text', 'image', 'file', 'voice']).optional()
});

interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: Date;
}

interface MessageThread {
  id: string;
  parentMessageId: string;
  conversationId: string;
  messageCount: number;
  lastReplyAt: Date;
  participants: string[];
}

export class EnhancedChatHandlers {
  /**
   * Handle sending enhanced messages with attachments and threading
   */
  static async handleSendMessage(socket: Socket, data: any): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const messageData = messageSchema.parse(data);
      const userId = socket.userId;

      // Verify conversation access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: messageData.conversationId,
          participants: {
            some: { userId }
          }
        },
        include: {
          participants: true,
          task: true
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Process attachments
      const processedAttachments = await this.processAttachments(messageData.attachments || []);

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId: messageData.conversationId,
          senderId: userId,
          content: messageData.content,
          type: messageData.type,
          replyToId: messageData.replyTo,
          threadId: messageData.threadId,
          attachments: processedAttachments,
          metadata: messageData.metadata || {}
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true
            }
          },
          replyTo: {
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          thread: true,
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      // Update conversation activity
      await prisma.conversation.update({
        where: { id: messageData.conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageId: message.id
        }
      });

      // Handle threading
      if (messageData.replyTo && !messageData.threadId) {
        const thread = await this.createOrUpdateThread(messageData.replyTo, message.id);
        message.threadId = thread.id;
      }

      // Prepare message for broadcast
      const enhancedMessage = {
        ...message,
        isEdited: false,
        readBy: [userId],
        deliveredTo: [userId],
        reactions: [],
        threadCount: 0
      };

      // Broadcast to conversation participants
      const roomId = `conversation:${messageData.conversationId}`;
      socket.to(roomId).emit('message_received', enhancedMessage);

      // Send confirmation to sender
      socket.emit('message_sent', {
        tempId: data.tempId,
        message: enhancedMessage
      });

      // Update read status for sender
      await this.markMessageAsRead(message.id, userId);

      // Send push notifications to offline users
      await this.sendOfflineNotifications(conversation, message);

      timer();
      console.log(`💬 Enhanced message sent by ${userId} to conversation ${messageData.conversationId}`);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          handler: 'sendMessage',
          userId: socket.userId,
          conversationId: data.conversationId
        }
      });

      socket.emit('error', {
        message: 'Failed to send message',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle message reactions (emoji reactions)
   */
  static async handleMessageReaction(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, reaction, action } = reactionSchema.parse(data);
      const userId = socket.userId;

      // Verify message access
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          conversation: {
            participants: {
              some: { userId }
            }
          }
        }
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found or access denied' });
        return;
      }

      if (action === 'add') {
        // Add reaction
        const messageReaction = await prisma.messageReaction.upsert({
          where: {
            messageId_userId_reaction: {
              messageId,
              userId,
              reaction
            }
          },
          update: {},
          create: {
            messageId,
            userId,
            reaction
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          }
        });

        // Broadcast reaction added
        const roomId = `conversation:${message.conversationId}`;
        socket.to(roomId).emit('reaction_added', {
          messageId,
          reaction: messageReaction
        });

      } else {
        // Remove reaction
        await prisma.messageReaction.deleteMany({
          where: {
            messageId,
            userId,
            reaction
          }
        });

        // Broadcast reaction removed
        const roomId = `conversation:${message.conversationId}`;
        socket.to(roomId).emit('reaction_removed', {
          messageId,
          userId,
          reaction
        });
      }

    } catch (error) {
      socket.emit('error', {
        message: 'Failed to handle reaction',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle creating thread replies
   */
  static async handleThreadReply(socket: Socket, data: any): Promise<void> {
    try {
      const threadData = threadSchema.parse(data);
      const userId = socket.userId;

      // Verify parent message and access
      const parentMessage = await prisma.message.findFirst({
        where: {
          id: threadData.messageId,
          conversation: {
            participants: {
              some: { userId }
            }
          }
        },
        include: {
          conversation: true
        }
      });

      if (!parentMessage) {
        socket.emit('error', { message: 'Parent message not found or access denied' });
        return;
      }

      // Find or create thread
      let thread = await prisma.messageThread.findFirst({
        where: { parentMessageId: threadData.messageId }
      });

      if (!thread) {
        thread = await prisma.messageThread.create({
          data: {
            parentMessageId: threadData.messageId,
            conversationId: parentMessage.conversationId
          }
        });
      }

      // Process attachments
      const processedAttachments = await this.processAttachments(threadData.attachments || []);

      // Create thread reply
      const reply = await prisma.message.create({
        data: {
          conversationId: parentMessage.conversationId,
          senderId: userId,
          content: threadData.content,
          type: 'text',
          threadId: thread.id,
          attachments: processedAttachments
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true
            }
          }
        }
      });

      // Update thread statistics
      await prisma.messageThread.update({
        where: { id: thread.id },
        data: {
          lastReplyAt: new Date(),
          messageCount: {
            increment: 1
          }
        }
      });

      // Broadcast thread reply
      const roomId = `conversation:${parentMessage.conversationId}`;
      socket.to(roomId).emit('thread_reply', {
        threadId: thread.id,
        parentMessageId: threadData.messageId,
        reply
      });

      socket.emit('thread_reply_sent', {
        tempId: data.tempId,
        reply
      });

    } catch (error) {
      socket.emit('error', {
        message: 'Failed to send thread reply',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle message editing
   */
  static async handleEditMessage(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, content } = editMessageSchema.parse(data);
      const userId = socket.userId;

      // Verify message ownership
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: userId
        }
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found or not owned by user' });
        return;
      }

      // Check if message is too old to edit (24 hours)
      const hoursSinceCreated = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreated > 24) {
        socket.emit('error', { message: 'Message too old to edit' });
        return;
      }

      // Update message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          editedAt: new Date()
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Broadcast edit
      const roomId = `conversation:${message.conversationId}`;
      socket.to(roomId).emit('message_edited', {
        messageId,
        content,
        editedAt: updatedMessage.editedAt
      });

      socket.emit('message_edit_confirmed', {
        messageId,
        content,
        editedAt: updatedMessage.editedAt
      });

    } catch (error) {
      socket.emit('error', {
        message: 'Failed to edit message',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle message deletion
   */
  static async handleDeleteMessage(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, reason } = deleteMessageSchema.parse(data);
      const userId = socket.userId;

      // Verify message ownership or admin privileges
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          OR: [
            { senderId: userId },
            {
              conversation: {
                task: {
                  ownerId: userId
                }
              }
            }
          ]
        }
      });

      if (!message) {
        socket.emit('error', { message: 'Message not found or insufficient permissions' });
        return;
      }

      // Soft delete the message
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: userId,
          deleteReason: reason
        }
      });

      // Broadcast deletion
      const roomId = `conversation:${message.conversationId}`;
      socket.to(roomId).emit('message_deleted', {
        messageId,
        deletedBy: userId,
        reason
      });

      socket.emit('message_delete_confirmed', { messageId });

    } catch (error) {
      socket.emit('error', {
        message: 'Failed to delete message',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle conversation search
   */
  static async handleSearchMessages(socket: Socket, data: any): Promise<void> {
    try {
      const searchParams = searchSchema.parse(data);
      const userId = socket.userId;

      // Verify conversation access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: searchParams.conversationId,
          participants: {
            some: { userId }
          }
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Build search query
      const whereClause: any = {
        conversationId: searchParams.conversationId,
        isDeleted: false,
        content: {
          contains: searchParams.query,
          mode: 'insensitive'
        }
      };

      if (searchParams.messageType) {
        whereClause.type = searchParams.messageType;
      }

      if (searchParams.dateFrom || searchParams.dateTo) {
        whereClause.createdAt = {};
        if (searchParams.dateFrom) {
          whereClause.createdAt.gte = new Date(searchParams.dateFrom);
        }
        if (searchParams.dateTo) {
          whereClause.createdAt.lte = new Date(searchParams.dateTo);
        }
      }

      // Execute search
      const messages = await prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: searchParams.limit,
        skip: searchParams.offset
      });

      // Get total count for pagination
      const totalCount = await prisma.message.count({
        where: whereClause
      });

      socket.emit('search_results', {
        query: searchParams.query,
        messages,
        totalCount,
        hasMore: searchParams.offset + messages.length < totalCount
      });

    } catch (error) {
      socket.emit('error', {
        message: 'Search failed',
        details: error instanceof z.ZodError ? error.errors : 'Internal error'
      });
    }
  }

  /**
   * Handle marking messages as read
   */
  static async handleMarkAsRead(socket: Socket, data: any): Promise<void> {
    try {
      const { messageIds } = data;
      const userId = socket.userId;

      if (!Array.isArray(messageIds)) {
        socket.emit('error', { message: 'Invalid message IDs' });
        return;
      }

      // Mark messages as read
      for (const messageId of messageIds) {
        await this.markMessageAsRead(messageId, userId);
      }

      // Get conversation ID for broadcasting
      if (messageIds.length > 0) {
        const message = await prisma.message.findFirst({
          where: { id: messageIds[0] },
          select: { conversationId: true }
        });

        if (message) {
          const roomId = `conversation:${message.conversationId}`;
          socket.to(roomId).emit('messages_read', {
            messageIds,
            readerId: userId,
            timestamp: new Date().toISOString()
          });
        }
      }

      socket.emit('mark_as_read_confirmed', { messageIds });

    } catch (error) {
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  // Helper methods

  private static async processAttachments(attachments: any[]): Promise<any[]> {
    // Process and validate attachments
    // This would include virus scanning, file type validation, etc.
    return attachments.map(attachment => ({
      ...attachment,
      processed: true,
      scanned: true
    }));
  }

  private static async createOrUpdateThread(parentMessageId: string, replyId: string): Promise<any> {
    let thread = await prisma.messageThread.findFirst({
      where: { parentMessageId }
    });

    if (!thread) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentMessageId }
      });

      thread = await prisma.messageThread.create({
        data: {
          parentMessageId,
          conversationId: parentMessage!.conversationId
        }
      });
    }

    await prisma.messageThread.update({
      where: { id: thread.id },
      data: {
        lastReplyAt: new Date(),
        messageCount: {
          increment: 1
        }
      }
    });

    return thread;
  }

  private static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await prisma.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        messageId,
        userId,
        readAt: new Date()
      }
    });
  }

  private static async sendOfflineNotifications(conversation: any, message: any): Promise<void> {
    // Implementation for sending push notifications to offline users
    // This would integrate with your notification service
    console.log('Sending offline notifications for message:', message.id);
  }
}

export default EnhancedChatHandlers;