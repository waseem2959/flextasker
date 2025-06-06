/**
 * Payment Method Selector Component
 * 
 * Multi-gateway payment method selection with enhanced UI using teal-mint color system.
 * Supports Stripe, PayPal, Square, and other payment providers.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Building, Check, CreditCard, Plus, Shield, Wallet } from 'lucide-react';
import React, { useState } from 'react';

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'apple-pay' | 'google-pay';

export interface PaymentMethod {
  id: string;
  provider: PaymentProvider;
  type: 'card' | 'bank' | 'wallet' | 'crypto';
  displayName: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  brand?: string;
  isDefault: boolean;
  isVerified: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId?: string;
  onMethodSelect: (methodId: string) => void;
  onAddMethod: (provider: PaymentProvider) => void;
  showAddMethod?: boolean;
  className?: string;
  disabled?: boolean;
}

// Payment provider configuration
const PAYMENT_PROVIDERS: Record<PaymentProvider, {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  fees: string;
  processingTime: string;
}> = {
  stripe: {
    name: 'Stripe',
    icon: CreditCard,
    color: 'bg-blue-600',
    description: 'Credit/Debit Cards',
    fees: '2.9% + 30¢',
    processingTime: 'Instant',
  },
  paypal: {
    name: 'PayPal',
    icon: Wallet,
    color: 'bg-blue-500',
    description: 'PayPal Balance & Cards',
    fees: '2.9% + 30¢',
    processingTime: 'Instant',
  },
  square: {
    name: 'Square',
    icon: Building,
    color: 'bg-gray-800',
    description: 'Square Payment',
    fees: '2.6% + 10¢',
    processingTime: '1-2 business days',
  },
  'apple-pay': {
    name: 'Apple Pay',
    icon: CreditCard,
    color: 'bg-gray-900',
    description: 'Apple Pay',
    fees: '2.9% + 30¢',
    processingTime: 'Instant',
  },
  'google-pay': {
    name: 'Google Pay',
    icon: Wallet,
    color: 'bg-green-600',
    description: 'Google Pay',
    fees: '2.9% + 30¢',
    processingTime: 'Instant',
  },
};

/**
 * Payment Method Card Component
 */
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}> = ({ method, isSelected, onSelect, disabled }) => {
  const provider = PAYMENT_PROVIDERS[method.provider];
  const IconComponent = provider.icon;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative w-full cursor-pointer transition-all duration-200 text-left",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      aria-label={`Select ${method.displayName} payment method`}
      aria-pressed={isSelected}
    >
      <Card className={cn(
        "border-2 transition-all duration-200 hover:shadow-md",
        isSelected 
          ? "border-primary-500 bg-primary-50 shadow-lg shadow-primary-500/10" 
          : "border-neutral-200 hover:border-primary-300",
        disabled && "hover:border-neutral-200 hover:shadow-none"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Provider Icon */}
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                provider.color
              )}>
                <IconComponent className="w-5 h-5" />
              </div>
              
              {/* Method Details */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 font-heading">
                    {method.displayName}
                  </span>
                  {method.isDefault && (
                    <Badge variant="secondary" className="text-xs bg-primary-100 text-primary-800">
                      Default
                    </Badge>
                  )}
                  {method.isVerified && (
                    <Shield className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="text-sm text-neutral-600 font-body">
                  {provider.description}
                  {method.last4 && ` •••• ${method.last4}`}
                  {method.expiryMonth && method.expiryYear && 
                    ` • ${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}`
                  }
                </div>
              </div>
            </div>

            {/* Selection Indicator */}
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              isSelected 
                ? "border-primary-500 bg-primary-500" 
                : "border-neutral-300"
            )}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <div className="flex justify-between text-xs text-neutral-500">
              <span>Fee: {provider.fees}</span>
              <span>Processing: {provider.processingTime}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.button>
  );
};

/**
 * Add Payment Method Card Component
 */
const AddPaymentMethodCard: React.FC<{
  onAddMethod: (provider: PaymentProvider) => void;
  disabled?: boolean;
}> = ({ onAddMethod, disabled }) => {
  const [showProviders, setShowProviders] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-all duration-200 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed hover:border-neutral-300"
      )}>
        <CardContent className="p-6">
          {!showProviders ? (
            <button
              type="button"
              className="w-full text-center p-4 hover:bg-neutral-50 rounded-lg transition-colors"
              onClick={!disabled ? () => setShowProviders(true) : undefined}
              disabled={disabled}
              aria-label="Add new payment method"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-neutral-600" />
              </div>
              <h3 className="font-medium text-neutral-900 font-heading mb-1">
                Add Payment Method
              </h3>
              <p className="text-sm text-neutral-600 font-body">
                Add a new payment method for secure transactions
              </p>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-neutral-900 font-heading">
                  Choose Provider
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProviders(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(PAYMENT_PROVIDERS).map(([key, provider]) => (
                  <Button
                    key={key}
                    variant="outline"
                    onClick={() => {
                      onAddMethod(key as PaymentProvider);
                      setShowProviders(false);
                    }}
                    className="justify-start h-auto p-3"
                    disabled={disabled}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded mr-3 flex items-center justify-center text-white",
                      provider.color
                    )}>
                      <provider.icon className="w-3 h-3" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-xs text-neutral-600">{provider.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Main Payment Method Selector Component
 */
export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  selectedMethodId,
  onMethodSelect,
  onAddMethod,
  showAddMethod = true,
  className,
  disabled = false,
}) => {
  const selectedMethod = paymentMethods.find(method => method.id === selectedMethodId);

  return (
    <div className={cn("payment-method-selector space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-heading font-semibold text-neutral-900">
            Payment Method
          </h3>
          <p className="text-sm text-neutral-600 font-body">
            Choose how you'd like to pay for this task
          </p>
        </div>
        
        {selectedMethod && (
          <Badge variant="outline" className="bg-primary-50 text-primary-800 border-primary-200">
            {PAYMENT_PROVIDERS[selectedMethod.provider].name} Selected
          </Badge>
        )}
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={method.id === selectedMethodId}
              onSelect={() => onMethodSelect(method.id)}
              disabled={disabled}
            />
          ))}
          
          {showAddMethod && (
            <AddPaymentMethodCard
              onAddMethod={onAddMethod}
              disabled={disabled}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-primary-50 border border-primary-200 rounded-lg">
        <Shield className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-primary-900 font-heading">
            Secure Payment Processing
          </p>
          <p className="text-primary-700 font-body mt-1">
            All payments are processed securely through our trusted payment partners. 
            Your payment information is encrypted and never stored on our servers.
          </p>
        </div>
      </div>

      {/* Error State */}
      {paymentMethods.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-900 font-heading mb-1">
            No Payment Methods
          </h3>
          <p className="text-sm text-neutral-600 font-body mb-4">
            Add a payment method to continue with your transaction
          </p>
          {showAddMethod && (
            <Button
              onClick={() => onAddMethod('stripe')}
              disabled={disabled}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              Add Payment Method
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
