import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { type InsertTransaction } from '@shared/schema';

export interface ImportedTransaction {
  type: string;
  amount: string;
  category: string;
  note?: string;
  date: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ImportResult {
  success: boolean;
  validTransactions: InsertTransaction[];
  errors: ValidationError[];
  totalRows: number;
  processedRows: number;
}

// Convert imported transaction to internal format
export function parseImportedData(data: ImportedTransaction[], availableCategories: string[]): ImportResult {
  const validTransactions: InsertTransaction[] = [];
  const errors: ValidationError[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 2; // Account for header row
    const rowErrors: ValidationError[] = [];

    // Validate transaction type
    const normalizedType = normalizeTransactionType(row.type);
    if (!normalizedType) {
      rowErrors.push({
        row: rowNumber,
        field: 'نوع العملية',
        message: 'يجب أن يكون "دخل" أو "مصروف"',
        value: row.type
      });
    }

    // Validate amount
    const amount = parseAmount(row.amount);
    if (amount === null || amount <= 0) {
      rowErrors.push({
        row: rowNumber,
        field: 'المبلغ',
        message: 'يجب أن يكون رقم أكبر من صفر',
        value: row.amount
      });
    }

    // Validate category
    const category = normalizeCategory(row.category, availableCategories);
    if (!category) {
      rowErrors.push({
        row: rowNumber,
        field: 'التصنيف',
        message: 'التصنيف غير صحيح أو غير موجود',
        value: row.category
      });
    }

    // Validate date
    const parsedDate = parseDate(row.date);
    if (!parsedDate) {
      rowErrors.push({
        row: rowNumber,
        field: 'التاريخ',
        message: 'تاريخ غير صحيح. يجب أن يكون بصيغة yyyy-mm-dd أو dd/mm/yyyy',
        value: row.date
      });
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validTransactions.push({
        type: normalizedType!,
        amount: amount!.toString(),
        category: category!,
        note: row.note?.trim() || null,
        date: parsedDate!
      });
    }
  });

  return {
    success: errors.length === 0,
    validTransactions,
    errors,
    totalRows: data.length,
    processedRows: validTransactions.length
  };
}

function normalizeTransactionType(type: string): 'income' | 'expense' | null {
  if (!type) return null;
  
  const normalized = type.trim().toLowerCase();
  
  // Arabic variants
  if (normalized === 'دخل' || normalized === 'ايراد' || normalized === 'إيراد' || normalized === 'دخول') {
    return 'income';
  }
  
  if (normalized === 'مصروف' || normalized === 'مصاريف' || normalized === 'مصروفات' || normalized === 'نفقة' || normalized === 'نفقات') {
    return 'expense';
  }

  // English variants
  if (normalized === 'income' || normalized === 'revenue' || normalized === 'earning') {
    return 'income';
  }
  
  if (normalized === 'expense' || normalized === 'spending' || normalized === 'expenditure' || normalized === 'cost') {
    return 'expense';
  }

  return null;
}

function parseAmount(amount: any): number | null {
  if (typeof amount === 'number') {
    return amount > 0 ? amount : null;
  }
  
  if (typeof amount === 'string') {
    // Normalize Arabic-Hindi numbers to Western numbers
    const arabicToWestern = amount.replace(/[\u0660-\u0669]/g, (d: string) => 
      String.fromCharCode(d.charCodeAt(0) - '\u0660'.charCodeAt(0) + '0'.charCodeAt(0))
    );
    
    // Remove common currency symbols and spaces - using alternation instead of character class
    const cleaned = arabicToWestern.trim()
      .replace(/(جنيه|جنية|ج|£|\$|€|ريال|درهم|دينار)/g, '')
      .replace(/\s+/g, '')
      .replace(/,/g, ''); // Remove comma separators
    
    const parsed = parseFloat(cleaned);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  }
  
  return null;
}

