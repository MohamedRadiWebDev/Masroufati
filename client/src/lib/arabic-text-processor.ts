import { type Category } from "@shared/schema";

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryAr?: string;
  note?: string;
}

interface ParsedTransactions {
  transactions: ParsedTransaction[];
  originalText: string;
}

// Unified Arabic text normalization function
function normalizeArabic(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Convert Arabic-Indic digits to ASCII digits
    .replace(/[٠-٩]/gu, (match) => String.fromCharCode(match.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0)))
    
    // Normalize Arabic letters
    .replace(/[إأآا]/gu, 'ا')  // Normalize Alif variations
    .replace(/[ىئي]/gu, 'ي')   // Normalize Ya variations  
    .replace(/ة/gu, 'ه')       // Normalize Ta Marbuta to Ha
    .replace(/[ؤو]/gu, 'و')    // Normalize Waw variations
    
    // Remove diacritics (Tashkeel)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/gu, '')
    
    // Normalize punctuation and spaces
    .replace(/[،؛]/gu, '،')     // Normalize Arabic comma/semicolon
    .replace(/[؟]/gu, '؟')      // Normalize Arabic question mark
    .replace(/\s+/gu, ' ')      // Normalize multiple spaces
    .trim();
}

// Common speech recognition errors and their corrections
const speechErrors: Record<string, string> = {
  // Numbers often misheard
  'عشره جنيه': 'عشرة جنيه',
  'عشرين جنيه': 'عشرين جنيه',
  'تلاتين جنيه': 'ثلاثين جنيه',
  'اربعين جنيه': 'أربعين جنيه',
  'خمسين جنيه': 'خمسين جنيه',
  
  // Common word substitutions
  'أشتري': 'اشتري',
  'أشتريت': 'اشتريت',
  'دافع': 'دفع',
  'دافعت': 'دفعت',
  'صارف': 'صرف',
  'صارفت': 'صرفت',
  'أكتر': 'اكتر',
  'أول': 'اول',
  'آخر': 'اخر',
  
  // Egyptian dialect corrections
  'مشريت': 'مشتري',
  'شاريت': 'شريت',
  'بادي': 'بدي',
  'عايز': 'عاوز',
  'عايزه': 'عاوزة',
  
  // Category confusions
  'موصلات': 'مواصلات',
  'مصاريف': 'مصروفات',
  'مشروبات': 'مشروب',
  'مأكولات': 'اكل',
  
  // Common phrase corrections
  'في المطعم': 'مطعم',
  'في السوبر ماركت': 'سوبرماركت',
  'في الصيدلية': 'صيدلية',
  'في البقالة': 'بقالة',
  'راحت على': 'راحت في',
  'صرفت على': 'صرفت في',
  'دفعت على': 'دفعت في',
  
  // Time expressions that get confused
  'امبارح': 'أمس',
  'النهارده': 'اليوم',
  'بكره': 'غداً',
  'الأسبوع الي فات': 'الأسبوع الماضي',
  'الشهر الي فات': 'الشهر الماضي'
};

// Context indicators for better understanding
const contextIndicators = {
  timeReferences: [
    'امبارح', 'أمس', 'البارحة', 'من شوية', 'من شوي', 'دلوقتي', 'دلوقت', 'حالاً', 'الحين',
    'النهارده', 'اليوم', 'بكره', 'غداً', 'بعد كده', 'بعد شوية', 'قريب', 'ع الفطار', 'ع الغدا', 'ع العشا',
    'الأسبوع ده', 'الأسبوع الي فات', 'الأسبوع الجاي', 'الشهر ده', 'الشهر الي فات', 'الشهر الجاي',
    'السنة دي', 'السنة الي فاتت', 'السنة الجاية', 'في رمضان', 'في العيد', 'في المولد'
  ],
  locationReferences: [
    'في البيت', 'في الشغل', 'في الشارع', 'في المول', 'في السوق', 'في النادي', 'في المطعم',
    'في الكافيه', 'في الصيدلية', 'في البقالة', 'في السوبرماركت', 'في المستشفى', 'في العيادة',
    'في المحطة', 'في المطار', 'في الجامعة', 'في المدرسة', 'في الكلية', 'في المكتب',
    'قريب من البيت', 'جمب البيت', 'حوالين البيت', 'في المنطقة', 'في الحي'
  ],
  paymentMethods: [
    'كاش', 'نقدي', 'نقداً', 'فيزا', 'كارت', 'بطاقة ائتمان', 'بطاقة', 'فودافون كاش', 'اورانج مني',
    'انستاباي', 'باي موب', 'محفظة', 'محفظة رقمية', 'تحويل', 'تحويل بنكي', 'ويسترن يونيون',
    'حوالة', 'شيك', 'قسط', 'أقساط', 'تقسيط', 'دفعة واحدة', 'مقدم', 'عربون'
  ],
  quantityIndicators: [
    'كيلو', 'جرام', 'لتر', 'علبة', 'كرتونة', 'شنطة', 'كيس', 'زجاجة', 'عدد', 'قطعة', 'حتة',
    'حبة', 'قطعتين', 'تلات قطع', 'شوية', 'كتير', 'قليل', 'بسيط', 'كبير', 'صغير',
    'نص كيلو', 'ربع كيلو', 'كيلو ونص', 'اتنين كيلو', 'تلات كيلو'
  ]
};

