/**
 * Conversation Routes
 * 
 * REST API endpoints for conversation and messaging functionality.
 * These routes were missing and causing the frontend messaging system to fail.
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth-middleware';
import { validateRequest } from '../middleware/zod-validation-middleware';
import { ConversationController } from '../controllers/conversation-controller';
import { z } from 'zod';

const router = Router();
const conversationController = new ConversationController();

// Validation schemas
const createConversationSchema = {
  body: z.object({
    participantIds: z.array(z.string().uuid()),
    title: z.string().optional(),
    type: z.enum(['direct', 'group']).default('direct')
  })
};

const sendMessageSchema = {
  body: z.object({
    content: z.string().min(1),
    type: z.enum(['text', 'image', 'file']).default('text'),
    attachments: z.array(z.string()).optional()
  })
};

const getMessagesSchema = {
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('50'),
    before: z.string().optional()
  })
};

const addParticipantsSchema = {
  body: z.object({
    participantIds: z.array(z.string().uuid())
  })
};

// Routes

/**
 * GET /api/conversations
 * Get all conversations for the authenticated user
 */
router.get('/', 
  authenticateToken,
  conversationController.getConversations.bind(conversationController)
);

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post('/', 
  authenticateToken,
  validateRequest(createConversationSchema),
  conversationController.createConversation.bind(conversationController)
);

/**
 * GET /api/conversations/:id
 * Get a specific conversation by ID
 */
router.get('/:id', 
  authenticateToken,
  conversationController.getConversation.bind(conversationController)
);

/**
 * GET /api/conversations/:id/messages
 * Get messages for a specific conversation
 */
router.get('/:id/messages',
  authenticateToken,
  validateRequest(getMessagesSchema),
  conversationController.getMessages.bind(conversationController)
);

/**
 * POST /api/conversations/:id/messages
 * Send a message to a conversation
 */
router.post('/:id/messages',
  authenticateToken,
  validateRequest(sendMessageSchema),
  conversationController.sendMessage.bind(conversationController)
);

/**
 * PUT /api/conversations/:id/read
 * Mark all messages in a conversation as read
 */
router.put('/:id/read',
  authenticateToken,
  conversationController.markAsRead.bind(conversationController)
);

/**
 * DELETE /api/conversations/:id
 * Delete a conversation (soft delete)
 */
router.delete('/:id',
  authenticateToken,
  conversationController.deleteConversation.bind(conversationController)
);

/**
 * POST /api/conversations/:id/participants
 * Add participants to a group conversation
 */
router.post('/:id/participants',
  authenticateToken,
  validateRequest(addParticipantsSchema),
  conversationController.addParticipants.bind(conversationController)
);

/**
 * DELETE /api/conversations/:id/participants/:userId
 * Remove a participant from a conversation
 */
router.delete('/:id/participants/:userId',
  authenticateToken,
  conversationController.removeParticipant.bind(conversationController)
);

export default router;