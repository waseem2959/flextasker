/**
 * UAE Currency Utilities
 * 
 * Comprehensive currency formatting, validation, and calculation utilities
 * for AED (Dirham) with Arabic/English localization and business logic.
 */

import { UAE_BUSINESS_CONFIG } from '../../shared/config/uae-config';
import { i18nService, SupportedLanguage } from '../../shared/services/i18n-service';

export interface CurrencyFormatOptions {
  locale?: SupportedLanguage;
  showSymbol?: boolean;
  showCode?: boolean;
  precision?: number;
  compact?: boolean;
  style?: 'symbol' | 'code' | 'name';
  includeVAT?: boolean;
  vatRate?: number;
}

export interface CurrencyValidationResult {
  isValid: boolean;
  errors: string[];
  formattedValue?: string;
  numericValue?: number;
}

export interface PaymentCalculation {
  subtotal: number;
  vat: number;
  total: number;
  fees: number;
  netAmount: number;
  breakdown: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

export interface PriceRange {
  min: number;
  max: number;
  average?: number;
  currency: string;
}

/**
 * Format amount as UAE Dirham with proper localization
 */
export const formatAED = (
  amount: number, 
  options: CurrencyFormatOptions = {}
): string => {
  const {
    locale = i18nService.getCurrentLanguage(),
    showSymbol = true,
    showCode = false,
    precision = UAE_BUSINESS_CONFIG.currency.precision,
    compact = false,
    style = 'symbol',
    includeVAT = false,
    vatRate = UAE_BUSINESS_CONFIG.taxInfo.vat.rate
  } = options;

  // Calculate VAT if needed
  const finalAmount = includeVAT ? amount * (1 + vatRate) : amount;

  // Handle compact formatting for large numbers
  if (compact && finalAmount >= 1000) {
    const formatCompact = (value: number): string => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toString();
    };

    const compactValue = formatCompact(finalAmount);
    const symbol = locale === 'ar' ? UAE_BUSINESS_CONFIG.currency.symbol : UAE_BUSINESS_CONFIG.currency.symbolEn;
    
    if (locale === 'ar') {
      return `${compactValue} ${symbol}`;
    } else {
      return `${symbol} ${compactValue}`;
    }
  }

  // Standard formatting
  const formatter = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-AE' : 'en-AE',
    {
      style: showSymbol || showCode ? 'currency' : 'decimal',
      currency: UAE_BUSINESS_CONFIG.currency.code,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      currencyDisplay: showCode ? 'code' : (style === 'name' ? 'name' : 'symbol')
    }
  );

  let formatted = formatter.format(finalAmount);

  // Custom formatting for Arabic to ensure proper symbol placement
  if (locale === 'ar' && showSymbol && !showCode) {
    const numberPart = formatted.replace(/[^\d\s,.-]/g, '').trim();
    const symbol = UAE_BUSINESS_CONFIG.currency.symbol;
    formatted = `${numberPart} ${symbol}`;
  }

  return formatted;
};

/**
 * Parse currency string to numeric value
 */
export const parseAED = (value: string): number | null => {
  if (!value || typeof value !== 'string') return null;

  // Remove currency symbols and codes
  let cleanValue = value
    .replace(new RegExp(UAE_BUSINESS_CONFIG.currency.symbol, 'g'), '')
    .replace(new RegExp(UAE_BUSINESS_CONFIG.currency.symbolEn, 'g'), '')
    .replace(new RegExp(UAE_BUSINESS_CONFIG.currency.code, 'g'), '')
    .replace(/[^\d.,\-]/g, '')
    .trim();

  // Handle Arabic numerals
  if (i18nService.getCurrentLanguage() === 'ar') {
    const arabicNumerals = '٠١٢٣٤٥٦٧٨٩';
    const westernNumerals = '0123456789';
    
    for (let i = 0; i < arabicNumerals.length; i++) {
      cleanValue = cleanValue.replace(new RegExp(arabicNumerals[i], 'g'), westernNumerals[i]);
    }
  }

  // Convert to number
  const parsed = parseFloat(cleanValue.replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
};

/**
 * Validate currency amount
 */
export const validateCurrency = (
  value: string | number,
  options: {
    min?: number;
    max?: number;
    required?: boolean;
    allowZero?: boolean;
  } = {}
): CurrencyValidationResult => {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    required = false,
    allowZero = true
  } = options;

  const errors: string[] = [];
  let numericValue: number | null = null;
  let formattedValue: string | undefined;

  // Handle empty value
  if (!value || value === '') {
    if (required) {
      errors.push(i18nService.translate('validation.required'));
    }
    return { isValid: !required, errors };
  }

  // Parse value
  if (typeof value === 'string') {
    numericValue = parseAED(value);
  } else {
    numericValue = value;
  }

  if (numericValue === null || isNaN(numericValue)) {
    errors.push(i18nService.translate('validation.invalidCurrency'));
    return { isValid: false, errors };
  }

  // Validate range
  if (!allowZero && numericValue === 0) {
    errors.push(i18nService.translate('validation.amountMustBeGreaterThanZero'));
  }

  if (numericValue < min) {
    errors.push(i18nService.translate('validation.amountTooLow', { min: formatAED(min) }));
  }

  if (numericValue > max) {
    errors.push(i18nService.translate('validation.amountTooHigh', { max: formatAED(max) }));
  }

  // Format if valid
  if (errors.length === 0) {
    formattedValue = formatAED(numericValue);
  }

  return {
    isValid: errors.length === 0,
    errors,
    formattedValue,
    numericValue
  };
};

