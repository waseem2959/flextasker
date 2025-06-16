/**
 * Financial Management Service
 * 
 * Comprehensive financial management including invoice generation, tax compliance,
 * revenue analytics, and automated accounting for marketplace transactions.
 */

import errorService from '@/services/error-service';
import { ApiResponse } from '@/types';
import { apiClient } from '../api/api-client';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  
  // Invoice details
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Amounts
  subtotal: number;
  taxAmount: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Tax information
  taxRate: number;
  taxType: 'vat' | 'gst' | 'sales_tax' | 'none';
  taxId?: string;
  
  // Addresses
  billingAddress: Address;
  serviceAddress?: Address;
  
  // Files
  pdfUrl?: string;
  attachments: string[];
  
  // Metadata
  notes?: string;
  terms?: string;
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxable: boolean;
  category: string;
}

export interface Address {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId?: string;
}

export interface TaxDocument {
  id: string;
  type: '1099' | 'w9' | 'vat_return' | 'gst_return' | 'sales_tax_return';
  year: number;
  quarter?: number;
  userId: string;
  status: 'pending' | 'generated' | 'filed' | 'error';
  
  // Document details
  totalEarnings: number;
  totalTaxes: number;
  totalDeductions: number;
  netIncome: number;
  
  // File information
  documentUrl?: string;
  filedDate?: Date;
  
  // Tax authority information
  taxAuthority: string;
  filingDeadline: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RevenueAnalytics {
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Revenue metrics
  totalRevenue: number;
  platformRevenue: number;
  taskerRevenue: number;
  
  // Transaction metrics
  totalTransactions: number;
  averageTransactionValue: number;
  
  // Growth metrics
  revenueGrowth: number;
  transactionGrowth: number;
  
  // Breakdown by category
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    transactions: number;
    percentage: number;
  }>;
  
  // Breakdown by payment method
  revenueByPaymentMethod: Array<{
    method: string;
    revenue: number;
    transactions: number;
    percentage: number;
  }>;
  
  // Geographic breakdown
  revenueByRegion: Array<{
    region: string;
    revenue: number;
    transactions: number;
    percentage: number;
  }>;
  
  // Time series data
  dailyRevenue: Array<{
    date: Date;
    revenue: number;
    transactions: number;
  }>;
}

export interface PayoutSummary {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  // Earnings
  grossEarnings: number;
  platformFees: number;
  netEarnings: number;
  
  // Taxes
  estimatedTaxes: number;
  taxDocuments: TaxDocument[];
  
  // Transactions
  completedTasks: number;
  totalTransactions: number;
  averageTaskValue: number;
  
  // Payouts
  totalPayouts: number;
  pendingPayouts: number;
  nextPayoutDate?: Date;
  
  // Performance metrics
  completionRate: number;
  averageRating: number;
  repeatClientRate: number;
}

/**
 * Generate invoice for a completed task
 */
export async function generateInvoice(
  taskId: string,
  lineItems: Omit<InvoiceLineItem, 'id'>[],
  billingAddress: Address,
  options?: {
    dueDate?: Date;
    notes?: string;
    terms?: string;
    taxRate?: number;
    currency?: string;
  }
): Promise<ApiResponse<Invoice>> {
  try {
    return await apiClient.post('/financial/invoices', {
      taskId,
      lineItems,
      billingAddress,
      ...options
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to generate invoice');
    throw error;
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<ApiResponse<Invoice>> {
  try {
    return await apiClient.get(`/financial/invoices/${invoiceId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch invoice');
    throw error;
  }
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePDF(invoiceId: string): Promise<ApiResponse<{ url: string }>> {
  try {
    return await apiClient.get(`/financial/invoices/${invoiceId}/pdf`);
  } catch (error) {
    errorService.handleError(error, 'Failed to download invoice PDF');
    throw error;
  }
}

/**
 * Send invoice to client
 */
export async function sendInvoice(
  invoiceId: string,
  emailOptions?: {
    subject?: string;
    message?: string;
    ccEmails?: string[];
  }
): Promise<ApiResponse<{ sent: boolean; sentAt: Date }>> {
  try {
    return await apiClient.post(`/financial/invoices/${invoiceId}/send`, emailOptions);
  } catch (error) {
    errorService.handleError(error, 'Failed to send invoice');
    throw error;
  }
}

/**
 * Generate tax document (1099, W9, etc.)
 */
export async function generateTaxDocument(
  userId: string,
  type: TaxDocument['type'],
  year: number,
  quarter?: number
): Promise<ApiResponse<TaxDocument>> {
  try {
    return await apiClient.post('/financial/tax-documents', {
      userId,
      type,
      year,
      quarter
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to generate tax document');
    throw error;
  }
}

/**
 * Get revenue analytics
 */
export async function getRevenueAnalytics(
  startDate: string,
  endDate: string,
  filters?: {
    category?: string;
    region?: string;
    paymentMethod?: string;
    userId?: string;
  }
): Promise<ApiResponse<RevenueAnalytics>> {
  try {
    return await apiClient.get('/financial/analytics/revenue', {
      startDate,
      endDate,
      ...filters
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch revenue analytics');
    throw error;
  }
}

/**
 * Get payout summary for tasker
 */
export async function getPayoutSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<PayoutSummary>> {
  try {
    return await apiClient.get(`/financial/payouts/${userId}/summary`, {
      startDate,
      endDate
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch payout summary');
    throw error;
  }
}

/**
 * Calculate tax liability
 */
export async function calculateTaxLiability(
  userId: string,
  year: number,
  jurisdiction: string
): Promise<ApiResponse<{
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  estimatedTax: number;
  quarterlyPayments: number[];
  filingDeadline: Date;
}>> {
  try {
    return await apiClient.get(`/financial/tax-calculation/${userId}`, {
      year,
      jurisdiction
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to calculate tax liability');
    throw error;
  }
}

/**
 * Export financial data
 */
export async function exportFinancialData(
  userId: string,
  startDate: string,
  endDate: string,
  format: 'csv' | 'xlsx' | 'pdf',
  includeTransactions: boolean = true,
  includeInvoices: boolean = true,
  includeTaxDocuments: boolean = false
): Promise<ApiResponse<{ downloadUrl: string; expiresAt: Date }>> {
  try {
    return await apiClient.post('/financial/export', {
      userId,
      startDate,
      endDate,
      format,
      includeTransactions,
      includeInvoices,
      includeTaxDocuments
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to export financial data');
    throw error;
  }
}

/**
 * Get financial dashboard data
 */
export async function getFinancialDashboard(
  userId: string,
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
): Promise<ApiResponse<{
  totalEarnings: number;
  pendingEarnings: number;
  completedTasks: number;
  averageTaskValue: number;
  topCategories: Array<{ category: string; earnings: number }>;
  recentTransactions: Array<{
    id: string;
    taskTitle: string;
    amount: number;
    date: Date;
    status: string;
  }>;
  upcomingPayouts: Array<{
    amount: number;
    date: Date;
    method: string;
  }>;
}>> {
  try {
    return await apiClient.get(`/financial/dashboard/${userId}`, { period });
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch financial dashboard');
    throw error;
  }
}

// Export service object
export const financialManagementService = {
  generateInvoice,
  getInvoice,
  downloadInvoicePDF,
  sendInvoice,
  generateTaxDocument,
  getRevenueAnalytics,
  getPayoutSummary,
  calculateTaxLiability,
  exportFinancialData,
  getFinancialDashboard
};

export default financialManagementService;
