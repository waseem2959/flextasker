/**
 * UAE Market Configuration
 * 
 * Configuration for United Arab Emirates launch including all seven emirates,
 * Arabic/English localization, AED currency, and local business requirements.
 */

export const UAE_EMIRATES = [
  {
    id: 'abu_dhabi',
    name: { en: 'Abu Dhabi', ar: 'أبوظبي' },
    code: 'AD',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 24.4539, lng: 54.3773 },
    population: 1450000,
    isCapital: true,
    majorCities: [
      { name: { en: 'Abu Dhabi City', ar: 'مدينة أبوظبي' }, coordinates: { lat: 24.4539, lng: 54.3773 } },
      { name: { en: 'Al Ain', ar: 'العين' }, coordinates: { lat: 24.2075, lng: 55.7647 } },
      { name: { en: 'Al Dhafra', ar: 'الظفرة' }, coordinates: { lat: 23.1619, lng: 53.6472 } }
    ]
  },
  {
    id: 'dubai',
    name: { en: 'Dubai', ar: 'دبي' },
    code: 'DU',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    population: 3500000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Dubai City', ar: 'مدينة دبي' }, coordinates: { lat: 25.2048, lng: 55.2708 } },
      { name: { en: 'Deira', ar: 'ديرة' }, coordinates: { lat: 25.2677, lng: 55.3094 } },
      { name: { en: 'Bur Dubai', ar: 'بر دبي' }, coordinates: { lat: 25.2632, lng: 55.2972 } }
    ]
  },
  {
    id: 'sharjah',
    name: { en: 'Sharjah', ar: 'الشارقة' },
    code: 'SH',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.3463, lng: 55.4209 },
    population: 1800000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Sharjah City', ar: 'مدينة الشارقة' }, coordinates: { lat: 25.3463, lng: 55.4209 } },
      { name: { en: 'Kalba', ar: 'كلباء' }, coordinates: { lat: 25.0336, lng: 56.3439 } },
      { name: { en: 'Khor Fakkan', ar: 'خورفكان' }, coordinates: { lat: 25.3391, lng: 56.3569 } }
    ]
  },
  {
    id: 'ajman',
    name: { en: 'Ajman', ar: 'عجمان' },
    code: 'AJ',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.4052, lng: 55.5136 },
    population: 540000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Ajman City', ar: 'مدينة عجمان' }, coordinates: { lat: 25.4052, lng: 55.5136 } },
      { name: { en: 'Masfout', ar: 'مسفوت' }, coordinates: { lat: 25.3167, lng: 56.1167 } }
    ]
  },
  {
    id: 'umm_al_quwain',
    name: { en: 'Umm Al-Quwain', ar: 'أم القيوين' },
    code: 'UQ',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.5641, lng: 55.6552 },
    population: 85000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Umm Al-Quwain City', ar: 'مدينة أم القيوين' }, coordinates: { lat: 25.5641, lng: 55.6552 } },
      { name: { en: 'Falaj Al Mualla', ar: 'فلج المعلا' }, coordinates: { lat: 25.4333, lng: 55.8833 } }
    ]
  },
  {
    id: 'ras_al_khaimah',
    name: { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
    code: 'RK',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.7889, lng: 55.9758 },
    population: 400000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Ras Al Khaimah City', ar: 'مدينة رأس الخيمة' }, coordinates: { lat: 25.7889, lng: 55.9758 } },
      { name: { en: 'Khatt', ar: 'خت' }, coordinates: { lat: 25.6667, lng: 56.0833 } },
      { name: { en: 'Rams', ar: 'رمس' }, coordinates: { lat: 25.8667, lng: 56.0833 } }
    ]
  },
  {
    id: 'fujairah',
    name: { en: 'Fujairah', ar: 'الفجيرة' },
    code: 'FU',
    timezone: 'Asia/Dubai',
    coordinates: { lat: 25.1164, lng: 56.3258 },
    population: 260000,
    isCapital: false,
    majorCities: [
      { name: { en: 'Fujairah City', ar: 'مدينة الفجيرة' }, coordinates: { lat: 25.1164, lng: 56.3258 } },
      { name: { en: 'Dibba Al-Fujairah', ar: 'دبا الفجيرة' }, coordinates: { lat: 25.5833, lng: 56.2667 } },
      { name: { en: 'Al Badiyah', ar: 'البديعة' }, coordinates: { lat: 25.3000, lng: 56.3167 } }
    ]
  }
];

