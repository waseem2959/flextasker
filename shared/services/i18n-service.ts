/**
 * Internationalization Service
 * 
 * Comprehensive i18n service for UAE launch with Arabic/English support,
 * RTL/LTR layouts, date/time formatting, and cultural adaptations.
 */

import { UAE_BUSINESS_CONFIG, UAE_EMIRATES } from '../config/uae-config';

export type SupportedLanguage = 'en' | 'ar';
export type TextDirection = 'ltr' | 'rtl';

interface TranslationKey {
  en: string;
  ar: string;
}

interface DateTimeOptions {
  locale: SupportedLanguage;
  timezone: string;
  format: 'short' | 'medium' | 'long' | 'full';
  includeTime?: boolean;
}

interface CurrencyOptions {
  locale: SupportedLanguage;
  amount: number;
  showSymbol?: boolean;
  precision?: number;
}

interface NumberOptions {
  locale: SupportedLanguage;
  value: number;
  style?: 'decimal' | 'currency' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Core translation dictionary
export const translations = {
  // Common UI elements
  common: {
    welcome: { en: 'Welcome', ar: 'مرحباً' },
    loading: { en: 'Loading...', ar: 'جارٍ التحميل...' },
    error: { en: 'Error', ar: 'خطأ' },
    success: { en: 'Success', ar: 'نجح' },
    cancel: { en: 'Cancel', ar: 'إلغاء' },
    save: { en: 'Save', ar: 'حفظ' },
    edit: { en: 'Edit', ar: 'تعديل' },
    delete: { en: 'Delete', ar: 'حذف' },
    search: { en: 'Search', ar: 'بحث' },
    filter: { en: 'Filter', ar: 'تصفية' },
    sort: { en: 'Sort', ar: 'ترتيب' },
    next: { en: 'Next', ar: 'التالي' },
    previous: { en: 'Previous', ar: 'السابق' },
    submit: { en: 'Submit', ar: 'إرسال' },
    confirm: { en: 'Confirm', ar: 'تأكيد' },
    close: { en: 'Close', ar: 'إغلاق' },
    open: { en: 'Open', ar: 'فتح' },
    yes: { en: 'Yes', ar: 'نعم' },
    no: { en: 'No', ar: 'لا' },
    view: { en: 'View', ar: 'عرض' },
    download: { en: 'Download', ar: 'تحميل' },
    upload: { en: 'Upload', ar: 'رفع' },
    refresh: { en: 'Refresh', ar: 'تحديث' },
    back: { en: 'Back', ar: 'رجوع' },
    home: { en: 'Home', ar: 'الرئيسية' },
    dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
    profile: { en: 'Profile', ar: 'الملف الشخصي' },
    settings: { en: 'Settings', ar: 'الإعدادات' },
    logout: { en: 'Logout', ar: 'تسجيل الخروج' },
    login: { en: 'Login', ar: 'تسجيل الدخول' },
    register: { en: 'Register', ar: 'تسجيل جديد' },
    forgotPassword: { en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟' },
    rememberMe: { en: 'Remember me', ar: 'تذكرني' }
  },

  // Navigation
  navigation: {
    tasks: { en: 'Tasks', ar: 'المهام' },
    marketplace: { en: 'Marketplace', ar: 'السوق' },
    messages: { en: 'Messages', ar: 'الرسائل' },
    notifications: { en: 'Notifications', ar: 'الإشعارات' },
    payments: { en: 'Payments', ar: 'المدفوعات' },
    support: { en: 'Support', ar: 'الدعم' },
    help: { en: 'Help', ar: 'المساعدة' },
    aboutUs: { en: 'About Us', ar: 'من نحن' },
    contact: { en: 'Contact', ar: 'اتصل بنا' },
    terms: { en: 'Terms of Service', ar: 'شروط الخدمة' },
    privacy: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' }
  },

  // Accessibility and ARIA labels
  accessibility: {
    // Navigation accessibility
    openMenu: { en: 'Open menu', ar: 'فتح القائمة' },
    closeMenu: { en: 'Close menu', ar: 'إغلاق القائمة' },
    navigationOpened: { en: 'Navigation menu opened', ar: 'تم فتح قائمة التنقل' },
    navigationClosed: { en: 'Navigation menu closed', ar: 'تم إغلاق قائمة التنقل' },
    skipToContent: { en: 'Skip to main content', ar: 'الانتقال إلى المحتوى الرئيسي' },
    skipToNavigation: { en: 'Skip to navigation', ar: 'الانتقال إلى التنقل' },
    skippedToContent: { en: 'Skipped to main content', ar: 'تم الانتقال إلى المحتوى الرئيسي' },
    skippedToNavigation: { en: 'Skipped to navigation', ar: 'تم الانتقال إلى التنقل' },
    menuOpened: { en: 'Menu opened', ar: 'تم فتح القائمة' },
    settingsReset: { en: 'Accessibility settings reset to defaults', ar: 'تم إعادة تعيين إعدادات إمكانية الوصول إلى الافتراضي' },

    // Button accessibility
    button: { en: 'Button', ar: 'زر' },
    clickToActivate: { en: 'Click to activate', ar: 'انقر للتفعيل' },
    pressEnterToActivate: { en: 'Press Enter to activate', ar: 'اضغط Enter للتفعيل' },
    expanded: { en: 'Expanded', ar: 'موسع' },
    collapsed: { en: 'Collapsed', ar: 'مطوي' },
    pressed: { en: 'Pressed', ar: 'مضغوط' },
    notPressed: { en: 'Not pressed', ar: 'غير مضغوط' },

    // Form accessibility
    required: { en: 'Required field', ar: 'حقل مطلوب' },
    optional: { en: 'Optional field', ar: 'حقل اختياري' },
    invalid: { en: 'Invalid input', ar: 'إدخال غير صحيح' },
    validInput: { en: 'Valid input', ar: 'إدخال صحيح' },
    characterCount: { en: '{count} characters entered', ar: 'تم إدخال {count} حرف' },
    characterLimit: { en: '{count} of {limit} characters', ar: '{count} من {limit} حرف' },
    passwordShow: { en: 'Show password', ar: 'إظهار كلمة المرور' },
    passwordHide: { en: 'Hide password', ar: 'إخفاء كلمة المرور' },

    // Table accessibility
    sortAscending: { en: 'Sort ascending', ar: 'ترتيب تصاعدي' },
    sortDescending: { en: 'Sort descending', ar: 'ترتيب تنازلي' },
    notSorted: { en: 'Not sorted', ar: 'غير مرتب' },
    columnHeader: { en: 'Column header', ar: 'رأس العمود' },
    rowHeader: { en: 'Row header', ar: 'رأس الصف' },
    tableCaption: { en: 'Table showing {description}', ar: 'جدول يعرض {description}' },

    // Modal accessibility
    dialogOpened: { en: 'Dialog opened', ar: 'تم فتح مربع الحوار' },
    dialogClosed: { en: 'Dialog closed', ar: 'تم إغلاق مربع الحوار' },
    closeDialog: { en: 'Close dialog', ar: 'إغلاق مربع الحوار' },

    // Loading states
    loadingContent: { en: 'Loading content', ar: 'جارٍ تحميل المحتوى' },
    loadingComplete: { en: 'Content loaded', ar: 'تم تحميل المحتوى' },
    processingRequest: { en: 'Processing request', ar: 'جارٍ معالجة الطلب' },

    // Status messages
    success: { en: 'Success', ar: 'نجح' },
    error: { en: 'Error occurred', ar: 'حدث خطأ' },
    warning: { en: 'Warning', ar: 'تحذير' },
    information: { en: 'Information', ar: 'معلومات' },

    // Pagination
    page: { en: 'Page', ar: 'صفحة' },
    currentPage: { en: 'Current page, page {page}', ar: 'الصفحة الحالية، صفحة {page}' },
    goToPage: { en: 'Go to page {page}', ar: 'الانتقال إلى صفحة {page}' },
    nextPage: { en: 'Next page', ar: 'الصفحة التالية' },
    previousPage: { en: 'Previous page', ar: 'الصفحة السابقة' },
    firstPage: { en: 'First page', ar: 'الصفحة الأولى' },
    lastPage: { en: 'Last page', ar: 'الصفحة الأخيرة' },

    // Search
    searchResults: { en: '{count} search results found', ar: 'تم العثور على {count} نتيجة بحث' },
    noSearchResults: { en: 'No search results found', ar: 'لم يتم العثور على نتائج بحث' },
    searchSuggestion: { en: 'Search suggestion: {suggestion}', ar: 'اقتراح بحث: {suggestion}' },
    clearSearch: { en: 'Clear search', ar: 'مسح البحث' },

    // Notifications
    newNotification: { en: 'New notification', ar: 'إشعار جديد' },
    notificationRead: { en: 'Notification marked as read', ar: 'تم وضع علامة على الإشعار كمقروء' },
    notificationDeleted: { en: 'Notification deleted', ar: 'تم حذف الإشعار' },
    unreadCount: { en: '{count} unread notifications', ar: '{count} إشعارات غير مقروءة' },

    // File upload
    fileSelected: { en: 'File selected: {filename}', ar: 'تم اختيار الملف: {filename}' },
    fileUploadProgress: { en: 'Upload progress: {progress}%', ar: 'تقدم الرفع: {progress}%' },
    fileUploadComplete: { en: 'File upload complete', ar: 'تم رفع الملف بنجاح' },
    fileUploadError: { en: 'File upload failed', ar: 'فشل في رفع الملف' },
    dragDropArea: { en: 'Drag and drop files here or click to select', ar: 'اسحب وأفلت الملفات هنا أو انقر للاختيار' },

    // Date and time
    selectDate: { en: 'Select date', ar: 'اختيار التاريخ' },
    selectTime: { en: 'Select time', ar: 'اختيار الوقت' },
    dateSelected: { en: 'Date selected: {date}', ar: 'تم اختيار التاريخ: {date}' },
    timeSelected: { en: 'Time selected: {time}', ar: 'تم اختيار الوقت: {time}' },

    // Map and location
    mapRegion: { en: 'Interactive map', ar: 'خريطة تفاعلية' },
    zoomIn: { en: 'Zoom in', ar: 'تكبير' },
    zoomOut: { en: 'Zoom out', ar: 'تصغير' },
    locationSelected: { en: 'Location selected: {location}', ar: 'تم اختيار الموقع: {location}' },

    // Media
    playVideo: { en: 'Play video', ar: 'تشغيل الفيديو' },
    pauseVideo: { en: 'Pause video', ar: 'إيقاف الفيديو' },
    muteAudio: { en: 'Mute audio', ar: 'كتم الصوت' },
    unmuteAudio: { en: 'Unmute audio', ar: 'إلغاء كتم الصوت' },
    fullscreen: { en: 'Enter fullscreen', ar: 'دخول وضع ملء الشاشة' },
    exitFullscreen: { en: 'Exit fullscreen', ar: 'الخروج من وضع ملء الشاشة' },

    // Social features
    like: { en: 'Like', ar: 'إعجاب' },
    unlike: { en: 'Unlike', ar: 'إلغاء الإعجاب' },
    share: { en: 'Share', ar: 'مشاركة' },
    comment: { en: 'Comment', ar: 'تعليق' },
    reply: { en: 'Reply', ar: 'رد' },
    follow: { en: 'Follow', ar: 'متابعة' },
    unfollow: { en: 'Unfollow', ar: 'إلغاء المتابعة' },

    // Accessibility settings
    highContrast: { en: 'High contrast mode', ar: 'وضع التباين العالي' },
    reducedMotion: { en: 'Reduced motion', ar: 'تقليل الحركة' },
    fontSize: { en: 'Font size', ar: 'حجم الخط' },
    fontSizeSmall: { en: 'Small font size', ar: 'حجم خط صغير' },
    fontSizeMedium: { en: 'Medium font size', ar: 'حجم خط متوسط' },
    fontSizeLarge: { en: 'Large font size', ar: 'حجم خط كبير' },
    fontSizeExtraLarge: { en: 'Extra large font size', ar: 'حجم خط كبير جداً' },
    colorMode: { en: 'Color mode', ar: 'وضع الألوان' },
    lightMode: { en: 'Light mode', ar: 'الوضع الفاتح' },
    darkMode: { en: 'Dark mode', ar: 'الوضع الداكن' },
    autoMode: { en: 'Auto mode', ar: 'الوضع التلقائي' }
  },

  // Form validation and feedback
  form: {
    required: { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
    email: { en: 'Please enter a valid email address', ar: 'يرجى إدخال عنوان بريد إلكتروني صحيح' },
    password: { en: 'Password must be at least 8 characters', ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' },
    confirmPassword: { en: 'Passwords do not match', ar: 'كلمات المرور غير متطابقة' },
    phone: { en: 'Please enter a valid phone number', ar: 'يرجى إدخال رقم هاتف صحيح' },
    url: { en: 'Please enter a valid URL', ar: 'يرجى إدخال رابط صحيح' },
    number: { en: 'Please enter a valid number', ar: 'يرجى إدخال رقم صحيح' },
    date: { en: 'Please enter a valid date', ar: 'يرجى إدخال تاريخ صحيح' },
    minLength: { en: 'Minimum {min} characters required', ar: 'مطلوب {min} أحرف كحد أدنى' },
    maxLength: { en: 'Maximum {max} characters allowed', ar: 'مسموح بحد أقصى {max} حرف' },
    minValue: { en: 'Minimum value is {min}', ar: 'القيمة الدنيا هي {min}' },
    maxValue: { en: 'Maximum value is {max}', ar: 'القيمة العليا هي {max}' }
  },

  // Task-related translations
  tasks: {
    createTask: { en: 'Create Task', ar: 'إنشاء مهمة' },
    taskTitle: { en: 'Task Title', ar: 'عنوان المهمة' },
    taskDescription: { en: 'Task Description', ar: 'وصف المهمة' },
    taskCategory: { en: 'Category', ar: 'الفئة' },
    taskBudget: { en: 'Budget', ar: 'الميزانية' },
    taskDeadline: { en: 'Deadline', ar: 'الموعد النهائي' },
    taskLocation: { en: 'Location', ar: 'الموقع' },
    taskStatus: { en: 'Status', ar: 'الحالة' },
    applyForTask: { en: 'Apply for Task', ar: 'التقدم للمهمة' },
    viewDetails: { en: 'View Details', ar: 'عرض التفاصيل' },
    editTask: { en: 'Edit Task', ar: 'تعديل المهمة' },
    deleteTask: { en: 'Delete Task', ar: 'حذف المهمة' },
    completeTask: { en: 'Complete Task', ar: 'إكمال المهمة' },
    taskCompleted: { en: 'Task Completed', ar: 'تم إكمال المهمة' },
    taskInProgress: { en: 'In Progress', ar: 'قيد التنفيذ' },
    taskPending: { en: 'Pending', ar: 'معلق' },
    taskCancelled: { en: 'Cancelled', ar: 'ملغي' },
    myTasks: { en: 'My Tasks', ar: 'مهامي' },
    availableTasks: { en: 'Available Tasks', ar: 'المهام المتاحة' },
    completedTasks: { en: 'Completed Tasks', ar: 'المهام المكتملة' },
    taskApplications: { en: 'Applications', ar: 'التطبيقات' },
    selectTasker: { en: 'Select Tasker', ar: 'اختيار المنفذ' },
    taskAssigned: { en: 'Task Assigned', ar: 'تم تعيين المهمة' }
  },

  // User and profile
  user: {
    firstName: { en: 'First Name', ar: 'الاسم الأول' },
    lastName: { en: 'Last Name', ar: 'الاسم الأخير' },
    email: { en: 'Email', ar: 'البريد الإلكتروني' },
    phone: { en: 'Phone Number', ar: 'رقم الهاتف' },
    address: { en: 'Address', ar: 'العنوان' },
    emirate: { en: 'Emirate', ar: 'الإمارة' },
    city: { en: 'City', ar: 'المدينة' },
    nationality: { en: 'Nationality', ar: 'الجنسية' },
    dateOfBirth: { en: 'Date of Birth', ar: 'تاريخ الميلاد' },
    gender: { en: 'Gender', ar: 'الجنس' },
    skills: { en: 'Skills', ar: 'المهارات' },
    experience: { en: 'Experience', ar: 'الخبرة' },
    rating: { en: 'Rating', ar: 'التقييم' },
    reviews: { en: 'Reviews', ar: 'المراجعات' },
    portfolio: { en: 'Portfolio', ar: 'معرض الأعمال' },
    verification: { en: 'Verification', ar: 'التحقق' },
    verified: { en: 'Verified', ar: 'محقق' },
    unverified: { en: 'Unverified', ar: 'غير محقق' },
    joinedDate: { en: 'Joined', ar: 'تاريخ الانضمام' },
    lastSeen: { en: 'Last seen', ar: 'آخر ظهور' },
    online: { en: 'Online', ar: 'متصل' },
    offline: { en: 'Offline', ar: 'غير متصل' }
  },

  // Payment and financial
  payment: {
    payment: { en: 'Payment', ar: 'الدفع' },
    paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
    creditCard: { en: 'Credit Card', ar: 'بطاقة ائتمان' },
    bankTransfer: { en: 'Bank Transfer', ar: 'تحويل مصرفي' },
    cashOnDelivery: { en: 'Cash on Delivery', ar: 'الدفع عند التسليم' },
    digitalWallet: { en: 'Digital Wallet', ar: 'محفظة رقمية' },
    amount: { en: 'Amount', ar: 'المبلغ' },
    fee: { en: 'Fee', ar: 'الرسوم' },
    total: { en: 'Total', ar: 'المجموع' },
    subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
    tax: { en: 'Tax', ar: 'الضريبة' },
    vat: { en: 'VAT', ar: 'ضريبة القيمة المضافة' },
    discount: { en: 'Discount', ar: 'الخصم' },
    payNow: { en: 'Pay Now', ar: 'ادفع الآن' },
    paymentSuccessful: { en: 'Payment Successful', ar: 'تم الدفع بنجاح' },
    paymentFailed: { en: 'Payment Failed', ar: 'فشل الدفع' },
    refund: { en: 'Refund', ar: 'استرداد' },
    invoice: { en: 'Invoice', ar: 'الفاتورة' },
    receipt: { en: 'Receipt', ar: 'الإيصال' },
    balance: { en: 'Balance', ar: 'الرصيد' },
    wallet: { en: 'Wallet', ar: 'المحفظة' },
    withdraw: { en: 'Withdraw', ar: 'سحب' },
    deposit: { en: 'Deposit', ar: 'إيداع' },
    transactionHistory: { en: 'Transaction History', ar: 'تاريخ المعاملات' }
  },

  // Time and dates
  time: {
    now: { en: 'Now', ar: 'الآن' },
    today: { en: 'Today', ar: 'اليوم' },
    yesterday: { en: 'Yesterday', ar: 'أمس' },
    tomorrow: { en: 'Tomorrow', ar: 'غداً' },
    thisWeek: { en: 'This week', ar: 'هذا الأسبوع' },
    thisMonth: { en: 'This month', ar: 'هذا الشهر' },
    lastWeek: { en: 'Last week', ar: 'الأسبوع الماضي' },
    lastMonth: { en: 'Last month', ar: 'الشهر الماضي' },
    minute: { en: 'minute', ar: 'دقيقة' },
    minutes: { en: 'minutes', ar: 'دقائق' },
    hour: { en: 'hour', ar: 'ساعة' },
    hours: { en: 'hours', ar: 'ساعات' },
    day: { en: 'day', ar: 'يوم' },
    days: { en: 'days', ar: 'أيام' },
    week: { en: 'week', ar: 'أسبوع' },
    weeks: { en: 'weeks', ar: 'أسابيع' },
    month: { en: 'month', ar: 'شهر' },
    months: { en: 'months', ar: 'أشهر' },
    year: { en: 'year', ar: 'سنة' },
    years: { en: 'years', ar: 'سنوات' },
    ago: { en: 'ago', ar: 'مضت' },
    in: { en: 'in', ar: 'خلال' }
  },

  // Validation and errors
  validation: {
    required: { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
    invalidEmail: { en: 'Invalid email address', ar: 'عنوان بريد إلكتروني غير صحيح' },
    invalidPhone: { en: 'Invalid phone number', ar: 'رقم هاتف غير صحيح' },
    passwordTooShort: { en: 'Password must be at least 8 characters', ar: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل' },
    passwordMismatch: { en: 'Passwords do not match', ar: 'كلمات المرور غير متطابقة' },
    invalidDate: { en: 'Invalid date', ar: 'تاريخ غير صحيح' },
    invalidNumber: { en: 'Invalid number', ar: 'رقم غير صحيح' },
    fileTooLarge: { en: 'File is too large', ar: 'الملف كبير جداً' },
    invalidFileType: { en: 'Invalid file type', ar: 'نوع ملف غير صحيح' },
    networkError: { en: 'Network error. Please try again.', ar: 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.' },
    serverError: { en: 'Server error. Please contact support.', ar: 'خطأ في الخادم. يرجى الاتصال بالدعم.' }
  },

  // Notifications and messages
  notifications: {
    newMessage: { en: 'New message', ar: 'رسالة جديدة' },
    taskAssigned: { en: 'Task assigned to you', ar: 'تم تعيين مهمة لك' },
    taskCompleted: { en: 'Task completed', ar: 'تم إكمال المهمة' },
    paymentReceived: { en: 'Payment received', ar: 'تم استلام الدفعة' },
    profileUpdated: { en: 'Profile updated successfully', ar: 'تم تحديث الملف الشخصي بنجاح' },
    passwordChanged: { en: 'Password changed successfully', ar: 'تم تغيير كلمة المرور بنجاح' },
    accountVerified: { en: 'Account verified successfully', ar: 'تم التحقق من الحساب بنجاح' },
    taskPosted: { en: 'Task posted successfully', ar: 'تم نشر المهمة بنجاح' },
    applicationSubmitted: { en: 'Application submitted', ar: 'تم إرسال الطلب' },
    reviewSubmitted: { en: 'Review submitted', ar: 'تم إرسال المراجعة' }
  },

  // Business categories (from UAE config)
  categories: {
    technology: { en: 'Technology & IT', ar: 'التكنولوجيا وتقنية المعلومات' },
    construction: { en: 'Construction & Engineering', ar: 'البناء والهندسة' },
    healthcare: { en: 'Healthcare & Medical', ar: 'الرعاية الصحية والطبية' },
    education: { en: 'Education & Training', ar: 'التعليم والتدريب' },
    finance: { en: 'Finance & Accounting', ar: 'المالية والمحاسبة' },
    marketing: { en: 'Marketing & Advertising', ar: 'التسويق والإعلان' },
    legal: { en: 'Legal Services', ar: 'الخدمات القانونية' },
    logistics: { en: 'Logistics & Transportation', ar: 'اللوجستيات والنقل' },
    hospitality: { en: 'Hospitality & Tourism', ar: 'الضيافة والسياحة' },
    retail: { en: 'Retail & E-commerce', ar: 'التجارة الإلكترونية والتجزئة' },
    realEstate: { en: 'Real Estate', ar: 'العقارات' },
    consulting: { en: 'Business Consulting', ar: 'الاستشارات التجارية' },
    maintenance: { en: 'Maintenance & Repair', ar: 'الصيانة والإصلاح' },
    design: { en: 'Design & Creative', ar: 'التصميم والإبداع' },
    automotive: { en: 'Automotive Services', ar: 'خدمات السيارات' }
  }
};

class I18nService {
  private currentLanguage: SupportedLanguage = 'en';
  private fallbackLanguage: SupportedLanguage = 'en';

  constructor() {
    this.currentLanguage = this.detectLanguage();
  }

  /**
   * Detect user's preferred language
   */
  private detectLanguage(): SupportedLanguage {
    // Check localStorage first
    const savedLanguage = localStorage.getItem('flextasker_language') as SupportedLanguage;
    if (savedLanguage && this.isValidLanguage(savedLanguage)) {
      return savedLanguage;
    }

    // Check browser language
    const browserLanguage = navigator.language.split('-')[0] as SupportedLanguage;
    if (this.isValidLanguage(browserLanguage)) {
      return browserLanguage;
    }

    // Default to English for UAE market
    return 'en';
  }

  /**
   * Check if language is supported
   */
  private isValidLanguage(lang: string): lang is SupportedLanguage {
    return UAE_BUSINESS_CONFIG.languages.supported.includes(lang as SupportedLanguage);
  }

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguage): void {
    if (!this.isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    this.currentLanguage = language;
    localStorage.setItem('flextasker_language', language);

    // Update document direction
    this.updateDocumentDirection();

    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language } 
    }));
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get text direction for current language
   */
  getTextDirection(): TextDirection {
    return UAE_BUSINESS_CONFIG.languages.rtl.includes(this.currentLanguage) ? 'rtl' : 'ltr';
  }

  /**
   * Update document direction
   */
  private updateDocumentDirection(): void {
    const direction = this.getTextDirection();
    document.documentElement.dir = direction;
    document.documentElement.lang = this.currentLanguage;
  }

  /**
   * Translate a key with optional parameters
   */
  translate(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let translation: any = translations;

    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Key not found, return the key itself as fallback
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // Get translation for current language
    let result: string;
    if (translation && typeof translation === 'object' && this.currentLanguage in translation) {
      result = translation[this.currentLanguage];
    } else if (translation && typeof translation === 'object' && this.fallbackLanguage in translation) {
      result = translation[this.fallbackLanguage];
    } else if (typeof translation === 'string') {
      result = translation;
    } else {
      console.warn(`Invalid translation format for key: ${key}`);
      return key;
    }

    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return result;
  }

  /**
   * Translate with shorthand method
   */
  t = this.translate.bind(this);

  /**
   * Format currency according to UAE standards
   */
  formatCurrency(options: CurrencyOptions): string {
    const { locale, amount, showSymbol = true, precision = 2 } = options;
    
    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
      style: 'currency',
      currency: UAE_BUSINESS_CONFIG.currency.code,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });

    if (!showSymbol) {
      return formatter.format(amount).replace(/[^\d\s,.-]/g, '').trim();
    }

    // Use custom formatting for better Arabic support
    if (locale === 'ar') {
      const formatted = formatter.format(amount);
      return UAE_BUSINESS_CONFIG.currency.format.ar
        .replace('{amount}', formatted.replace(/[^\d\s,.-]/g, '').trim())
        .replace('{symbol}', UAE_BUSINESS_CONFIG.currency.symbol);
    }

    return formatter.format(amount);
  }

  /**
   * Format numbers with locale-specific formatting
   */
  formatNumber(options: NumberOptions): string {
    const { 
      locale, 
      value, 
      style = 'decimal',
      minimumFractionDigits = 0,
      maximumFractionDigits = 2
    } = options;

    const formatter = new Intl.NumberFormat(locale === 'ar' ? 'ar-AE' : 'en-AE', {
      style,
      minimumFractionDigits,
      maximumFractionDigits
    });

    return formatter.format(value);
  }

  /**
   * Format date and time for UAE locale
   */
  formatDateTime(date: Date, options: DateTimeOptions): string {
    const { locale, format, includeTime = false } = options;
    
    const dateFormatOptions: Intl.DateTimeFormatOptions = {
      timeZone: UAE_BUSINESS_CONFIG.timezone
    };

    // Set date format based on requested format
    switch (format) {
      case 'short':
        dateFormatOptions.dateStyle = 'short';
        break;
      case 'medium':
        dateFormatOptions.dateStyle = 'medium';
        break;
      case 'long':
        dateFormatOptions.dateStyle = 'long';
        break;
      case 'full':
        dateFormatOptions.dateStyle = 'full';
        break;
    }

    if (includeTime) {
      dateFormatOptions.timeStyle = 'short';
    }

    const formatter = new Intl.DateTimeFormat(
      locale === 'ar' ? 'ar-AE' : 'en-AE',
      dateFormatOptions
    );

    return formatter.format(date);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(
      this.currentLanguage === 'ar' ? 'ar-AE' : 'en-AE',
      { numeric: 'auto' }
    );

    // Define time units in seconds
    const units = [
      { name: 'year', seconds: 31536000 },
      { name: 'month', seconds: 2592000 },
      { name: 'week', seconds: 604800 },
      { name: 'day', seconds: 86400 },
      { name: 'hour', seconds: 3600 },
      { name: 'minute', seconds: 60 }
    ];

    for (const unit of units) {
      const interval = Math.floor(diffInSeconds / unit.seconds);
      if (interval >= 1) {
        return rtf.format(-interval, unit.name as Intl.RelativeTimeFormatUnit);
      }
    }

    return this.translate('time.now');
  }

  /**
   * Get UAE emirate name in current language
   */
  getEmirateName(emirateId: string): string {
    const emirate = UAE_EMIRATES.find(e => e.id === emirateId);
    return emirate ? emirate.name[this.currentLanguage] : emirateId;
  }

  /**
   * Get business category name in current language
   */
  getCategoryName(categoryId: string): string {
    const category = UAE_BUSINESS_CONFIG.businessCategories.find(c => c.id === categoryId);
    return category ? category.name[this.currentLanguage] : categoryId;
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.getTextDirection() === 'rtl';
  }

  /**
   * Get CSS classes for current language direction
   */
  getDirectionClasses(): string {
    const direction = this.getTextDirection();
    return direction === 'rtl' ? 'rtl text-right' : 'ltr text-left';
  }

  /**
   * Get opposite direction (useful for icons and layout)
   */
  getOppositeDirection(): TextDirection {
    return this.getTextDirection() === 'rtl' ? 'ltr' : 'rtl';
  }

  /**
   * Pluralize based on count and language rules
   */
  pluralize(count: number, singular: TranslationKey, plural?: TranslationKey): string {
    const text = this.currentLanguage === 'ar' ? 
      this.getArabicPlural(count, singular, plural) :
      this.getEnglishPlural(count, singular, plural);
    
    return text.replace('{{count}}', this.formatNumber({
      locale: this.currentLanguage,
      value: count
    }));
  }

  /**
   * Handle English pluralization
   */
  private getEnglishPlural(count: number, singular: TranslationKey, plural?: TranslationKey): string {
    if (count === 1) {
      return singular.en;
    }
    return plural ? plural.en : singular.en + 's';
  }

  /**
   * Handle Arabic pluralization (simplified)
   */
  private getArabicPlural(count: number, singular: TranslationKey, plural?: TranslationKey): string {
    // Arabic has complex plural rules, this is a simplified version
    if (count === 1) {
      return singular.ar;
    } else if (count === 2) {
      return plural ? plural.ar : singular.ar;
    } else if (count >= 3 && count <= 10) {
      return plural ? plural.ar : singular.ar;
    } else {
      return singular.ar;
    }
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return UAE_BUSINESS_CONFIG.languages.supported;
  }

  /**
   * Get language display names
   */
  getLanguageNames(): Record<SupportedLanguage, string> {
    return {
      en: 'English',
      ar: 'العربية'
    };
  }
}

// Create singleton instance
export const i18nService = new I18nService();

// Export utility functions
export const t = i18nService.t;
export const formatCurrency = i18nService.formatCurrency.bind(i18nService);
export const formatDateTime = i18nService.formatDateTime.bind(i18nService);
export const formatRelativeTime = i18nService.formatRelativeTime.bind(i18nService);
export const isRTL = i18nService.isRTL.bind(i18nService);

export default i18nService;