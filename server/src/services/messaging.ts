import { db } from '@/utils/database';
import {
  AuthorizationError,
  NotFoundError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';

/**
 * Messaging service - this is like the internal communication system of our platform.
 * It handles creating conversations, sending messages, tracking read status,
 * and managing chat history between users.
 * 
 * EDUCATIONAL NOTE: This service demonstrates advanced TypeScript patterns for
 * handling complex data transformations while maintaining strict type safety.
 * Notice how we define explicit interfaces for all data structures and use
 * proper typing for all function parameters and return values.
 */

/**
 * Core interfaces that define the structure of our messaging data.
 * 
 * EDUCATIONAL NOTE: By defining these interfaces explicitly, we create a contract
 * that ensures all parts of our system agree on the shape of messaging data.
 * This prevents runtime errors and makes the code self-documenting.
 */
export interface CreateConversationData {
  participantIds: string[];
  taskId?: string;
  title?: string;
  initialMessage?: string;
}

export interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

/**
 * Database entity interfaces - these match what Prisma returns from the database.
 * 
 * EDUCATIONAL NOTE: These interfaces bridge the gap between database schema
 * and application logic. Notice how we're explicit about nullable fields
 * (using | null) to match exactly what Prisma returns.
 */
interface DatabaseUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isActive: boolean;
}

interface DatabaseConversationParticipant {
  userId: string;
  isActive: boolean;
  lastReadAt: Date | null;
  user: DatabaseUser;
}


interface DatabaseMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string | null;
  content: string;
  messageType: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  status: string;
  createdAt: Date;
  sender: DatabaseUser;
}

/**
 * Application interfaces - these represent cleaned data for use in business logic.
 * 
 * EDUCATIONAL NOTE: Notice how these differ from database interfaces:
 * - Optional fields use ? instead of | null
 * - We include computed fields like isOwnMessage
 * - We transform nested objects to include only needed fields
 */
