import { authenticateToken, requireRole } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { PaymentService } from '@/services/payment';
import { sendSuccess } from '@/utils/response';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';

/**
 * Payment routes - these are like different windows at a bank where
 * users can make payments, check transaction history, request refunds,
 * and manage their financial activities on the platform.
 */

const router = Router();
const paymentService = new PaymentService();

/**
 * Create Payment for Task
 * POST /api/v1/payments
 * 
 * This is like making a payment at a bank - users can pay for completed
 * tasks using their preferred payment method.
 */
router.post('/',
  authenticateToken,
  validate([
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
      .withMessage('Payment details must be an object'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.createPayment(req.user!.id, req.body);
      
      sendSuccess(res, payment, 'Payment processed successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Payment by ID
 * GET /api/v1/payments/:id
 * 
 * This is like checking a payment receipt - users can view detailed
 * information about a specific payment transaction.
 */
router.get('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Payment ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payment = await paymentService.getPaymentById(req.params.id, req.user!.id);
      
      sendSuccess(res, payment, 'Payment retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get User Payment History
 * GET /api/v1/payments/my/history
 * 
 * This is like viewing your bank statement - users can see all their
 * payment transactions with filtering and pagination options.
 */
router.get('/my/history',
  authenticateToken,
  validate([
    query('type')
      .optional()
      .isIn(['sent', 'received'])
      .withMessage('Type must be sent or received'),
    
    query('status')
      .optional()
      .isIn(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.query.type as 'sent' | 'received' | undefined;
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await paymentService.getUserPayments(
        req.user!.id,
        type,
        status,
        page,
        limit
      );
      
      sendSuccess(res, result, 'Payment history retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Payment Summary
 * GET /api/v1/payments/my/summary
 * 
 * This is like checking your account balance - users can see their
 * overall payment statistics and current balance information.
 */
router.get('/my/summary',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await paymentService.getPaymentSummary(req.user!.id);
      
      sendSuccess(res, summary, 'Payment summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Process Refund
 * POST /api/v1/payments/:id/refund
 * 
 * This is like requesting a refund at a store - users can request
 * refunds for payments in case of disputes or cancellations.
 */
router.post('/:id/refund',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Payment ID is required'),
    
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0'),
    
    body('reason')
      .trim()
      .isLength({ min: 10, max: 500 })
      .withMessage('Refund reason must be between 10 and 500 characters'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await paymentService.processRefund(
        req.params.id,
        req.body.amount,
        req.body.reason,
        req.user!.id
      );
      
      sendSuccess(res, null, 'Refund processed successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Payment Statistics (Admin Only)
 * GET /api/v1/payments/admin/statistics
 * 
 * This is like viewing business analytics - administrators can see
 * platform payment statistics, revenue, and transaction trends.
 */
router.get('/admin/statistics',
  authenticateToken,
  requireRole(['ADMIN']),
  validate([
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const statistics = await paymentService.getPaymentStatistics(startDate, endDate);
      
      sendSuccess(res, statistics, 'Payment statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;