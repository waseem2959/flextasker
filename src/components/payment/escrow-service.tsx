/**
 * Escrow Service Component
 * 
 * Secure escrow service for marketplace transactions with milestone tracking.
 * Implements project-map specifications for trust and payment security.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Calendar, CheckCircle, Clock, DollarSign, FileText, Shield } from 'lucide-react';
import React, { useCallback, useState } from 'react';

export type EscrowStatus =
  | 'pending'
  | 'funded'
  | 'in-progress'
  | 'milestone-pending'
  | 'dispute'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type UserRole = 'client' | 'tasker' | 'admin';
export type MilestoneAction = 'approve' | 'dispute' | 'submit';
export type TransactionAction = 'fund' | 'cancel' | 'complete' | 'refund';

export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'submitted' | 'approved' | 'disputed';
  submittedAt?: Date;
  approvedAt?: Date;
  notes?: string;
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
  createdAt: Date;
  fundedAt?: Date;
  completedAt?: Date;
  disputeReason?: string;
  platformFee: number;
  taskerAmount: number;
  refundAmount?: number;
}

interface EscrowServiceProps {
  transaction: EscrowTransaction;
  userRole: UserRole;
  onMilestoneAction: (milestoneId: string, action: MilestoneAction) => void;
  onTransactionAction: (action: TransactionAction) => void;
  className?: string;
}

/**
 * Escrow Status Badge Component
 */
const EscrowStatusBadge: React.FC<{ status: EscrowStatus }> = ({ status }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending Payment' },
    funded: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Funded' },
    'in-progress': { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'In Progress' },
    'milestone-pending': { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Milestone Review' },
    dispute: { color: 'bg-red-100 text-red-800 border-red-300', label: 'In Dispute' },
    completed: { color: 'bg-primary-100 text-primary-800 border-primary-300', label: 'Completed' },
    cancelled: { color: 'bg-neutral-100 text-neutral-800 border-neutral-300', label: 'Cancelled' },
    refunded: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Refunded' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("font-medium border-2", config.color)}>
      {config.label}
    </Badge>
  );
};

/**
 * Milestone Card Component
 */
