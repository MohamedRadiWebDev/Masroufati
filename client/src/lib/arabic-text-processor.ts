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

// Enhanced Expense keywords with Egyptian colloquial variations
const expenseKeywords = [
  // Standard Arabic
  'صرف', 'صرفت', 'دفع', 'دفعت', 'اشترى', 'اشتريت', 'مصروف', 'مصاريف',
  'خرج', 'خرجت', 'انفق', 'انفقت', 'بلاش', 'اتحسب', 'طلع', 'طلعت', 'ادفع',
  
  // Egyptian colloquial - Future tense
  'هدفع', 'هصرف', 'هشتري', 'حدفع', 'حصرف', 'حشتري', 
  'هاشتري', 'هاصرف', 'هادفع', 'هاطلع', 
  
  // Egyptian colloquial - Present continuous
  'بشتري', 'بصرف', 'بدفع', 'بطلع', 'باشتري', 'باصرف', 'بادفع',
  
  // Egyptian colloquial - Past tense variations
  'اشتريت', 'صرفت', 'دفعت', 'طلعت', 'خلصت', 'اديت',
  'شريت', 'صرّفت', 'دفّعت', 'طلّعت', 'خلّصت',
  
  // Context-aware expressions
  'راح', 'راحت', 'اتصرف', 'اتدفع', 'خلاص', 'انتهى', 'فات',
  'ضاع', 'ضاعت', 'انفرط', 'انفرطت', 'فلت', 'فلتت',
  'مشتري', 'ماشي', 'تمام', 'اوكي', 'باي باي', 'يللا',
  
  // Financial expressions
  'دي فلوس', 'فلوس راحت', 'فلوس طلعت', 'فلوس خلصت', 'فلوس ضاعت',
  'المصاري راحت', 'المصاري طلعت', 'الفلوس خلاص', 'اتحرقت فلوس',
  
  // Specific purchasing contexts
  'اشتري من', 'اشتري لـ', 'دفعت في', 'صرفت على', 'طلعت في',
  'عملت حساب', 'دفعت حساب', 'سددت', 'قضيت', 'انفقت على'
];

// Enhanced Income keywords with Egyptian colloquial variations  
const incomeKeywords = [
  // Standard Arabic
  'دخل', 'دخول', 'استلم', 'استلمت', 'وصل', 'وصلت', 'ربح', 'ربحت',
  'قبض', 'قبضت', 'حصل', 'حصلت', 'وصل', 'وصلت',
  
  // Egyptian colloquial - Past tense
  'اخد', 'اخدت', 'جاني', 'جالي', 'جه', 'جت', 'وصلني', 'وصلتني',
  'خدت', 'استلمت', 'قبضت', 'حصلت على', 'جابوا', 'جابولي',
  
  // Egyptian colloquial - Future tense
  'هاخد', 'هستلم', 'هقبض', 'حاخد', 'حستلم', 'حقبض',
  'هيجي', 'هيجيلي', 'هيوصل', 'هيوصلي', 'هحصل على',
  
  // Egyptian colloquial - Present continuous
  'باخد', 'بستلم', 'بقبض', 'بحصل على', 'بجيب', 'بكسب',
  
  // Context-aware expressions
  'واصل', 'واصلة', 'اتقبض', 'اتاخد', 'اتاستلم', 'اتحصل',
  'اتسلم', 'اتجاب', 'اتوصل', 'اتسدد', 'اتعطى',
  
  // Financial expressions
  'فلوس جاية', 'فلوس داخلة', 'فلوس واصلة', 'جايني فلوس',
  'المصاري جت', 'المصاري وصلت', 'الفلوس وصلت', 'دخلت فلوس',
  'جاني راتب', 'جالي مرتب', 'قبضت راتب', 'استلمت مرتب',
  
  // Work-related income
  'شغل', 'عمل', 'وظيفة', 'كسب', 'ربح', 'مكسب', 'عائد',
  'مقابل', 'أجر', 'مكافأة', 'عمولة', 'حافز', 'بونص'
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
  const regex = /\d+(?:\.\d+)?/g;
  let match;
  while ((match = regex.exec(normalizedText)) !== null) {
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

// Create a utility function to suggest category for any text input
export function suggestCategoryFromText(text: string, categories: Category[], transactionType: 'income' | 'expense'): string | null {
  return detectCategoryFuzzy(text, categories, transactionType);
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
