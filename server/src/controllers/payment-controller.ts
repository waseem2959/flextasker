/**
 * Payment Controller
 * 
 * Handles HTTP requests related to payments, delegating business logic
 * to the payment service and formatting responses.
 */

import { Request, Response } from 'express';
import { paymentService } from '../services/payment-service';
import { logger } from '../utils/logger';
import { BaseController } from './base-controller';

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

  /**
   * Get task payment information
   */
  getTaskPayments = this.asyncHandler(async (req: Request, res: Response) => {
    const taskId = req.params.taskId;
    const userId = req.user!.id;

    logger.info('Retrieving task payments', { taskId, userId });
    const result = await paymentService.getTaskPayments(taskId, userId);
    
    return this.sendSuccess(res, result, 'Task payments retrieved successfully');
  });

  /**
   * Add payment method
   */
  addPaymentMethod = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const paymentMethodData = req.body;

    logger.info('Adding payment method', { userId, type: paymentMethodData.type });
    const paymentMethod = await paymentService.addPaymentMethod(userId, paymentMethodData);
    
    return this.sendSuccess(res, paymentMethod, 'Payment method added successfully', 201);
  });

  /**
   * Get user's payment methods
   */
  getPaymentMethods = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    logger.info('Retrieving payment methods', { userId });
    const paymentMethods = await paymentService.getPaymentMethods(userId);
    
    return this.sendSuccess(res, paymentMethods, 'Payment methods retrieved successfully');
  });

  /**
   * Delete payment method
   */
  deletePaymentMethod = this.asyncHandler(async (req: Request, res: Response) => {
    const paymentMethodId = req.params.id;
    const userId = req.user!.id;

    logger.info('Deleting payment method', { paymentMethodId, userId });
    await paymentService.deletePaymentMethod(paymentMethodId, userId);
    
    return this.sendSuccess(res, null, 'Payment method deleted successfully');
  });

  /**
   * Get payment receipt
   */
  getPaymentReceipt = this.asyncHandler(async (req: Request, res: Response) => {
    const paymentId = req.params.id;
    const userId = req.user!.id;

    logger.info('Retrieving payment receipt', { paymentId, userId });
    const receipt = await paymentService.getPaymentReceipt(paymentId, userId);
    
    return this.sendSuccess(res, receipt, 'Payment receipt retrieved successfully');
  });
}

// Export controller instance
export const paymentController = new PaymentController();