const MilestoneCard: React.FC<{
  milestone: EscrowMilestone;
  userRole: 'client' | 'tasker' | 'admin';
  onAction: (action: 'approve' | 'dispute' | 'submit') => void;
  currency: string;
}> = ({ milestone, userRole, onAction, currency }) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusIcon = (status: EscrowMilestone['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-neutral-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'submitted':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disputed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const canSubmit = userRole === 'tasker' && milestone.status === 'in-progress';
  const canApprove = userRole === 'client' && milestone.status === 'submitted';
  const canDispute = userRole === 'client' && milestone.status === 'submitted';

  return (
    <Card className={cn(
      "transition-all duration-200",
      milestone.status === 'approved' && "border-green-200 bg-green-50",
      milestone.status === 'disputed' && "border-red-200 bg-red-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(milestone.status)}
              <h4 className="font-medium text-neutral-900 font-heading">
                {milestone.title}
              </h4>
              <Badge variant="outline" className="text-xs">
                {milestone.status.replace('-', ' ')}
              </Badge>
            </div>
            
            <p className="text-sm text-neutral-600 font-body mb-3">
              {milestone.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                    }).format(milestone.amount)}
                  </span>
                </div>
                
                {milestone.dueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{milestone.dueDate.toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              {(canSubmit || canApprove || canDispute) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="text-primary-600 border-primary-300 hover:bg-primary-50"
                >
                  Actions
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-neutral-200"
            >
              <div className="flex gap-2">
                {canSubmit && (
                  <Button
                    size="sm"
                    onClick={() => onAction('submit')}
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    Submit for Review
                  </Button>
                )}
                
                {canApprove && (
                  <Button
                    size="sm"
                    onClick={() => onAction('approve')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Approve
                  </Button>
                )}
                
                {canDispute && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction('dispute')}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Dispute
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

/**
 * Main Escrow Service Component
 */
export const EscrowService: React.FC<EscrowServiceProps> = ({
  transaction,
  userRole,
  onMilestoneAction,
  onTransactionAction,
  className,
}) => {
  // Note: Dispute form UI to be implemented in future iteration
  // const [showDisputeForm, setShowDisputeForm] = useState(false);
  // const [disputeReason, setDisputeReason] = useState('');

  // Calculate progress
  const completedMilestones = transaction.milestones.filter(m => m.status === 'approved').length;
  const totalMilestones = transaction.milestones.length;
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  // Handle milestone actions
  const handleMilestoneAction = useCallback((milestoneId: string, action: MilestoneAction) => {
    try {
      onMilestoneAction(milestoneId, action);
    } catch (error) {
      console.error('Milestone action failed:', error);
      // In a real app, this would show a user-friendly error message
    }
  }, [onMilestoneAction]);

  // Note: Dispute submission handler to be implemented with dispute form UI
  // const handleDisputeSubmit = useCallback(() => {
  //   if (disputeReason.trim()) {
  //     onDisputeSubmit(disputeReason);
  //     setShowDisputeForm(false);
  //     setDisputeReason('');
  //   }
  // }, [disputeReason, onDisputeSubmit]);

  // Progress steps for visualization
  const progressSteps = transaction.milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    description: `${new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: transaction.currency,
    }).format(milestone.amount)}`,
    isCompleted: milestone.status === 'approved',
    isActive: milestone.status === 'in-progress' || milestone.status === 'submitted',
  }));

  return (
    <div className={cn("escrow-service space-y-6", className)}>
      {/* Header */}
      <Card className="border-2 border-primary-200 bg-primary-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-heading text-primary-900">
                  Secure Escrow Service
                </CardTitle>
                <p className="text-primary-700 font-body">
                  Transaction ID: {transaction.id}
                </p>
              </div>
            </div>
            <EscrowStatusBadge status={transaction.status} />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900 font-heading">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: transaction.currency,
                }).format(transaction.totalAmount)}
              </div>
              <div className="text-sm text-primary-700 font-body">Total Amount</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900 font-heading">
                {completedMilestones}/{totalMilestones}
              </div>
              <div className="text-sm text-primary-700 font-body">Milestones Complete</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-900 font-heading">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-sm text-primary-700 font-body">Progress</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Progress Visualization */}
      {totalMilestones > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Milestone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressIndicator
              steps={progressSteps}
              currentStep={transaction.milestones.findIndex(m => 
                m.status === 'in-progress' || m.status === 'submitted'
              )}
              variant="default"
              showLabels={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold text-neutral-900">
          Project Milestones
        </h3>
        
        <div className="space-y-3">
          {transaction.milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              userRole={userRole}
              onAction={(action) => handleMilestoneAction(milestone.id, action)}
              currency={transaction.currency}
            />
          ))}
        </div>
      </div>

      {/* Payment Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-600 font-body">Task Amount</span>
            <span className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.currency,
              }).format(transaction.taskerAmount)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-neutral-600 font-body">Platform Fee</span>
            <span className="font-medium">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.currency,
              }).format(transaction.platformFee)}
            </span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-lg font-semibold">
            <span className="font-heading">Total</span>
            <span>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: transaction.currency,
              }).format(transaction.totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {transaction.status === 'pending' && userRole === 'client' && (
        <div className="flex gap-3">
          <Button
            onClick={() => onTransactionAction('fund')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-heading"
          >
            Fund Escrow
          </Button>
          <Button
            variant="outline"
            onClick={() => onTransactionAction('cancel')}
            className="text-neutral-600 border-neutral-300"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-green-900 font-heading">
            Protected by Escrow
          </p>
          <p className="text-green-700 font-body mt-1">
            Your payment is held securely until work is completed and approved. 
            Funds are only released when milestones are met or disputes are resolved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EscrowService;
