/**
 * Payment Controller
 * 
 * Handles HTTP requests related to payments, delegating business logic
 * to the payment service and formatting responses.
 */

import { Request, Response } from 'express';
import { BaseController } from './base-controller';
import { paymentService } from '../services/payment-service';
import { logger } from '../utils/logger';

class PaymentController extends BaseController {
  /**
   * Create a new payment for a task
   */
  createPayment = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const paymentData = req.body;

    logger.info('Processing payment', { userId, taskId: paymentData.taskId });
    const payment = await paymentService.createPayment(userId, paymentData);
    
    return this.sendSuccess(res, payment, 'Payment processed successfully', 201);
  });

  /**
   * Get a payment by ID
   */
  getPaymentById = this.asyncHandler(async (req: Request, res: Response) => {
    const paymentId = req.params.id;
    const userId = req.user!.id;

    logger.info('Retrieving payment', { paymentId, userId });
    const payment = await paymentService.getPaymentById(paymentId, userId);
    
    return this.sendSuccess(res, payment, 'Payment details retrieved successfully');
  });

  /**
   * Get user's payment history
   */
  getPaymentHistory = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const type = req.query.type as 'sent' | 'received' | undefined;

    logger.info('Retrieving payment history', { userId, page, limit, status, type });
    const { payments, pagination } = await paymentService.getUserPayments(
      userId,
      type,
      status,
      page,
      limit
    );
    
    return this.sendSuccess(res, { payments, pagination }, 'Payment history retrieved successfully');
  });

  /**
   * Get payment summary for the current user
   */
  getPaymentSummary = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    logger.info('Retrieving payment summary', { userId });
    const summary = await paymentService.getPaymentSummary(userId);
    
    return this.sendSuccess(res, summary, 'Payment summary retrieved successfully');
  });

  /**
   * Request a refund for a payment
   */
  requestRefund = this.asyncHandler(async (req: Request, res: Response) => {
    const paymentId = req.params.id;
    const userId = req.user!.id;
    const { reason, amount } = req.body;

    logger.info('Processing refund', { paymentId, userId, amount, reason });
    await paymentService.processRefund(paymentId, amount, reason, userId);
    
    return this.sendSuccess(res, null, 'Refund processed successfully');
  });

  /**
   * Get platform payment statistics
   */
  getPaymentStatistics = this.asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    logger.info('Retrieving payment statistics', { start, end });
    const stats = await paymentService.getPaymentStatistics(start, end);
    
    return this.sendSuccess(res, stats, 'Payment statistics retrieved successfully');
  });
}

// Export controller instance
export const paymentController = new PaymentController();
