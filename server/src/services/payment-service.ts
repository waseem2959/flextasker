/**
 * Payment Service
 * 
 * This service handles all payment-related operations including:
 * - Processing payments for tasks
 * - Managing payment methods
 * - Handling refunds and disputes
 * - Calculating fees and distributing funds
 */

import { DatabaseQueryBuilder, models } from '../utils/database-query-builder';
import { AppError, ConflictError, NotFoundError, ValidationError } from '../utils/error-utils';
import { logger } from '../utils/logger';
import { createPagination, PaginationInfo } from '../utils/response-utils';

// ====================================
// TYPE DEFINITIONS
// ====================================

export interface CreatePaymentData {
  taskId: string;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET';
  // In real implementation, these would be encrypted/tokenized
  paymentDetails?: {
    cardToken?: string;
    bankAccountId?: string;
    walletId?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  taskId: string;
  payerId: string;
  amount: number;
  platformFee: number;
  processingFee: number;
  status: string;
  paymentMethod: string;
  gatewayTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  task: {
    id: string;
    title: string;
    paymentStatus?: string;
    owner: {
      firstName: string;
      lastName: string;
    };
    assignee: {
      firstName: string;
      lastName: string;
    } | null;
  };
}

export interface PaymentSummary {
  totalEarnings: number;
  totalSpent: number;
  pendingPayments: number;
  completedPayments: number;
  refundedPayments: number;
}

// New type definitions to fix the typing issues
interface TaskWithRelations {
  id: string;
  ownerId: string;
  assigneeId: string | null;
  title: string;
  status: string;
  paymentStatus?: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  payments: Array<{
    id: string;
    status: string;
    amount: number;
    platformFee: number;
    processingFee: number;
    paymentMethod: string;
    gatewayTransactionId?: string;
    createdAt: Date;
    completedAt?: Date | null;
  }>;
}

interface PaymentGatewayResult {
  success: boolean;
  transactionId?: string;
  details: Record<string, unknown>;
}

interface RefundGatewayResult {
  success: boolean;
  refundTransactionId?: string;
}

// Type for payment statistics where clause
interface PaymentStatsWhereClause {
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface PaymentStatusCount {
  status: string;
  _count: { id: number };
}

/**
 * Payment Service Class
 * 
 * Handles all payment-related operations including processing payments,
 * managing refunds, and calculating fees.
 */
export class PaymentService {
  private readonly PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee
  private readonly PAYMENT_PROCESSING_FEE_PERCENTAGE = 0.029; // 2.9% payment processing fee
  private readonly PAYMENT_PROCESSING_FIXED_FEE = 0.30; // $0.30 fixed fee per transaction

