/**
 * Budget Utilities
 * 
 * Centralized budget formatting and calculation utilities
 * to eliminate duplication across components
 */

import { BudgetType } from '@/types';

export interface BudgetObject {
  type: BudgetType;
  min?: number;
  max?: number;
  currency?: string;
}

/**
 * Format budget display string based on budget type and values
 */
export const formatTaskBudget = (
  budget: number | BudgetObject | null | undefined,
  type?: BudgetType
): string => {
  if (!budget) {
    return 'Budget not specified';
  }

  // Handle number input (legacy support)
  if (typeof budget === 'number') {
    const budgetType = type || BudgetType.FIXED;
    switch (budgetType) {
      case BudgetType.HOURLY:
        return `$${budget.toFixed(2)}/hr`;
      case BudgetType.NEGOTIABLE:
        return 'Negotiable';
      default:
        return `$${budget.toFixed(2)}`;
    }
  }

  // Handle budget object
  const { type: budgetType, min, max, currency = 'USD' } = budget;
  const currencySymbol = getCurrencySymbol(currency);

  switch (budgetType) {
    case BudgetType.HOURLY:
      return min ? `${currencySymbol}${min.toFixed(2)}/hr` : 'Hourly rate TBD';
    
    case BudgetType.NEGOTIABLE:
      return 'Negotiable';
    
    case BudgetType.FIXED:
    default:
      if (min && max && min !== max) {
        return `${currencySymbol}${min.toFixed(2)} - ${currencySymbol}${max.toFixed(2)}`;
      } else if (min) {
        return `${currencySymbol}${min.toFixed(2)}`;
      }
      return 'Fixed price TBD';
  }
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    JPY: '¥',
  };
  
  return symbols[currency] || currency;
};

/**
 * Calculate platform fee based on budget amount
 */
export const calculatePlatformFee = (amount: number, feePercentage: number = 0.05): number => {
  return Math.round(amount * feePercentage * 100) / 100;
};

/**
 * Calculate total cost including platform fee
 */
export const calculateTotalCost = (amount: number, feePercentage: number = 0.05): number => {
  return amount + calculatePlatformFee(amount, feePercentage);
};

/**
 * Validate budget values
 */
export const validateBudget = (budget: BudgetObject): string[] => {
  const errors: string[] = [];

  if (!budget.type) {
    errors.push('Budget type is required');
  }

  if (budget.type !== BudgetType.NEGOTIABLE) {
    if (!budget.min || budget.min <= 0) {
      errors.push('Budget amount must be greater than 0');
    }

    if (budget.max && budget.min && budget.max < budget.min) {
      errors.push('Maximum budget cannot be less than minimum budget');
    }
  }

  return errors;
};

/**
 * Create budget object from form values
 */
export const createBudgetObject = (
  type: BudgetType,
  min?: number,
  max?: number,
  currency: string = 'USD'
): BudgetObject => {
  return {
    type,
    min: type !== BudgetType.NEGOTIABLE ? min : undefined,
    max: type === BudgetType.FIXED ? max : undefined,
    currency,
  };
};