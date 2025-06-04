/**
 * Messaging Service
 * 
 * This service handles all messaging-related operations including:
 * - Creating and managing conversations
 * - Sending and receiving messages
 * - Searching message history
 * - Managing read/unread status
 */

import { prisma } from '../utils/database-utils';
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
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: data.participantIds
          }
        },
        select: {
          id: true
        }
      });

      if (users.length !== data.participantIds.length) {
        throw new ValidationError('One or more participants do not exist');
      }

      // Check if a direct conversation already exists between these two users
      if (data.participantIds.length === 2 && !data.taskId) {
        const existingConversation = await prisma.conversation.findFirst({
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
        });

        if (existingConversation) {
          logger.info('Found existing conversation', { conversationId: existingConversation.id });
          
          // If there's an initial message, add it to the existing conversation
          if (data.initialMessage) {
            await prisma.message.create({
              data: {
                conversationId: existingConversation.id,
                senderId: creatorId,
                content: data.initialMessage,
                messageType: 'TEXT'
              }
            });
          }
          
          return existingConversation.id;
        }
      }

      // Create new conversation
      const conversation = await prisma.$transaction(async (prismaClient) => {
        // Create conversation
        const newConversation = await prismaClient.conversation.create({
          data: {
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
          include: {
            participants: true
          }
        });
        return newConversation;
      });

      // Add initial message if provided
      if (data.initialMessage) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: creatorId,
            content: data.initialMessage,
            messageType: 'TEXT'
          }
        });
      }

      logger.info('Conversation created successfully', { conversationId: conversation.id });
      return conversation.id;
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
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: data.conversationId,
          participants: {
            some: {
              userId: senderId
            }
          }
        },
        include: {
          participants: {
            select: {
              userId: true
            }
          }
        }
      });

      if (!conversation) {
        throw new NotFoundError('Conversation not found or user is not a participant');
      }

      // Validate message content
      if (!data.content && !data.fileUrl) {
        throw new ValidationError('Message must have content or file attachment');
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId,
          content: data.content,
          messageType: data.messageType ?? 'TEXT',
          fileUrl: data.fileUrl ?? null,
          fileName: data.fileName ?? null,
          fileType: data.fileType ?? null
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });

      // Update conversation's updatedAt timestamp
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() }
      });

      // Format the message for response
      const formattedMessage: MessageWithSender = {
        id: message.id,
        conversationId: message.conversationId ?? '',
        content: message.content ?? '',
        messageType: message.messageType ?? 'TEXT',
        fileUrl: message.fileUrl ?? undefined,
        fileName: message.fileName ?? undefined,
        fileType: message.fileType ?? undefined,
        sentAt: message.createdAt,
        readAt: message.readAt ?? undefined,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
          avatar: message.sender.avatar ?? undefined
        }
      };

      logger.info('Message sent successfully', { messageId: message.id });
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
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await prisma.conversation.count({
        where: {
          participants: {
            some: {
              userId
            }
          }
        }
      });

      // Get conversations
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId
            }
          }
        },
        include: {
          participants: {
            include: {
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
            include: {
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
        skip,
        take: limit
      });

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
