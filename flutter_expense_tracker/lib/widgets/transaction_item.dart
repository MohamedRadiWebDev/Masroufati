import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../providers/offline_providers.dart';
import '../utils/category_icons.dart';
import '../widgets/receipt_image_viewer.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../utils/text_direction_helper.dart';

class TransactionItem extends ConsumerWidget {
  final Transaction transaction;

  const TransactionItem({
    super.key,
    required this.transaction,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(localCategoriesProvider);
    final category = categories.firstWhere(
      (c) => c.name == transaction.category,
      orElse: () => Category(
        id: 'default',
        name: transaction.category,
        nameAr: transaction.category,
        color: '#6B7280',
        icon: 'circle',
        type: transaction.type,
        createdAt: DateTime.now(),
      ),
    );

    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showTransactionDetails(context, ref),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Category Icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  CategoryIcons.getIcon(category.icon),
                  color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                  size: 24,
                ),
              ),

              const SizedBox(width: 16),

              // Transaction Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            transaction.category,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Theme.of(context).colorScheme.onSurface,
                            ),
                            textDirection: TextDirectionHelper.rtl,
                          ),
                        ),

                        // Receipt Image Indicator
                        if (transaction.receiptImage != null)
                          Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Icon(
                              LucideIcons.image,
                              size: 12,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 4),

                    // Note (if available)
                    if (transaction.note != null && transaction.note!.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          transaction.note!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                          textDirection: TextDirectionHelper.rtl,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),

                    // Date and Time
                    Text(
                      _formatDate(transaction.date),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      textDirection: TextDirectionHelper.rtl,
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 16),

              // Amount and Actions
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    _formatCurrency(transaction.amount),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: transaction.type == TransactionType.income
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.error,
                    ),
                    textDirection: TextDirectionHelper.rtl,
                  ),

                  const SizedBox(height: 4),

                  PopupMenuButton<String>(
                    onSelected: (value) => _handleMenuAction(context, ref, value),
                    icon: Icon(
                      Icons.more_horiz,
                      size: 16,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'view_receipt',
                        enabled: transaction.receiptImage != null,
                        child: Row(
                          children: [
                            Icon(
                              LucideIcons.image,
                              size: 16,
                              color: transaction.receiptImage != null
                                  ? Theme.of(context).colorScheme.onSurfaceVariant
                                  : Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.4),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'عرض الإيصال',
                              textDirection: TextDirectionHelper.rtl,
                              style: TextStyle(
                                color: transaction.receiptImage != null
                                    ? Theme.of(context).colorScheme.onSurfaceVariant
                                    : Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.4),
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(
                              LucideIcons.edit,
                              size: 16,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'تعديل',
                              textDirection: TextDirectionHelper.rtl,
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(
                              LucideIcons.trash,
                              size: 16,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'حذف',
                              textDirection: TextDirectionHelper.rtl,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    final formatter = NumberFormat('#,##0.00', 'ar');
    final sign = transaction.type == TransactionType.income ? '+' : '-';
    return '$sign ${formatter.format(amount)} ج.م';
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final transactionDate = DateTime(date.year, date.month, date.day);

    if (transactionDate.isAtSameMomentAs(today)) {
      return 'اليوم، ${DateFormat('HH:mm').format(date)}';
    } else if (transactionDate.isAtSameMomentAs(yesterday)) {
      return 'أمس، ${DateFormat('HH:mm').format(date)}';
    } else {
      return DateFormat('d/M/yyyy، HH:mm').format(date);
    }
  }

  void _showTransactionDetails(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _TransactionDetailsModal(transaction: transaction),
    );
  }

  void _handleMenuAction(BuildContext context, WidgetRef ref, String action) {
    switch (action) {
      case 'view_receipt':
        if (transaction.receiptImage != null) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ReceiptImageViewer(
                imageData: transaction.receiptImage!,
                title: 'إيصال ${transaction.category}',
              ),
            ),
          );
        }
        break;
      case 'edit':
        _showEditTransactionModal(context);
        break;
      case 'delete':
        _showDeleteConfirmation(context, ref);
        break;
    }
  }

  void _showEditTransactionModal(BuildContext context) {
    // TODO: Implement edit transaction modal
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('ميزة التعديل قيد التطوير'),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'تأكيد الحذف',
          textDirection: TextDirectionHelper.rtl,
        ),
        content: const Text(
          'هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.',
          textDirection: TextDirectionHelper.rtl,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteTransaction(context, ref);
            },
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }

  void _deleteTransaction(BuildContext context, WidgetRef ref) {
    ref.read(transactionRepositoryProvider).deleteTransaction(transaction.id);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'تم حذف العملية بنجاح',
          textDirection: TextDirectionHelper.rtl,
        ),
        action: SnackBarAction(
          label: 'تراجع',
          onPressed: () {
            // TODO: Implement undo functionality
          },
        ),
      ),
    );
  }
}

