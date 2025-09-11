import { type Category } from "@shared/schema";

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  categoryAr?: string;
  note?: string;
}

// Arabic number words to digits mapping
const arabicNumbers: Record<string, number> = {
  'صفر': 0, 'واحد': 1, 'اثنان': 2, 'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5,
  'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
  'احد': 1, 'اتنين': 2, 'تلاتة': 3, 'اربعة': 4, 'خمسه': 5,
  'سته': 6, 'سبعه': 7, 'تمانية': 8, 'تسعه': 9, 'عشره': 10,
  'عشرين': 20, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50,
  'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
  'مائة': 100, 'مية': 100, 'الف': 1000, 'ألف': 1000,
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

function extractAmount(text: string): number | null {
  // Remove common currency words and normalize
  let normalizedText = text
    .replace(/جنيه|جنية|ج\.م|ج|جم/g, '')
    .replace(/ريال|ر\.س|درهم|دولار/g, '')
    .trim();

  // First try to find direct numbers
  const numberMatch = normalizedText.match(/\d+(?:\.\d+)?/);
  if (numberMatch) {
    return parseFloat(numberMatch[0]);
  }

  // Try to find Arabic number words
  const words = normalizedText.split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const value = arabicNumbers[word.trim()];
    if (value !== undefined) {
      if (value === 100 || value === 1000) {
        if (current === 0) current = 1;
        current *= value;
        total += current;
        current = 0;
      } else if (value >= 10 && value < 100) {
        current += value;
      } else {
        current += value;
      }
    }
  }

  total += current;
  return total > 0 ? total : null;
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

export function parseArabicTransaction(text: string, categories: Category[]): ParsedTransaction | null {
  if (!text || text.trim() === '') {
    return null;
  }

  const amount = extractAmount(text);
  if (!amount) {
    return null;
  }

  const type = detectTransactionType(text);
  const category = detectCategory(text, categories, type);
  
  if (!category) {
    return null;
  }

  const categoryInfo = categories.find(cat => cat.name === category);

  return {
    type,
    amount,
    category,
    categoryAr: categoryInfo?.nameAr,
    note: text.length < 100 ? text : undefined
  };
}