export const UAE_BUSINESS_CONFIG = {
  currency: {
    code: 'AED',
    symbol: 'د.إ',
    symbolEn: 'AED',
    name: { en: 'UAE Dirham', ar: 'درهم إماراتي' },
    subunit: { en: 'Fils', ar: 'فلس' },
    precision: 2,
    format: {
      en: '{symbol} {amount}',
      ar: '{amount} {symbol}'
    }
  },
  languages: {
    primary: 'ar',
    secondary: 'en',
    supported: ['ar', 'en'],
    rtl: ['ar'],
    ltr: ['en']
  },
  timezone: 'Asia/Dubai',
  countryCode: 'AE',
  phoneCode: '+971',
  workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], // Friday-Saturday weekend
  workingHours: {
    start: '08:00',
    end: '17:00',
    ramadanStart: '09:00',
    ramadanEnd: '15:00'
  },
  holidays: [
    { name: { en: 'New Year\'s Day', ar: 'رأس السنة الميلادية' }, date: '01-01', type: 'fixed' },
    { name: { en: 'Eid Al-Fitr', ar: 'عيد الفطر' }, date: 'variable', type: 'islamic', duration: 3 },
    { name: { en: 'Arafat Day', ar: 'يوم عرفة' }, date: 'variable', type: 'islamic' },
    { name: { en: 'Eid Al-Adha', ar: 'عيد الأضحى' }, date: 'variable', type: 'islamic', duration: 3 },
    { name: { en: 'Islamic New Year', ar: 'رأس السنة الهجرية' }, date: 'variable', type: 'islamic' },
    { name: { en: 'Prophet Muhammad\'s Birthday', ar: 'المولد النبوي' }, date: 'variable', type: 'islamic' },
    { name: { en: 'UAE National Day', ar: 'اليوم الوطني للإمارات' }, date: '12-02', type: 'fixed' },
    { name: { en: 'Commemoration Day', ar: 'يوم الشهيد' }, date: '11-30', type: 'fixed' }
  ],
  businessCategories: [
    { id: 'technology', name: { en: 'Technology & IT', ar: 'التكنولوجيا وتقنية المعلومات' }, popular: true },
    { id: 'construction', name: { en: 'Construction & Engineering', ar: 'البناء والهندسة' }, popular: true },
    { id: 'healthcare', name: { en: 'Healthcare & Medical', ar: 'الرعاية الصحية والطبية' }, popular: true },
    { id: 'education', name: { en: 'Education & Training', ar: 'التعليم والتدريب' }, popular: true },
    { id: 'finance', name: { en: 'Finance & Accounting', ar: 'المالية والمحاسبة' }, popular: true },
    { id: 'marketing', name: { en: 'Marketing & Advertising', ar: 'التسويق والإعلان' }, popular: true },
    { id: 'legal', name: { en: 'Legal Services', ar: 'الخدمات القانونية' }, popular: false },
    { id: 'logistics', name: { en: 'Logistics & Transportation', ar: 'اللوجستيات والنقل' }, popular: true },
    { id: 'hospitality', name: { en: 'Hospitality & Tourism', ar: 'الضيافة والسياحة' }, popular: true },
    { id: 'retail', name: { en: 'Retail & E-commerce', ar: 'التجارة الإلكترونية والتجزئة' }, popular: true },
    { id: 'real_estate', name: { en: 'Real Estate', ar: 'العقارات' }, popular: true },
    { id: 'consulting', name: { en: 'Business Consulting', ar: 'الاستشارات التجارية' }, popular: false },
    { id: 'maintenance', name: { en: 'Maintenance & Repair', ar: 'الصيانة والإصلاح' }, popular: true },
    { id: 'design', name: { en: 'Design & Creative', ar: 'التصميم والإبداع' }, popular: false },
    { id: 'automotive', name: { en: 'Automotive Services', ar: 'خدمات السيارات' }, popular: true }
  ],
  paymentMethods: [
    { id: 'bank_transfer', name: { en: 'Bank Transfer', ar: 'تحويل مصرفي' }, fees: 0, supported: true },
    { id: 'credit_card', name: { en: 'Credit/Debit Card', ar: 'بطاقة ائتمان/خصم' }, fees: 2.9, supported: true },
    { id: 'cash_on_delivery', name: { en: 'Cash on Delivery', ar: 'الدفع عند التسليم' }, fees: 0, supported: true },
    { id: 'digital_wallet', name: { en: 'Digital Wallet', ar: 'محفظة رقمية' }, fees: 1.5, supported: true }
  ],
  taxInfo: {
    vat: {
      rate: 0.05, // 5% VAT
      name: { en: 'Value Added Tax', ar: 'ضريبة القيمة المضافة' },
      registration_threshold: 375000 // AED
    },
    corporate_tax: {
      rate: 0.09, // 9% for profits above 375,000 AED
      threshold: 375000
    }
  },
  compliance: {
    data_protection: 'UAE PDPL', // UAE Personal Data Protection Law
    business_registration: ['Trade License', 'UAE Pass', 'Emirates ID'],
    payment_regulations: ['UAE Central Bank', 'Payment Card Industry']
  }
};

