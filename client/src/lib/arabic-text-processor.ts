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

// Enhanced Arabic number words to digits mapping
const arabicNumbers: Record<string, number> = {
  // Basic numbers
  'صفر': 0, 'واحد': 1, 'اثنان': 2, 'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5,
  'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
  
  // Colloquial variations
  'احد': 1, 'اتنين': 2, 'تلاتة': 3, 'اربعة': 4, 'خمسه': 5,
  'سته': 6, 'سبعه': 7, 'تمانية': 8, 'تسعه': 9, 'عشره': 10,
  
  // Tens
  'عشرين': 20, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50,
  'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
  
  // Compound teens
  'احد عشر': 11, 'اثنا عشر': 12, 'ثلاثة عشر': 13, 'أربعة عشر': 14, 'خمسة عشر': 15,
  'ستة عشر': 16, 'سبعة عشر': 17, 'ثمانية عشر': 18, 'تسعة عشر': 19,
  'احداشر': 11, 'اتناشر': 12, 'تلتاشر': 13, 'اربعتاشر': 14, 'خمستاشر': 15,
  
  // Hundreds and thousands
  'مائة': 100, 'مية': 100, 'مئة': 100,
  'الف': 1000, 'ألف': 1000, 'آلاف': 1000,
  
  // Common fractions
  'نص': 0.5, 'نصف': 0.5, 'ربع': 0.25, 'تلت': 0.33, 'ثلث': 0.33,
};

// Expense keywords
const expenseKeywords = [
  'صرف', 'صرفت', 'دفع', 'دفعت', 'اشترى', 'اشتريت', 'مصروف', 'مصاريف',
  'خرج', 'خرجت', 'انفق', 'انفقت', 'بلاش', 'اتحسب', 'طلع', 'طلعت'
];

// Income keywords  
const incomeKeywords = [
  'دخل', 'دخول', 'استلم', 'استلمت', 'وصل', 'وصلت', 'ربح', 'ربحت',
  'اخد', 'اخدت', 'جاني', 'جالي', 'حصلت', 'قبض', 'قبضت'
];

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  
  // Remove common currency words and normalize
  let normalizedText = text
    .replace(/جنيه|جنية|ج\.م|ج|جم/g, ' ')
    .replace(/ريال|ر\.س|درهم|دولار/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // First extract all direct numbers
  const numberMatches = normalizedText.matchAll(/\d+(?:\.\d+)?/g);
  for (const match of numberMatches) {
    amounts.push(parseFloat(match[0]));
  }

  // Remove numeric values for Arabic word processing
  const textWithoutNumbers = normalizedText.replace(/\d+(?:\.\d+)?/g, ' ').trim();
  
  // Enhanced Arabic number extraction with compound support
  if (textWithoutNumbers) {
    const arabicAmount = extractComplexArabicNumber(textWithoutNumbers);
    if (arabicAmount && arabicAmount > 0) {
      amounts.push(arabicAmount);
    }
  }

  // Remove duplicates with tolerance for floating point precision
  const uniqueAmounts: number[] = [];
  for (const amount of amounts.filter(a => a > 0)) {
    const isDuplicate = uniqueAmounts.some(existing => 
      Math.abs(existing - amount) < 0.01
    );
    if (!isDuplicate) {
      uniqueAmounts.push(amount);
    }
  }
  
  return uniqueAmounts;
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
  const normalizedText = text.toLowerCase();
  
  // Check for expense keywords
  for (const keyword of expenseKeywords) {
    if (normalizedText.includes(keyword)) {
      return 'expense';
    }
  }
  
  // Check for income keywords
  for (const keyword of incomeKeywords) {
    if (normalizedText.includes(keyword)) {
      return 'income';
    }
  }
  
  // Default to expense if unsure
  return 'expense';
}

function detectCategory(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  const normalizedText = text.toLowerCase();
  const relevantCategories = categories.filter(cat => cat.type === transactionType);
  
  // Category keywords mapping
  const categoryKeywords: Record<string, string[]> = {
    'food': ['أكل', 'طعام', 'غداء', 'فطار', 'عشا', 'شاي', 'قهوة', 'مطعم', 'كافيه', 'وجبة'],
    'transport': ['مواصلات', 'تاكسي', 'اوبر', 'كريم', 'اتوبيس', 'بنزين', 'وقود', 'سيارة'],
    'bills': ['فواتير', 'كهرباء', 'مياه', 'غاز', 'تليفون', 'نت', 'انترنت'],
    'shopping': ['تسوق', 'شراء', 'ملابس', 'حاجات', 'سوبرماركت'],
    'entertainment': ['سينما', 'فيلم', 'لعبة', 'ترفيه', 'نادي', 'كورة'],
    'health': ['دكتور', 'دوا', 'علاج', 'صيدلية', 'مستشفى', 'كشف'],
    'salary': ['راتب', 'مرتب', 'شغل', 'عمل', 'وظيفة'],
    'freelance': ['فري لانس', 'مشروع', 'شغل حر'],
    'business': ['تجارة', 'بيع', 'ربح', 'محل'],
    'gift': ['هدية', 'عيدية', 'مناسبة']
  };
  
  // Try to match category keywords
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
  
  // Default categories
  return transactionType === 'expense' ? 'other' : 'other_income';
}