export interface ConversationSummary {
  id: string;
  title?: string;
  taskId?: string;
  isGroup: boolean;
  participants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
  lastMessage?: {
    content: string;
    sentBy: string;
    sentAt: Date;
    messageType: string;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface MessageWithSender {
  id: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  status: string;
  createdAt: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  isOwnMessage: boolean;
}

/**
 * Type-safe search result interface
 */
export interface MessageSearchResult {
  messages: MessageWithSender[];
  pagination: PaginationInfo;
}

export class MessagingService {

  /**
   * Utility method to safely convert database user to application user format.
   * 
   * EDUCATIONAL NOTE: This is a critical pattern for type safety. Instead of
   * spreading database objects directly into application interfaces, we
   * explicitly transform each field. This ensures type compatibility and
   * makes our data transformations explicit and auditable.
   */
  private transformDatabaseUser(dbUser: DatabaseUser): {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  } {
    return {
      id: dbUser.id,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      avatar: dbUser.avatar ?? undefined, // Convert null to undefined
    };
  }

  /**
   * Transform database message to application message format.
   * 
   * EDUCATIONAL NOTE: This method demonstrates how to handle complex transformations
   * while maintaining type safety. We explicitly handle each field and add
   * computed properties like isOwnMessage.
   */
  private transformDatabaseMessage(
    dbMessage: DatabaseMessage, 
    currentUserId: string
  ): MessageWithSender {
    return {
      id: dbMessage.id,
      content: dbMessage.content,
      messageType: dbMessage.messageType,
      fileUrl: dbMessage.fileUrl ?? undefined,
      fileName: dbMessage.fileName ?? undefined,
      fileType: dbMessage.fileType ?? undefined,
      status: dbMessage.status,
      createdAt: dbMessage.createdAt,
      sender: this.transformDatabaseUser(dbMessage.sender),
      isOwnMessage: dbMessage.senderId === currentUserId,
    };
  }

  /**
   * Create a new conversation - like starting a new chat thread
   * 
   * This creates a conversation between multiple participants, optionally
   * related to a specific task for business context.
   */
  async createConversation(creatorId: string, data: CreateConversationData): Promise<string> {
    try {
      // Validate participants
      if (data.participantIds.length < 1) {
        throw new ValidationError('At least one participant is required');
      }

      // Ensure creator is included in participants
      if (!data.participantIds.includes(creatorId)) {
        data.participantIds.push(creatorId);
      }

      // Validate that all participants exist and are active
      const participantCount = await db.user.count({
        where: {
          id: { in: data.participantIds },
          isActive: true,
        },
      });

      if (participantCount !== data.participantIds.length) {
        throw new ValidationError('One or more participants not found or inactive');
      }

      // For task-related conversations, validate task access
      if (data.taskId) {
        const task = await db.task.findUnique({
          where: { id: data.taskId },
          select: {
            id: true,
            ownerId: true,
            assigneeId: true,
          },
        });

        if (!task) {
          throw new NotFoundError('Task not found');
        }

        // Ensure all participants have access to the task
        const taskParticipants = [task.ownerId, task.assigneeId].filter(
          (id): id is string => id !== null
        );
        const hasAccess = data.participantIds.every(
          participantId => taskParticipants.includes(participantId)
        );

        if (!hasAccess) {
          throw new AuthorizationError('All participants must have access to the task');
        }
      }

      // Check if a conversation already exists with these exact participants
      const existingConversation = await db.conversation.findFirst({
        where: {
          participants: {
            every: {
              userId: { in: data.participantIds },
            },
          },
          ...(data.taskId && { taskId: data.taskId }),
        },
        include: {
          participants: true,
        },
      });

      if (existingConversation && existingConversation.participants.length === data.participantIds.length) {
        return existingConversation.id;
      }

      // Create new conversation
      const conversation = await db.conversation.create({
        data: {
          taskId: data.taskId,
          title: data.title,
          isGroup: data.participantIds.length > 2,
          participants: {
            create: data.participantIds.map(userId => ({
              userId,
              isActive: true,
            })),
          },
        },
      });

      // Send initial message if provided
      if (data.initialMessage) {
        await this.sendMessage(creatorId, {
          conversationId: conversation.id,
          content: data.initialMessage,
          messageType: 'TEXT',
        });
      }

      logger.info('Conversation created:', {
        conversationId: conversation.id,
        creatorId,
        participantCount: data.participantIds.length,
        taskId: data.taskId,
      });

      return conversation.id;

    } catch (error) {
      logger.error('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation - like sending a chat message
   * 
   * This sends a message to all participants in a conversation and
   * updates read status tracking.
   */
  async sendMessage(senderId: string, data: SendMessageData): Promise<MessageWithSender> {
    try {
      // Validate conversation exists and user is a participant
      const conversation = await db.conversation.findUnique({
        where: { id: data.conversationId },
        include: {
          participants: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        throw new NotFoundError('Conversation not found');
      }

      // Check if sender is a participant - using proper typing for find result
      const senderParticipant = conversation.participants.find(
        (participant: DatabaseConversationParticipant) => participant.userId === senderId
      );
      
      if (!senderParticipant) {
        throw new AuthorizationError('You are not a participant in this conversation');
      }

      // Validate message content
      if (!data.content.trim() && !data.fileUrl) {
        throw new ValidationError('Message content or file is required');
      }

      // Determine receiver (for direct messages)
      let receiverId: string | null = null;
      if (!conversation.isGroup) {
        const otherParticipant = conversation.participants.find(
          (participant: DatabaseConversationParticipant) => participant.userId !== senderId
        );
        receiverId = otherParticipant?.userId ?? null;
      }

      // Create message
      const message = await db.message.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          receiverId,
          content: data.content,
          messageType: data.messageType ?? 'TEXT',
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          status: 'SENT',
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
            },
          },
        },
      });

      // Update conversation last activity
      await db.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      // Update read status for all participants except sender
      await db.conversationParticipant.updateMany({
        where: {
          conversationId: data.conversationId,
          userId: { not: senderId },
        },
        data: {
          // Don't update lastReadAt - they haven't read the new message yet
        },
      });

      const transformedMessage = this.transformDatabaseMessage(message, senderId);

      logger.info('Message sent:', {
        messageId: message.id,
        conversationId: data.conversationId,
        senderId,
        messageType: data.messageType,
      });

      return transformedMessage;

    } catch (error) {
      logger.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations - like viewing chat list
   * 
   * This retrieves all conversations for a user with summary information
   * and unread message counts.
   * 
   * EDUCATIONAL NOTE: This method demonstrates complex data transformation
   * with proper TypeScript typing. Notice how we handle the async operations
   * and transform database results to application interfaces.
   */
  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ conversations: ConversationSummary[]; pagination: PaginationInfo }> {
    try {
      const skip = (page - 1) * limit;

      // Get total count
      const totalConversations = await db.conversation.count({
        where: {
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      });

      // Get conversations with details
      const conversations = await db.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
        include: {
          participants: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isActive: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  isActive: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      });

      // Process conversations to get summary format
      const conversationSummaries: ConversationSummary[] = [];

      for (const conversation of conversations) {
        // Get participant's last read time
        const userParticipant = conversation.participants.find(
          (participant: DatabaseConversationParticipant) => participant.userId === userId
        );
        const lastReadAt = userParticipant?.lastReadAt ?? new Date(0);

        // Count unread messages
        const unreadCount = await db.message.count({
          where: {
            conversationId: conversation.id,
            createdAt: { gt: lastReadAt },
            senderId: { not: userId },
          },
        });

        // Get last message
        const lastMessage = conversation.messages[0];

        conversationSummaries.push({
          id: conversation.id,
          title: conversation.title ?? undefined,
          taskId: conversation.taskId ?? undefined,
          isGroup: conversation.isGroup,
          participants: conversation.participants.map(
            (participant: DatabaseConversationParticipant) => ({
              id: participant.user.id,
              firstName: participant.user.firstName,
              lastName: participant.user.lastName,
              avatar: participant.user.avatar ?? undefined,
              // Real-time online status would be implemented via WebSocket
              isOnline: false,
            })
          ),
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sentBy: lastMessage.senderId,
            sentAt: lastMessage.createdAt,
            messageType: lastMessage.messageType,
          } : undefined,
          unreadCount,
          updatedAt: conversation.updatedAt,
        });
      }

      const pagination = createPagination(page, limit, totalConversations);

      logger.info('User conversations retrieved:', {
        userId,
        page,
        limit,
        totalFound: conversationSummaries.length,
      });

      return {
        conversations: conversationSummaries,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get user conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages in a conversation - like viewing chat history
   * 
   * This retrieves all messages in a conversation with pagination,
   * typically ordered from newest to oldest.
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: MessageWithSender[]; pagination: PaginationInfo }> {
    try {
      // Verify user is a participant
      const participant = await db.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
      });

      if (!participant?.isActive) {
        throw new AuthorizationError('You are not a participant in this conversation');
      }

      const skip = (page - 1) * limit;

      // Get total message count
      const totalMessages = await db.message.count({
        where: { conversationId },
      });

      // Get messages with sender information
      const messages = await db.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Process messages to include ownership information
      const messagesWithSender: MessageWithSender[] = messages.map(
        (message: DatabaseMessage) => this.transformDatabaseMessage(message, userId)
      );

      const pagination = createPagination(page, limit, totalMessages);

      logger.info('Conversation messages retrieved:', {
        conversationId,
        userId,
        page,
        limit,
        totalFound: messagesWithSender.length,
      });

      return {
        messages: messagesWithSender,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get conversation messages:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read - like opening and reading chat messages
   * 
   * This updates the read status when a user views messages in a conversation.
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      // Update participant's last read time
      await db.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Update message status to READ for messages in this conversation
      await db.message.updateMany({
        where: {
          conversationId,
          receiverId: userId,
          status: 'SENT',
        },
        data: {
          status: 'READ',
        },
      });

      logger.info('Messages marked as read:', {
        conversationId,
        userId,
      });

    } catch (error) {
      logger.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  /**
   * Leave a conversation - like leaving a group chat
   * 
   * This removes a user from a conversation (marks them as inactive).
   */
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Mark participant as inactive
      await db.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId,
        },
        data: {
          isActive: false,
        },
      });

      // Send system message about user leaving
      await this.sendMessage(userId, {
        conversationId,
        content: 'User left the conversation',
        messageType: 'SYSTEM',
      });

      logger.info('User left conversation:', {
        conversationId,
        userId,
      });

    } catch (error) {
      logger.error('Failed to leave conversation:', error);
      throw error;
    }
  }