function normalizeCategory(category: string, availableCategories: string[]): string | null {
  if (!category) return null;
  
  const normalized = category.trim().toLowerCase();
  
  // Try exact match first
  const exactMatch = availableCategories.find(cat => cat.toLowerCase() === normalized);
  if (exactMatch) return exactMatch;
  
  // Try partial match
  const partialMatch = availableCategories.find(cat => 
    cat.toLowerCase().includes(normalized) || normalized.includes(cat.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // Common Arabic category mappings
  const categoryMappings: Record<string, string> = {
    'أكل': 'food',
    'طعام': 'food',
    'اكل': 'food',
    'مطعم': 'food',
    'مطاعم': 'food',
    'مواصلات': 'transport',
    'مواصلة': 'transport',
    'نقل': 'transport',
    'سيارة': 'transport',
    'باص': 'transport',
    'أتوبيس': 'transport',
    'قطار': 'transport',
    'مترو': 'transport',
    'تاكسي': 'transport',
    'أوبر': 'transport',
    'كريم': 'transport',
    'فواتير': 'bills',
    'فاتورة': 'bills',
    'كهرباء': 'bills',
    'مياه': 'bills',
    'غاز': 'bills',
    'تليفون': 'bills',
    'موبايل': 'bills',
    'انترنت': 'bills',
    'إنترنت': 'bills',
    'تسوق': 'shopping',
    'شراء': 'shopping',
    'ملابس': 'shopping',
    'أحذية': 'shopping',
    'ترفيه': 'entertainment',
    'سينما': 'entertainment',
    'مسرح': 'entertainment',
    'ألعاب': 'entertainment',
    'العاب': 'entertainment',
    'نادي': 'entertainment',
    'صحة': 'health',
    'طبيب': 'health',
    'دواء': 'health',
    'مستشفى': 'health',
    'عيادة': 'health',
    'تحاليل': 'health',
    'راتب': 'salary',
    'مرتب': 'salary',
    'أجر': 'salary',
    'عمل': 'freelance',
    'مشروع': 'freelance',
    'استشارة': 'freelance',
    'تجارة': 'business',
    'بيع': 'business',
    'شراكة': 'business',
    'استثمار': 'investment',
    'أسهم': 'investment',
    'عقار': 'investment',
    'هدية': 'gift',
    'هدايا': 'gift',
    'عيدية': 'gift'
  };

  const mappedCategory = categoryMappings[normalized];
  if (mappedCategory && availableCategories.includes(mappedCategory)) {
    return mappedCategory;
  }

  return null;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const cleaned = dateStr.trim();
  
  // Try parsing as ISO date (yyyy-mm-dd)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const isoString = isoMatch[1] + '-' + isoMatch[2].padStart(2, '0') + '-' + isoMatch[3].padStart(2, '0');
    const date = new Date(isoString);
    return isValidDate(date) ? isoString : null;
  }

  // Try parsing as dd/mm/yyyy or dd-mm-yyyy
  const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const isoString = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
    const date = new Date(isoString);
    return isValidDate(date) ? isoString : null;
  }

  // Try parsing as mm/dd/yyyy or mm-dd-yyyy (less common but might appear)
  const mmddyyyyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const isoString = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
    const date = new Date(isoString);
    return isValidDate(date) ? isoString : null;
  }

  // Try parsing with built-in Date constructor as fallback
  const fallbackDate = new Date(cleaned);
  if (isValidDate(fallbackDate)) {
    return fallbackDate.toISOString().split('T')[0]; // Return yyyy-mm-dd format
  }
  
  return null;
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
}

// File reading functions
export async function readExcelFile(file: File): Promise<ImportedTransaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first worksheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and convert to our format
        const rows = jsonData.slice(1) as any[][];
        const transactions: ImportedTransaction[] = rows
          .filter(row => row.some(cell => cell !== undefined && cell !== ''))
          .map(row => ({
            type: row[0]?.toString() || '',
            amount: row[1]?.toString() || '',
            category: row[2]?.toString() || '',
            note: row[3]?.toString() || '',
            date: row[4]?.toString() || ''
          }));
        
        resolve(transactions);
      } catch (error) {
        reject(new Error('فشل في قراءة ملف Excel. تأكد من أن الملف غير محمي بكلمة مرور وأن التنسيق صحيح.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('فشل في قراءة الملف'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

export async function readCSVFile(file: File): Promise<ImportedTransaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            reject(new Error('خطأ في تحليل ملف CSV: ' + results.errors[0].message));
            return;
          }
          
          const rows = results.data as string[][];
          
          // Skip header row and convert to our format
          const transactions: ImportedTransaction[] = rows
            .slice(1)
            .filter(row => row.some(cell => cell.trim() !== ''))
            .map(row => ({
              type: row[0]?.trim() || '',
              amount: row[1]?.trim() || '',
              category: row[2]?.trim() || '',
              note: row[3]?.trim() || '',
              date: row[4]?.trim() || ''
            }));
          
          resolve(transactions);
        } catch (error) {
          reject(new Error('فشل في معالجة ملف CSV'));
        }
      },
      error: (error) => {
        reject(new Error('فشل في قراءة ملف CSV: ' + error.message));
      }
    });
  });
}

export function validateFileType(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
    'application/csv'
  ];
  
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
}

export function getFileTypeDisplayName(fileName: string): string {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  switch (extension) {
    case '.xlsx':
    case '.xls':
      return 'Excel';
    case '.csv':
      return 'CSV';
    default:
      return 'غير معروف';
  }
}