  /**
   * Create a payment for a task
   * 
   * This creates a payment record and initiates the payment process
   * with the payment gateway. In a real implementation, this would
   * integrate with Stripe, PayPal, or similar services.
   */
  async createPayment(payerId: string, paymentData: CreatePaymentData): Promise<PaymentTransaction> {
    logger.info('Creating payment', { payerId, taskId: paymentData.taskId });

    try {
      // DatabaseQueryBuilder is now imported at the top

      // Get task information
      const task = await DatabaseQueryBuilder.findById(
        models.task,
        paymentData.taskId,
        'Task',
        {
          id: true,
          title: true,
          ownerId: true,
          assigneeId: true,
          paymentStatus: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payments: {
            select: {
              status: true
            }
          }
        }
      );

      // Check if user is authorized to make payment
      if ((task as any).ownerId !== payerId) {
        throw new ValidationError('Only the task owner can make payments');
      }

      // Check if task has an assignee
      if (!(task as any).assigneeId) {
        throw new ValidationError('Task does not have an assigned tasker');
      }

      // Check if payment already exists and is not refunded
      const hasActivePayment = (task as any).payments.some(
        (payment: { status: string }) => payment.status !== 'REFUNDED'
      );

      if (hasActivePayment) {
        throw new ConflictError('Task already has an active payment');
      }

      // Calculate fees
      const platformFee = paymentData.amount * this.PLATFORM_FEE_PERCENTAGE;
      const paymentProcessingFee = 
        (paymentData.amount * this.PAYMENT_PROCESSING_FEE_PERCENTAGE) + 
        this.PAYMENT_PROCESSING_FIXED_FEE;
      const totalFees = platformFee + paymentProcessingFee;

      // Create payment record in pending state
      const payment = await DatabaseQueryBuilder.create(
        models.payment,
        {
          taskId: paymentData.taskId,
          userId: payerId,
          payerId,
          amount: paymentData.amount,
          platformFee,
          processingFee: paymentProcessingFee,
          paymentMethod: paymentData.paymentMethod ?? 'UNKNOWN',
          status: 'PENDING',
          gatewayResponse: paymentData.paymentDetails ? (paymentData.paymentDetails as any) : undefined
        },
        'Payment',
        {
          id: true,
          taskId: true,
          payerId: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          status: true,
          createdAt: true
        }
      );

      // Process payment with payment gateway
      const gatewayResult = await this.processPaymentWithGateway(
        (payment as any).id,
        paymentData
      );

      if (!gatewayResult.success) {
        // Update payment status to failed
        await DatabaseQueryBuilder.update(
          models.payment,
          (payment as any).id,
          {
            status: 'FAILED',
            gatewayResponse: gatewayResult.details ? (gatewayResult.details as any) : undefined
          },
          'Payment'
        );

        throw new AppError('Payment processing failed', 400, true, 'PAYMENT_FAILED');
      }

      // Update payment with gateway response
      const updatedPayment = await DatabaseQueryBuilder.update(
        models.payment,
        (payment as any).id,
        {
          status: 'COMPLETED',
          gatewayTransactionId: gatewayResult.transactionId ?? undefined,
          gatewayResponse: gatewayResult.details ? (gatewayResult.details as any) : undefined,
          completedAt: new Date()
        },
        'Payment',
        {
          id: true,
          taskId: true,
          payerId: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          status: true,
          paymentMethod: true,
          gatewayTransactionId: true,
          createdAt: true,
          completedAt: true
        }
      );

      // Update task status to paid
      await DatabaseQueryBuilder.update(
        models.task,
        (task as any).id,
        { paymentStatus: 'PAID' },
        'Task'
      );

      // Update user balances
      await this.updateUserBalances(task as any, paymentData.amount, totalFees);

      // Return formatted payment transaction
      return {
        id: (updatedPayment as any).id,
        taskId: (updatedPayment as any).taskId,
        payerId: (updatedPayment as any).payerId,
        amount: (updatedPayment as any).amount,
        platformFee: (updatedPayment as any).platformFee,
        processingFee: (updatedPayment as any).processingFee,
        status: (updatedPayment as any).status,
        paymentMethod: (updatedPayment as any).paymentMethod ?? 'UNKNOWN',
        gatewayTransactionId: (updatedPayment as any).gatewayTransactionId ?? undefined,
        createdAt: (updatedPayment as any).createdAt,
        completedAt: (updatedPayment as any).completedAt ?? undefined,
        task: {
          id: (task as any).id,
          title: (task as any).title,
          paymentStatus: (task as any).paymentStatus ?? undefined,
          owner: {
            firstName: (task as any).owner.firstName,
            lastName: (task as any).owner.lastName
          },
          assignee: (task as any).assignee ? {
            firstName: (task as any).assignee.firstName,
            lastName: (task as any).assignee.lastName
          } : null
        }
      };
    } catch (error) {
      logger.error('Error creating payment', { error, payerId, taskId: paymentData.taskId });
      throw error;
    }
  }

