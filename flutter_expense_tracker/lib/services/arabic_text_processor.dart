
import 'package:flutter_expense_tracker/models/transaction.dart';
import 'package:flutter_expense_tracker/models/category.dart';

class ArabicTextProcessor {
  // Keywords for expense transactions
  static const List<String> _expenseKeywords = [
    'صرف', 'صرفت', 'دفع', 'دفعت', 'اشتري', 'اشتريت', 'مصروف', 'مصاريف',
    'خرج', 'خرجت', 'انفق', 'انفقت', 'بلاش', 'اتحسب', 'طلع', 'طلعت',
    'شريت', 'جبت', 'خدت', 'راح', 'راحت', 'ضاع', 'ضاعت'
  ];

  // Keywords for income transactions
  static const List<String> _incomeKeywords = [
    'دخل', 'استلم', 'استلمت', 'وصل', 'وصلت', 'قبض', 'قبضت',
    'اخد', 'اخدت', 'جاني', 'جالي', 'جه', 'جت', 'حصل', 'حصلت',
    'راتب', 'مرتب', 'عمل', 'شغل', 'كسب', 'ربح', 'عايد'
  ];

  // Arabic numbers mapping
  static const Map<String, int> _arabicNumbers = {
    'واحد': 1, 'اثنان': 2, 'اثنين': 2, 'ثلاثة': 3, 'أربعة': 4, 'خمسة': 5,
    'ستة': 6, 'سبعة': 7, 'ثمانية': 8, 'تسعة': 9, 'عشرة': 10,
    'احد': 1, 'اتنين': 2, 'تلاتة': 3, 'اربعة': 4, 'خمسه': 5,
    'سته': 6, 'سبعه': 7, 'تمانية': 8, 'تسعه': 9, 'عشره': 10,
    'عشرين': 20, 'ثلاثين': 30, 'اربعين': 40, 'خمسين': 50,
    'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
    'مية': 100, 'مائة': 100, 'الف': 1000, 'ألف': 1000,
  };

  // Process Arabic text and extract transaction data
  static ParsedTransaction? parseTransaction(String text, List<Category> categories) {
    if (text.trim().isEmpty) return null;

    final normalizedText = _normalizeText(text);
    
    // Detect transaction type
    final type = _detectTransactionType(normalizedText);
    
    // Extract amount
    final amount = _extractAmount(normalizedText);
    if (amount == null || amount <= 0) return null;
    
    // Detect category
    final category = _detectCategory(normalizedText, categories, type);
    
    // Extract note (cleaned original text)
    final note = _cleanTextForNote(text);

    return ParsedTransaction(
      type: type,
      amount: amount,
      category: category,
      note: note.isNotEmpty ? note : null,
      confidence: _calculateConfidence(normalizedText, amount, category),
    );
  }

  // Normalize Arabic text
  static String _normalizeText(String text) {
    return text
        .toLowerCase()
        .replaceAll(RegExp(r'[٠-٩]'), (match) {
          // Convert Arabic-Indic digits to ASCII
          final arabicDigit = match.group(0)!;
          final asciiDigit = String.fromCharCode(
            arabicDigit.codeUnitAt(0) - '٠'.codeUnitAt(0) + '0'.codeUnitAt(0)
          );
          return asciiDigit;
        })
        .replaceAll(RegExp(r'[إأآا]'), 'ا')
        .replaceAll(RegExp(r'[ىئي]'), 'ي')
        .replaceAll(RegExp(r'ة'), 'ه')
        .replaceAll(RegExp(r'[ؤو]'), 'و')
        .replaceAll(RegExp(r'[\u064B-\u065F\u0670\u06D6-\u06ED]'), '') // Remove diacritics
        .trim();
  }

  // Detect transaction type from text
  static TransactionType _detectTransactionType(String text) {
    for (final keyword in _expenseKeywords) {
      if (text.contains(keyword)) {
        return TransactionType.expense;
      }
    }
    
    for (final keyword in _incomeKeywords) {
      if (text.contains(keyword)) {
        return TransactionType.income;
      }
    }
    
    // Default to expense
    return TransactionType.expense;
  }

  // Extract amount from text
  static double? _extractAmount(String text) {
    // Look for numeric values first
    final digitPattern = RegExp(r'\d+\.?\d*');
    final digitMatches = digitPattern.allMatches(text);
    
    for (final match in digitMatches) {
      final value = double.tryParse(match.group(0)!);
      if (value != null && value > 0) {
        return value;
      }
    }
    
    // Look for Arabic number words
    final words = text.split(RegExp(r'\s+'));
    for (final word in words) {
      if (_arabicNumbers.containsKey(word)) {
        return _arabicNumbers[word]!.toDouble();
      }
    }
    
    // Try compound numbers like "عشرين جنيه"
    for (int i = 0; i < words.length - 1; i++) {
      final compound = '${words[i]} ${words[i + 1]}';
      if (_arabicNumbers.containsKey(compound)) {
        return _arabicNumbers[compound]!.toDouble();
      }
    }
    
    return null;
  }

  // Detect category from text
  static String _detectCategory(String text, List<Category> categories, TransactionType type) {
    final relevantCategories = categories.where((cat) => cat.type == type).toList();
    
    // Category keywords mapping
    final categoryKeywords = {
      'food': ['اكل', 'طعام', 'فطار', 'غدا', 'عشا', 'مطعم', 'كافيه', 'قهوه'],
      'transport': ['مواصلات', 'تاكسي', 'اوبر', 'بنزين', 'وقود', 'سياره'],
      'bills': ['فواتير', 'كهربا', 'مياه', 'غاز', 'تليفون', 'نت'],
      'shopping': ['تسوق', 'شراء', 'ملابس', 'حاجات', 'سوبرماركت'],
      'health': ['دكتور', 'دوا', 'علاج', 'صيدليه', 'مستشفي'],
      'salary': ['راتب', 'مرتب', 'شغل', 'عمل'],
      'business': ['تجاره', 'بيع', 'ربح', 'محل'],
    };

    // Try to match category keywords
    for (final category in relevantCategories) {
      final keywords = categoryKeywords[category.name] ?? [];
      for (final keyword in keywords) {
        if (text.contains(keyword)) {
          return category.name;
        }
      }
    }

    // Return default category
    final defaultCategories = relevantCategories.where((cat) => 
        cat.name == 'other' || cat.name == 'other_income').toList();
    
    return defaultCategories.isNotEmpty 
        ? defaultCategories.first.name 
        : (relevantCategories.isNotEmpty ? relevantCategories.first.name : 'other');
  }

  // Clean text for use as note
  static String _cleanTextForNote(String text) {
    return text
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  // Calculate confidence score
  static double _calculateConfidence(String text, double? amount, String? category) {
    double confidence = 0.5; // Base confidence
    
    // Higher confidence if amount is clearly stated
    if (amount != null && amount > 0) {
      confidence += 0.3;
    }
    
    // Higher confidence if category keywords are found
    if (category != null && category != 'other') {
      confidence += 0.2;
    }
    
    return confidence.clamp(0.0, 1.0);
  }
}

// Data class for parsed transaction
class ParsedTransaction {
  final TransactionType type;
  final double amount;
  final String category;
  final String? note;
  final double confidence;

  ParsedTransaction({
    required this.type,
    required this.amount,
    required this.category,
    this.note,
    required this.confidence,
  });
}