/**
 * Calculate payment breakdown with fees and taxes
 */
export const calculatePayment = (
  subtotal: number,
  options: {
    includeVAT?: boolean;
    vatRate?: number;
    paymentMethod?: string;
    platformFeeRate?: number;
    minimumFee?: number;
    maximumFee?: number;
  } = {}
): PaymentCalculation => {
  const {
    includeVAT = true,
    vatRate = UAE_BUSINESS_CONFIG.taxInfo.vat.rate,
    paymentMethod = 'bank_transfer',
    platformFeeRate = 0.05, // 5% platform fee
    minimumFee = 5,
    maximumFee = 500
  } = options;

  const breakdown: Array<{ type: string; amount: number; description: string }> = [];

  // Calculate VAT
  let vat = 0;
  if (includeVAT && subtotal >= UAE_BUSINESS_CONFIG.taxInfo.vat.registration_threshold) {
    vat = subtotal * vatRate;
    breakdown.push({
      type: 'vat',
      amount: vat,
      description: i18nService.translate('payment.vat')
    });
  }

  // Calculate payment method fees
  const paymentMethodConfig = UAE_BUSINESS_CONFIG.paymentMethods.find(
    pm => pm.id === paymentMethod
  );
  
  let paymentFee = 0;
  if (paymentMethodConfig && paymentMethodConfig.fees > 0) {
    paymentFee = subtotal * (paymentMethodConfig.fees / 100);
    breakdown.push({
      type: 'payment_fee',
      amount: paymentFee,
      description: i18nService.translate('payment.paymentMethodFee', { 
        method: paymentMethodConfig.name[i18nService.getCurrentLanguage()] 
      })
    });
  }

  // Calculate platform fee
  let platformFee = subtotal * platformFeeRate;
  platformFee = Math.max(minimumFee, Math.min(maximumFee, platformFee));
  
  breakdown.push({
    type: 'platform_fee',
    amount: platformFee,
    description: i18nService.translate('payment.platformFee')
  });

  const fees = paymentFee + platformFee;
  const total = subtotal + vat + fees;
  const netAmount = total - fees; // Amount after deducting fees

  return {
    subtotal,
    vat,
    total,
    fees,
    netAmount,
    breakdown
  };
};

/**
 * Convert currency to other units (for international users)
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string = 'AED',
  toCurrency: string = 'USD'
): Promise<{ amount: number; rate: number; timestamp: Date } | null> => {
  try {
    // In a real application, you would call a currency exchange API
    // For now, return mock data with common rates
    const mockRates: Record<string, number> = {
      'AED-USD': 0.27,
      'AED-EUR': 0.25,
      'AED-GBP': 0.21,
      'USD-AED': 3.67,
      'EUR-AED': 4.0,
      'GBP-AED': 4.8
    };

    const rateKey = `${fromCurrency}-${toCurrency}`;
    const rate = mockRates[rateKey];

    if (!rate) {
      console.warn(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
      return null;
    }

    return {
      amount: amount * rate,
      rate,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return null;
  }
};

/**
 * Generate price suggestions based on category and complexity
 */
