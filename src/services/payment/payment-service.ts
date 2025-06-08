/**
 * Payment Service
 * 
 * This service provides functionality for managing payments and transactions
 * including processing payments, checking status, and handling refunds.
 */

import { ApiResponse, PaginatedApiResponse, Task } from '@/types';
import { apiClient } from '../api/api-client';
import { errorService } from '../error/error-service';

/**
 * Payment method types - Stripe only
 */
export enum PaymentMethodType {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card'
}

/**
 * Payment status values
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

/**
 * Transaction types
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  DEPOSIT = 'deposit',
  FEE = 'fee',
  ADJUSTMENT = 'adjustment'
}

/**
 * Payment method interface
 */
export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Card-specific fields
  cardLast4?: string;
  cardBrand?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  
  // PayPal-specific fields
  email?: string;
  
  // Bank-specific fields
  bankName?: string;
  accountLast4?: string;
}

/**
 * Transaction interface
 */
export interface Transaction {
  id: string;
  userId: string;
  taskId?: string;
  type: TransactionType;
  amount: number;
  fee: number;
  status: PaymentStatus;
  description: string;
  paymentMethodId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Related entities
  task?: Task;
  paymentMethod?: PaymentMethod;
}

/**
 * Wallet interface
 */
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment intent request
 */
export interface CreatePaymentIntentRequest {
  taskId: string;
  amount: number;
  paymentMethodId?: string;
  description?: string;
}

/**
 * Withdrawal request
 */
export interface WithdrawalRequest {
  amount: number;
  paymentMethodId: string;
  description?: string;
}

/**
 * Transaction search parameters
 */
export interface TransactionSearchParams {
  userId?: string;
  taskId?: string;
  type?: TransactionType | TransactionType[];
  status?: PaymentStatus | PaymentStatus[];
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get user wallet information
 * 
 * @returns Promise with wallet information
 */
export async function getWallet(): Promise<ApiResponse<Wallet>> {
  try {
    return await apiClient.get('/payments/wallet');
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch wallet information');
    throw error;
  }
}

/**
 * Get all payment methods for the current user
 * 
 * @returns Promise with array of payment methods
 */
export async function getPaymentMethods(): Promise<ApiResponse<PaymentMethod[]>> {
  try {
    return await apiClient.get('/payments/methods');
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch payment methods');
    throw error;
  }
}

/**
 * Add a new payment method
 * 
 * @param token - Secure token from payment processor
 * @param isDefault - Whether this should be the default payment method
 * @returns Promise with the added payment method
 */
export async function addPaymentMethod(
  token: string,
  isDefault: boolean = false
): Promise<ApiResponse<PaymentMethod>> {
  try {
    return await apiClient.post('/payments/methods', { token, isDefault });
  } catch (error) {
    errorService.handleError(error, 'Failed to add payment method');
    throw error;
  }
}

/**
 * Update a payment method
 * 
 * @param paymentMethodId - The payment method ID
 * @param isDefault - Whether this should be the default payment method
 * @returns Promise with the updated payment method
 */
export async function updatePaymentMethod(
  paymentMethodId: string,
  isDefault: boolean
): Promise<ApiResponse<PaymentMethod>> {
  try {
    return await apiClient.put(`/payments/methods/${paymentMethodId}`, { isDefault });
  } catch (error) {
    errorService.handleError(error, 'Failed to update payment method');
    throw error;
  }
}

/**
 * Remove a payment method
 * 
 * @param paymentMethodId - The payment method ID
 * @returns Promise indicating success or failure
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete(`/payments/methods/${paymentMethodId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to remove payment method');
    throw error;
  }
}

/**
 * Create a payment intent for a task
 * 
 * @param paymentData - Payment intent request data
 * @returns Promise with the client secret for the payment intent
 */
export async function createPaymentIntent(
  paymentData: CreatePaymentIntentRequest
): Promise<ApiResponse<{clientSecret: string; intentId: string}>> {
  try {
    return await apiClient.post('/payments/intents', paymentData);
  } catch (error) {
    errorService.handleError(error, 'Failed to create payment intent');
    throw error;
  }
}

/**
 * Release payment for a completed task
 * 
 * @param taskId - The task ID
 * @returns Promise indicating success or failure
 */
export async function releasePayment(taskId: string): Promise<ApiResponse<Transaction>> {
  try {
    return await apiClient.post(`/payments/release/${taskId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to release payment');
    throw error;
  }
}

/**
 * Request a refund for a task
 * 
 * @param taskId - The task ID
 * @param reason - Reason for the refund
 * @returns Promise with the refund transaction
 */
export async function requestRefund(
  taskId: string,
  reason: string
): Promise<ApiResponse<Transaction>> {
  try {
    return await apiClient.post(`/payments/refund/${taskId}`, { reason });
  } catch (error) {
    errorService.handleError(error, 'Failed to request refund');
    throw error;
  }
}

/**
 * Get transaction history with optional filtering
 * 
 * @param params - Search parameters for filtering transactions
 * @returns Promise with paginated transactions
 */
export async function getTransactions(
  params?: TransactionSearchParams
): Promise<PaginatedApiResponse<Transaction>> {
  try {
    return await apiClient.get('/payments/transactions', params as any) as PaginatedApiResponse<Transaction>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch transactions');
    throw error;
  }
}

/**
 * Get a specific transaction by ID
 * 
 * @param transactionId - The transaction ID
 * @returns Promise with the transaction details
 */
export async function getTransactionById(transactionId: string): Promise<ApiResponse<Transaction>> {
  try {
    return await apiClient.get(`/payments/transactions/${transactionId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch transaction');
    throw error;
  }
}

/**
 * Request a withdrawal from the wallet
 * 
 * @param withdrawalData - Withdrawal request data
 * @returns Promise with the withdrawal transaction
 */
export async function requestWithdrawal(
  withdrawalData: WithdrawalRequest
): Promise<ApiResponse<Transaction>> {
  try {
    return await apiClient.post('/payments/withdraw', withdrawalData);
  } catch (error) {
    errorService.handleError(error, 'Failed to request withdrawal');
    throw error;
  }
}

/**
 * Calculate service fee for a given amount
 * 
 * @param amount - The amount to calculate fee for
 * @param isTasker - Whether the fee is for a tasker (vs client)
 * @returns Promise with the calculated fee
 */
export async function calculateFee(
  amount: number,
  isTasker: boolean = false
): Promise<ApiResponse<{fee: number; totalWithFee: number}>> {
  try {
    return await apiClient.get('/payments/calculate-fee', { amount, isTasker });
  } catch (error) {
    errorService.handleError(error, 'Failed to calculate fee');
    throw error;
  }
}

/**
 * Get payment settings and fee structure
 * 
 * @returns Promise with payment settings
 */
export async function getPaymentSettings(): Promise<ApiResponse<{
  serviceFeeClient: number;
  serviceFeeTasker: number;
  minimumWithdrawal: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
}>> {
  try {
    return await apiClient.get('/payments/settings');
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch payment settings');
    throw error;
  }
}

// Export service object
export const paymentService = {
  getWallet,
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
  createPaymentIntent,
  releasePayment,
  requestRefund,
  getTransactions,
  getTransactionById,
  requestWithdrawal,
  calculateFee,
  getPaymentSettings,
  
  // Enums
  PaymentMethodType,
  PaymentStatus,
  TransactionType
};

export default paymentService;
