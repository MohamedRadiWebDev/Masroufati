
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_expense_tracker/services/arabic_text_processor.dart';
import 'package:flutter_expense_tracker/models/transaction.dart';
import 'package:flutter_expense_tracker/models/category.dart';

void main() {
  group('ArabicTextProcessor Tests', () {
    late List<Category> testCategories;

    setUp(() {
      testCategories = [
        Category(
          id: '1',
          name: 'food',
          color: '#FF5722',
          icon: 'utensils',
          createdAt: DateTime.now(),
        ),
        Category(
          id: '2',
          name: 'transport',
          color: '#2196F3',
          icon: 'car',
          createdAt: DateTime.now(),
        ),
        Category(
          id: '3',
          name: 'salary',
          color: '#4CAF50',
          icon: 'briefcase',
          createdAt: DateTime.now(),
        ),
        Category(
          id: '4',
          name: 'other',
          color: '#9E9E9E',
          icon: 'circle',
          createdAt: DateTime.now(),
        ),
      ];
    });

    group('Transaction Type Detection', () {
      test('should detect expense transactions', () {
        final expenseTexts = [
          'صرفت خمسين جنيه',
          'دفعت عشرين جنيه أكل',
          'اشتريت حاجات من السوق',
          'مصروف تاكسي',
        ];

        for (final text in expenseTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result?.type, TransactionType.expense, reason: 'Failed for: $text');
        }
      });

      test('should detect income transactions', () {
        final incomeTexts = [
          'استلمت راتب ألف جنيه',
          'جاني فلوس',
          'قبضت مرتب',
          'دخل من العمل',
        ];

        for (final text in incomeTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result?.type, TransactionType.income, reason: 'Failed for: $text');
        }
      });
    });

    group('Amount Extraction', () {
      test('should extract numeric amounts correctly', () {
        final testCases = [
          {'text': 'صرفت 50 جنيه', 'expected': 50.0},
          {'text': 'دفعت 25.5 جنيه', 'expected': 25.5},
          {'text': 'اشتريت بـ 100', 'expected': 100.0},
          {'text': 'مصروف ١٠٠ جنيه', 'expected': 100.0}, // Arabic-Indic digits
        ];

        for (final testCase in testCases) {
          final result = ArabicTextProcessor.parseTransaction(
            testCase['text'] as String, 
            testCategories
          );
          expect(result?.amount, testCase['expected'], 
            reason: 'Failed for: ${testCase['text']}');
        }
      });

      test('should extract Arabic number words', () {
        final testCases = [
          {'text': 'صرفت خمسين جنيه', 'expected': 50.0},
          {'text': 'دفعت عشرة جنيه', 'expected': 10.0},
          {'text': 'اشتريت بمائة جنيه', 'expected': 100.0},
          {'text': 'راتب ألف جنيه', 'expected': 1000.0},
        ];

        for (final testCase in testCases) {
          final result = ArabicTextProcessor.parseTransaction(
            testCase['text'] as String, 
            testCategories
          );
          expect(result?.amount, testCase['expected'], 
            reason: 'Failed for: ${testCase['text']}');
        }
      });

      test('should return null for invalid amounts', () {
        final invalidTexts = [
          'صرفت فلوس',
          'دفعت شوية',
          'اشتريت حاجات',
        ];

        for (final text in invalidTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result, isNull, reason: 'Should be null for: $text');
        }
      });
    });

    group('Category Detection', () {
      test('should detect food category correctly', () {
        final foodTexts = [
          'صرفت على أكل',
          'دفعت في المطعم',
          'اشتريت طعام',
          'غداء خمسين جنيه',
        ];

        for (final text in foodTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result?.category, 'food', reason: 'Failed for: $text');
        }
      });

      test('should detect transport category correctly', () {
        final transportTexts = [
          'دفعت مواصلات',
          'أجرة تاكسي',
          'بنزين السيارة',
          'صرفت على الموصلات',
        ];

        for (final text in transportTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result?.category, 'transport', reason: 'Failed for: $text');
        }
      });

      test('should default to other category for unknown categories', () {
        final unknownTexts = [
          'صرفت خمسين على حاجة غريبة',
          'دفعت مبلغ لحاجة مش معروفة',
        ];

        for (final text in unknownTexts) {
          final result = ArabicTextProcessor.parseTransaction(text, testCategories);
          expect(result?.category, 'other', reason: 'Failed for: $text');
        }
      });
    });

    group('Text Normalization', () {
      test('should handle diacritics correctly', () {
        final textWithDiacritics = 'صَرَفْتُ خَمْسِينَ جُنَيْهًا';
        final result = ArabicTextProcessor.parseTransaction(textWithDiacritics, testCategories);
        expect(result, isNotNull);
        expect(result?.type, TransactionType.expense);
      });

      test('should handle different Arabic letter forms', () {
        final variations = [
          'إشتريت', // Different hamza
          'أشتريت',
          'اشتريت',
        ];

        for (final text in variations) {
          final fullText = '$text عشرة جنيه';
          final result = ArabicTextProcessor.parseTransaction(fullText, testCategories);
          expect(result?.type, TransactionType.expense, reason: 'Failed for: $text');
        }
      });
    });

    group('Confidence Calculation', () {
      test('should have higher confidence for clear transactions', () {
        final clearText = 'صرفت خمسين جنيه أكل في المطعم';
        final result = ArabicTextProcessor.parseTransaction(clearText, testCategories);
        expect(result?.confidence, greaterThan(0.8));
      });

      test('should have lower confidence for ambiguous transactions', () {
        final ambiguousText = 'صرفت فلوس';
        final result = ArabicTextProcessor.parseTransaction(ambiguousText, testCategories);
        expect(result, isNull); // Should be null due to no amount
      });
    });

    group('Edge Cases', () {
      test('should handle empty or null text', () {
        expect(ArabicTextProcessor.parseTransaction('', testCategories), isNull);
        expect(ArabicTextProcessor.parseTransaction('   ', testCategories), isNull);
      });

      test('should handle mixed Arabic and English', () {
        final mixedText = 'paid خمسين جنيه for أكل';
        final result = ArabicTextProcessor.parseTransaction(mixedText, testCategories);
        expect(result?.amount, 50.0);
      });

      test('should handle very long text', () {
        final longText = 'اليوم روحت السوق واشتريت حاجات كتير وصرفت في الآخر خمسين جنيه على أكل لذيذ جداً من مطعم حلو في وسط البلد';
        final result = ArabicTextProcessor.parseTransaction(longText, testCategories);
        expect(result?.amount, 50.0);
        expect(result?.category, 'food');
      });
    });
  });
}
