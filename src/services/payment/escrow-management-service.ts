/**
 * Enhanced Escrow Management Service
 * 
 * Advanced escrow functionality with milestone-based payments, dispute resolution,
 * and automated release mechanisms for secure marketplace transactions.
 */

import errorService from '@/services/error-service';
import { ApiResponse } from '@/types';
import { apiClient } from '../api/api-client';

export type EscrowStatus = 
  | 'pending_funding'
  | 'funded'
  | 'in_progress'
  | 'milestone_pending'
  | 'dispute_initiated'
  | 'dispute_resolved'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'expired';

export type MilestoneStatus = 
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'disputed'
  | 'cancelled';

export type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'evidence_required'
  | 'mediation'
  | 'resolved_client'
  | 'resolved_tasker'
  | 'resolved_split';

export interface EscrowMilestone {
  id: string;
  escrowId: string;
  title: string;
  description: string;
  amount: number;
  percentage: number;
  dueDate?: Date;
  status: MilestoneStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  submissionNotes?: string;
  approvalNotes?: string;
  deliverables: {
    id: string;
    name: string;
    type: 'file' | 'link' | 'text';
    content: string;
    uploadedAt: Date;
  }[];
  autoApprovalDays?: number;
  requiresClientApproval: boolean;
}

export interface EscrowTransaction {
  id: string;
  taskId: string;
  clientId: string;
  taskerId: string;
  totalAmount: number;
  currency: string;
  status: EscrowStatus;
  milestones: EscrowMilestone[];
  platformFee: number;
  taskerAmount: number;
  clientAmount: number;
  createdAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
  expiresAt?: Date;
  autoReleaseDate?: Date;
  metadata: Record<string, any>;
  
  // Dispute information
  dispute?: {
    id: string;
    status: DisputeStatus;
    initiatedBy: 'client' | 'tasker';
    reason: string;
    description: string;
    evidence: DisputeEvidence[];
    mediatorId?: string;
    resolution?: DisputeResolution;
    createdAt: Date;
    resolvedAt?: Date;
  };
  
  // Payment tracking
  paymentIntent?: {
    id: string;
    gateway: string;
    status: string;
    clientSecret?: string;
  };
  
  // Release tracking
  releases: {
    id: string;
    milestoneId?: string;
    amount: number;
    releasedAt: Date;
    reason: string;
    initiatedBy: 'client' | 'auto' | 'admin';
  }[];
}

export interface DisputeEvidence {
  id: string;
  type: 'communication' | 'deliverable' | 'screenshot' | 'document' | 'other';
  title: string;
  description: string;
  fileUrl?: string;
  submittedBy: 'client' | 'tasker';
  submittedAt: Date;
}

export interface DisputeResolution {
  type: 'full_refund' | 'partial_refund' | 'release_payment' | 'split_payment';
  clientAmount: number;
  taskerAmount: number;
  reasoning: string;
  resolvedBy: 'mediator' | 'admin' | 'automated';
}

export interface EscrowSettings {
  defaultAutoReleaseDays: number;
  maxEscrowDuration: number;
  minimumMilestoneAmount: number;
  maximumMilestones: number;
  disputeTimeoutDays: number;
  evidenceSubmissionDays: number;
  platformFeePercentage: number;
  instantReleaseEnabled: boolean;
  autoApprovalEnabled: boolean;
}

/**
 * Create a new escrow transaction with milestones
 */