export const UAE_PHONE_VALIDATION = {
  pattern: /^(\+971|971|0)?[2-9]\d{7}$/,
  format: '+971 XX XXX XXXX',
  operators: [
    { name: 'Etisalat', prefixes: ['50', '52', '54', '55', '56', '58'] },
    { name: 'du', prefixes: ['51', '53', '57', '59'] }
  ]
};

export const UAE_ADDRESS_FORMAT = {
  fields: [
    { name: 'emirate', required: true, type: 'select' },
    { name: 'city', required: true, type: 'select' },
    { name: 'area', required: false, type: 'text' },
    { name: 'street', required: true, type: 'text' },
    { name: 'building', required: false, type: 'text' },
    { name: 'apartment', required: false, type: 'text' },
    { name: 'po_box', required: false, type: 'text' }
  ],
  format: {
    en: '{building} {street}, {area}, {city}, {emirate}, UAE',
    ar: '{building} {street}، {area}، {city}، {emirate}، الإمارات العربية المتحدة'
  }
};

export const UAE_BUSINESS_HOURS = {
  standard: {
    sunday: { start: '08:00', end: '17:00' },
    monday: { start: '08:00', end: '17:00' },
    tuesday: { start: '08:00', end: '17:00' },
    wednesday: { start: '08:00', end: '17:00' },
    thursday: { start: '08:00', end: '17:00' },
    friday: { start: null, end: null }, // Weekend
    saturday: { start: null, end: null } // Weekend
  },
  ramadan: {
    sunday: { start: '09:00', end: '15:00' },
    monday: { start: '09:00', end: '15:00' },
    tuesday: { start: '09:00', end: '15:00' },
    wednesday: { start: '09:00', end: '15:00' },
    thursday: { start: '09:00', end: '15:00' },
    friday: { start: null, end: null },
    saturday: { start: null, end: null }
  },
  retail: {
    sunday: { start: '10:00', end: '22:00' },
    monday: { start: '10:00', end: '22:00' },
    tuesday: { start: '10:00', end: '22:00' },
    wednesday: { start: '10:00', end: '22:00' },
    thursday: { start: '10:00', end: '22:00' },
    friday: { start: '14:00', end: '22:00' }, // After Friday prayers
    saturday: { start: '10:00', end: '22:00' }
  }
};

export const UAE_CULTURAL_CONSIDERATIONS = {
  prayer_times: {
    importance: 'high',
    impact_on_business: true,
    friday_prayers: { start: '12:00', end: '14:00' }
  },
  ramadan: {
    working_hours_adjusted: true,
    business_impact: 'significant',
    cultural_sensitivity_required: true
  },
  language_preferences: {
    government_official: 'ar',
    business_common: 'en',
    customer_service: 'both'
  },
  cultural_values: [
    'respect_for_tradition',
    'hospitality',
    'family_importance',
    'business_relationships',
    'punctuality',
    'formal_communication'
  ]
};

export default {
  emirates: UAE_EMIRATES,
  business: UAE_BUSINESS_CONFIG,
  phone: UAE_PHONE_VALIDATION,
  address: UAE_ADDRESS_FORMAT,
  businessHours: UAE_BUSINESS_HOURS,
  cultural: UAE_CULTURAL_CONSIDERATIONS
};