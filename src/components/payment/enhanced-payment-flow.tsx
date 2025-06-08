/**
 * Enhanced Payment Flow Component
 * 
 * Comprehensive payment flow with multi-gateway support, fraud detection,
 * escrow management, and milestone-based payments for marketplace transactions.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    EscrowTransaction,
    escrowManagementService
} from '@/services/payment/escrow-management-service';
import {
    FraudAssessment,
    PaymentGateway,
    PaymentIntent,
    paymentGatewayService
} from '@/services/payment/payment-gateway-service';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle,
    CreditCard,
    Lock,
    Shield,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
// Note: Using service types directly for consistency
// import { EscrowService } from './escrow-service';
import { PaymentMethodSelector } from './payment-method-selector';

export interface PaymentFlowProps {
  taskId: string;
  clientId: string;
  taskerId: string;
  amount: number;
  currency?: string;
  milestones?: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate?: Date;
  }>;
  onPaymentComplete: (escrowTransaction: EscrowTransaction) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

type PaymentStep = 
  | 'method_selection'
  | 'fraud_check'
  | 'payment_processing'
  | 'escrow_setup'
  | 'confirmation';

interface PaymentState {
  step: PaymentStep;
  selectedGateway?: PaymentGateway;
  selectedMethodId?: string;
  paymentIntent?: PaymentIntent;
  fraudAssessment?: FraudAssessment;
  escrowTransaction?: EscrowTransaction;
  paymentMethods: any[];
  isLoadingMethods: boolean;
  isProcessing: boolean;
  error?: string;
}

/**
 * Payment Step Indicator
 */
const PaymentStepIndicator: React.FC<{
  currentStep: PaymentStep;
  steps: Array<{ key: PaymentStep; label: string; icon: React.ComponentType<any> }>;
}> = ({ currentStep, steps }) => {
  const currentIndex = steps.findIndex(step => step.key === currentStep);
  
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const IconComponent = step.icon;
        
        return (
          <div key={step.key} className="flex items-center">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
              isCompleted && "bg-primary-600 border-primary-600 text-white",
              isCurrent && "border-primary-600 text-primary-600 bg-primary-50",
              !isCompleted && !isCurrent && "border-neutral-300 text-neutral-400"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <IconComponent className="w-5 h-5" />
              )}
            </div>
            
            <div className="ml-3">
              <div className={cn(
                "text-sm font-medium",
                (isCompleted || isCurrent) && "text-neutral-900",
                !isCompleted && !isCurrent && "text-neutral-500"
              )}>
                {step.label}
              </div>
            </div>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-4 transition-all duration-200",
                isCompleted ? "bg-primary-600" : "bg-neutral-200"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Fraud Assessment Display
 */
