/**
 * Messaging Service
 *
 * This service handles all messaging-related operations including:
 * - Creating and managing conversations
 * - Sending and receiving messages
 * - Searching message history
 * - Managing read/unread status
 */

import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { PaginationInfo } from '../utils/response-utils';

/**
 * Core interfaces that define the structure of our messaging data.
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

// Message interfaces
export interface MessageWithSender {
  id: string;
  conversationId: string;
  content: string;
  messageType: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  sentAt: Date;
  readAt?: Date;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

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

export interface MessageSearchResult {
  messages: MessageWithSender[];
  pagination: PaginationInfo;
}

/**
 * Messaging Service Class
 *
 * Handles all messaging-related functionality including conversation management,
 * message sending/receiving, and message search.
 */
export class MessagingService {
  /**
   * Utility method to transform database user to application user format
   */


  /**
   * Create a new conversation
   */
  async createConversation(creatorId: string, data: CreateConversationData): Promise<string> {
    logger.info('Creating conversation', { creatorId, participantCount: data.participantIds.length });

    try {
      // Validate participants
      if (!data.participantIds.includes(creatorId)) {
        data.participantIds.push(creatorId); // Ensure creator is a participant
      }

      if (data.participantIds.length < 2) {
        throw new ValidationError('Conversation must have at least 2 participants');
      }

      // Check if all participants exist
      const { items: users } = await DatabaseQueryBuilder.findMany(
        models.user,
        {
          where: {
            id: {
              in: data.participantIds
            }
          },
          select: {
            id: true
          }
        },
        'User'
      );

      if ((users as any).length !== data.participantIds.length) {
        throw new ValidationError('One or more participants do not exist');
      }

      // Check if a direct conversation already exists between these two users
      if (data.participantIds.length === 2 && !data.taskId) {
        const existingConversation = await DatabaseQueryBuilder.findFirst(
          models.conversation,
          {
            where: {
              participants: {
                every: {
                  userId: {
                    in: data.participantIds
                  }
                }
              },
              AND: [
                {
                  participants: {
                    some: {
                      userId: data.participantIds[0]
                    }
                  }
                },
                {
                  participants: {
                    some: {
                      userId: data.participantIds[1]
                    }
                  }
                }
              ],
              isGroup: false,
              taskId: null
            }
          },
          'Conversation'
        );

        if (existingConversation) {
          logger.info('Found existing conversation', { conversationId: (existingConversation as any).id });

          // If there's an initial message, add it to the existing conversation
          if (data.initialMessage) {
            await DatabaseQueryBuilder.create(
              models.message,
              {
                conversationId: (existingConversation as any).id,
                senderId: creatorId,
                content: data.initialMessage,
                messageType: 'TEXT'
              },
              'Message',
              {
                id: true,
                conversationId: true,
                senderId: true,
                content: true,
                type: true,
                createdAt: true
              }
            );
          }

          return (existingConversation as any).id;
        }
      }

      // Create new conversation
      // Create conversation
      const newConversation = await DatabaseQueryBuilder.create(
        models.conversation,
        {
          title: data.title ?? undefined,
          taskId: data.taskId ?? undefined,
          isGroup: data.participantIds.length > 2,
          participants: {
            createMany: {
              data: data.participantIds.map(userId => ({
                userId,
                joinedAt: new Date()
              }))
            }
          }
        },
        'Conversation',
        {
          id: true,
          title: true,
          taskId: true,
          isGroup: true,
          createdAt: true,
          participants: true
        }
      );
      // Add initial message if provided
      if (data.initialMessage) {
        await DatabaseQueryBuilder.create(
          models.message,
          {
            conversationId: (newConversation as any).id,
            senderId: (data as any).senderId,
            content: data.initialMessage,
            messageType: 'TEXT'
          },
          'Message',
          {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            messageType: true,
            createdAt: true
          }
        );
      }

      logger.info('Conversation created successfully', { conversationId: (newConversation as any).id });
      return (newConversation as any).id;
    } catch (error) {
      logger.error('Error creating conversation', { error, creatorId });
      throw error;
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(senderId: string, data: SendMessageData): Promise<MessageWithSender> {
    logger.info('Sending message', { senderId, conversationId: data.conversationId });

    try {
      // Validate conversation exists and user is a participant
      const conversation = await DatabaseQueryBuilder.findFirst(
        models.conversation,
        {
          where: {
            id: data.conversationId,
            participants: {
              some: {
                userId: senderId
              }
            }
          },
          select: {
            id: true,
            participants: {
              select: {
                userId: true
              }
            }
          }
        },
        'Conversation'
      );

      if (!conversation) {
        throw new NotFoundError('Conversation not found or user is not a participant');
      }

      // Validate message content
      if (!data.content && !data.fileUrl) {
        throw new ValidationError('Message must have content or file attachment');
      }

      // Create message
      const message = await DatabaseQueryBuilder.create(
        models.message,
        {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          messageType: data.messageType ?? 'TEXT',
          fileUrl: data.fileUrl ?? null,
          fileName: data.fileName ?? null,
          fileType: data.fileType ?? null
        },
        'Message',
        {
          id: true,
          conversationId: true,
          senderId: true,
          content: true,
          messageType: true,
          fileUrl: true,
          fileName: true,
          fileType: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      );

      // Update conversation's updatedAt timestamp
      await DatabaseQueryBuilder.update(
        models.conversation,
        data.conversationId,
        { updatedAt: new Date() },
        'Conversation'
      );

      // Format the message for response
      const formattedMessage: MessageWithSender = {
        id: (message as any).id,
        conversationId: (message as any).conversationId ?? '',
        content: (message as any).content ?? '',
        messageType: (message as any).messageType ?? 'TEXT',
        fileUrl: (message as any).fileUrl ?? undefined,
        fileName: (message as any).fileName ?? undefined,
        fileType: (message as any).fileType ?? undefined,
        sentAt: (message as any).createdAt,
        readAt: (message as any).readAt ?? undefined,
        sender: {
          id: (message as any).sender.id,
          firstName: (message as any).sender.firstName,
          lastName: (message as any).sender.lastName,
          avatar: (message as any).sender.avatar ?? undefined
        }
      };

      logger.info('Message sent successfully', { messageId: (message as any).id });
      return formattedMessage;
    } catch (error) {
      logger.error('Error sending message', { error, senderId, conversationId: data.conversationId });
      throw error;
    }
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ conversations: ConversationSummary[]; pagination: PaginationInfo }> {
    logger.info('Getting user conversations', { userId, page, limit });

    try {
      // Skip calculation handled in pagination

      // Get total count for pagination
      const totalCount = await DatabaseQueryBuilder.count(
        models.conversation,
        {
          participants: {
            some: {
              userId
            }
          }
        } as any,
        'Conversation'
      );

      // Get conversations
      const { items: conversations } = await DatabaseQueryBuilder.findMany(
        models.conversation,
        {
          where: {
            participants: {
              some: {
                userId
              }
            }
          },
          select: {
            id: true,
            title: true,
            taskId: true,
            isGroup: true,
            updatedAt: true,
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    lastActive: true
                  }
                }
              }
            },
            messages: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1,
              select: {
                content: true,
                senderId: true,
                createdAt: true,
                messageType: true,
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            _count: {
              select: {
                messages: {
                  where: {
                    readAt: null,
                    senderId: {
                      not: userId
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          pagination: { page, skip: (page - 1) * limit, limit }
        },
        'Conversation'
      );

      // Format conversations for response
      const formattedConversations: ConversationSummary[] = conversations.map((conv: any) => {
        // Format participants
        const participants = conv.participants.map((participant: any) => {
          const user = participant.user;
          const isOnline = user.lastActive ?
            new Date().getTime() - user.lastActive.getTime() < 5 * 60 * 1000 : // 5 minutes
            false;

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar ?? undefined,
            isOnline
          };
        });

        // Format last message if exists
        const lastMessage = conv.messages[0] ? {
          content: conv.messages[0].content,
          sentBy: conv.messages[0].senderId,
          sentAt: conv.messages[0].createdAt,
          messageType: conv.messages[0].messageType
        } : undefined;

        return {
          id: conv.id,
          title: conv.title ?? undefined,
          taskId: conv.taskId ?? undefined,
          isGroup: conv.isGroup,
          participants,
          lastMessage,
          unreadCount: conv._count.messages,
          updatedAt: conv.updatedAt
        };
      });

      // Return conversations and pagination info
      return {
        conversations: formattedConversations,
        pagination: {
          page: page,
          limit: limit,
          total: totalCount,
          totalItems: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting user conversations', { error, userId });
      throw error;
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
