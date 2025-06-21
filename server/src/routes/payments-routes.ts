/**
 * Payment Routes
 * 
 * These routes handle all payment-related operations including:
 * - Processing payments for tasks
 * - Managing payment methods
 * - Viewing transaction history
 * - Processing refunds and disputes
 */

import { paymentController } from '../controllers/payment-controller';
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '../middleware/auth-middleware';

const router = Router();

/**
 * Create Payment for Task
 * POST /api/v1/payments
 */
router.post('/',
  authenticateToken,
  [
    body('taskId')
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    
    body('paymentMethod')
      .isIn(['CREDIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET'])
      .withMessage('Invalid payment method'),
    
    body('paymentDetails')
      .optional()
      .isObject()
      .withMessage('Payment details must be an object')
  ],
  paymentController.createPayment
);

/**
 * Get Payment by ID
 * GET /api/v1/payments/:id
 */
router.get('/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid payment ID format')
  ],
  paymentController.getPaymentById
);

/**
 * Get User's Payment History
 * GET /api/v1/payments/history
 */
router.get('/history',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).withMessage('Invalid status')
  ],
  paymentController.getPaymentHistory
);

/**
 * Get Task Payment Information
 * GET /api/v1/payments/task/:taskId
 */
router.get('/task/:taskId',
  authenticateToken,
  [
    param('taskId').isUUID().withMessage('Invalid task ID format')
  ],
  paymentController.getTaskPayments
);

/**
 * Add Payment Method
 * POST /api/v1/payments/methods
 */
router.post('/methods',
  authenticateToken,
  [
    body('type').isIn(['CREDIT_CARD', 'BANK_ACCOUNT', 'DIGITAL_WALLET']).withMessage('Invalid payment method type'),
    body('details').isObject().withMessage('Payment details are required')
  ],
  paymentController.addPaymentMethod
);

/**
 * Get User's Payment Methods
 * GET /api/v1/payments/methods
 */
router.get('/methods',
  authenticateToken,
  paymentController.getPaymentMethods
);

/**
 * Delete Payment Method
 * DELETE /api/v1/payments/methods/:id
 */
router.delete('/methods/:id',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid payment method ID')
  ],
  paymentController.deletePaymentMethod
);

/**
 * Request Refund
 * POST /api/v1/payments/:id/refund
 */
router.post('/:id/refund',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid payment ID format'),
    body('reason').isString().trim().isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be greater than 0')
  ],
  paymentController.requestRefund
);

/**
 * Get Payment Receipt
 * GET /api/v1/payments/:id/receipt
 */
router.get('/:id/receipt',
  authenticateToken,
  [
    param('id').isUUID().withMessage('Invalid payment ID format')
  ],
  paymentController.getPaymentReceipt
);

export default router;