// Enhanced Arabic number words to digits mapping with colloquial variants
const arabicNumbers: Record<string, number> = {
  // Basic numbers - Standard Arabic
  'صفر': 0, 'واحد': 1, 'اثنان': 2, 'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5,
  'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
  
  // Egyptian colloquial variations (using different spellings)
  'احد': 1, 'اتنين': 2, 'تلاتة': 3, 'اربعة': 4, 'خمسه': 5,
  'سته': 6, 'سبعه': 7, 'تمانية': 8, 'تسعه': 9, 'عشره': 10,
  'اثنتين': 2, 'تنتين': 2, 'ثنتين': 2, // feminine variations
  
  // Additional colloquial variations
  'واحدة': 1, 'وحدة': 1, 'وحده': 1,
  'اتنتين': 2, 'تنين': 2, 'اثنتان': 2,
  'تلته': 3, 'تلاته': 3, 'ثلاثه': 3,
  'اربعه': 4, 'ربعة': 4, 'اربع': 4,
  'خمس': 5,
  'ست': 6, 'ستّة': 6,
  'سبع': 7, 'سبّعة': 7,
  'تمن': 8, 'تمان': 8, 'تمانه': 8, 'تمنية': 8,
  'تسع': 9, 'تسّعة': 9,
  'عشر': 10, 'عشّرة': 10,
  
  // Tens with variations
  'عشرين': 20, 'عشرون': 20, 'عشرين جنيه': 20,
  'ثلاثين': 30, 'ثلاثون': 30, 'تلاتين': 30,
  'اربعين': 40, 'أربعون': 40, 'اربعون': 40,
  'خمسين': 50, 'خمسون': 50, 'خمسين جنيه': 50,
  'ستين': 60, 'ستون': 60, 'سّتين': 60,
  'سبعين': 70, 'سبعون': 70, 'سبّعين': 70,
  'ثمانين': 80, 'ثمانون': 80, 'تمانين': 80,
  'تسعين': 90, 'تسعون': 90, 'تسّعين': 90,
  
  // Compound teens - Standard
  'احد عشر': 11, 'اثنا عشر': 12, 'ثلاثة عشر': 13, 'أربعة عشر': 14, 'خمسة عشر': 15,
  'ستة عشر': 16, 'سبعة عشر': 17, 'ثمانية عشر': 18, 'تسعة عشر': 19,
  
  // Compound teens - Colloquial
  'احداشر': 11, 'اتناشر': 12, 'تلتاشر': 13, 'اربعتاشر': 14, 'خمستاشر': 15,
  'ستاشر': 16, 'سبعتاشر': 17, 'تمنتاشر': 18, 'تسعتاشر': 19,
  'حداشر': 11, 'اطناشر': 12, 'طلتاشر': 13,
  
  // Hundreds with variations
  'مائة': 100, 'مية': 100, 'مئة': 100, 'ميت': 100, 'مايه': 100,
  'مئتان': 200, 'مئتين': 200, 'ميتين': 200, 'مايتين': 200,
  
  // Thousands with variations
  'الف': 1000, 'ألف': 1000, 'آلاف': 1000, 'ألاف': 1000,
  'الفين': 2000, 'ألفين': 2000, 'ألفان': 2000,
  'تلات آلاف': 3000, 'ثلاثة آلاف': 3000,
  'اربع آلاف': 4000, 'أربعة آلاف': 4000,
  'خمس آلاف': 5000, 'خمسة آلاف': 5000,
  
  // Common fractions with variations
  'نص': 0.5, 'نصف': 0.5, 'نُص': 0.5, 'نِص': 0.5,
  'ربع': 0.25, 'ربُع': 0.25, 'ربْع': 0.25,
  'تلت': 0.33, 'ثلث': 0.33, 'تُلت': 0.33,
  'تلتين': 0.67, 'ثلثين': 0.67, 'ثلثان': 0.67,
};

// Enhanced Expense keywords with Egyptian colloquial variations - Pre-normalized
const expenseKeywords = [
  // Standard Arabic
  'صرف', 'صرفت', 'دفع', 'دفعت', 'اشتري', 'اشتريت', 'مصروف', 'مصاريف',
  'خرج', 'خرجت', 'انفق', 'انفقت', 'بلاش', 'اتحسب', 'طلع', 'طلعت', 'ادفع',
  
  // Egyptian colloquial - Future tense
  'هدفع', 'هصرف', 'هشتري', 'حدفع', 'حصرف', 'حشتري', 
  'هاشتري', 'هاصرف', 'هادفع', 'هاطلع', 
  
  // Egyptian colloquial - Present continuous
  'بشتري', 'بصرف', 'بدفع', 'بطلع', 'باشتري', 'باصرف', 'بادفع',
  
  // Egyptian colloquial - Past tense variations
  'اشتريت', 'صرفت', 'دفعت', 'طلعت', 'خلصت', 'اديت',
  'شريت', 'صرفت', 'دفعت', 'طلعت', 'خلصت',
  
  // Context-aware expressions
  'راح', 'راحت', 'اتصرف', 'اتدفع', 'خلاص', 'انتهي', 'فات',
  'ضاع', 'ضاعت', 'انفرط', 'انفرطت', 'فلت', 'فلتت',
  'مشتري', 'ماشي', 'تمام', 'اوكي', 'باي باي', 'يللا',
  
  // Financial expressions
  'دي فلوس', 'فلوس راحت', 'فلوس طلعت', 'فلوس خلصت', 'فلوس ضاعت',
  'المصاري راحت', 'المصاري طلعت', 'الفلوس خلاص', 'اتحرقت فلوس',
  
  // Specific purchasing contexts
  'اشتري من', 'اشتري ل', 'دفعت في', 'صرفت علي', 'طلعت في',
  'عملت حساب', 'دفعت حساب', 'سددت', 'قضيت', 'انفقت علي'
].map(keyword => normalizeArabic(keyword));

// Enhanced Income keywords with Egyptian colloquial variations - Pre-normalized
const incomeKeywords = [
  // Standard Arabic
  'دخل', 'دخول', 'استلم', 'استلمت', 'وصل', 'وصلت', 'ربح', 'ربحت',
  'قبض', 'قبضت', 'حصل', 'حصلت', 'وصل', 'وصلت',
  
  // Egyptian colloquial - Past tense
  'اخد', 'اخدت', 'جاني', 'جالي', 'جه', 'جت', 'وصلني', 'وصلتني',
  'خدت', 'استلمت', 'قبضت', 'حصلت علي', 'جابوا', 'جابولي',
  
  // Egyptian colloquial - Future tense
  'هاخد', 'هستلم', 'هقبض', 'حاخد', 'حستلم', 'حقبض',
  'هيجي', 'هيجيلي', 'هيوصل', 'هيوصلي', 'هحصل علي',
  
  // Egyptian colloquial - Present continuous
  'باخد', 'بستلم', 'بقبض', 'بحصل علي', 'بجيب', 'بكسب',
  
  // Context-aware expressions
  'واصل', 'واصله', 'اتقبض', 'اتاخد', 'اتاستلم', 'اتحصل',
  'اتسلم', 'اتجاب', 'اتوصل', 'اتسدد', 'اتعطي',
  
  // Financial expressions
  'فلوس جايه', 'فلوس داخله', 'فلوس واصله', 'جايني فلوس',
  'المصاري جت', 'المصاري وصلت', 'الفلوس وصلت', 'دخلت فلوس',
  'جاني راتب', 'جالي مرتب', 'قبضت راتب', 'استلمت مرتب',
  
  // Work-related income
  'شغل', 'عمل', 'وظيفه', 'كسب', 'ربح', 'مكسب', 'عايد',
  'مقابل', 'اجر', 'مكافاه', 'عموله', 'حافز', 'بونص'
].map(keyword => normalizeArabic(keyword));