  /**
   * Search messages - like searching through chat history
   * 
   * This allows users to search for specific messages within their conversations.
   * 
   * EDUCATIONAL NOTE: This method demonstrates proper typing for complex search operations
   * with multiple optional parameters and paginated results.
   */
  async searchMessages(
    userId: string,
    query: string,
    conversationId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<MessageSearchResult> {
    try {
      const skip = (page - 1) * limit;

      // Build where clause with proper typing
      interface MessageWhereClause {
        content: {
          contains: string;
          mode: 'insensitive';
        };
        conversation: {
          participants: {
            some: {
              userId: string;
              isActive: boolean;
            };
          };
        };
        conversationId?: string;
      }

      const whereClause: MessageWhereClause = {
        content: {
          contains: query,
          mode: 'insensitive',
        },
        conversation: {
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      // Get total count
      const totalMessages = await db.message.count({
        where: whereClause,
      });

      // Get messages
      const messages = await db.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              isActive: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const messagesWithSender: MessageWithSender[] = messages.map(
        (message: DatabaseMessage) => this.transformDatabaseMessage(message, userId)
      );

      const pagination = createPagination(page, limit, totalMessages);

      logger.info('Message search completed:', {
        userId,
        query,
        conversationId,
        totalFound: messagesWithSender.length,
      });

      return {
        messages: messagesWithSender,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to search messages:', error);
      throw error;
    }
  }
}