export async function createEscrowTransaction(
  taskId: string,
  clientId: string,
  taskerId: string,
  totalAmount: number,
  milestones: Omit<EscrowMilestone, 'id' | 'escrowId' | 'status' | 'deliverables'>[],
  settings?: Partial<EscrowSettings>
): Promise<ApiResponse<EscrowTransaction>> {
  try {
    return await apiClient.post('/escrow/transactions', {
      taskId,
      clientId,
      taskerId,
      totalAmount,
      milestones,
      settings
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to create escrow transaction');
    throw error;
  }
}

/**
 * Fund an escrow transaction
 */
export async function fundEscrowTransaction(
  escrowId: string,
  paymentMethodId: string,
  gateway: string = 'stripe'
): Promise<ApiResponse<{ paymentIntent: any; clientSecret: string }>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/fund`, {
      paymentMethodId,
      gateway
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to fund escrow transaction');
    throw error;
  }
}

/**
 * Submit milestone deliverables
 */
export async function submitMilestoneDeliverables(
  escrowId: string,
  milestoneId: string,
  deliverables: Array<{
    name: string;
    type: 'file' | 'link' | 'text';
    content: string;
  }>,
  notes?: string
): Promise<ApiResponse<EscrowMilestone>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/milestones/${milestoneId}/submit`, {
      deliverables,
      notes
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to submit milestone deliverables');
    throw error;
  }
}

/**
 * Approve milestone completion
 */
export async function approveMilestone(
  escrowId: string,
  milestoneId: string,
  notes?: string,
  rating?: number
): Promise<ApiResponse<EscrowMilestone>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/milestones/${milestoneId}/approve`, {
      notes,
      rating
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to approve milestone');
    throw error;
  }
}

/**
 * Initiate dispute for milestone or entire transaction
 */
export async function initiateDispute(
  escrowId: string,
  reason: string,
  description: string,
  milestoneId?: string,
  evidence?: Array<{
    type: DisputeEvidence['type'];
    title: string;
    description: string;
    fileUrl?: string;
  }>
): Promise<ApiResponse<EscrowTransaction>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/dispute`, {
      reason,
      description,
      milestoneId,
      evidence
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to initiate dispute');
    throw error;
  }
}

/**
 * Submit additional evidence for dispute
 */
export async function submitDisputeEvidence(
  escrowId: string,
  evidence: Array<{
    type: DisputeEvidence['type'];
    title: string;
    description: string;
    fileUrl?: string;
  }>
): Promise<ApiResponse<DisputeEvidence[]>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/dispute/evidence`, {
      evidence
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to submit dispute evidence');
    throw error;
  }
}

/**
 * Release payment for completed milestones
 */
export async function releaseMilestonePayment(
  escrowId: string,
  milestoneId: string,
  amount?: number,
  reason?: string
): Promise<ApiResponse<EscrowTransaction>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/milestones/${milestoneId}/release`, {
      amount,
      reason
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to release milestone payment');
    throw error;
  }
}

/**
 * Cancel escrow transaction and process refund
 */
export async function cancelEscrowTransaction(
  escrowId: string,
  reason: string,
  refundAmount?: number
): Promise<ApiResponse<EscrowTransaction>> {
  try {
    return await apiClient.post(`/escrow/transactions/${escrowId}/cancel`, {
      reason,
      refundAmount
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to cancel escrow transaction');
    throw error;
  }
}

/**
 * Get escrow transaction details
 */
export async function getEscrowTransaction(escrowId: string): Promise<ApiResponse<EscrowTransaction>> {
  try {
    return await apiClient.get(`/escrow/transactions/${escrowId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch escrow transaction');
    throw error;
  }
}

/**
 * Get escrow transactions for user
 */
export async function getUserEscrowTransactions(
  userId: string,
  status?: EscrowStatus[],
  page: number = 1,
  limit: number = 20
): Promise<ApiResponse<{
  transactions: EscrowTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>> {
  try {
    return await apiClient.get('/escrow/transactions', {
      userId,
      status: status?.join(','),
      page,
      limit
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch user escrow transactions');
    throw error;
  }
}

/**
 * Get escrow settings
 */
export async function getEscrowSettings(): Promise<ApiResponse<EscrowSettings>> {
  try {
    return await apiClient.get('/escrow/settings');
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch escrow settings');
    throw error;
  }
}

// Export service object
export const escrowManagementService = {
  createEscrowTransaction,
  fundEscrowTransaction,
  submitMilestoneDeliverables,
  approveMilestone,
  initiateDispute,
  submitDisputeEvidence,
  releaseMilestonePayment,
  cancelEscrowTransaction,
  getEscrowTransaction,
  getUserEscrowTransactions,
  getEscrowSettings
};

export default escrowManagementService;
