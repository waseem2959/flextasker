/**
 * Payment Service
 * 
 * This service handles all payment-related operations including:
 * - Processing payments for tasks
 * - Managing payment methods
 * - Handling refunds and disputes
 * - Calculating fees and distributing funds
 */

import { db } from '../utils/database';
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
  status: string;
  paymentMethod: string;
  createdAt: Date;
  completedAt?: Date;
  task: {
    id: string;
    title: string;
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
    status: string;
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
      // Get task information
      const task = await db.task.findUnique({
        where: { id: paymentData.taskId },
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
          },
          payments: {
            select: {
              status: true
            }
          }
        }
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Check if user is authorized to make payment
      if (task.ownerId !== payerId) {
        throw new ValidationError('Only the task owner can make payments');
      }

      // Check if task has an assignee
      if (!task.assigneeId) {
        throw new ValidationError('Task does not have an assigned tasker');
      }

      // Check if payment already exists and is not refunded
      const hasActivePayment = task.payments.some(
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
      const payment = await db.payment.create({
        data: {
          taskId: paymentData.taskId,
          payerId,
          amount: paymentData.amount,
          platformFee,
          processingFee: paymentProcessingFee,
          paymentMethod: paymentData.paymentMethod,
          status: 'PENDING',
          metadata: paymentData.paymentDetails || {}
        }
      });

      // Process payment with payment gateway
      const gatewayResult = await this.processPaymentWithGateway(
        payment.id,
        paymentData
      );

      if (!gatewayResult.success) {
        // Update payment status to failed
        await db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            gatewayResponse: gatewayResult.details
          }
        });

        throw new AppError('Payment processing failed', 400, true, 'PAYMENT_FAILED');
      }

      // Update payment with gateway response
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          gatewayTransactionId: gatewayResult.transactionId,
          gatewayResponse: gatewayResult.details,
          completedAt: new Date()
        }
      });

      // Update task status to paid
      await db.task.update({
        where: { id: task.id },
        data: { paymentStatus: 'PAID' }
      });

      // Update user balances
      await this.updateUserBalances(task, paymentData.amount, totalFees);

      // Return formatted payment transaction
      return {
        id: updatedPayment.id,
        taskId: updatedPayment.taskId,
        payerId: updatedPayment.payerId,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        paymentMethod: updatedPayment.paymentMethod,
        createdAt: updatedPayment.createdAt,
        completedAt: updatedPayment.completedAt,
        task: {
          id: task.id,
          title: task.title,
          owner: {
            firstName: task.owner.firstName,
            lastName: task.owner.lastName
          },
          assignee: task.assignee ? {
            firstName: task.assignee.firstName,
            lastName: task.assignee.lastName
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
    task: TaskWithRelations,
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

      // Update assignee's balance
      if (task.assigneeId) {
        await db.user.update({
          where: { id: task.assigneeId },
          data: {
            balance: {
              increment: assigneeAmount
            },
            pendingBalance: {
              increment: assigneeAmount
            }
          }
        });
      }

      // Update platform revenue records
      await db.platformRevenue.create({
        data: {
          amount: totalFees,
          source: 'TASK_PAYMENT',
          sourceId: task.id,
          description: `Fees for task: ${task.title}`
        }
      });

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
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
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
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if user is authorized to view this payment
      if (payment.payerId !== userId && payment.task.assigneeId !== userId) {
        throw new ValidationError('Not authorized to view this payment');
      }

      return {
        id: payment.id,
        taskId: payment.taskId,
        payerId: payment.payerId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt ?? undefined,
        task: {
          id: payment.task.id,
          title: payment.task.title,
          owner: {
            firstName: payment.task.owner.firstName,
            lastName: payment.task.owner.lastName
          },
          assignee: payment.task.assignee ? {
            firstName: payment.task.assignee.firstName,
            lastName: payment.task.assignee.lastName
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

      // Get total count for pagination
      const totalCount = await db.payment.count({ where });

      // Get payments with pagination
      const paymentsData = await db.payment.findMany({
        where,
        include: {
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
        skip,
        take: limit
      });

      // Format payments for response
      const payments = paymentsData.map((payment: any) => ({
        id: payment.id,
        taskId: payment.taskId,
        payerId: payment.payerId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt ?? undefined,
        task: {
          id: payment.task.id,
          title: payment.task.title,
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
      // Get total earnings (received payments)
      const earnings = await db.payment.aggregate({
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
      const spent = await db.payment.aggregate({
        where: {
          payerId: userId,
          status: 'COMPLETED'
        },
        _sum: {
          amount: true
        }
      });

      // Get pending payments count
      const pendingCount = await db.payment.count({
        where: {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'PENDING'
        }
      });

      // Get completed payments count
      const completedCount = await db.payment.count({
        where: {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'COMPLETED'
        }
      });

      // Get refunded payments count
      const refundedCount = await db.payment.count({
        where: {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } }
          ],
          status: 'REFUNDED'
        }
      });

      // Calculate platform and processing fees for earnings
      const totalFees = (earnings._sum.amount ?? 0) * (
        this.PLATFORM_FEE_PERCENTAGE + this.PAYMENT_PROCESSING_FEE_PERCENTAGE
      ) + (completedCount * this.PAYMENT_PROCESSING_FIXED_FEE);

      // Adjust earnings to account for fees
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
      // Get payment with task information
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
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
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if payment is in a refundable state
      if (payment.status !== 'COMPLETED') {
        throw new ValidationError('Only completed payments can be refunded');
      }

      // Check if user is authorized to request refund
      const isTaskOwner = payment.task.owner.id === requestedBy;
      const isTaskAssignee = payment.task.assignee?.id === requestedBy;
      const isAdmin = false; // In a real app, check if user is admin

      if (!isTaskOwner && !isTaskAssignee && !isAdmin) {
        throw new ValidationError('Not authorized to refund this payment');
      }

      // Validate refund amount
      if (refundAmount <= 0 || refundAmount > payment.amount) {
        throw new ValidationError('Invalid refund amount');
      }

      // Process refund with payment gateway
      const refundResult = await this.processRefundWithGateway(
        payment.gatewayTransactionId ?? '',
        refundAmount
      );

      if (!refundResult.success) {
        throw new AppError('Refund processing failed', 400, true, 'REFUND_FAILED');
      }

      // Create refund record
      await db.refund.create({
        data: {
          paymentId: payment.id,
          amount: refundAmount,
          reason,
          requestedById: requestedBy,
          status: 'COMPLETED',
          gatewayRefundId: refundResult.refundTransactionId,
          completedAt: new Date()
        }
      });

      // Update payment status
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: refundAmount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAmount: {
            increment: refundAmount
          }
        }
      });

      // Update task status if full refund
      if (refundAmount === payment.amount) {
        await db.task.update({
          where: { id: payment.task.id },
          data: { paymentStatus: 'REFUNDED' }
        });
      }

      // Reverse user balance changes
      await this.reverseUserBalances(payment.task, refundAmount);

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
        await db.user.update({
          where: { id: task.assigneeId },
          data: {
            balance: {
              decrement: assigneeAmount
            },
            pendingBalance: {
              decrement: assigneeAmount
            }
          }
        });
      }

      // Update platform revenue records
      await db.platformRevenue.create({
        data: {
          amount: -totalFees, // Negative amount to represent reversal
          source: 'REFUND',
          sourceId: task.id,
          description: `Refund fees for task: ${task.title}`
        }
      });

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
      const totalVolumeResult = await db.payment.aggregate({
        where,
        _sum: {
          amount: true
        }
      });

      // Get payment counts by status
      const statusCounts = await db.payment.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true
        }
      });

      // Get payment volumes by status
      const statusVolumes = await db.payment.groupBy({
        by: ['status'],
        where,
        _sum: {
          amount: true,
          platformFee: true,
          processingFee: true
        }
      });

      // Calculate total fees
      const totalFeesResult = await db.payment.aggregate({
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
      statusVolumes.forEach((statusVolume: { status: string; _sum: { amount?: number; platformFee?: number; processingFee?: number } }) => {
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
}

// Export singleton instance
export const paymentService = new PaymentService();
