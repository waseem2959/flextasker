/**
 * Task Utilities
 * 
 * This file provides helper functions for working with task data,
 * especially handling complex types like budget and location.
 */

import { BudgetType } from '../types';

/**
 * Location interface with flexible typing to handle different formats
 */
export interface TaskLocation {
  isRemote: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Budget interface with standardized structure
 */
export interface TaskBudget {
  amount: number;
  type: BudgetType;
  currency?: string;
  negotiable?: boolean;
}

/**
 * Type alias for location parameter that can be string, TaskLocation, undefined or null
 */
export type LocationParam = string | TaskLocation | undefined | null;

/**
 * Type alias for budget parameter that can be number, TaskBudget, undefined or null
 */
export type BudgetParam = number | TaskBudget | undefined | null;

/**
 * Type guard to check if a value is a TaskLocation object
 */
export function isTaskLocationObject(location: LocationParam): location is TaskLocation {
  return typeof location === 'object' && location !== null && 'isRemote' in location;
}

/**
 * Type guard to check if a value is a TaskBudget object
 */
export function isTaskBudgetObject(budget: BudgetParam): budget is TaskBudget {
  return typeof budget === 'object' && budget !== null && 'amount' in budget;
}

/**
 * Get display text for a location regardless of format
 */
export function getLocationDisplayText(location: LocationParam): string {
  if (!location) return 'Location not specified';
  if (typeof location === 'string') return location;
  if (isTaskLocationObject(location)) {
    if (location.isRemote) return 'Remote';
    const addressParts = [
      location.address,
      location.city,
      location.state,
      location.country
    ].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(', ') : 'On Location';
  }
  return 'Location not specified';
}

/**
 * Get budget display text regardless of budget format
 */
export function getBudgetDisplayText(budget: BudgetParam): {amount: string, type?: string} {
  if (budget === null || budget === undefined) {
    return {amount: 'Budget not specified'};
  }
  
  if (typeof budget === 'number') {
    return {
      amount: budget.toFixed(2)
    };
  }
  
  if (isTaskBudgetObject(budget)) {
    return {
      amount: budget.amount.toFixed(2),
      type: budget.type
    };
  }
  
  return {amount: 'Budget not specified'};
}

/**
 * Format budget for display, including currency symbol and type
 */
export function formatBudget(budget: BudgetParam, currencySymbol = '$'): string {
  const budgetInfo = getBudgetDisplayText(budget);
  
  if (budgetInfo.amount === 'Budget not specified') {
    return budgetInfo.amount;
  }
  
  let result = `${currencySymbol}${budgetInfo.amount}`;
  
  if (budgetInfo.type) {
    let suffix = '';
    if (budgetInfo.type === BudgetType.HOURLY) {
      suffix = '/hr';
    } else if (budgetInfo.type === BudgetType.NEGOTIABLE) {
      suffix = ' (Negotiable)';
    }
    result += suffix;
  }
  
  return result;
}