export const generatePriceSuggestions = (
  category: string,
  complexity: 'simple' | 'medium' | 'complex' = 'medium',
  duration?: number // in hours
): PriceRange => {
  // Base rates per category (per hour in AED)
  const categoryRates: Record<string, { min: number; max: number }> = {
    technology: { min: 50, max: 200 },
    construction: { min: 30, max: 120 },
    healthcare: { min: 80, max: 300 },
    education: { min: 40, max: 150 },
    finance: { min: 60, max: 250 },
    marketing: { min: 45, max: 180 },
    legal: { min: 100, max: 400 },
    logistics: { min: 25, max: 80 },
    hospitality: { min: 30, max: 100 },
    retail: { min: 25, max: 90 },
    realEstate: { min: 50, max: 200 },
    consulting: { min: 80, max: 300 },
    maintenance: { min: 35, max: 100 },
    design: { min: 40, max: 180 },
    automotive: { min: 40, max: 120 }
  };

  const baseRate = categoryRates[category] || { min: 30, max: 100 };
  
  // Complexity multipliers
  const complexityMultipliers = {
    simple: 0.7,
    medium: 1.0,
    complex: 1.5
  };

  const multiplier = complexityMultipliers[complexity];
  const estimatedDuration = duration || 8; // Default to 8 hours

  const min = Math.round(baseRate.min * multiplier * estimatedDuration);
  const max = Math.round(baseRate.max * multiplier * estimatedDuration);
  const average = Math.round((min + max) / 2);

  return {
    min,
    max,
    average,
    currency: UAE_BUSINESS_CONFIG.currency.code
  };
};

/**
 * Format price range for display
 */
export const formatPriceRange = (
  range: PriceRange,
  options: CurrencyFormatOptions = {}
): string => {
  const { locale = i18nService.getCurrentLanguage() } = options;
  
  const minFormatted = formatAED(range.min, options);
  const maxFormatted = formatAED(range.max, options);
  
  if (locale === 'ar') {
    return `${minFormatted} - ${maxFormatted}`;
  } else {
    return `${minFormatted} - ${maxFormatted}`;
  }
};

/**
 * Check if amount is within UAE business thresholds
 */
export const checkBusinessThresholds = (amount: number): {
  requiresVAT: boolean;
  requiresCorporateTax: boolean;
  thresholds: Array<{
    type: string;
    threshold: number;
    exceeded: boolean;
    description: string;
  }>;
} => {
  const vatThreshold = UAE_BUSINESS_CONFIG.taxInfo.vat.registration_threshold;
  const corporateTaxThreshold = UAE_BUSINESS_CONFIG.taxInfo.corporate_tax.threshold;

  const thresholds = [
    {
      type: 'vat',
      threshold: vatThreshold,
      exceeded: amount >= vatThreshold,
      description: i18nService.translate('tax.vatRegistrationRequired')
    },
    {
      type: 'corporate_tax',
      threshold: corporateTaxThreshold,
      exceeded: amount >= corporateTaxThreshold,
      description: i18nService.translate('tax.corporateTaxApplies')
    }
  ];

  return {
    requiresVAT: amount >= vatThreshold,
    requiresCorporateTax: amount >= corporateTaxThreshold,
    thresholds
  };
};

/**
 * Format currency input for real-time input formatting
 */
export const formatCurrencyInput = (
  value: string,
  previousValue: string = ''
): string => {
  // Remove non-numeric characters except decimal point
  let cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit decimal places
  if (parts[1] && parts[1].length > UAE_BUSINESS_CONFIG.currency.precision) {
    cleaned = parts[0] + '.' + parts[1].substring(0, UAE_BUSINESS_CONFIG.currency.precision);
  }
  
  // Add thousand separators
  const [integerPart, decimalPart] = cleaned.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
};

/**
 * Get currency symbol for current locale
 */
export const getCurrencySymbol = (locale: SupportedLanguage = i18nService.getCurrentLanguage()): string => {
  return locale === 'ar' ? UAE_BUSINESS_CONFIG.currency.symbol : UAE_BUSINESS_CONFIG.currency.symbolEn;
};

/**
 * Calculate tip/gratuity suggestions (cultural consideration for UAE)
 */
export const calculateTipSuggestions = (amount: number): Array<{
  percentage: number;
  amount: number;
  label: string;
}> => {
  const suggestions = [
    { percentage: 10, label: i18nService.translate('payment.tip.standard') },
    { percentage: 15, label: i18nService.translate('payment.tip.good') },
    { percentage: 20, label: i18nService.translate('payment.tip.excellent') }
  ];

  return suggestions.map(suggestion => ({
    ...suggestion,
    amount: Math.round(amount * (suggestion.percentage / 100))
  }));
};

export default {
  formatAED,
  parseAED,
  validateCurrency,
  calculatePayment,
  convertCurrency,
  generatePriceSuggestions,
  formatPriceRange,
  checkBusinessThresholds,
  formatCurrencyInput,
  getCurrencySymbol,
  calculateTipSuggestions
};