  /**
   * Process payment with payment gateway
   * 
   * This is a mock implementation. In production, this would integrate
   * with actual payment processors like Stripe, PayPal, etc.
   */
  private async processPaymentWithGateway(
    _paymentId: string, // Prefixed with underscore to indicate intentionally unused
    paymentData: CreatePaymentData
  ): Promise<PaymentGatewayResult> {
    logger.info('Processing payment with gateway', { 
      amount: paymentData.amount,
      method: paymentData.paymentMethod
    });

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock implementation - in production, this would call the actual payment gateway
    // For demo purposes, we'll simulate a successful payment most of the time
    const isSuccessful = Math.random() > 0.1; // 90% success rate

    if (isSuccessful) {
      return {
        success: true,
        transactionId: `tx_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        details: {
          processorResponse: 'approved',
          authorizationCode: `auth_${Math.floor(Math.random() * 1000000)}`
        }
      };
    } else {
      return {
        success: false,
        details: {
          processorResponse: 'declined',
          declineReason: 'insufficient_funds',
          errorCode: 'payment_failed'
        }
      };
    }
  }

  /**
   * Update user balances after successful payment
   * 
   * This handles the complex business logic of distributing payments
   * between task assignee, platform fees, and payment processing fees.
   */
  private async updateUserBalances(
    task: { 
      id: string;
      assigneeId: string | null;
      title: string;
      owner: { id: string; firstName: string; lastName: string };
      assignee: { id: string; firstName: string; lastName: string } | null;
      payments: { status: string }[];
    },
    amount: number,
    totalFees: number
  ): Promise<void> {
    logger.info('Updating user balances', { 
      taskId: task.id,
      amount,
      totalFees
    });

    try {
      // Calculate amount to be received by the tasker (assignee)
      const assigneeAmount = amount - totalFees;

      // DatabaseQueryBuilder is now imported at the top

      // Update assignee's balance
      if (task.assigneeId) {
        await DatabaseQueryBuilder.update(
          models.user,
          task.assigneeId,
          {
            balance: {
              increment: assigneeAmount
            },
            pendingBalance: {
              increment: assigneeAmount
            }
          },
          'User',
          { id: true, balance: true, pendingBalance: true }
        );
      }

      // Update platform revenue records
      await DatabaseQueryBuilder.create(
        models.platformRevenue,
        {
          amount: totalFees,
          source: 'TASK_PAYMENT',
          sourceId: task.id,
          description: `Fees for task: ${task.title}`
        },
        'PlatformRevenue',
        { id: true, amount: true, source: true, sourceId: true, description: true, createdAt: true }
      );

      logger.info('User balances updated successfully', {
        taskId: task.id,
        assigneeId: task.assigneeId,
        assigneeAmount
      });
    } catch (error) {
      logger.error('Error updating user balances', { error, taskId: task.id });
      throw error;
    }
  }

  /**
   * Get payment by ID with full details
   */
  async getPaymentById(paymentId: string, userId: string): Promise<PaymentTransaction> {
    logger.info('Getting payment by ID', { paymentId, userId });

    try {
      // DatabaseQueryBuilder is now imported at the top

      const payment = await DatabaseQueryBuilder.findById(
        models.payment,
        paymentId,
        'Payment',
        {
          id: true,
          taskId: true,
          payerId: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          status: true,
          paymentMethod: true,
          gatewayTransactionId: true,
          createdAt: true,
          completedAt: true,
          task: {
            include: {
              owner: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              assignee: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      );

      // Check if user is authorized to view this payment
      if ((payment as any).payerId !== userId && (payment as any).task.assigneeId !== userId) {
        throw new ValidationError('Not authorized to view this payment');
      }

      return {
        id: (payment as any).id,
        taskId: (payment as any).taskId,
        payerId: (payment as any).payerId,
        amount: (payment as any).amount,
        platformFee: (payment as any).platformFee,
        processingFee: (payment as any).processingFee,
        status: (payment as any).status,
        paymentMethod: (payment as any).paymentMethod ?? 'UNKNOWN',
        createdAt: (payment as any).createdAt,
        completedAt: (payment as any).completedAt ?? undefined,
        task: {
          id: (payment as any).task.id,
          title: (payment as any).task.title,
          owner: {
            firstName: (payment as any).task.owner.firstName,
            lastName: (payment as any).task.owner.lastName
          },
          assignee: (payment as any).task.assignee ? {
            firstName: (payment as any).task.assignee.firstName,
            lastName: (payment as any).task.assignee.lastName
          } : null
        }
      };
    } catch (error) {
      logger.error('Error getting payment by ID', { error, paymentId, userId });
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getUserPayments(
    userId: string,
    type?: 'sent' | 'received',
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ payments: PaymentTransaction[]; pagination: PaginationInfo }> {
    logger.info('Getting user payments', { userId, type, status, page, limit });

    try {
      const skip = (page - 1) * limit;

      // Build query filters
      const where: any = {};

      if (type === 'sent') {
        where.payerId = userId;
      } else if (type === 'received') {
        where.task = {
          assigneeId: userId
        };
      } else {
        // Both sent and received
        where.OR = [
          { payerId: userId },
          { task: { assigneeId: userId } }
        ];
      }

      if (status) {
        where.status = status;
      }

      // Get payments with pagination using consolidated method
      const { items: paymentsData, total: totalCount } = await DatabaseQueryBuilder.findMany(
        models.payment,
        {
          where,
          select: {
            id: true,
            taskId: true,
            payerId: true,
            amount: true,
            platformFee: true,
            processingFee: true,
            status: true,
            paymentMethod: true,
            gatewayTransactionId: true,
            createdAt: true,
            completedAt: true,
            task: {
              include: {
                owner: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                assignee: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          pagination: { page, skip, limit }
        },
        'Payment'
      );

      // Format payments for response
      const payments = paymentsData.map((payment: any) => ({
        id: payment.id,
        taskId: payment.taskId,
        payerId: payment.payerId,
        amount: payment.amount,
        platformFee: payment.platformFee,
        processingFee: payment.processingFee,
        status: payment.status,
        paymentMethod: payment.paymentMethod ?? 'UNKNOWN',
        gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt ?? undefined,
        task: {
          id: payment.task.id,
          title: payment.task.title,
          paymentStatus: payment.task.paymentStatus ?? undefined,
          owner: {
            firstName: payment.task.owner.firstName,
            lastName: payment.task.owner.lastName
          },
          assignee: payment.task.assignee ? {
            firstName: payment.task.assignee.firstName,
            lastName: payment.task.assignee.lastName
          } : null
        }
      }));

      // Create pagination info
      const pagination = createPagination(page, limit, totalCount);

      return { payments, pagination };
    } catch (error) {
      logger.error('Error getting user payments', { error, userId });
      throw error;
    }
  }

  /**
   * Get payment summary for a user
   */
  async getPaymentSummary(userId: string): Promise<PaymentSummary> {
    logger.info('Getting payment summary', { userId });

    try {
      // Get total earnings (received payments) - using aggregate method
      const earnings = await models.payment.aggregate({
        where: {
          task: {
            assigneeId: userId
          },
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      // Get total spent (sent payments)
      const spent = await models.payment.aggregate({
        where: {
          payerId: userId,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      // Get pending payments count
      const pendingCount = await DatabaseQueryBuilder.count(
        models.payment,
        'Payment',
        {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'PENDING'
        }
      );

      // Get completed payments count
      const completedCount = await DatabaseQueryBuilder.count(
        models.payment,
        'Payment',
        {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'COMPLETED'
        }
      );

      // Get refunded payments count
      const refundedCount = await DatabaseQueryBuilder.count(
        models.payment,
        'Payment',
        {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'REFUNDED'
        }
      );

      // Calculate total platform and processing fees from completed payments
      const fees = await models.payment.aggregate({
        where: {
          task: {
            assigneeId: userId
          },
          status: 'COMPLETED'
        },
        _sum: {
          platformFee: true,
          processingFee: true
        }
      });

      const totalFees = (fees._sum.platformFee ?? 0) + (fees._sum.processingFee ?? 0);
      const adjustedEarnings = (earnings._sum.amount ?? 0) - totalFees;

      return {
        totalEarnings: adjustedEarnings,
        totalSpent: spent._sum.amount ?? 0,
        pendingPayments: pendingCount,
        completedPayments: completedCount,
        refundedPayments: refundedCount
      };
    } catch (error) {
      logger.error('Error getting payment summary', { error, userId });
      throw error;
    }
  }

  /**
   * Process refund for a payment
   * 
   * This handles refunding payments in case of disputes or cancellations.
   */
  async processRefund(
    paymentId: string,
    refundAmount: number,
    reason: string,
    requestedBy: string
  ): Promise<void> {
    logger.info('Processing refund', { paymentId, refundAmount, requestedBy });

    try {
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Get payment with task information
      const payment = await DatabaseQueryBuilder.findById(
        models.payment,
        paymentId,
        'Payment',
        {
          id: true,
          taskId: true,
          payerId: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          status: true,
          paymentMethod: true,
          gatewayTransactionId: true,
          createdAt: true,
          completedAt: true,
          task: {
            include: {
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      );

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if payment is in a refundable state
      if ((payment as any).status !== 'COMPLETED') {
        throw new ValidationError('Only completed payments can be refunded');
      }

      // Check if user is authorized to request refund
      const isTaskOwner = (payment as any).task.owner.id === requestedBy;
      const isTaskAssignee = (payment as any).task.assignee?.id === requestedBy;
      const isAdmin = false; // In a real app, check if user is admin

      if (!isTaskOwner && !isTaskAssignee && !isAdmin) {
        throw new ValidationError('Not authorized to refund this payment');
      }

      // Validate refund amount
      if (refundAmount <= 0 || refundAmount > (payment as any).amount) {
        throw new ValidationError('Invalid refund amount');
      }

      // Process refund with payment gateway
      const refundResult = await this.processRefundWithGateway(
        (payment as any).gatewayTransactionId ?? '',
        refundAmount
      );

      if (!refundResult.success) {
        throw new AppError('Refund processing failed', 400, true, 'REFUND_FAILED');
      }

      // Create refund record
      await DatabaseQueryBuilder.create(
        models.refund,
        {
          paymentId: (payment as any).id,
          amount: refundAmount,
          reason,
          requestedById: requestedBy,
          status: 'COMPLETED'
        },
        'Refund',
        {
          id: true,
          paymentId: true,
          amount: true,
          reason: true,
          requestedById: true,
          status: true,
          createdAt: true
        }
      );

      // Update payment status
      await DatabaseQueryBuilder.update(
        models.payment,
        (payment as any).id,
        {
          status: refundAmount === (payment as any).amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAmount: {
            increment: refundAmount
          }
        },
        'Payment',
        {
          id: true,
          status: true,
          refundedAmount: true
        }
      );

      // Update task status if full refund
      if (refundAmount === (payment as any).amount) {
        await DatabaseQueryBuilder.update(
          models.task,
          (payment as any).task.id,
          { paymentStatus: 'REFUNDED' },
          'Task'
        );
      }

      // Reverse user balance changes
      const taskWithPayments = await DatabaseQueryBuilder.findById(
        models.task,
        (payment as any).task.id,
        'Task',
        {
          id: true,
          assigneeId: true,
          title: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              platformFee: true,
              processingFee: true,
              paymentMethod: true,
              gatewayTransactionId: true,
              createdAt: true,
              completedAt: true
            }
          }
        }
      );

      if (!taskWithPayments) {
        throw new Error('Task not found');
      }

      // Update the task balance reversal
      await this.reverseUserBalances(taskWithPayments as TaskWithRelations, refundAmount);

      logger.info('Refund processed successfully', { paymentId, refundAmount });
    } catch (error) {
      logger.error('Error processing refund', { error, paymentId });
      throw error;
    }
  }

  /**
   * Process refund with payment gateway
   * 
   * Mock implementation - would integrate with actual payment processor.
   * In a real system, you'd use the transactionId and amount to process the actual refund.
   */
  private async processRefundWithGateway(
    _transactionId: string, // Prefixed with underscore to indicate intentionally unused in mock
    _amount: number // Prefixed with underscore to indicate intentionally unused in mock
  ): Promise<RefundGatewayResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock implementation - always succeeds in this demo
    return {
      success: true,
      refundTransactionId: `refund_${Date.now()}_${Math.floor(Math.random() * 1000000)}`
    };
  }

  /**
   * Reverse user balance changes after refund
   */
  private async reverseUserBalances(task: TaskWithRelations, refundAmount: number): Promise<void> {
    logger.info('Reversing user balances for refund', { 
      taskId: task.id,
      refundAmount
    });

    try {
      // Calculate fees for the refunded amount
      const platformFee = refundAmount * this.PLATFORM_FEE_PERCENTAGE;
      const paymentProcessingFee = 
        (refundAmount * this.PAYMENT_PROCESSING_FEE_PERCENTAGE) + 
        this.PAYMENT_PROCESSING_FIXED_FEE;
      const totalFees = platformFee + paymentProcessingFee;

      // Calculate amount that was received by the tasker (assignee)
      const assigneeAmount = refundAmount - totalFees;

      // Update assignee's balance
      if (task.assigneeId) {
        await DatabaseQueryBuilder.update(
          models.user,
          task.assigneeId,
          {
            balance: {
              decrement: assigneeAmount
            },
            pendingBalance: {
              decrement: assigneeAmount
            }
          },
          'User'
        );
      }

      // Update platform revenue records
      await DatabaseQueryBuilder.create(
        models.platformRevenue,
        {
          amount: -totalFees, // Negative amount to represent reversal
          source: 'REFUND',
          sourceId: task.id,
          description: `Refund fees for task: ${task.title}`
        },
        'PlatformRevenue',
        {
          id: true,
          amount: true,
          source: true,
          sourceId: true,
          description: true,
          createdAt: true
        }
      );

      logger.info('User balances reversed successfully', {
        taskId: task.id,
        assigneeId: task.assigneeId,
        assigneeAmount
      });
    } catch (error) {
      logger.error('Error reversing user balances', { error, taskId: task.id });
      throw error;
    }
  }

  /**
   * Get platform payment statistics
   * 
   * This provides analytics about payment volume, fees collected, etc.
   */
  async getPaymentStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalVolume: number;
    totalFees: number;
    statusBreakdown: Record<string, { count: number; volume: number; fees: number }>;
    platformFeePercentage: number;
    paymentProcessingFeePercentage: number;
  }> {
    logger.info('Getting payment statistics', { startDate, endDate });

    try {
      // Build where clause for date filtering
      const where: PaymentStatsWhereClause = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Get total payment volume
      const totalVolumeResult = await models.payment.aggregate({
        where,
        _sum: {
          amount: true
        }
      });

      // Get payment counts by status
      const statusCounts = await DatabaseQueryBuilder.groupBy(
        models.payment,
        ['status'],
        { _count: { id: true } },
        'Payment',
        where
      );

      // Get payment volumes by status
      const statusVolumes = await DatabaseQueryBuilder.groupBy(
        models.payment,
        ['status'],
        {
          _sum: {
            amount: true,
            platformFee: true,
            processingFee: true
          }
        },
        'Payment',
        where
      );

      // Calculate total fees
      const totalFeesResult = await models.payment.aggregate({
        where,
        _sum: {
          platformFee: true,
          processingFee: true
        }
      });

      const totalVolume = totalVolumeResult._sum.amount ?? 0;
      const totalFees = 
        (totalFeesResult._sum.platformFee ?? 0) + 
        (totalFeesResult._sum.processingFee ?? 0);

      // Build status breakdown
      const statusBreakdown: Record<string, { count: number; volume: number; fees: number }> = {};

      // Initialize with all possible statuses
      const allStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'];
      allStatuses.forEach(status => {
        statusBreakdown[status] = { count: 0, volume: 0, fees: 0 };
      });

      // Populate counts
      statusCounts.forEach((statusCount: PaymentStatusCount) => {
        statusBreakdown[statusCount.status].count = statusCount._count.id;
      });

      // Populate volumes and fees
      statusVolumes.forEach((statusVolume: { status: string; _sum: { amount: number | null; platformFee: number | null; processingFee: number | null } }) => {
        statusBreakdown[statusVolume.status].volume = statusVolume._sum.amount ?? 0;
        statusBreakdown[statusVolume.status].fees = 
          (statusVolume._sum.platformFee ?? 0) + 
          (statusVolume._sum.processingFee ?? 0);
      });

      return {
        totalVolume,
        totalFees,
        statusBreakdown,
        platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE,
        paymentProcessingFeePercentage: this.PAYMENT_PROCESSING_FEE_PERCENTAGE
      };
    } catch (error) {
      logger.error('Error getting payment statistics', { error });
      throw error;
    }
  }

  /**
   * Get task payments information
   */
  async getTaskPayments(taskId: string, userId: string): Promise<{
    payments: PaymentTransaction[];
    totalAmount: number;
    lastPayment?: PaymentTransaction;
  }> {
    logger.info('Getting task payments', { taskId, userId });

    try {
      // Get task with payment information
      const task = await DatabaseQueryBuilder.findById(
        models.task,
        taskId,
        'Task',
        {
          id: true,
          title: true,
          ownerId: true,
          assigneeId: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      );

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Check if user is authorized to view task payments
      const isOwner = (task as any).owner.id === userId;
      const isAssignee = (task as any).assignee?.id === userId;

      if (!isOwner && !isAssignee) {
        throw new ValidationError('Not authorized to view payments for this task');
      }

      // Format payment data
      type PaymentWithTask = {
        id: string;
        payerId: string;
        amount: number;
        platformFee: number;
        processingFee: number;
        status: string;
        paymentMethod: string | null;
        gatewayTransactionId: string | null;
        createdAt: Date;
        completedAt: Date | null;
      };

      const payments: PaymentTransaction[] = (task as any).payments.map((payment: PaymentWithTask) => ({
        id: payment.id,
        taskId: (task as any).id,
        payerId: payment.payerId,
        amount: payment.amount,
        platformFee: payment.platformFee,
        processingFee: payment.processingFee,
        status: payment.status,
        paymentMethod: payment.paymentMethod ?? 'UNKNOWN',
        gatewayTransactionId: payment.gatewayTransactionId ?? undefined,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt ?? undefined,
        task: {
          id: (task as any).id,
          title: (task as any).title,
          paymentStatus: (task as any).paymentStatus ?? undefined,
          owner: {
            firstName: (task as any).owner.firstName,
            lastName: (task as any).owner.lastName
          },
          assignee: (task as any).assignee ? {
            firstName: (task as any).assignee.firstName,
            lastName: (task as any).assignee.lastName
          } : null
        }
      }));

      const totalAmount = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

      const lastPayment = payments.length > 0 ? payments[0] : undefined;

      return {
        payments,
        totalAmount,
        lastPayment
      };
    } catch (error) {
      logger.error('Error getting task payments', { error, taskId, userId });
      throw error;
    }
  }

  /**
   * Add a payment method for a user
   */
  async addPaymentMethod(userId: string, paymentMethodData: {
    type: 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'DIGITAL_WALLET';
    provider: 'STRIPE' | 'PAYPAL';
    externalId: string;
    details: {
      cardToken?: string;
      bankAccountId?: string;
      walletId?: string;
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
      name?: string;
    };
  }): Promise<{
    id: string;
    type: string;
    provider: string;
    maskedDetails: Record<string, unknown>;
    isDefault: boolean;
    createdAt: Date;
  }> {
    logger.info('Adding payment method', { userId, type: paymentMethodData.type, provider: paymentMethodData.provider });

    try {
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      // Check if this is the user's first payment method
      const existingMethodsCount = await DatabaseQueryBuilder.count(
        models.paymentMethod,
        'PaymentMethod',
        { userId, isActive: true }
      );

      const isDefault = existingMethodsCount === 0;

      // Create payment method record
      const paymentMethod = await DatabaseQueryBuilder.create(
        models.paymentMethod,
        {
          userId,
          type: paymentMethodData.type,
          provider: paymentMethodData.provider,
          externalId: paymentMethodData.externalId,
          details: paymentMethodData.details,
          isDefault,
          isActive: true
        },
        'PaymentMethod',
        {
          id: true,
          userId: true,
          type: true,
          provider: true,
          externalId: true,
          details: true,
          isDefault: true,
          isActive: true,
          createdAt: true
        }
      );

      // Create masked details for response
      const maskedDetails: Record<string, unknown> = {};
      if (paymentMethodData.type === 'CREDIT_CARD') {
        maskedDetails.last4 = paymentMethodData.details.last4 ?? '****';
        maskedDetails.brand = paymentMethodData.details.brand ?? 'Unknown';
        maskedDetails.expiryMonth = paymentMethodData.details.expiryMonth;
        maskedDetails.expiryYear = paymentMethodData.details.expiryYear;
      } else if (paymentMethodData.type === 'BANK_ACCOUNT') {
        maskedDetails.last4 = paymentMethodData.details.last4 ?? '****';
        maskedDetails.name = paymentMethodData.details.name ?? 'Bank Account';
      } else if (paymentMethodData.type === 'DIGITAL_WALLET') {
        maskedDetails.name = paymentMethodData.details.name ?? 'Digital Wallet';
      }

      return {
        id: (paymentMethod as any).id,
        type: (paymentMethod as any).type,
        provider: (paymentMethod as any).provider,
        maskedDetails,
        isDefault: (paymentMethod as any).isDefault,
        createdAt: (paymentMethod as any).createdAt
      };
    } catch (error) {
      logger.error('Error adding payment method', { error, userId });
      throw error;
    }
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(userId: string): Promise<Array<{
    id: string;
    type: string;
    maskedDetails: Record<string, unknown>;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
  }>> {
    logger.info('Getting payment methods', { userId });

    try {
      // Import DatabaseQueryBuilder
      const { DatabaseQueryBuilder, models } = await import('../utils/database-query-builder');

      const { items: paymentMethods } = await DatabaseQueryBuilder.findMany(
        models.paymentMethod,
        {
          where: {
            userId,
            isActive: true
          },
          select: {
            id: true,
            type: true,
            provider: true,
            details: true,
            isDefault: true,
            isActive: true,
            createdAt: true
          },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        },
        'PaymentMethod'
      );

      return paymentMethods.map(method => {
        const details = (method as any).details as Record<string, unknown>;
        const maskedDetails: Record<string, unknown> = {};

        if ((method as any).type === 'CREDIT_CARD') {
          maskedDetails.last4 = details.last4 ?? '****';
          maskedDetails.brand = details.brand ?? 'Unknown';
          maskedDetails.expiryMonth = details.expiryMonth;
          maskedDetails.expiryYear = details.expiryYear;
        } else if ((method as any).type === 'BANK_ACCOUNT') {
          maskedDetails.last4 = details.last4 ?? '****';
          maskedDetails.name = details.name ?? 'Bank Account';
        } else if ((method as any).type === 'DIGITAL_WALLET') {
          maskedDetails.name = details.name ?? 'Digital Wallet';
        }

        return {
          id: (method as any).id,
          type: (method as any).type,
          maskedDetails,
          isDefault: (method as any).isDefault,
          isActive: (method as any).isActive,
          createdAt: (method as any).createdAt
        };
      });
    } catch (error) {
      logger.error('Error getting payment methods', { error, userId });
      throw error;
    }
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(paymentMethodId: string, userId: string): Promise<void> {
    logger.info('Deleting payment method', { paymentMethodId, userId });

    try {
      const paymentMethod = await DatabaseQueryBuilder.findById(
        models.paymentMethod,
        paymentMethodId,
        'PaymentMethod',
        {
          id: true,
          userId: true,
          isDefault: true,
          isActive: true
        }
      );

      if (!paymentMethod) {
        throw new NotFoundError('Payment method not found');
      }

      if ((paymentMethod as any).userId !== userId) {
        throw new ValidationError('Not authorized to delete this payment method');
      }

      // Soft delete by setting isActive to false
      await DatabaseQueryBuilder.update(
        models.paymentMethod,
        paymentMethodId,
        {
          isActive: false,
          isDefault: false
        },
        'PaymentMethod'
      );

      // If this was the default method, set another method as default
      if ((paymentMethod as any).isDefault) {
        const nextMethod = await DatabaseQueryBuilder.findUnique(
          models.paymentMethod,
          {
            userId,
            isActive: true,
            id: { not: paymentMethodId }
          },
          'PaymentMethod',
          {
            id: true,
            userId: true,
            isActive: true,
            isDefault: true
          }
        );

        if (nextMethod) {
          await DatabaseQueryBuilder.update(
            models.paymentMethod,
            (nextMethod as any).id,
            { isDefault: true },
            'PaymentMethod'
          );
        }
      }

      logger.info('Payment method deleted successfully', { paymentMethodId, userId });
    } catch (error) {
      logger.error('Error deleting payment method', { error, paymentMethodId, userId });
      throw error;
    }
  }

  /**
   * Get payment receipt
   */
  async getPaymentReceipt(paymentId: string, userId: string): Promise<{
    payment: PaymentTransaction;
    receipt: {
      receiptNumber: string;
      issueDate: Date;
      platformFee: number;
      processingFee: number;
      totalFees: number;
      netAmount: number;
    };
  }> {
    logger.info('Getting payment receipt', { paymentId, userId });

    try {
      const payment = await this.getPaymentById(paymentId, userId);

      if (payment.status !== 'COMPLETED') {
        throw new ValidationError('Receipt only available for completed payments');
      }

      // Get payment details from database to calculate fees
      const paymentRecord = await DatabaseQueryBuilder.findById(
        models.payment,
        paymentId,
        'Payment',
        {
          id: true,
          amount: true,
          platformFee: true,
          processingFee: true,
          status: true
        }
      );

      if (!paymentRecord) {
        throw new NotFoundError('Payment record not found');
      }

      const platformFee = (paymentRecord as any).platformFee || 0;
      const processingFee = (paymentRecord as any).processingFee || 0;
      const totalFees = platformFee + processingFee;
      const netAmount = payment.amount - totalFees;

      return {
        payment,
        receipt: {
          receiptNumber: `FT-${paymentId.substring(0, 8).toUpperCase()}`,
          issueDate: payment.completedAt || payment.createdAt,
          platformFee,
          processingFee,
          totalFees,
          netAmount
        }
      };
    } catch (error) {
      logger.error('Error getting payment receipt', { error, paymentId, userId });
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