// Split complex sentences into multiple transactions
function splitComplexSentence(text: string): string[] {
  // Split on common separators that indicate multiple transactions
  const separators = [
    /\s+و\s+(?=\d|\w+\s+\d)/g, // "و" followed by number or word+number
    /\s*،\s*/g, // Comma separator
    /\s+كمان\s+/g, // "كمان" (also)
    /\s+برضه\s+/g, // "برضه" (also)
    /\s+وكمان\s+/g, // "وكمان" (and also)
  ];
  
  let sentences = [text];
  
  for (const separator of separators) {
    const newSentences: string[] = [];
    for (const sentence of sentences) {
      newSentences.push(...sentence.split(separator));
    }
    sentences = newSentences;
  }
  
  return sentences.filter(s => s.trim().length > 0);
}

// Enhanced category detection with fuzzy matching
function detectCategoryFuzzy(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  const normalizedText = text.toLowerCase();
  const relevantCategories = categories.filter(cat => cat.type === transactionType);
  
  // Enhanced category keywords with more variations
  const categoryKeywords: Record<string, string[]> = {
    'food': [
      'أكل', 'طعام', 'غداء', 'فطار', 'عشا', 'شاي', 'قهوة', 'مطعم', 'كافيه', 'وجبة',
      'فول', 'طعمية', 'كشري', 'بيتزا', 'برجر', 'شاورما', 'محشي', 'ملوخية', 'رز',
      'عيش', 'خبز', 'لبن', 'جبنة', 'زيت', 'سكر', 'شعيرية', 'مكرونة'
    ],
    'transport': [
      'مواصلات', 'تاكسي', 'اوبر', 'كريم', 'اتوبيس', 'بنزين', 'وقود', 'سيارة',
      'مترو', 'قطار', 'طيارة', 'سفر', 'توك توك', 'موتوسيكل', 'عربية'
    ],
    'bills': [
      'فواتير', 'كهرباء', 'مياه', 'غاز', 'تليفون', 'نت', 'انترنت', 'كابل',
      'فودافون', 'اورانج', 'اتصالات', 'وي', 'تي داتا'
    ],
    'shopping': [
      'تسوق', 'شراء', 'ملابس', 'حاجات', 'سوبرماركت', 'هايبر', 'مول',
      'جزمة', 'بنطلون', 'قميص', 'فستان', 'شنطة', 'ساعة', 'عطر'
    ],
    'entertainment': [
      'سينما', 'فيلم', 'لعبة', 'ترفيه', 'نادي', 'كورة', 'مسرح', 'كونسرت',
      'ملاهي', 'كافيه', 'بولينج', 'بلايستيشن'
    ],
    'health': [
      'دكتور', 'دوا', 'علاج', 'صيدلية', 'مستشفى', 'كشف', 'تحليل', 'أشعة',
      'أسنان', 'عيون', 'جراحة', 'فيتامين'
    ],
    'salary': ['راتب', 'مرتب', 'شغل', 'عمل', 'وظيفة', 'شركة', 'مكافأة', 'علاوة'],
    'freelance': ['فري لانس', 'مشروع', 'شغل حر', 'كورس', 'تدريس', 'استشارة'],
    'business': ['تجارة', 'بيع', 'ربح', 'محل', 'مشروع', 'استثمار', 'أرباح'],
    'gift': ['هدية', 'عيدية', 'مناسبة', 'عيد', 'جواز', 'خطوبة', 'مولود']
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

  // Split complex sentences
  const sentences = splitComplexSentence(text);
  const transactions: ParsedTransaction[] = [];

  for (const sentence of sentences) {
    const amounts = extractAmounts(sentence);
    
    if (amounts.length === 0) continue;

    const type = detectTransactionType(sentence);
    
    // If multiple amounts found, create separate transactions
    if (amounts.length > 1) {
      // Try to match amounts with different categories if possible
      for (const amount of amounts) {
        const category = detectCategoryFuzzy(sentence, categories, type);
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
      // Single amount
      const amount = amounts[0];
      const category = detectCategoryFuzzy(sentence, categories, type);
      
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
