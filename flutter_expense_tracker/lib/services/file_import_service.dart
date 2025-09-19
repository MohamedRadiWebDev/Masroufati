import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:csv/csv.dart';
import '../models/transaction.dart';
import '../models/category.dart' as models;

class FileImportService {
  // Supported file types
  static const List<String> supportedExtensions = ['csv', 'xlsx', 'xls'];

  // Import transactions from file
  static Future<ImportResult> importFile(List<models.Category> categories) async {
    try {
      // Pick file
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: supportedExtensions,
        allowMultiple: false,
      );

      if (result == null || result.files.isEmpty) {
        return ImportResult.cancelled();
      }

      final file = result.files.first;
      final extension = file.extension?.toLowerCase();

      if (!supportedExtensions.contains(extension)) {
        return ImportResult.error('نوع الملف غير مدعوم. يُدعم CSV وExcel فقط.');
      }

      List<List<dynamic>>? rawData;

      // Parse file based on type
      if (extension == 'csv') {
        rawData = await _parseCSV(file);
      } else {
        return ImportResult.error('ملفات Excel غير مدعومة حالياً. يُرجى استخدام CSV.');
      }

      if (rawData == null || rawData.isEmpty) {
        return ImportResult.error('الملف فارغ أو تالف');
      }

      // Process and validate data
      return _processImportData(rawData, categories);

    } catch (e) {
      if (kDebugMode) {
        print('خطأ في استيراد الملف: $e');
      }
      return ImportResult.error('خطأ في قراءة الملف: ${e.toString()}');
    }
  }

  // Parse CSV file
  static Future<List<List<dynamic>>?> _parseCSV(PlatformFile file) async {
    try {
      String content;

      if (file.bytes != null) {
        // Web platform
        content = utf8.decode(file.bytes!);
      } else if (file.path != null) {
        // Mobile/Desktop platform
        final fileContent = await File(file.path!).readAsString(encoding: utf8);
        content = fileContent;
      } else {
        throw Exception('لا يمكن قراءة الملف');
      }

      // Parse CSV
      const csvConverter = CsvToListConverter();
      return csvConverter.convert(content);

    } catch (e) {
      if (kDebugMode) {
        print('خطأ في تحليل CSV: $e');
      }
      return null;
    }
  }

  // Process and validate imported data
  static ImportResult _processImportData(List<List<dynamic>> rawData, List<models.Category> categories) {
    final errors = <ImportError>[];
    final validTransactions = <CreateTransactionRequest>[];

    // Skip header row
    final dataRows = rawData.skip(1).toList();

    for (int i = 0; i < dataRows.length; i++) {
      final row = dataRows[i];
      final rowNumber = i + 2; // +2 to account for header and 0-based index

      try {
        final transaction = _parseTransactionRow(row, categories, rowNumber);
        if (transaction != null) {
          validTransactions.add(transaction);
        }
      } catch (e) {
        errors.add(ImportError(
          row: rowNumber,
          message: e.toString(),
          data: row.join(', '),
        ));
      }
    }

    return ImportResult.success(
      validTransactions: validTransactions,
      errors: errors,
      totalRows: dataRows.length,
    );
  }

  // Parse a single transaction row
  static CreateTransactionRequest? _parseTransactionRow(
    List<dynamic> row,
    List<models.Category> categories,
    int rowNumber
  ) {
    if (row.length < 4) {
      throw Exception('الصف لا يحتوي على البيانات المطلوبة (النوع، المبلغ، التصنيف، التاريخ)');
    }

    // Parse transaction type
    final typeStr = row[0]?.toString().trim() ?? '';
    TransactionType? type;

    if (typeStr == 'دخل' || typeStr == 'إيراد' || typeStr == 'income') {
      type = TransactionType.income;
    } else if (typeStr == 'مصروف' || typeStr == 'مصاريف' || typeStr == 'expense') {
      type = TransactionType.expense;
    } else {
      throw Exception('نوع العملية غير صحيح: $typeStr');
    }

    // Parse amount
    final amountStr = row[1]?.toString().trim() ?? '';
    final amount = _parseAmount(amountStr);
    if (amount == null || amount <= 0) {
      throw Exception('المبلغ غير صحيح: $amountStr');
    }

    // Parse category
    final categoryStr = row[2]?.toString().trim() ?? '';
    final category = _findCategory(categoryStr, categories, type);
    if (category == null) {
      throw Exception('التصنيف غير موجود: $categoryStr');
    }

    // Parse date
    final dateStr = row[3]?.toString().trim() ?? '';
    final date = _parseDate(dateStr);
    if (date == null) {
      throw Exception('التاريخ غير صحيح: $dateStr');
    }

    // Parse note (optional)
    final note = row.length > 4 ? row[4]?.toString().trim() : null;

    return CreateTransactionRequest(
      type: type,
      amount: amount,
      category: category.name,
      note: note?.isNotEmpty == true ? note : null,
      date: date,
      receiptImage: null,
    );
  }

  // Parse amount from string
  static double? _parseAmount(String amountStr) {
    if (amountStr.isEmpty) return null;

    // Remove currency symbols and normalize
    String cleaned = amountStr
        .replaceAll(RegExp(r'[^\d.,\u0660-\u0669]'), '') // Keep only digits, dots, commas, and Arabic digits
        .replaceAll(',', '') // Remove thousands separators
        .replaceAll(RegExp(r'[\u0660-\u0669]'), (match) {
          // Convert Arabic-Indic digits to ASCII
          final arabicDigit = match.group(0)!;
          return String.fromCharCode(
            arabicDigit.codeUnitAt(0) - '\u0660'.codeUnitAt(0) + '0'.codeUnitAt(0)
          );
        });

    return double.tryParse(cleaned);
  }

  // Find category by name or create suggestion
  static models.Category? _findCategory(String categoryStr, List<models.Category> categories, TransactionType type) {
    if (categoryStr.isEmpty) return null;

    // Exact match
    for (final category in categories) {
      if (category.name.toLowerCase() == categoryStr.toLowerCase()) {
        return category;
      }
    }

    // Arabic name match (if implemented)
    // This would require adding Arabic names to categories

    // Partial match
    for (final category in categories) {
      if (category.name.toLowerCase().contains(categoryStr.toLowerCase()) ||
          categoryStr.toLowerCase().contains(category.name.toLowerCase())) {
        return category;
      }
    }

    // Return null if not found - could be extended to suggest creating new category
    return null;
  }

  // Parse date from string
  static DateTime? _parseDate(String dateStr) {
    if (dateStr.isEmpty) return null;

    // Try different date formats
    final formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'dd-MM-yyyy',
      'MM/dd/yyyy',
      'MM-dd-yyyy',
    ];

    for (final format in formats) {
      try {
        // Simple parsing - could be enhanced with proper date parsing library
        if (format == 'yyyy-MM-dd') {
          final parts = dateStr.split('-');
          if (parts.length == 3) {
            final year = int.tryParse(parts[0]);
            final month = int.tryParse(parts[1]);
            final day = int.tryParse(parts[2]);
            if (year != null && month != null && day != null) {
              return DateTime(year, month, day);
            }
          }
        } else if (format == 'dd/MM/yyyy' || format == 'dd-MM-yyyy') {
          final parts = dateStr.split(RegExp(r'[/-]'));
          if (parts.length == 3) {
            final day = int.tryParse(parts[0]);
            final month = int.tryParse(parts[1]);
            final year = int.tryParse(parts[2]);
            if (day != null && month != null && year != null) {
              return DateTime(year, month, day);
            }
          }
        }
        // Add more format parsing as needed
      } catch (e) {
        continue;
      }
    }

    // Try built-in DateTime.parse as last resort
    try {
      return DateTime.parse(dateStr);
    } catch (e) {
      return null;
    }
  }

  // Generate sample CSV content
  static String generateSampleCSV() {
    return '''النوع,المبلغ,التصنيف,التاريخ,الملاحظة
مصروف,50,food,2024-01-15,غداء في المطعم
دخل,1000,salary,2024-01-01,راتب شهري
مصروف,20,transport,2024-01-10,أجرة تاكسي
مصروف,100,bills,2024-01-05,فاتورة كهرباء
دخل,200,freelance,2024-01-12,مشروع تصميم''';
  }
}

