/**
 * Multi-Gateway Payment Service
 * 
 * Unified interface for multiple payment gateways including Stripe, PayPal, Square, and digital wallets.
 * Implements advanced features like marketplace payments, escrow, and fraud detection.
 */

import { ApiResponse } from '@/types';
import { apiClient } from '../api/api-client';
import { errorService } from '../error/error-service';

export type PaymentGateway = 'stripe';

export interface PaymentGatewayConfig {
  id: PaymentGateway;
  name: string;
  isEnabled: boolean;
  supportedMethods: PaymentMethodType[];
  fees: {
    percentage: number;
    fixed: number;
    currency: string;
  };
  processingTime: string;
  features: {
    instantPayouts: boolean;
    recurringPayments: boolean;
    marketplacePayments: boolean;
    disputeManagement: boolean;
    fraudDetection: boolean;
  };
  limits: {
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface PaymentMethodType {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'wallet' | 'crypto' | 'bnpl';
  icon: string;
  description: string;
}

export interface PaymentIntent {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  clientSecret?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

export interface MarketplacePayment {
  id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  amount: number;
  platformFee: number;
  taskerAmount: number;
  gateway: PaymentGateway;
  status: 'pending' | 'escrowed' | 'released' | 'refunded' | 'disputed';
  escrowReleaseDate?: Date;
  metadata: Record<string, any>;
}

export interface FraudAssessment {
  riskScore: number; // 0-100, higher = more risky
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    velocityCheck: boolean;
    deviceFingerprint: boolean;
    geolocationCheck: boolean;
    behaviorAnalysis: boolean;
    blacklistCheck: boolean;
  };
  recommendations: string[];
  requiresManualReview: boolean;
}

export interface DisputeCase {
  id: string;
  paymentId: string;
  type: 'chargeback' | 'inquiry' | 'fraud' | 'authorization' | 'processing_error';
  status: 'open' | 'under_review' | 'won' | 'lost' | 'warning_closed';
  amount: number;
  reason: string;
  evidence: {
    customerCommunication: string[];
    serviceDocumentation: string[];
    shippingDocumentation: string[];
    duplicateChargeDocumentation: string[];
  };
  dueDate: Date;
  createdAt: Date;
}

/**
 * Get available payment gateways and their configurations
 */
export async function getPaymentGateways(): Promise<ApiResponse<PaymentGatewayConfig[]>> {
  try {
    return await apiClient.get('/payments/gateways');
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch payment gateways');
    throw error;
  }
}

/**
 * Create a payment intent with the specified gateway
 */
export async function createPaymentIntent(
  gateway: PaymentGateway,
  amount: number,
  currency: string = 'USD',
  metadata: Record<string, any> = {}
): Promise<ApiResponse<PaymentIntent>> {
  try {
    return await apiClient.post('/payments/intents', {
      gateway,
      amount,
      currency,
      metadata
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to create payment intent');
    throw error;
  }
}

/**
 * Process marketplace payment with escrow
 */
export async function processMarketplacePayment(
  taskId: string,
  clientId: string,
  taskerId: string,
  amount: number,
  gateway: PaymentGateway,
  paymentMethodId: string,
  escrowDays: number = 7
): Promise<ApiResponse<MarketplacePayment>> {
  try {
    return await apiClient.post('/payments/marketplace', {
      taskId,
      clientId,
      taskerId,
      amount,
      gateway,
      paymentMethodId,
      escrowDays
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to process marketplace payment');
    throw error;
  }
}

/**
 * Release escrowed payment to tasker
 */
export async function releaseEscrowPayment(
  paymentId: string,
  releaseAmount?: number
): Promise<ApiResponse<MarketplacePayment>> {
  try {
    return await apiClient.post(`/payments/escrow/${paymentId}/release`, {
      releaseAmount
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to release escrow payment');
    throw error;
  }
}

/**
 * Assess fraud risk for a payment
 */
export async function assessFraudRisk(
  amount: number,
  paymentMethodId: string,
  userAgent: string,
  ipAddress: string,
  metadata: Record<string, any> = {}
): Promise<ApiResponse<FraudAssessment>> {
  try {
    return await apiClient.post('/payments/fraud-assessment', {
      amount,
      paymentMethodId,
      userAgent,
      ipAddress,
      metadata
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to assess fraud risk');
    throw error;
  }
}

/**
 * Handle payment dispute
 */
export async function submitDisputeEvidence(
  disputeId: string,
  evidence: Partial<DisputeCase['evidence']>
): Promise<ApiResponse<DisputeCase>> {
  try {
    return await apiClient.post(`/payments/disputes/${disputeId}/evidence`, evidence);
  } catch (error) {
    errorService.handleError(error, 'Failed to submit dispute evidence');
    throw error;
  }
}

/**
 * Get payment analytics
 */
export async function getPaymentAnalytics(
  startDate: string,
  endDate: string,
  gateway?: PaymentGateway
): Promise<ApiResponse<{
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  averageAmount: number;
  topGateways: Array<{ gateway: PaymentGateway; volume: number; count: number }>;
  fraudRate: number;
  disputeRate: number;
  refundRate: number;
}>> {
  try {
    return await apiClient.get('/payments/analytics', {
      startDate,
      endDate,
      gateway
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch payment analytics');
    throw error;
  }
}

/**
 * Setup recurring payment
 */
export async function setupRecurringPayment(
  gateway: PaymentGateway,
  paymentMethodId: string,
  amount: number,
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly',
  metadata: Record<string, any> = {}
): Promise<ApiResponse<{
  subscriptionId: string;
  status: string;
  nextPaymentDate: Date;
}>> {
  try {
    return await apiClient.post('/payments/recurring', {
      gateway,
      paymentMethodId,
      amount,
      interval,
      metadata
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to setup recurring payment');
    throw error;
  }
}

/**
 * Process instant payout to tasker
 */
export async function processInstantPayout(
  taskerId: string,
  amount: number,
  paymentMethodId: string,
  gateway: PaymentGateway = 'stripe'
): Promise<ApiResponse<{
  payoutId: string;
  status: string;
  estimatedArrival: Date;
  fee: number;
}>> {
  try {
    return await apiClient.post('/payments/instant-payout', {
      taskerId,
      amount,
      paymentMethodId,
      gateway
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to process instant payout');
    throw error;
  }
}

// Export service object
export const paymentGatewayService = {
  getPaymentGateways,
  createPaymentIntent,
  processMarketplacePayment,
  releaseEscrowPayment,
  assessFraudRisk,
  submitDisputeEvidence,
  getPaymentAnalytics,
  setupRecurringPayment,
  processInstantPayout
};

export default paymentGatewayService;