const FraudAssessmentDisplay: React.FC<{
  assessment: FraudAssessment;
  onProceed: () => void;
  onCancel: () => void;
}> = ({ assessment, onProceed, onCancel }) => {
  const getRiskColor = (level: FraudAssessment['riskLevel']) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Risk Level</span>
          <Badge className={cn("border", getRiskColor(assessment.riskLevel))}>
            {assessment.riskLevel.toUpperCase()} ({assessment.riskScore}/100)
          </Badge>
        </div>
        
        <div className="space-y-2">
          <span className="font-medium text-sm">Security Checks</span>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(assessment.factors).map(([key, passed]) => (
              <div key={key} className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>
        
        {assessment.recommendations.length > 0 && (
          <div className="space-y-2">
            <span className="font-medium text-sm">Recommendations</span>
            <ul className="text-sm text-neutral-600 space-y-1">
              {assessment.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onProceed}
            disabled={assessment.requiresManualReview}
            className="flex-1"
          >
            {assessment.requiresManualReview ? 'Manual Review Required' : 'Proceed with Payment'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Enhanced Payment Flow Component
 */
export const EnhancedPaymentFlow: React.FC<PaymentFlowProps> = ({
  taskId,
  clientId,
  taskerId,
  amount,
  currency = 'USD',
  milestones = [],
  onPaymentComplete,
  onPaymentError,
  className
}) => {
  const [state, setState] = useState<PaymentState>({
    step: 'method_selection',
    paymentMethods: [],
    isLoadingMethods: true,
    isProcessing: false
  });

  const paymentSteps = [
    { key: 'method_selection' as PaymentStep, label: 'Payment Method', icon: CreditCard },
    { key: 'fraud_check' as PaymentStep, label: 'Security Check', icon: Shield },
    { key: 'payment_processing' as PaymentStep, label: 'Processing', icon: Zap },
    { key: 'escrow_setup' as PaymentStep, label: 'Escrow Setup', icon: Lock },
    { key: 'confirmation' as PaymentStep, label: 'Confirmation', icon: CheckCircle }
  ];

  // Load payment methods on component mount
  React.useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        // Simulate loading payment methods
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock payment methods for demonstration
        const mockMethods = [
          { id: 'card_1', type: 'credit_card', last4: '4242', brand: 'visa' },
          { id: 'card_2', type: 'credit_card', last4: '5555', brand: 'mastercard' }
        ];

        setState(prev => ({
          ...prev,
          paymentMethods: mockMethods,
          isLoadingMethods: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to load payment methods',
          isLoadingMethods: false
        }));
      }
    };

    loadPaymentMethods();
  }, []);

  // Handle payment method selection
  const handleMethodSelect = async (methodId: string, gateway: PaymentGateway) => {
    setState(prev => ({ ...prev, selectedMethodId: methodId, selectedGateway: gateway }));
  };

  // Process fraud assessment
  const handleFraudCheck = async () => {
    if (!state.selectedMethodId) return;

    setState(prev => ({ ...prev, isProcessing: true, step: 'fraud_check' }));

    try {
      const response = await paymentGatewayService.assessFraudRisk(
        amount,
        state.selectedMethodId,
        navigator.userAgent,
        '', // IP address would be determined server-side
        { taskId, clientId, taskerId }
      );

      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          fraudAssessment: response.data,
          isProcessing: false 
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Fraud assessment failed',
        isProcessing: false 
      }));
    }
  };

  // Process payment
  const handlePaymentProcess = async () => {
    if (!state.selectedGateway || !state.selectedMethodId) return;

    setState(prev => ({ ...prev, isProcessing: true, step: 'payment_processing' }));

    try {
      // Create payment intent
      const intentResponse = await paymentGatewayService.createPaymentIntent(
        state.selectedGateway,
        amount,
        currency,
        { taskId, clientId, taskerId }
      );

      if (intentResponse.success) {
        setState(prev => ({ 
          ...prev, 
          paymentIntent: intentResponse.data,
          step: 'escrow_setup'
        }));
        
        // Setup escrow transaction
        await handleEscrowSetup();
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Payment processing failed',
        isProcessing: false 
      }));
      onPaymentError('Payment processing failed');
    }
  };

  // Setup escrow transaction
  const handleEscrowSetup = async () => {
    try {
      const escrowResponse = await escrowManagementService.createEscrowTransaction(
        taskId,
        clientId,
        taskerId,
        amount,
        milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          percentage: (milestone.amount / amount) * 100,
          dueDate: milestone.dueDate,
          requiresClientApproval: true
        }))
      );

      if (escrowResponse.success && escrowResponse.data) {
        setState(prev => ({
          ...prev,
          escrowTransaction: escrowResponse.data,
          step: 'confirmation',
          isProcessing: false
        }));

        onPaymentComplete(escrowResponse.data);
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Escrow setup failed',
        isProcessing: false 
      }));
      onPaymentError('Escrow setup failed');
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (state.step) {
      case 'method_selection':
        return (
          <div className="space-y-6">
            {state.isLoadingMethods ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p>Loading payment methods...</p>
              </div>
            ) : (
              <PaymentMethodSelector
                paymentMethods={state.paymentMethods}
                selectedMethodId={state.selectedMethodId}
                onMethodSelect={(methodId) => setState(prev => ({ ...prev, selectedMethodId: methodId }))}
                onAddMethod={(gateway) => handleMethodSelect('new', gateway)}
              />
            )}
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-neutral-600">
                Total: <span className="font-semibold text-lg">${amount.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleFraudCheck}
                disabled={!state.selectedMethodId || state.isProcessing}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Continue to Security Check
              </Button>
            </div>
          </div>
        );

      case 'fraud_check':
        return state.fraudAssessment ? (
          <FraudAssessmentDisplay
            assessment={state.fraudAssessment}
            onProceed={handlePaymentProcess}
            onCancel={() => setState(prev => ({ ...prev, step: 'method_selection' }))}
          />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Running security assessment...</p>
          </div>
        );

      case 'payment_processing':
        return (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Processing your payment securely...</p>
          </div>
        );

      case 'escrow_setup':
        return (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Setting up secure escrow...</p>
          </div>
        );

      case 'confirmation':
        return state.escrowTransaction ? (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-neutral-600">
                Your payment has been securely processed and held in escrow.
              </p>
            </div>
            
            {/* EscrowService component would be rendered here */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                Escrow transaction created successfully!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Transaction ID: {state.escrowTransaction.id}
              </p>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={cn("enhanced-payment-flow max-w-2xl mx-auto", className)}>
      <PaymentStepIndicator currentStep={state.step} steps={paymentSteps} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
      
      {state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Payment Error</span>
          </div>
          <p className="text-red-700 mt-1">{state.error}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedPaymentFlow;