function extractAmounts(text: string): number[] {
  if (!text || typeof text !== 'string') return [];
  
  // Apply unified processing pipeline: correction → normalization → context analysis → extraction
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText);
  const context = analyzeContext(normalizedText);
  return extractAmountsWithContext(normalizedText, context);
}

function extractComplexArabicNumber(text: string): number | null {
  // Handle compound numbers like "مائة وخمسة وعشرين" (125)
  let normalizedText = text
    .replace(/\s*و\s*/g, ' ') // Replace "و" with space
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalizedText.split(/\s+/);
  let total = 0;
  let current = 0;
  let hasNumber = false;

  for (let i = 0; i < words.length; i++) {
    // First check for longer compound phrases (3 words, then 2 words)
    let phraseMatched = false;
    
    for (let phraseLength = 3; phraseLength >= 2 && i + phraseLength <= words.length; phraseLength--) {
      const phrase = words.slice(i, i + phraseLength).join(' ');
      const phraseValue = arabicNumbers[phrase];
      
      if (phraseValue !== undefined) {
        hasNumber = true;
        
        if (phraseValue === 1000) {
          if (current === 0) current = 1;
          total += current * 1000;
          current = 0;
        } else if (phraseValue === 100) {
          if (current === 0) current = 1;
          current *= 100;
        } else if (phraseValue >= 10 && phraseValue < 100) {
          current += phraseValue;
        } else {
          current += phraseValue;
        }
        
        i += phraseLength - 1; // Skip processed words
        phraseMatched = true;
        break;
      }
    }
    
    // If no phrase matched, check individual word
    if (!phraseMatched) {
      const word = words[i].trim();
      const value = arabicNumbers[word];
      
      if (value !== undefined) {
        hasNumber = true;
        
        if (value === 1000) {
          if (current === 0) current = 1;
          total += current * 1000;
          current = 0;
        } else if (value === 100) {
          if (current === 0) current = 1;
          current *= 100;
        } else if (value >= 10 && value < 100) {
          current += value;
        } else {
          current += value;
        }
      }
    }
  }

  total += current;
  return hasNumber && total > 0 ? total : null;
}

function detectTransactionType(text: string): 'income' | 'expense' {
  if (!text || typeof text !== 'string') return 'expense';
  
  // Apply unified normalization pipeline
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText.toLowerCase());
  
  // Normalize keywords for consistent matching
  const normalizedExpenseKeywords = expenseKeywords.map(keyword => normalizeArabic(keyword.toLowerCase()));
  const normalizedIncomeKeywords = incomeKeywords.map(keyword => normalizeArabic(keyword.toLowerCase()));
  
  // Check for expense keywords with normalized text
  for (const keyword of normalizedExpenseKeywords) {
    if (normalizedText.includes(keyword)) {
      return 'expense';
    }
  }
  
  // Check for income keywords with normalized text
  for (const keyword of normalizedIncomeKeywords) {
    if (normalizedText.includes(keyword)) {
      return 'income';
    }
  }
  
  // Default to expense if unsure
  return 'expense';
}

function detectCategory(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  if (!text || typeof text !== 'string') {
    return transactionType === 'expense' ? 'other' : 'other_income';
  }
  
  // Apply unified normalization pipeline
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText.toLowerCase());
  const relevantCategories = categories.filter(cat => cat.type === transactionType);
  
  // Category keywords mapping with normalized keywords
  const categoryKeywords: Record<string, string[]> = {
    'food': ['اكل', 'طعام', 'غداء', 'فطار', 'عشا', 'شاي', 'قهوه', 'مطعم', 'كافيه', 'وجبه'],
    'transport': ['مواصلات', 'تاكسي', 'اوبر', 'كريم', 'اتوبيس', 'بنزين', 'وقود', 'سياره'],
    'bills': ['فواتير', 'كهرباء', 'مياه', 'غاز', 'تليفون', 'نت', 'انترنت'],
    'shopping': ['تسوق', 'شراء', 'ملابس', 'حاجات', 'سوبرماركت'],
    'entertainment': ['سينما', 'فيلم', 'لعبه', 'ترفيه', 'نادي', 'كوره'],
    'health': ['دكتور', 'دوا', 'علاج', 'صيدليه', 'مستشفي', 'كشف'],
    'salary': ['راتب', 'مرتب', 'شغل', 'عمل', 'وظيفه'],
    'freelance': ['فري لانس', 'مشروع', 'شغل حر'],
    'business': ['تجاره', 'بيع', 'ربح', 'محل'],
    'gift': ['هديه', 'عيديه', 'مناسبه']
  };
  
  // Normalize all category keywords for consistent matching
  const normalizedCategoryKeywords: Record<string, string[]> = {};
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    normalizedCategoryKeywords[categoryName] = keywords.map(keyword => normalizeArabic(keyword));
  }
  
  // Try to match category keywords
  for (const [categoryName, keywords] of Object.entries(normalizedCategoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        const category = relevantCategories.find(cat => cat.name === categoryName);
        if (category) {
          return category.name;
        }
      }
    }
  }
  
  // Default categories
  return transactionType === 'expense' ? 'other' : 'other_income';
}

