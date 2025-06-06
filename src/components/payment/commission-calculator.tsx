/**
 * Commission Calculator Component
 * 
 * Dynamic commission calculation system with tiered pricing and real-time updates.
 * Implements project-map specifications for marketplace fee structure.
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import { Award, Calculator, DollarSign, Info, Percent, TrendingUp } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type UserTier = 'basic' | 'verified' | 'professional' | 'elite';
export type TaskCategory = 'cleaning' | 'handyman' | 'delivery' | 'creative' | 'tech' | 'other';

export interface CommissionTier {
  tier: UserTier;
  name: string;
  baseRate: number; // Base commission percentage
  minRate: number;  // Minimum commission percentage
  maxRate: number;  // Maximum commission percentage
  volumeDiscount: number; // Discount per $1000 in monthly volume
  benefits: string[];
  color: string;
}

export interface CommissionCalculation {
  taskAmount: number;
  baseCommission: number;
  platformFee: number;
  paymentProcessingFee: number;
  totalFees: number;
  taskerReceives: number;
  clientPays: number;
  effectiveRate: number;
}

interface CommissionCalculatorProps {
  userTier: UserTier;
  monthlyVolume?: number;
  taskCategory?: TaskCategory;
  onCalculationChange?: (calculation: CommissionCalculation) => void;
  className?: string;
  showBreakdown?: boolean;
}

// Commission tier configuration
const COMMISSION_TIERS: Record<UserTier, CommissionTier> = {
  basic: {
    tier: 'basic',
    name: 'Basic',
    baseRate: 20,
    minRate: 15,
    maxRate: 25,
    volumeDiscount: 0.1,
    benefits: ['Standard support', 'Basic profile'],
    color: 'bg-neutral-500',
  },
  verified: {
    tier: 'verified',
    name: 'Verified',
    baseRate: 15,
    minRate: 12,
    maxRate: 18,
    volumeDiscount: 0.15,
    benefits: ['Priority support', 'Verified badge', 'Enhanced profile'],
    color: 'bg-blue-500',
  },
  professional: {
    tier: 'professional',
    name: 'Professional',
    baseRate: 12,
    minRate: 8,
    maxRate: 15,
    volumeDiscount: 0.2,
    benefits: ['Premium support', 'Professional badge', 'Advanced analytics'],
    color: 'bg-primary-600',
  },
  elite: {
    tier: 'elite',
    name: 'Elite',
    baseRate: 8,
    minRate: 5,
    maxRate: 12,
    volumeDiscount: 0.25,
    benefits: ['VIP support', 'Elite badge', 'Custom branding', 'Priority placement'],
    color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  },
};

// Category multipliers
const CATEGORY_MULTIPLIERS: Record<TaskCategory, number> = {
  cleaning: 1.0,
  handyman: 1.1,
  delivery: 0.9,
  creative: 1.2,
  tech: 1.3,
  other: 1.0,
};

/**
 * Commission Calculator Component
 */
