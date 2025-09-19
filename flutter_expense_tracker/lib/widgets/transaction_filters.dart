import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/transaction.dart';
import '../providers/offline_providers.dart';
import 'package:lucide_icons/lucide_icons.dart';

class TransactionFilters extends ConsumerWidget {
  final String selectedCategory;
  final TransactionType? selectedType;
  final String dateFilter;
  final ValueChanged<String> onCategoryChanged;
  final ValueChanged<TransactionType?> onTypeChanged;
  final ValueChanged<String> onDateFilterChanged;

  const TransactionFilters({
    super.key,
    required this.selectedCategory,
    required this.selectedType,
    required this.dateFilter,
    required this.onCategoryChanged,
    required this.onTypeChanged,
    required this.onDateFilterChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(localCategoriesProvider);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                LucideIcons.filter,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'تصفية العمليات',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
                textDirection: TextDirection.rtl,
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Transaction Type Filter
          Text(
            'نوع العملية',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            textDirection: TextDirection.rtl,
          ),
          const SizedBox(height: 8),
          
          Wrap(
            spacing: 8,
            children: [
              _buildTypeChip(
                context,
                'الكل',
                selectedType == null,
                () => onTypeChanged(null),
                LucideIcons.list,
              ),
              _buildTypeChip(
                context,
                'دخل',
                selectedType == TransactionType.income,
                () => onTypeChanged(TransactionType.income),
                LucideIcons.trendingUp,
                color: Theme.of(context).colorScheme.primary,
              ),
              _buildTypeChip(
                context,
                'مصروف',
                selectedType == TransactionType.expense,
                () => onTypeChanged(TransactionType.expense),
                LucideIcons.trendingDown,
                color: Theme.of(context).colorScheme.error,
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Category Filter
          Text(
            'التصنيف',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            textDirection: TextDirection.rtl,
          ),
          const SizedBox(height: 8),

          DropdownButtonFormField<String>(
            value: selectedCategory,
            decoration: InputDecoration(
              prefixIcon: const Icon(LucideIcons.tag),
              filled: true,
              fillColor: Theme.of(context).colorScheme.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                ),
              ),
            ),
            onChanged: (value) => onCategoryChanged(value ?? 'all'),
            items: [
              DropdownMenuItem(
                value: 'all',
                child: Text(
                  'جميع التصنيفات',
                  textDirection: TextDirection.rtl,
                ),
              ),
              ...categories.map((category) => DropdownMenuItem(
                value: category.name,
                child: Text(
                  category.name,
                  textDirection: TextDirection.rtl,
                ),
              )),
            ],
          ),

          const SizedBox(height: 16),

          // Date Filter
          Text(
            'الفترة الزمنية',
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface,
            ),
            textDirection: TextDirection.rtl,
          ),
          const SizedBox(height: 8),

          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildDateChip(context, 'الكل', 'all'),
              _buildDateChip(context, 'اليوم', 'today'),
              _buildDateChip(context, 'أمس', 'yesterday'),
              _buildDateChip(context, 'هذا الأسبوع', 'this_week'),
              _buildDateChip(context, 'هذا الشهر', 'this_month'),
              _buildDateChip(context, 'الشهر الماضي', 'last_month'),
            ],
          ),

          const SizedBox(height: 12),

          // Clear Filters Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                onCategoryChanged('all');
                onTypeChanged(null);
                onDateFilterChanged('all');
              },
              icon: const Icon(LucideIcons.x),
              label: const Text('مسح جميع المرشحات'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeChip(
    BuildContext context,
    String label,
    bool isSelected,
    VoidCallback onTap,
    IconData icon, {
    Color? color,
  }) {
    return FilterChip(
      selected: isSelected,
      onSelected: (_) => onTap(),
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected 
                ? Theme.of(context).colorScheme.onPrimary
                : color ?? Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            textDirection: TextDirection.rtl,
            style: TextStyle(
              color: isSelected 
                  ? Theme.of(context).colorScheme.onPrimary
                  : Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
      selectedColor: color ?? Theme.of(context).colorScheme.primary,
      checkmarkColor: Theme.of(context).colorScheme.onPrimary,
      backgroundColor: Theme.of(context).colorScheme.surface,
      side: BorderSide(
        color: isSelected 
            ? (color ?? Theme.of(context).colorScheme.primary)
            : Theme.of(context).colorScheme.outline.withOpacity(0.3),
      ),
    );
  }

  Widget _buildDateChip(BuildContext context, String label, String value) {
    final isSelected = dateFilter == value;
    
    return FilterChip(
      selected: isSelected,
      onSelected: (_) => onDateFilterChanged(value),
      label: Text(
        label,
        textDirection: TextDirection.rtl,
        style: TextStyle(
          color: isSelected 
              ? Theme.of(context).colorScheme.onPrimary
              : Theme.of(context).colorScheme.onSurfaceVariant,
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        ),
      ),
      selectedColor: Theme.of(context).colorScheme.primary,
      checkmarkColor: Theme.of(context).colorScheme.onPrimary,
      backgroundColor: Theme.of(context).colorScheme.surface,
      side: BorderSide(
        color: isSelected 
            ? Theme.of(context).colorScheme.primary
            : Theme.of(context).colorScheme.outline.withOpacity(0.3),
      ),
    );
  }
}