// Smart text correction function - targeted corrections only
function correctSpeechErrors(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let correctedText = text;
  
  // Apply targeted speech error corrections using Unicode-safe boundaries
  for (const [error, correction] of Object.entries(speechErrors)) {
    // Use Unicode-safe lookarounds instead of \b for Arabic text
    const escapedError = error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\p{L})${escapedError}(?!\\p{L})`, 'gui');
    correctedText = correctedText.replace(regex, correction);
  }
  
  return correctedText;
}

// Enhanced context analysis function with unified normalization
function analyzeContext(text: string): {
  hasTimeReference: boolean;
  hasLocationReference: boolean;
  hasPaymentMethod: boolean;
  hasQuantityIndicator: boolean;
  confidence: number;
} {
  if (!text || typeof text !== 'string') {
    return {
      hasTimeReference: false,
      hasLocationReference: false,
      hasPaymentMethod: false,
      hasQuantityIndicator: false,
      confidence: 0
    };
  }
  
  const normalizedText = normalizeArabic(text.toLowerCase());
  
  // Normalize context indicators for consistent matching
  const normalizedTimeRefs = contextIndicators.timeReferences.map(ref => normalizeArabic(ref.toLowerCase()));
  const normalizedLocationRefs = contextIndicators.locationReferences.map(ref => normalizeArabic(ref.toLowerCase()));
  const normalizedPaymentMethods = contextIndicators.paymentMethods.map(method => normalizeArabic(method.toLowerCase()));
  const normalizedQuantityIndicators = contextIndicators.quantityIndicators.map(qty => normalizeArabic(qty.toLowerCase()));
  
  const hasTimeReference = normalizedTimeRefs.some(ref => 
    normalizedText.includes(ref)
  );
  
  const hasLocationReference = normalizedLocationRefs.some(ref => 
    normalizedText.includes(ref)
  );
  
  const hasPaymentMethod = normalizedPaymentMethods.some(method => 
    normalizedText.includes(method)
  );
  
  const hasQuantityIndicator = normalizedQuantityIndicators.some(qty => 
    normalizedText.includes(qty)
  );
  
  // Calculate confidence based on context completeness
  let confidence = 0.5; // Base confidence
  if (hasTimeReference) confidence += 0.1;
  if (hasLocationReference) confidence += 0.2;
  if (hasPaymentMethod) confidence += 0.1;
  if (hasQuantityIndicator) confidence += 0.1;
  
  return {
    hasTimeReference,
    hasLocationReference,
    hasPaymentMethod,
    hasQuantityIndicator,
    confidence: Math.min(confidence, 1.0)
  };
}

// Advanced complex sentence splitting with context awareness
function splitComplexSentence(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  
  // Apply normalization first
  const normalizedText = normalizeArabic(text);
  
  // First analyze the text for context
  const context = analyzeContext(normalizedText);
  
  // Enhanced separators with context awareness using Unicode-safe patterns
  const separators = [
    // Strong separators (high confidence splits)
    /\s*،\s*/gu, // Comma separator
    /\s+و\s+(?=[\p{N}]+[\s\u0660-\u0669]*|\p{L}+\s+[\p{N}])/gu, // "و" followed by number
    /\s+كمان\s+(?=[\p{N}]|\p{L}+\s+[\p{N}])/gu, // "كمان" with numbers
    /\s+برضه\s+(?=[\p{N}]|\p{L}+\s+[\p{N}])/gu, // "برضه" with numbers  
    /\s+وكمان\s+(?=[\p{N}]|\p{L}+\s+[\p{N}])/gu, // "وكمان" with numbers
    
    // Conditional separators (based on context)
    ...(context.confidence > 0.7 ? [
      /\s+و\s+(?=اشتريت|صرفت|دفعت|جبت)/gu, // "و" before action verbs
      /\s+و\s+(?=في\s+)/gu, // "و" before location indicators
      /\s+بعدين\s+/gu, // "بعدين" (then)
      /\s+و\s*بعدها\s+/gu, // "وبعدها" (and after that)
    ] : []),
    
    // Specific patterns for multiple purchases
    /(?:و\s*)?(?:اشتريت|جبت|صرفت\s+علي)\s+/gu,
    
    // Time-based separators
    /\s+في\s+نفس\s+اليوم\s+/gu,
    /\s+بعد\s+كده\s+/gu,
  ];
  
  let sentences = [normalizedText];
  
  for (const separator of separators) {
    const newSentences: string[] = [];
    for (const sentence of sentences) {
      const splits = sentence.split(separator);
      // Only split if resulting sentences still make sense (have amounts or actions)
      if (splits.length > 1 && splits.every(s => s.trim().length > 5)) {
        newSentences.push(...splits);
      } else {
        newSentences.push(sentence);
      }
    }
    sentences = newSentences;
  }
  
  // Clean up and validate sentences using Unicode-safe patterns
  return sentences
    .map(s => s.trim())
    .filter(s => s.length > 3) // Filter very short fragments
    .filter(s => /[\p{N}]+|واحد|اثنان|ثلاث|اربع|خمس|ست|سبع|تمان|تسع|عشر/gu.test(s)); // Must contain some form of number
}

// Enhanced amount extraction with context awareness
function extractAmountsWithContext(text: string, context: any): number[] {
  if (!text || typeof text !== 'string') return [];
  
  const amounts: number[] = [];
  
  // Apply unified processing pipeline: correction → normalization
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText);
  
  // Remove common currency words using precise boundaries to avoid breaking words like "جبنة"
  let cleanText = normalizedText
    .replace(/(?<!\p{L})(?:جنيه|ج\.م|ج|جم)(?!\p{L})/gu, ' ')
    .replace(/(?<!\p{L})(?:ريال|ر\.س|درهم|دولار)(?!\p{L})/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();

  // Enhanced number extraction with context
  if (context.hasQuantityIndicator) {
    // Look for quantity-price patterns like "كيلو بـ عشرة جنيه" using Unicode-safe patterns
    const quantityPricePattern = /(?:كيلو|جرام|لتر|قطعه|حبه)\s+(?:بـ|ب)\s*([\p{N}]+(?:\.[\p{N}]+)?|\p{L}+)/gu;
    let match;
    while ((match = quantityPricePattern.exec(cleanText)) !== null) {
      const numMatch = match[1];
      if (/^[\p{N}]+(?:\.[\p{N}]+)?$/u.test(numMatch)) {
        const parsedAmount = parseFloat(numMatch);
        if (Number.isFinite(parsedAmount)) {
          amounts.push(parsedAmount);
        }
      } else {
        const arabicAmount = extractComplexArabicNumber(numMatch);
        if (arabicAmount && arabicAmount > 0) {
          amounts.push(arabicAmount);
        }
      }
    }
  }
  
  // Standard number extraction using Unicode-safe patterns
  const regex = /[\p{N}]+(?:\.[\p{N}]+)?/gu;
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    const parsedAmount = parseFloat(match[0]);
    if (Number.isFinite(parsedAmount)) {
      amounts.push(parsedAmount);
    }
  }

  // Enhanced Arabic number extraction
  const textWithoutNumbers = cleanText.replace(/[\p{N}]+(?:\.[\p{N}]+)?/gu, ' ').trim();
  if (textWithoutNumbers) {
    const arabicAmount = extractComplexArabicNumber(textWithoutNumbers);
    if (arabicAmount && arabicAmount > 0) {
      amounts.push(arabicAmount);
    }
  }

  // Context-based amount validation
  const validAmounts = amounts.filter(amount => {
    if (amount <= 0) return false;
    if (amount > 1000000) return false; // Unreasonably large
    if (context.confidence < 0.6 && amount > 10000) return false; // High amounts need high confidence
    return true;
  });

  // Remove duplicates with tolerance
  const uniqueAmounts: number[] = [];
  for (const amount of validAmounts) {
    const isDuplicate = uniqueAmounts.some(existing => 
      Math.abs(existing - amount) < 0.01
    );
    if (!isDuplicate) {
      uniqueAmounts.push(amount);
    }
  }
  
  return uniqueAmounts;
}

// Create a utility function to suggest category for any text input
export function suggestCategoryFromText(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  if (!text || typeof text !== 'string') {
    return transactionType === 'expense' ? 'other' : 'other_income';
  }
  
  // Apply unified processing pipeline
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText);
  
  return detectCategoryFuzzy(normalizedText, categories, transactionType);
}

// Enhanced category detection with fuzzy matching
function detectCategoryFuzzy(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  const normalizedText = text.toLowerCase();
  const relevantCategories = categories.filter(cat => cat.type === transactionType);
  
  // Enhanced category keywords with extensive variations
  const categoryKeywords: Record<string, string[]> = {
    'food': [
      // Basic food terms
      'أكل', 'طعام', 'غداء', 'فطار', 'فطور', 'عشا', 'عشاء', 'وجبة', 'وجبات', 'اكلة', 'اكلات',
      // Restaurants and cafes
      'مطعم', 'مطاعم', 'كافيه', 'كافيتيريا', 'فودكورت', 'ديليفري', 'تيك اواي', 'توصيل', 'كشك', 'عربية فول',
      // Beverages
      'شاي', 'قهوة', 'عصير', 'مياه', 'ماء', 'بيبسي', 'كوكاكولا', 'شراب', 'عصائر', 'نسكافيه', 'كابتشينو', 'عصير طبيعي',
      // Egyptian food
      'فول', 'طعمية', 'كشري', 'ملوخية', 'محشي', 'فراخ', 'لحمة', 'سمك', 'رز', 'أرز', 'مسقعة', 'بامية', 'فسيخ', 'رنجة', 
      'ورق عنب', 'كباب حلة', 'رقاق', 'فتة', 'حواوشي', 'فطير', 'عسل اسود', 'طحينة', 'سلطة', 'رقاق لحمة',
      'شاورما فراخ', 'شاورما لحمة', 'كفتة داود باشا', 'روبيان', 'جمبري', 'كابوريا', 'بلطي', 'بوري', 'دنيس',
      'كباب وكفتة', 'مشاوي', 'حمام محشي', 'فراخ بانيه', 'استربس', 'زنجر', 'توينكي', 'برجر لحمة', 'برجر فراخ',
      // International food
      'بيتزا', 'برجر', 'شاورما', 'كباب', 'كفتة', 'باستا', 'مكرونة', 'هوت دوج', 'ساندويتش', 'كنتاكي', 'ماكدونالدز',
      'سوشي', 'صيني', 'هندي', 'تركي', 'لبناني', 'سوري', 'مغربي', 'بيتزا هت', 'دومينوز', 'بابا جونز',
      'صب واي', 'هارديز', 'كيه اف سي', 'كوك دور', 'تشيليز', 'كاسبر اند جامبينيز', 'ديليزيوسو', 'موز',
      'سي بي ار', 'زكريات', 'عبد الرؤوف', 'الدهان', 'الشبراوي', 'جعفر الطيار',
      // Basics and groceries
      'عيش', 'خبز', 'لبن', 'حليب', 'جبنة', 'جبن', 'زيت', 'سكر', 'شعيرية', 'حاجات اكل', 'بقالة', 'خضار', 'فواكه',
      'بيض', 'فراخ نية', 'لحمة نية', 'سمك ني', 'رز', 'مكرونة جافة', 'سكر', 'دقيق', 'شاي جاف', 'قهوة',
      'طماطم', 'خيار', 'جزر', 'بصل', 'ثوم', 'فلفل', 'باذنجان', 'كوسة', 'ملوخية نية', 'بقدونس', 'شبت',
      'برتقال', 'تفاح', 'موز', 'عنب', 'مانجو', 'فراولة', 'تين', 'رمان', 'خوخ', 'كمثرى', 'مشمش',
      'عيش بلدي', 'عيش شمسي', 'عيش فينو', 'عيش توست', 'كرواسون', 'بسكوت', 'حلاوة طحينية',
      // Sweets and snacks
      'حلويات', 'شوكولاتة', 'ايس كريم', 'كيك', 'تورتة', 'بسكويت', 'شيبسي', 'ناتس', 'لوز', 'بندق', 'تمر',
      'كنافة', 'بقلاوة', 'قطايف', 'مهلبية', 'ارز بلبن', 'كسترد', 'جيلاتي', 'بوظة'
    ],
    'transport': [
      // Public transport
      'مواصلات', 'موصلات', 'اتوبيس', 'أتوبيس', 'مترو', 'مايكروباص', 'ميكروباص', 'ترام', 'قطر المترو',
      // Ride services
      'تاكسي', 'اوبر', 'كريم', 'اندرايف', 'سويفل', 'توك توك', 'بجاج', 'دي دي', 'ديدي', 'جو باص',
      'تاكسي اصفر', 'تاكسي ابيض', 'اوبر x', 'اوبر بلاك', 'كريم جو', 'كريم بلاس', 'ديدي اكسبرس',
      // Private transport
      'سيارة', 'عربية', 'موتوسيكل', 'عجلة', 'دراجة', 'سكوتر', 'دباب',
      // Fuel and maintenance
      'بنزين', 'سولار', 'وقود', 'غاز طبيعي', 'اسطى', 'صيانة', 'غيار', 'زيت موتور', 'محطة وقود', 'محطة بنزين',
      'كاوتش', 'اطارات', 'فرامل', 'كلاتش', 'جير', 'موتور', 'بطارية', 'راديتر', 'تبريد',
      // Travel
      'قطار', 'طيارة', 'طيران', 'سفر', 'رحلة', 'تذكرة', 'تذاكر', 'مطار', 'طيارة', 'سكك حديد', 'محطة قطار',
      // Parking and fees
      'باركينج', 'موقف', 'جراج', 'رسوم طريق', 'مرور'
    ],
    'bills': [
      // Utilities
      'فواتير', 'فاتورة', 'كهرباء', 'مياه', 'غاز', 'شركة المياه', 'شركة الكهرباء', 'الكهربا', 'عداد', 'عدادات',
      'قراءة عداد', 'استهلاك', 'فاتورة كهربا', 'فاتورة مياه', 'فاتورة غاز', 'مرافق', 'خدمات',
      // Telecom
      'تليفون', 'موبايل', 'نت', 'انترنت', 'واي فاي', 'كابل', 'dsl', 'فايبر', 'باقة', 'باقات',
      'فودافون', 'اورانج', 'اتصالات', 'وي', 'تي داتا', 'لينك', 'رصيد', 'شحن', 'كارت شحن', 'فليكس',
      'مكالمات', 'رسائل', 'انترنت موبايل', 'هوتسبوت', 'اديسل', 'فايبر اوبتك'
    ],
    'shopping': [
      // General shopping
      'تسوق', 'تسويق', 'شراء', 'شريت', 'اشتريت', 'حاجات', 'مشتريات', 'سوق', 'اسواق',
      // Stores
      'سوبرماركت', 'هايبر', 'مول', 'سنتر', 'محل', 'دكان', 'بقالة', 'جمعية', 'كارفور', 'هايبر وان', 
      'سبينس', 'كازيون', 'راكب', 'فتح الله', 'خير زمان', 'اولاد رجب', 'سيتي سنتر', 'مول العرب', 'جنينة مول',
      'سيتي ستارز', 'فيستيفال سيتي', 'كونكورد بلازا', 'الماسة', 'ويست تاون', 'ذا سبوت', 'كايرو فيستيفال',
      'سيتي سكيب', 'كابيتال سنتر', 'مكة مول', 'بورت غاليب', 'سان ستيفانو', 'اوتليت',
      // Clothing
      'ملابس', 'هدوم', 'جزمة', 'حذاء', 'بنطلون', 'قميص', 'تيشيرت', 'فستان', 'جلابية', 'بلوزة', 'جاكت',
      'شنطة', 'حقيبة', 'ساعة', 'اكسسوارات', 'نضارة', 'خاتم', 'سلسلة', 'اسوارة', 'حلق', 'طربوش',
      'ملابس داخلية', 'جوارب', 'كرافتة', 'حزام', 'محفظة', 'شبشب', 'صندل',
      // Personal care
      'عطر', 'كريم', 'شامبو', 'صابون', 'مكياج', 'مستحضرات تجميل', 'ديودرانت', 'لوشن', 'فرشة اسنان',
      'معجون اسنان', 'غسول', 'كريم حلاقة', 'موس', 'مناديل', 'بودرة',
      // Electronics and appliances  
      'موبايل', 'تليفون', 'كمبيوتر', 'لابتوب', 'تابلت', 'تلفزيون', 'راديو', 'مكيف', 'غسالة', 'ثلاجة',
      'بوتاجاز', 'فرن', 'مايكرويف', 'خلاط', 'مكنسة كهربائية', 'مكواة', 'سخان', 'ديب فريزر', 'فريزر',
      'ايفون', 'ايباد', 'سامسونج', 'هواوي', 'شاومي', 'ريلمي', 'اوبو', 'فيفو', 'نوكيا', 'ال جي',
      'سوني', 'توشيبا', 'شارب', 'باناسونيك', 'بوش', 'سيمنس', 'اندرويد', 'ايفون 15', 'ايفون 14',
      'سماعات', 'ايربودز', 'سماعة بلوتوث', 'باور بانك', 'شاحن', 'كابل شحن', 'جراب موبايل', 'شاشة حماية'
    ],
    'entertainment': [
      // Cinema and shows
      'سينما', 'فيلم', 'مسرح', 'كونسرت', 'حفلة', 'مهرجان', 'عرض', 'تياترو', 'اوبرا', 'دار الاوبرا',
      // Games and activities
      'لعبة', 'العاب', 'بولينج', 'بلايستيشن', 'جيم', 'نادي', 'سبورت', 'xbox', 'فيفا', 'بيس', 'كول اوف ديوتي',
      'بلياردو', 'تنس طاولة', 'كاراتيه', 'جودو', 'سباحة', 'غطس',
      // Sports
      'كورة', 'كرة قدم', 'مباراة', 'ملعب', 'نادي رياضي', 'الاهلي', 'الزمالك', 'النادي', 'كاس العالم', 'شامبيونز',
      'تنس', 'سكواش', 'كرة يد', 'كرة سلة', 'طائرة', 'ملاكمة', 'مصارعة',
      // Fun places
      'ترفيه', 'ملاهي', 'اكوا بارك', 'نادي', 'كافيه', 'قهوة', 'شيشة', 'حديقة', 'متحف', 'معرض', 'فيستيفال',
      'كلوب', 'ديسكو', 'حفلة', 'زفة', 'فرح', 'مولد', 'خروجة', 'نزهة'
    ],
    'health': [
      // Medical services
      'دكتور', 'طبيب', 'دكتورة', 'كشف', 'عيادة', 'مستشفى', 'مركز طبي', 'معمل', 'لاب', 'تجميل', 'ليزر',
      'رعاية صحية', 'تأهيل', 'فيزيوثيرابي', 'علاج طبيعي',
      // Specialties
      'أسنان', 'عيون', 'جلدية', 'باطنة', 'عظام', 'نساء وتوليد', 'اطفال', 'قلب', 'مخ واعصاب', 'نفسية',
      'كلى', 'كبد', 'صدر', 'انف واذن', 'مسالك', 'غدد', 'سكر', 'ضغط', 'سمنة', 'تخسيس',
      // Procedures
      'عملية', 'جراحة', 'تحليل', 'تحاليل', 'أشعة', 'موجات صوتية', 'منظار', 'قسطرة', 'زراعة', 'ترقيع',
      'حشو', 'خلع', 'تقويم اسنان', 'تبييض', 'زراعة اسنان', 'طقم اسنان',
      // Pharmacy
      'صيدلية', 'دوا', 'دواء', 'علاج', 'فيتامين', 'مكمل غذائي', 'حقنة', 'مصل', 'لقاح', 'تطعيم',
      'اقراص', 'كبسولات', 'شراب', 'مرهم', 'قطرة', 'بخاخ', 'جل', 'كريم طبي'
    ],
    'salary': [
      'راتب', 'مرتب', 'مرتبات', 'شغل', 'عمل', 'وظيفة', 'شركة', 'مكافأة', 'علاوة',
      'حافز', 'بونص', 'عمولة', 'اجر', 'معاش'
    ],
    'freelance': [
      'فري لانس', 'فريلانس', 'مشروع', 'شغل حر', 'كورس', 'تدريس', 'استشارة',
      'تصميم', 'برمجة', 'كتابة', 'ترجمة', 'تطوير'
    ],
    'business': [
      'تجارة', 'بيع', 'ربح', 'أرباح', 'محل', 'مشروع', 'استثمار', 'شراكة',
      'صفقة', 'عمولة', 'مبيعات', 'تجاري'
    ],
    'gift': [
      'هدية', 'هدايا', 'عيدية', 'مناسبة', 'عيد', 'جواز', 'فرح', 'خطوبة', 'مولود',
      'عيد ميلاد', 'تخرج', 'ترقية', 'نجاح'
    ],
    // Additional categories
    'education': [
      'تعليم', 'مدرسة', 'جامعة', 'كورس', 'دورة', 'كتاب', 'كتب', 'قرطاسية', 'حضانة', 'كي جي',
      'مصاريف دراسية', 'رسوم', 'دروس خصوصية', 'سنتر', 'مذاكرة', 'امتحان', 'شهادة', 'دبلومة',
      'اكاديمية', 'معهد', 'كلية', 'جامعة', 'ماجستير', 'دكتوراة', 'تدريب', 'ورشة',
      'قلم', 'كراسة', 'كشكول', 'مسطرة', 'برايا', 'استيكة', 'الوان', 'فلوماستر', 'شنطة مدرسة'
    ],
    'home': [
      'بيت', 'شقة', 'منزل', 'ايجار', 'اثاث', 'موبيليا', 'ديكور', 'فرش', 'موكيت', 'سجاد', 'ستارة',
      'صيانة', 'نظافة', 'عمالة منزلية', 'عاملة', 'شغالة', 'سباك', 'كهربائي', 'نجار', 'دهان', 'بلاط',
      'ترميم', 'تشطيب', 'مطبخ', 'حمام', 'غرفة نوم', 'ريسبشن', 'صالون', 'بلكونة', 'سطح',
      'سرير', 'دولاب', 'كومودينو', 'مرايا', 'منضدة', 'كنبة', 'فوتيه', 'ترابيزة', 'رف', 'مكتبة'
    ],
    'insurance': [
      'تأمين', 'تأمينات', 'بوليصة', 'قسط', 'تكافل', 'تأمين صحي', 'تأمين سيارة', 'تأمين منزل', 
      'تأمين على الحياة', 'حوادث', 'مسئولية مدنية', 'شركة تأمين', 'مطالبة تأمين', 'تعويض'
    ],
    // New categories
    'pets': [
      'حيوانات أليفة', 'قطة', 'قطط', 'كلب', 'كلاب', 'عصافير', 'عصفور', 'سمك', 'اسماك', 'سلحفاة',
      'دكتور بيطري', 'بيطري', 'علاج حيوانات', 'اكل قطط', 'اكل كلاب', 'رمل قطط', 'قفص', 'اقفاص',
      'حوض سمك', 'طعام حيوانات', 'لعب حيوانات', 'شامبو حيوانات', 'فيتامين حيوانات'
    ],
    'beauty': [
      'كوافير', 'حلاق', 'صالون', 'مانيكير', 'باديكير', 'فرد شعر', 'صبغة', 'صبغة شعر', 'قص شعر',
      'حمام كريم', 'بروتين', 'كيراتين', 'تشقير', 'خيوط', 'شمع', 'ليزر', 'تجميل', 'بوتكس',
      'فيلر', 'تاتو', 'حناء', 'مكياج', 'ميك اب', 'رموش', 'حواجب', 'نيل ارت'
    ],
    'charity': [
      'صدقة', 'تبرع', 'تبرعات', 'زكاة', 'خيرية', 'جمعية خيرية', 'اعمال خيرية', 'كفالة يتيم',
      'مساعدة', 'معونة', 'مساهمة', 'فقراء', 'محتاجين', 'جمعية', 'دار ايتام', 'مؤسسة خيرية'
    ],
    'office': [
      'مكتب', 'شركة', 'مؤسسة', 'مكتبية', 'قرطاسية', 'طباعة', 'تصوير', 'ورق', 'حبر', 'طابعة',
      'فاكس', 'سكانر', 'لابتوب', 'كمبيوتر مكتبي', 'شاشة', 'كيبورد', 'ماوس', 'مكتب خشب',
      'كرسي مكتب', 'دولاب ملفات', 'خزانة', 'ملفات', 'استيكرز', 'دباسة', 'مقص'
    ],
    'travel': [
      'سفر', 'سياحة', 'رحلة', 'رحلات', 'طيران', 'طيارة', 'تذكرة طيران', 'مطار', 'فيزا', 'تأشيرة',
      'فندق', 'حجز فندق', 'بوكينج', 'اجودا', 'ترافيل', 'اوتوبيس سياحي', 'حافلة', 'كروز',
      'باخرة', 'عبارة', 'تامين سفر', 'حقائب سفر', 'جواز سفر', 'ترانزيت', 'استوب اوفر'
    ],
    'subscriptions': [
      'اشتراك', 'اشتراكات', 'نتفليكس', 'سبوتيفاي', 'يوتيوب بريميوم', 'ابل ميوزيك', 'امازون برايم',
      'ديزني بلس', 'شاهد', 'واتش ات', 'كريري', 'نغمة', 'خدمة شهرية', 'خدمة سنوية',
      'تطبيق مدفوع', 'برنامج', 'سوفتوير', 'لايسنس', 'تجديد اشتراك'
    ]
  };
  
  // Exact match first
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword)) {
        const category = relevantCategories.find(cat => cat.name === categoryName);
        if (category) {
          return category.name;
        }
      }
    }
  }
  
  // Fuzzy match (check for partial matches)
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (keyword.length >= 3) {
        const partial = keyword.substring(0, Math.max(3, keyword.length - 1));
        if (normalizedText.includes(partial)) {
          const category = relevantCategories.find(cat => cat.name === categoryName);
          if (category) {
            return category.name;
          }
        }
      }
    }
  }
  
  // Default categories
  return transactionType === 'expense' ? 'other' : 'other_income';
}

export function parseArabicTransaction(text: string, categories: Category[]): ParsedTransaction | null {
  const results = parseArabicTransactions(text, categories);
  return results.transactions.length > 0 ? results.transactions[0] : null;
}

export function parseArabicTransactions(text: string, categories: Category[]): ParsedTransactions {
  if (!text || text.trim() === '') {
    return { transactions: [], originalText: text };
  }

  // Apply speech error correction first
  const correctedText = correctSpeechErrors(text);
  
  // Analyze context for better processing
  const globalContext = analyzeContext(correctedText);
  
  // Split complex sentences with context awareness
  const sentences = splitComplexSentence(correctedText);
  const transactions: ParsedTransaction[] = [];

  for (const sentence of sentences) {
    // Analyze context for each sentence individually
    const sentenceContext = analyzeContext(sentence);
    
    // Extract amounts with context awareness
    const amounts = extractAmountsWithContext(sentence, sentenceContext);
    
    if (amounts.length === 0) continue;

    // Enhanced transaction type detection with context
    const type = detectTransactionTypeWithContext(sentence, sentenceContext);
    
    // Enhanced category detection with context
    if (amounts.length > 1) {
      // Try to match amounts with different categories if possible
      for (const amount of amounts) {
        const category = detectCategoryWithContext(sentence, categories, type, sentenceContext);
        if (category) {
          const categoryInfo = categories.find(cat => cat.name === category);
          transactions.push({
            type,
            amount,
            category,
            categoryAr: categoryInfo?.nameAr,
            note: sentence.length < 100 ? sentence : undefined
          });
        }
      }
    } else {
      // Single amount with enhanced processing
      const amount = amounts[0];
      const category = detectCategoryWithContext(sentence, categories, type, sentenceContext);
      
      if (category) {
        const categoryInfo = categories.find(cat => cat.name === category);
        transactions.push({
          type,
          amount,
          category,
          categoryAr: categoryInfo?.nameAr,
          note: sentence.length < 100 ? sentence : undefined
        });
      }
    }
  }

  return {
    transactions,
    originalText: text
  };
}

// Enhanced transaction type detection with context
function detectTransactionTypeWithContext(text: string, context: any): 'income' | 'expense' {
  const normalizedText = text.toLowerCase();
  
  // Context-based type hints
  if (context.hasLocationReference) {
    // Location contexts usually indicate expenses
    const expenseLocations = ['مطعم', 'مول', 'سوق', 'صيدلية', 'محطة'];
    if (expenseLocations.some(loc => normalizedText.includes(loc))) {
      return 'expense';
    }
  }
  
  if (context.hasPaymentMethod) {
    // Payment method contexts can indicate both
    const incomePayments = ['تحويل', 'حوالة', 'شيك'];
    if (incomePayments.some(payment => normalizedText.includes(payment))) {
      return 'income';
    }
  }
  
  // Enhanced keyword detection with confidence scoring
  let expenseScore = 0;
  let incomeScore = 0;
  
  // Check expense keywords with scoring
  for (const keyword of expenseKeywords) {
    if (normalizedText.includes(keyword)) {
      expenseScore += keyword.length > 4 ? 2 : 1; // Longer keywords get higher score
    }
  }
  
  // Check income keywords with scoring
  for (const keyword of incomeKeywords) {
    if (normalizedText.includes(keyword)) {
      incomeScore += keyword.length > 4 ? 2 : 1;
    }
  }
  
  // Decide based on scores and context confidence
  if (incomeScore > expenseScore && context.confidence > 0.6) {
    return 'income';
  }
  
  // Default to expense with high confidence, or if expense score is higher
  return 'expense';
}

// Enhanced category detection with context awareness  
function detectCategoryWithContext(text: string, categories: Category[], transactionType: 'income' | 'expense', context: any): string | null {
  // First try fuzzy matching
  const fuzzyResult = detectCategoryFuzzy(text, categories, transactionType);
  
  // If fuzzy matching succeeded and context confidence is high, return it
  if (fuzzyResult && context.confidence > 0.7) {
    return fuzzyResult;
  }
  
  // Enhanced context-based category detection
  const normalizedText = text.toLowerCase();
  
  // Location-based category hints
  if (context.hasLocationReference) {
    if (normalizedText.includes('مطعم') || normalizedText.includes('كافيه')) {
      const foodCategory = categories.find(cat => cat.name === 'food' && cat.type === transactionType);
      if (foodCategory) return foodCategory.name;
    }
    
    if (normalizedText.includes('صيدلية') || normalizedText.includes('مستشفى')) {
      const healthCategory = categories.find(cat => cat.name === 'health' && cat.type === transactionType);
      if (healthCategory) return healthCategory.name;
    }
    
    if (normalizedText.includes('مول') || normalizedText.includes('سوق')) {
      const shoppingCategory = categories.find(cat => cat.name === 'shopping' && cat.type === transactionType);
      if (shoppingCategory) return shoppingCategory.name;
    }
  }
  
  // Quantity-based category hints
  if (context.hasQuantityIndicator) {
    if (normalizedText.includes('كيلو') || normalizedText.includes('جرام')) {
      const foodCategory = categories.find(cat => cat.name === 'food' && cat.type === transactionType);
      if (foodCategory) return foodCategory.name;
    }
    
    if (normalizedText.includes('لتر')) {
      if (normalizedText.includes('بنزين') || normalizedText.includes('وقود')) {
        const transportCategory = categories.find(cat => cat.name === 'transport' && cat.type === transactionType);
        if (transportCategory) return transportCategory.name;
      }
    }
  }
  
  // Return fuzzy result or default
  return fuzzyResult || (transactionType === 'expense' ? 'other' : 'other_income');
}

// Main Arabic text processing function with unified pipeline
export function parseArabicTransactionText(text: string, categories: Category[]): ParsedTransactions {
  if (!text || typeof text !== 'string') {
    return {
      transactions: [],
      originalText: text || ''
    };
  }

  // Step 1: Apply unified processing pipeline: correction → normalization
  const correctedText = correctSpeechErrors(text);
  const normalizedText = normalizeArabic(correctedText);
  
  // Step 2: Context analysis
  const context = analyzeContext(normalizedText);
  
  // Step 3: Sentence splitting for complex inputs
  const sentences = splitComplexSentence(normalizedText);
  
  // Step 4: Data extraction for each sentence
  const transactions: ParsedTransaction[] = [];
  
  for (const sentence of sentences) {
    const amounts = extractAmountsWithContext(sentence, context);
    const transactionType = detectTransactionType(sentence);
    const category = detectCategoryWithContext(sentence, categories, transactionType, context);
    
    // Create transactions for each amount found
    for (const amount of amounts) {
      transactions.push({
        type: transactionType,
        amount,
        category: category || (transactionType === 'expense' ? 'other' : 'other_income'),
        note: sentence.trim()
      });
    }
  }
  
  // If no amounts found, try to extract from the full text as fallback
  if (transactions.length === 0) {
    const fallbackAmounts = extractAmountsWithContext(normalizedText, context);
    const fallbackType = detectTransactionType(normalizedText);
    const fallbackCategory = detectCategoryWithContext(normalizedText, categories, fallbackType, context);
    
    for (const amount of fallbackAmounts) {
      transactions.push({
        type: fallbackType,
        amount,
        category: fallbackCategory || (fallbackType === 'expense' ? 'other' : 'other_income'),
        note: normalizedText.trim()
      });
    }
  }
  
  return {
    transactions,
    originalText: text
  };
}