class _TransactionDetailsModal extends StatelessWidget {
  final Transaction transaction;

  const _TransactionDetailsModal({required this.transaction});

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
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'تفاصيل العملية',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textDirection: TextDirectionHelper.rtl,
                ),

                const SizedBox(height: 24),

                // Transaction details
                _buildDetailRow(
                  context,
                  'النوع',
                  transaction.type == TransactionType.income ? 'دخل' : 'مصروف',
                  icon: transaction.type == TransactionType.income
                      ? Icons.trending_up
                      : Icons.trending_down,
                ),

                _buildDetailRow(
                  context,
                  'المبلغ',
                  NumberFormat('#,##0.00 ج.م', 'ar').format(transaction.amount),
                  icon: LucideIcons.banknote,
                ),

                _buildDetailRow(
                  context,
                  'التصنيف',
                  transaction.category,
                  icon: LucideIcons.tag,
                ),

                if (transaction.note != null && transaction.note!.isNotEmpty)
                  _buildDetailRow(
                    context,
                    'الملاحظة',
                    transaction.note!,
                    icon: LucideIcons.fileText,
                  ),

                _buildDetailRow(
                  context,
                  'التاريخ',
                  DateFormat('EEEE، d MMMM yyyy - HH:mm', 'ar').format(transaction.date),
                  icon: LucideIcons.calendar,
                ),

                if (transaction.receiptImage != null)
                  const SizedBox(height: 16),

                // Receipt image preview
                if (transaction.receiptImage != null)
                  GestureDetector(
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ReceiptImageViewer(
                            imageData: transaction.receiptImage!,
                            title: 'إيصال ${transaction.category}',
                          ),
                        ),
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      height: 200,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: _buildImageWidget(transaction.receiptImage!),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, String label, String value, {required IconData icon}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 20,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                  textDirection: TextDirectionHelper.rtl,
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textDirection: TextDirectionHelper.rtl,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageWidget(String imageData) {
    if (imageData.startsWith('http')) {
      // Network image
      return Image.network(
        imageData,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          color: Colors.grey[200],
          child: const Center(
            child: Icon(Icons.image_not_supported),
          ),
        ),
      );
    } else if (imageData.startsWith('/')) {
      // File path
      return Image.file(
        File(imageData),
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => Container(
          color: Colors.grey[200],
          child: const Center(
            child: Icon(Icons.image_not_supported),
          ),
        ),
      );
    } else {
      // Base64 image
      try {
        final bytes = base64Decode(imageData);
        return Image.memory(
          bytes,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => Container(
            color: Colors.grey[200],
            child: const Center(
              child: Icon(Icons.image_not_supported),
            ),
          ),
        );
      } catch (e) {
        return Container(
          color: Colors.grey[200],
          child: const Center(
            child: Icon(Icons.image_not_supported),
          ),
        );
      }
    }
  }
}