export const CommissionCalculator: React.FC<CommissionCalculatorProps> = ({
  userTier,
  monthlyVolume = 0,
  taskCategory = 'other',
  onCalculationChange,
  className,
  showBreakdown = true,
}) => {
  const [taskAmount, setTaskAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('100');

  const tierConfig = COMMISSION_TIERS[userTier];
  const categoryMultiplier = CATEGORY_MULTIPLIERS[taskCategory];

  // Calculate dynamic commission rate
  const calculation = useMemo((): CommissionCalculation => {
    const volumeDiscount = Math.min(
      (monthlyVolume / 1000) * tierConfig.volumeDiscount,
      tierConfig.baseRate - tierConfig.minRate
    );
    
    const adjustedRate = Math.max(
      tierConfig.minRate,
      tierConfig.baseRate - volumeDiscount
    );
    
    const categoryAdjustedRate = adjustedRate * categoryMultiplier;
    const finalRate = Math.min(categoryAdjustedRate, tierConfig.maxRate);
    
    const baseCommission = (taskAmount * finalRate) / 100;
    const paymentProcessingFee = taskAmount * 0.029 + 0.30; // 2.9% + 30¢
    const platformFee = baseCommission;
    const totalFees = platformFee + paymentProcessingFee;
    const taskerReceives = taskAmount - totalFees;
    const clientPays = taskAmount + paymentProcessingFee;
    const effectiveRate = (totalFees / taskAmount) * 100;

    return {
      taskAmount,
      baseCommission,
      platformFee,
      paymentProcessingFee,
      totalFees,
      taskerReceives,
      clientPays,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
    };
  }, [taskAmount, tierConfig, categoryMultiplier, monthlyVolume]);

  // Update calculation when values change
  React.useEffect(() => {
    onCalculationChange?.(calculation);
  }, [calculation, onCalculationChange]);

  // Handle amount changes
  const handleAmountChange = useCallback((value: number[]) => {
    const newAmount = value[0];
    setTaskAmount(newAmount);
    setCustomAmount(newAmount.toString());
  }, []);

  const handleCustomAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomAmount(value);
    const numValue = parseFloat(value) || 0;
    if (numValue >= 5 && numValue <= 10000) {
      setTaskAmount(numValue);
    }
  }, []);

  return (
    <TooltipProvider>
      <div className={cn("commission-calculator space-y-6", className)}>
        {/* Header */}
        <Card className="border-2 border-primary-200 bg-primary-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-heading text-primary-900">
                    Commission Calculator
                  </CardTitle>
                  <p className="text-sm text-primary-700 font-body">
                    Calculate your earnings and fees
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <Badge className={cn("text-white font-medium", tierConfig.color)}>
                  {tierConfig.name} Tier
                </Badge>
                <p className="text-xs text-primary-700 mt-1">
                  {tierConfig.baseRate}% base rate
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Task Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount-input" className="text-sm font-medium">
                Enter task amount
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="amount-input"
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="100"
                  className="pl-10"
                  min="5"
                  max="10000"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick amounts</Label>
              <Slider
                value={[taskAmount]}
                onValueChange={handleAmountChange}
                max={1000}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>$5</span>
                <span>$250</span>
                <span>$500</span>
                <span>$1000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Results */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="text-2xl font-bold text-green-700 font-heading">
                  ${calculation.taskerReceives.toFixed(2)}
                </div>
                <div className="text-sm text-green-600 font-body">You Receive</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="text-2xl font-bold text-blue-700 font-heading">
                  ${calculation.clientPays.toFixed(2)}
                </div>
                <div className="text-sm text-blue-600 font-body">Client Pays</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="text-center p-4 bg-neutral-50 border border-neutral-200 rounded-lg"
              >
                <div className="text-2xl font-bold text-neutral-700 font-heading">
                  {calculation.effectiveRate}%
                </div>
                <div className="text-sm text-neutral-600 font-body">Effective Rate</div>
              </motion.div>
            </div>

            {showBreakdown && (
              <div className="space-y-3">
                <h4 className="font-medium text-neutral-900 font-heading">Fee Breakdown</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 font-body">Task Amount</span>
                    <span className="font-medium">${calculation.taskAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-600 font-body">Platform Fee</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Commission based on your {tierConfig.name} tier</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium text-red-600">
                      -${calculation.platformFee.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-neutral-600 font-body">Payment Processing</span>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-neutral-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>2.9% + $0.30 payment processing fee</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-medium text-red-600">
                      -${calculation.paymentProcessingFee.toFixed(2)}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-base font-semibold">
                    <span className="font-heading">You Receive</span>
                    <span className="text-green-600">
                      ${calculation.taskerReceives.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Benefits */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Your Tier Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-neutral-900 font-heading mb-2">
                  Commission Rate
                </h4>
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-primary-600" />
                  <span className="text-sm text-neutral-600 font-body">
                    {tierConfig.minRate}% - {tierConfig.maxRate}% 
                    (Base: {tierConfig.baseRate}%)
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-neutral-900 font-heading mb-2">
                  Volume Discount
                </h4>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-neutral-600 font-body">
                    {tierConfig.volumeDiscount}% per $1,000 monthly volume
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-neutral-900 font-heading mb-2">
                Tier Benefits
              </h4>
              <div className="flex flex-wrap gap-2">
                {tierConfig.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Notice */}
        {userTier !== 'elite' && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-900 font-heading">
                    Upgrade Your Tier
                  </h4>
                  <p className="text-sm text-yellow-700 font-body mt-1">
                    Upgrade to {userTier === 'basic' ? 'Verified' : userTier === 'verified' ? 'Professional' : 'Elite'} tier 
                    to reduce your commission rate and unlock additional benefits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default CommissionCalculator;
