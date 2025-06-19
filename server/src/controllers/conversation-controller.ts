/**
 * Conversation Controller
 * 
 * Handles REST API requests for conversation and messaging functionality.
 * This controller was missing and causing the frontend messaging system to fail.
 */

import { Request, Response } from 'express';
import { BaseController } from './base-controller';
import { MessagingService } from '../services/messaging-service';
import { ErrorType } from '../utils/error-utils';
import { logger } from '../utils/logger';

export class ConversationController extends BaseController {
  private messagingService: MessagingService;

  constructor() {
    super();
    this.messagingService = new MessagingService();
  }

  /**
   * Get all conversations for the authenticated user
   */
  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      const conversations = await this.messagingService.getUserConversations(userId);
      
      this.sendSuccess(res, conversations, 'Conversations retrieved successfully');
    } catch (error) {
      logger.error('Error getting conversations:', error);
      this.sendError(res, 'Failed to retrieve conversations', 500, ErrorType.SERVER);
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      const { participantIds, title, type } = req.body;
      
      // Add the current user to participants if not already included
      const allParticipants = participantIds.includes(userId) 
        ? participantIds 
        : [userId, ...participantIds];

      const conversation = await this.messagingService.createConversation({
        participantIds: allParticipants,
        title,
        type,
        createdBy: userId
      });

      this.sendSuccess(res, conversation, 'Conversation created successfully', 201);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      this.sendError(res, 'Failed to create conversation', 500, ErrorType.SERVER);
    }
  }

  /**
   * Get a specific conversation by ID
   */
  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      const conversation = await this.messagingService.getConversation(conversationId, userId);
      
      if (!conversation) {
        return this.sendError(res, 'Conversation not found', 404, ErrorType.NOT_FOUND);
      }

      this.sendSuccess(res, conversation, 'Conversation retrieved successfully');
    } catch (error) {
      logger.error('Error getting conversation:', error);
      this.sendError(res, 'Failed to retrieve conversation', 500, ErrorType.SERVER);
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;
      const { page = 1, limit = 50, before } = req.query;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      // Verify user is participant in conversation
      const conversation = await this.messagingService.getConversation(conversationId, userId);
      if (!conversation) {
        return this.sendError(res, 'Conversation not found or access denied', 404, ErrorType.NOT_FOUND);
      }

      const messages = await this.messagingService.getMessages(
        conversationId, 
        Number(page), 
        Number(limit),
        before as string
      );

      this.sendSuccess(res, messages, 'Messages retrieved successfully');
    } catch (error) {
      logger.error('Error getting messages:', error);
      this.sendError(res, 'Failed to retrieve messages', 500, ErrorType.SERVER);
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;
      const { content, type = 'text', attachments } = req.body;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      // Verify user is participant in conversation
      const conversation = await this.messagingService.getConversation(conversationId, userId);
      if (!conversation) {
        return this.sendError(res, 'Conversation not found or access denied', 404, ErrorType.NOT_FOUND);
      }

      const message = await this.messagingService.sendMessage({
        conversationId,
        senderId: userId,
        content,
        type,
        attachments
      });

      this.sendSuccess(res, message, 'Message sent successfully', 201);
    } catch (error) {
      logger.error('Error sending message:', error);
      this.sendError(res, 'Failed to send message', 500, ErrorType.SERVER);
    }
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      await this.messagingService.markAllMessagesAsRead(conversationId, userId);

      this.sendSuccess(res, null, 'Messages marked as read');
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      this.sendError(res, 'Failed to mark messages as read', 500, ErrorType.SERVER);
    }
  }

  /**
   * Delete a conversation (soft delete)
   */
  async deleteConversation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      await this.messagingService.deleteConversation(conversationId, userId);

      this.sendSuccess(res, null, 'Conversation deleted successfully');
    } catch (error) {
      logger.error('Error deleting conversation:', error);
      this.sendError(res, 'Failed to delete conversation', 500, ErrorType.SERVER);
    }
  }

  /**
   * Add participants to a group conversation
   */
  async addParticipants(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;
      const { participantIds } = req.body;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      const result = await this.messagingService.addParticipants(conversationId, participantIds, userId);

      this.sendSuccess(res, result, 'Participants added successfully');
    } catch (error) {
      logger.error('Error adding participants:', error);
      this.sendError(res, 'Failed to add participants', 500, ErrorType.SERVER);
    }
  }

  /**
   * Remove a participant from a conversation
   */
  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const conversationId = req.params.id;
      const participantId = req.params.userId;

      if (!userId) {
        return this.sendError(res, 'User not authenticated', 401, ErrorType.AUTHENTICATION);
      }

      await this.messagingService.removeParticipant(conversationId, participantId, userId);

      this.sendSuccess(res, null, 'Participant removed successfully');
    } catch (error) {
      logger.error('Error removing participant:', error);
      this.sendError(res, 'Failed to remove participant', 500, ErrorType.SERVER);
    }
  }
}