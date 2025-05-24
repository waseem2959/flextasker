import { db } from '@/utils/database';
import {
  AppError,
  ConflictError,
  NotFoundError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';
/**
 * Payment service - this is like the financial department that handles all
 * monetary transactions, escrow services, refunds, and payment security.
 * 
 * Think of this as having a sophisticated payment processor that can handle
 * secure transactions, hold funds in escrow until work is completed, and
 * manage complex payment flows between multiple parties.
 * 
 * Note: This is a simplified implementation. In production, you'd integrate
 * with actual payment processors like Stripe, PayPal, or similar services.
 */

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
    assignee?: {
      firstName: string;
      lastName: string;
    };
  };
  fees: {
    platformFee: number;
    paymentProcessingFee: number;
    totalFees: number;
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
  id: number;
}

export class PaymentService {
  
  // Platform configuration
  private readonly PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee
  private readonly PAYMENT_PROCESSING_FEE_PERCENTAGE = 0.029; // 2.9% processing fee
  private readonly PAYMENT_PROCESSING_FIXED_FEE = 0.30; // $0.30 fixed fee

  /**
   * Create a payment for a task - like making a secure payment
   * 
   * This creates a payment record and initiates the payment process
   * with the payment gateway. In a real implementation, this would
   * integrate with Stripe, PayPal, or similar services.
   */
  async createPayment(payerId: string, paymentData: CreatePaymentData): Promise<PaymentTransaction> {
    try {
      // Get task details and validate payment eligibility
      const task = await db.task.findUnique({
        where: { id: paymentData.taskId },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          payments: {
            where: {
              status: { in: ['PENDING', 'COMPLETED'] },
            },
          },
        },
      }) as TaskWithRelations | null;

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Validate payment authorization
      if (task.ownerId !== payerId) {
        throw new ValidationError('Only the task owner can make payments');
      }

      // Check if task is ready for payment
      if (task.status !== 'COMPLETED') {
        throw new ConflictError('Payment can only be made for completed tasks');
      }

      // Check if payment already exists
      if (task.payments.length > 0) {
        throw new ConflictError('Payment already exists for this task');
      }

      // Calculate fees
      const platformFee = paymentData.amount * this.PLATFORM_FEE_PERCENTAGE;
      const paymentProcessingFee = (paymentData.amount * this.PAYMENT_PROCESSING_FEE_PERCENTAGE) + this.PAYMENT_PROCESSING_FIXED_FEE;
      const totalFees = platformFee + paymentProcessingFee;

      // Create payment record
      const payment = await db.payment.create({
        data: {
          taskId: paymentData.taskId,
          payerId,
          amount: paymentData.amount,
          status: 'PENDING',
          // In real implementation, you wouldn't store payment details directly
          // Instead, you'd use tokens from payment processors
          gatewayResponse: {
            paymentMethod: paymentData.paymentMethod,
            // Store encrypted/tokenized payment info
            paymentToken: 'mock_payment_token_' + Date.now(),
            fees: {
              platformFee,
              paymentProcessingFee,
              totalFees,
            },
          },
        },
      });

      // Process payment with payment gateway
      const paymentResult = await this.processPaymentWithGateway(payment.id, paymentData);

      // Update payment status based on gateway response
      const updatedPayment = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentResult.success ? 'COMPLETED' : 'FAILED',
          gatewayTransactionId: paymentResult.transactionId,
          gatewayResponse: {
            ...payment.gatewayResponse,
            ...paymentResult.details,
          },
          completedAt: paymentResult.success ? new Date() : null,
        },
        include: {
          task: {
            include: {
              owner: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              assignee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // If payment successful, update user balances and task status
      if (paymentResult.success) {
        await this.updateUserBalances(task, paymentData.amount, totalFees);
        
        // Update task status to indicate payment completed
        await db.task.update({
          where: { id: paymentData.taskId },
          data: { 
            // Add a custom status or field to track payment completion
            // For now, we'll add a note in the task
          },
        });
      }

      const paymentTransaction: PaymentTransaction = {
        id: updatedPayment.id,
        taskId: updatedPayment.taskId,
        payerId: updatedPayment.payerId,
        amount: Number(updatedPayment.amount),
        status: updatedPayment.status,
        paymentMethod: paymentData.paymentMethod,
        createdAt: updatedPayment.createdAt,
        completedAt: updatedPayment.completedAt,
        task: {
          id: updatedPayment.task.id,
          title: updatedPayment.task.title,
          owner: updatedPayment.task.owner,
          assignee: updatedPayment.task.assignee,
        },
        fees: {
          platformFee,
          paymentProcessingFee,
          totalFees,
        },
      };

      logger.info('Payment created:', {
        paymentId: payment.id,
        taskId: paymentData.taskId,
        payerId,
        amount: paymentData.amount,
        status: paymentResult.success ? 'COMPLETED' : 'FAILED',
      });

      return paymentTransaction;

    } catch (error) {
      logger.error('Failed to create payment:', error);
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
    try {
      // Mock payment processing logic
      // In real implementation, this would call Stripe, PayPal, etc.
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success rate (95% success for testing)
      const isSuccessful = Math.random() > 0.05;
      
      if (isSuccessful) {
        return {
          success: true,
          // Use slice instead of deprecated substr method
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
          details: {
            gateway: 'mock_gateway',
            paymentMethod: paymentData.paymentMethod,
            processedAt: new Date(),
            mockData: true,
          },
        };
      } else {
        return {
          success: false,
          details: {
            gateway: 'mock_gateway',
            error: 'Payment declined',
            errorCode: 'DECLINED',
            mockData: true,
          },
        };
      }

    } catch (error) {
      logger.error('Payment gateway processing failed:', error);
      return {
        success: false,
        details: {
          error: 'Gateway error',
          errorCode: 'GATEWAY_ERROR',
        },
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
    try {
      const assigneeEarnings = amount - totalFees;

      // Update task owner (they spent money)
      await db.user.update({
        where: { id: task.ownerId },
        data: {
          totalSpent: {
            increment: amount,
          },
        },
      });

      // Update task assignee (they earned money)
      if (task.assigneeId) {
        await db.user.update({
          where: { id: task.assigneeId },
          data: {
            totalEarnings: {
              increment: assigneeEarnings,
            },
          },
        });
      }

      logger.info('User balances updated:', {
        taskId: task.id,
        ownerId: task.ownerId,
        assigneeId: task.assigneeId,
        totalAmount: amount,
        assigneeEarnings,
        platformFees: totalFees,
      });

    } catch (error) {
      logger.error('Failed to update user balances:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID with full details
   */
  async getPaymentById(paymentId: string, userId: string): Promise<PaymentTransaction> {
    try {
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
                },
              },
              assignee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      // Check if user has access to this payment
      const hasAccess = payment.payerId === userId ||
                       payment.task.ownerId === userId ||
                       payment.task.assigneeId === userId;

      if (!hasAccess) {
        throw new ValidationError('You do not have access to this payment');
      }

      // Calculate fees from gateway response
      const gatewayData = payment.gatewayResponse as Record<string, unknown>;
      const fees = (gatewayData?.fees as {
        platformFee: number;
        paymentProcessingFee: number;
        totalFees: number;
      }) || {
        platformFee: 0,
        paymentProcessingFee: 0,
        totalFees: 0,
      };

      const paymentTransaction: PaymentTransaction = {
        id: payment.id,
        taskId: payment.taskId,
        payerId: payment.payerId,
        amount: Number(payment.amount),
        status: payment.status,
        paymentMethod: (gatewayData?.paymentMethod as string) || 'UNKNOWN',
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        task: {
          id: payment.task.id,
          title: payment.task.title,
          owner: payment.task.owner,
          assignee: payment.task.assignee,
        },
        fees,
      };

      return paymentTransaction;

    } catch (error) {
      logger.error('Failed to get payment:', error);
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
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause based on payment type
      let whereClause: Record<string, unknown> = {};

      if (type === 'sent') {
        // Payments made by the user
        whereClause = { payerId: userId };
      } else if (type === 'received') {
        // Payments received by the user (as task assignee)
        whereClause = {
          task: {
            assigneeId: userId,
          },
        };
      } else {
        // All payments involving the user
        whereClause = {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } },
          ],
        };
      }

      if (status) {
        whereClause.status = status;
      }

      // Get total count
      const totalPayments = await db.payment.count({
        where: whereClause,
      });

      // Get payments
      const payments = await db.payment.findMany({
        where: whereClause,
        include: {
          task: {
            include: {
              owner: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              assignee: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      // Process payments to include fee information
      // Define the shape of payment objects returned from Prisma query
      type PaymentWithTask = {
        id: string;
        taskId: string;
        payerId: string;
        amount: number;
        status: string;
        createdAt: Date;
        completedAt: Date | null;
        gatewayResponse: Record<string, unknown> | null;
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
      };

      const processedPayments: PaymentTransaction[] = payments.map((payment: PaymentWithTask) => {
        // Safely extract gateway data with proper type handling
        const gatewayData = payment.gatewayResponse;
        const fees = (gatewayData?.fees as {
          platformFee: number;
          paymentProcessingFee: number;
          totalFees: number;
        }) ?? {
          platformFee: 0,
          paymentProcessingFee: 0,
          totalFees: 0,
        };

        return {
          id: payment.id,
          taskId: payment.taskId,
          payerId: payment.payerId,
          amount: Number(payment.amount),
          status: payment.status,
          paymentMethod: (gatewayData?.paymentMethod as string) ?? 'UNKNOWN',
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          task: {
            id: payment.task.id,
            title: payment.task.title,
            owner: payment.task.owner,
            assignee: payment.task.assignee,
          },
          fees,
        };
      });

      const pagination = createPagination(page, limit, totalPayments);

      return {
        payments: processedPayments,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get user payments:', error);
      throw error;
    }
  }

  /**
   * Get payment summary for a user
   */
  async getPaymentSummary(userId: string): Promise<PaymentSummary> {
    try {
      // Get user's current balance information
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          totalSpent: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get payment counts by status - TypeScript infers the proper type from groupBy
      const paymentCounts = await db.payment.groupBy({
        by: ['status'],
        where: {
          OR: [
            { payerId: userId },
            { task: { assigneeId: userId } },
          ],
        },
        _count: {
          id: true,
        },
      });

      // Process counts - TypeScript knows countItem structure from the groupBy operation above
      const counts = paymentCounts.reduce((acc: Record<string, number>, countItem: PaymentStatusCount) => {
  acc[countItem.status] = countItem._count.id;
  return acc;
}, {});
      const summary: PaymentSummary = {
        totalEarnings: Number(user.totalEarnings),
        totalSpent: Number(user.totalSpent),
        pendingPayments: counts.PENDING ?? 0,
        completedPayments: counts.COMPLETED ?? 0,
        refundedPayments: counts.REFUNDED ?? 0,
      };

      return summary;

    } catch (error) {
      logger.error('Failed to get payment summary:', error);
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
    try {
      // Get payment details with proper typing
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          task: {
            include: {
              owner: true,
              assignee: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundError('Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new ConflictError('Only completed payments can be refunded');
      }

      // Validate refund amount
      if (refundAmount > Number(payment.amount)) {
        throw new ValidationError('Refund amount cannot exceed payment amount');
      }

      // Process refund with payment gateway
      const refundResult = await this.processRefundWithGateway(
        payment.gatewayTransactionId,
        refundAmount
      );

      if (refundResult.success) {
        // Update payment status
        await db.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REFUNDED',
            gatewayResponse: {
              ...payment.gatewayResponse,
              refund: {
                amount: refundAmount,
                reason,
                processedAt: new Date(),
                requestedBy,
                refundTransactionId: refundResult.refundTransactionId,
              },
            },
          },
        });

        // Type the task object properly using object construction instead of assertion
        const taskWithRelations: TaskWithRelations = {
          id: payment.task.id,
          ownerId: payment.task.ownerId,
          assigneeId: payment.task.assigneeId,
          title: payment.task.title,
          status: payment.task.status,
          owner: payment.task.owner,
          assignee: payment.task.assignee,
          payments: [], // This isn't needed for the refund operation
        };

        // Reverse the balance changes
        await this.reverseUserBalances(taskWithRelations, refundAmount);

        logger.info('Payment refunded:', {
          paymentId,
          refundAmount,
          reason,
          requestedBy,
        });
      } else {
        throw new AppError('Refund processing failed');
      }

    } catch (error) {
      logger.error('Failed to process refund:', error);
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
    try {
      // Mock refund processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock 98% success rate
      const isSuccessful = Math.random() > 0.02;
      
      if (isSuccessful) {
        return {
          success: true,
          // Use slice instead of deprecated substr method
          refundTransactionId: `refund_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        };
      } else {
        return { success: false };
      }

    } catch (error) {
      logger.error('Refund gateway processing failed:', error);
      return { success: false };
    }
  }

  /**
   * Reverse user balance changes after refund
   */
  private async reverseUserBalances(task: TaskWithRelations, refundAmount: number): Promise<void> {
    try {
      // Calculate how much to reverse for each user
      const platformFee = refundAmount * this.PLATFORM_FEE_PERCENTAGE;
      const paymentProcessingFee = (refundAmount * this.PAYMENT_PROCESSING_FEE_PERCENTAGE) + this.PAYMENT_PROCESSING_FIXED_FEE;
      const totalFees = platformFee + paymentProcessingFee;
      const assigneeEarningsToReverse = refundAmount - totalFees;

      // Reverse task owner balance
      await db.user.update({
        where: { id: task.ownerId },
        data: {
          totalSpent: {
            decrement: refundAmount,
          },
        },
      });

      // Reverse task assignee balance
      if (task.assigneeId) {
        await db.user.update({
          where: { id: task.assigneeId },
          data: {
            totalEarnings: {
              decrement: assigneeEarningsToReverse,
            },
          },
        });
      }

      logger.info('User balances reversed for refund:', {
        taskId: task.id,
        refundAmount,
        assigneeEarningsReversed: assigneeEarningsToReverse,
      });

    } catch (error) {
      logger.error('Failed to reverse user balances:', error);
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
    try {
      const whereClause: PaymentStatsWhereClause = {};
      
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      // Get payment aggregations
      const paymentStats = await db.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { id: true },
        _sum: { amount: true },
      });

      // Calculate total volume and fees
      let totalVolume = 0;
      let totalFees = 0;
      const statusBreakdown: Record<string, { count: number; volume: number; fees: number }> = {};

      for (const stat of paymentStats) {
        const volume = Number(stat._sum.amount ?? 0);
        const fees = volume * (this.PLATFORM_FEE_PERCENTAGE + this.PAYMENT_PROCESSING_FEE_PERCENTAGE);
        
        totalVolume += volume;
        if (stat.status === 'COMPLETED') {
          totalFees += fees;
        }

        statusBreakdown[stat.status] = {
          count: stat._count.id,
          volume,
          fees,
        };
      }

      return {
        totalVolume,
        totalFees,
        statusBreakdown,
        platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE * 100,
        paymentProcessingFeePercentage: this.PAYMENT_PROCESSING_FEE_PERCENTAGE * 100,
      };

    } catch (error) {
      logger.error('Failed to get payment statistics:', error);
      throw error;
    }
  }
}