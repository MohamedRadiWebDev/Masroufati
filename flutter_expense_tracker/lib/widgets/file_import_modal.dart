
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:io';
import 'dart:typed_data';
import '../services/file_import_service.dart';
import '../providers/offline_providers.dart';

class FileImportModal extends ConsumerStatefulWidget {
  const FileImportModal({super.key});

  @override
  ConsumerState<FileImportModal> createState() => _FileImportModalState();
}

class _FileImportModalState extends ConsumerState<FileImportModal> {
  bool _isImporting = false;
  ImportResult? _importResult;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: _importResult == null
                  ? _buildImportInterface()
                  : _buildResultsInterface(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImportInterface() {
    return Column(
      children: [
        // Title and description
        Text(
          'استيراد المعاملات',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
          textDirection: TextDirection.rtl,
        ),
        
        const SizedBox(height: 8),
        
        Text(
          'قم بتحميل ملف CSV يحتوي على معاملاتك المالية',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          textDirection: TextDirection.rtl,
          textAlign: TextAlign.center,
        ),

        const Spacer(),

        // Import area
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.5),
              style: BorderStyle.solid,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
          ),
          child: Column(
            children: [
              Icon(
                LucideIcons.upload,
                size: 64,
                color: Theme.of(context).colorScheme.primary,
              ),
              
              const SizedBox(height: 16),
              
              Text(
                'اختر ملف CSV',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textDirection: TextDirection.rtl,
              ),
              
              const SizedBox(height: 8),
              
              Text(
                'الحد الأقصى: 10 ميجابايت\nالصيغة المطلوبة: النوع، المبلغ، التصنيف، التاريخ، الملاحظة',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textDirection: TextDirection.rtl,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),

        const Spacer(),

        // Action buttons
        Column(
          children: [
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isImporting ? null : _importFile,
                icon: _isImporting
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Icon(LucideIcons.upload),
                label: Text(_isImporting ? 'جاري الاستيراد...' : 'اختيار واستيراد الملف'),
              ),
            ),
            
            const SizedBox(height: 12),
            
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _downloadSampleFile,
                icon: const Icon(LucideIcons.download),
                label: const Text('تحميل ملف نموذجي'),
              ),
            ),
            
            const SizedBox(height: 12),
            
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(LucideIcons.x),
                label: const Text('إلغاء'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildResultsInterface() {
    final result = _importResult!;
    
    return Column(
      children: [
        // Results header
        Row(
          children: [
            Icon(
              result.isSuccess ? LucideIcons.checkCircle2 : LucideIcons.alertCircle,
              color: result.isSuccess ? Colors.green : Theme.of(context).colorScheme.error,
              size: 24,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result.isSuccess ? 'تم الاستيراد بنجاح!' : 'فشل الاستيراد',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: result.isSuccess ? Colors.green : Theme.of(context).colorScheme.error,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  if (result.errorMessage != null)
                    Text(
                      result.errorMessage!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.error,
                      ),
                      textDirection: TextDirection.rtl,
                    ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),

        if (result.isSuccess) ...[
          // Statistics cards
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'إجمالي الصفوف',
                  result.totalRows.toString(),
                  LucideIcons.fileText,
                  Theme.of(context).colorScheme.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'نجح',
                  result.validTransactions.length.toString(),
                  LucideIcons.checkCircle,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'أخطاء',
                  result.errors.length.toString(),
                  LucideIcons.alertTriangle,
                  Theme.of(context).colorScheme.error,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Errors list (if any)
          if (result.errors.isNotEmpty) ...[
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxHeight: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'الأخطاء الموجودة:',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.error,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      itemCount: result.errors.length,
                      itemBuilder: (context, index) {
                        final error = result.errors[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.errorContainer.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: Theme.of(context).colorScheme.error.withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'الصف ${error.row}: ${error.message}',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.error,
                                  fontWeight: FontWeight.w500,
                                ),
                                textDirection: TextDirection.rtl,
                              ),
                              if (error.data.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  'البيانات: ${error.data}',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context).colorScheme.onErrorContainer,
                                  ),
                                  textDirection: TextDirection.rtl,
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ],

        const Spacer(),

        // Action buttons
        if (result.isSuccess && result.validTransactions.isNotEmpty) ...[
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _saveTransactions,
              icon: const Icon(LucideIcons.save),
              label: Text('حفظ ${result.validTransactions.length} معاملة'),
            ),
          ),
          const SizedBox(height: 12),
        ],
        
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _resetImport,
                icon: const Icon(LucideIcons.refreshCw),
                label: const Text('استيراد ملف آخر'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(LucideIcons.x),
                label: const Text('إغلاق'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: color,
            ),
            textDirection: TextDirection.rtl,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _importFile() async {
    setState(() {
      _isImporting = true;
    });

    try {
      final categories = ref.read(localCategoriesProvider);
      final result = await FileImportService.importFile(categories);
      
      setState(() {
        _importResult = result;
      });
    } catch (e) {
      setState(() {
        _importResult = ImportResult.error('خطأ غير متوقع: ${e.toString()}');
      });
    } finally {
      setState(() {
        _isImporting = false;
      });
    }
  }

  Future<void> _saveTransactions() async {
    if (_importResult == null || !_importResult!.isSuccess) return;

    try {
      final repository = ref.read(transactionRepositoryProvider);
      
      for (final transaction in _importResult!.validTransactions) {
        await repository.createTransaction(transaction);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'تم حفظ ${_importResult!.validTransactions.length} معاملة بنجاح',
              textDirection: TextDirection.rtl,
            ),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ في حفظ المعاملات: ${e.toString()}',
              textDirection: TextDirection.rtl,
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _downloadSampleFile() async {
    final sampleContent = FileImportService.generateSampleCSV();
    
    try {
      // Create temporary file
      final bytes = Uint8List.fromList(sampleContent.codeUnits);
      
      // Share the file
      await Share.shareXFiles([
        XFile.fromData(
          bytes,
          mimeType: 'text/csv',
          name: 'sample_transactions.csv',
        )
      ], text: 'ملف نموذجي لاستيراد المعاملات');
      
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ في تحميل الملف النموذجي: ${e.toString()}',
              textDirection: TextDirection.rtl,
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  void _resetImport() {
    setState(() {
      _importResult = null;
      _isImporting = false;
    });
  }
}