// Import result classes
class ImportResult {
  final bool isSuccess;
  final String? errorMessage;
  final List<CreateTransactionRequest> validTransactions;
  final List<ImportError> errors;
  final int totalRows;
  final bool isCancelled;

  ImportResult._({
    required this.isSuccess,
    this.errorMessage,
    required this.validTransactions,
    required this.errors,
    required this.totalRows,
    required this.isCancelled,
  });

  factory ImportResult.success({
    required List<CreateTransactionRequest> validTransactions,
    required List<ImportError> errors,
    required int totalRows,
  }) {
    return ImportResult._(
      isSuccess: true,
      validTransactions: validTransactions,
      errors: errors,
      totalRows: totalRows,
      isCancelled: false,
    );
  }

  factory ImportResult.error(String message) {
    return ImportResult._(
      isSuccess: false,
      errorMessage: message,
      validTransactions: [],
      errors: [],
      totalRows: 0,
      isCancelled: false,
    );
  }

  factory ImportResult.cancelled() {
    return ImportResult._(
      isSuccess: false,
      validTransactions: [],
      errors: [],
      totalRows: 0,
      isCancelled: true,
    );
  }
}

class ImportError {
  final int row;
  final String message;
  final String data;

  ImportError({
    required this.row,
    required this.message,
    required this.data,
  });
}