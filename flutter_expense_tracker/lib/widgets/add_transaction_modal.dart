import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../providers/offline_providers.dart';
import '../utils/category_icons.dart';
import '../widgets/image_compression_widget.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../utils/text_direction_helper.dart';
import 'package:flutter/services.dart';

class AddTransactionModal extends ConsumerStatefulWidget {
  final Transaction? editTransaction;
  final TransactionType? initialType;

  const AddTransactionModal({
    super.key,
    this.editTransaction,
    this.initialType,
  });

  @override
  ConsumerState<AddTransactionModal> createState() => _AddTransactionModalState();
}

class _AddTransactionModalState extends ConsumerState<AddTransactionModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _noteController = TextEditingController();
  final _imagePicker = ImagePicker();
  
  TransactionType _selectedType = TransactionType.expense;
  String? _selectedCategoryId;
  DateTime _selectedDate = DateTime.now();
  File? _selectedImage;
  String? _compressedImageBase64;
  bool _isLoading = false;
  bool _showCategorySuggestions = false;
  List<Category> _suggestedCategories = [];

  @override
  void initState() {
    super.initState();
    if (widget.editTransaction != null) {
      _initializeFromTransaction(widget.editTransaction!);
    } else if (widget.initialType != null) {
      _selectedType = widget.initialType!;
    }
  }

  void _initializeFromTransaction(Transaction transaction) {
    _selectedType = transaction.type;
    _amountController.text = transaction.amount.toString();
    _noteController.text = transaction.note ?? '';
    _selectedDate = transaction.date;
    
    // Find category by name
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final categories = ref.read(localCategoriesProvider);
      final category = categories.firstWhere(
        (c) => c.name == transaction.category,
        orElse: () => categories.isNotEmpty ? categories.first : Category(
          id: 'temp',
          name: transaction.category,
          nameAr: transaction.category,
          color: '#6B7280',
          icon: 'circle',
          type: TransactionType.expense,
          createdAt: DateTime.now(),
        ),
      );
      setState(() {
        _selectedCategoryId = category.id;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(localCategoriesProvider);
    
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
            child: Form(
              key: _formKey,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      widget.editTransaction != null ? 'تعديل العملية' : 'إضافة عملية جديدة',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                      textDirection: TextDirectionHelper.rtl,
                    ),

                    const SizedBox(height: 24),

                    // Transaction Type Toggle
                    _buildTransactionTypeToggle(),

                    const SizedBox(height: 24),

                    // Amount Field
                    _buildAmountField(),

                    const SizedBox(height: 20),

                    // Category Selection
                    _buildCategoryField(categories),

                    const SizedBox(height: 20),

                    // Note Field
                    _buildNoteField(),

                    const SizedBox(height: 20),

                    // Date Selection
                    _buildDateField(),

                    const SizedBox(height: 20),

                    // Image Selection
                    _buildImageSection(),

                    const SizedBox(height: 32),

                    // Action Buttons
                    _buildActionButtons(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionTypeToggle() {
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildTypeButton(
              type: TransactionType.expense,
              label: 'مصروف',
              icon: Icons.trending_down,
              color: Theme.of(context).colorScheme.error,
            ),
          ),
          Expanded(
            child: _buildTypeButton(
              type: TransactionType.income,
              label: 'دخل',
              icon: Icons.trending_up,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeButton({
    required TransactionType type,
    required String label,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _selectedType == type;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : color,
              size: 20,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : color,
                fontWeight: FontWeight.w600,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'المبلغ',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          textDirection: TextDirectionHelper.rtl,
        ),
        const SizedBox(height: 8),
        
        TextFormField(
          controller: _amountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          textDirection: TextDirectionHelper.ltr,
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
          ],
          decoration: InputDecoration(
            hintText: '0.00',
            hintTextDirection: TextDirectionHelper.ltr,
            suffixText: 'ج.م',
            suffixIcon: const Icon(LucideIcons.banknote),
            filled: true,
            fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'المبلغ مطلوب';
            }
            final amount = double.tryParse(value);
            if (amount == null || amount <= 0) {
              return 'يجب أن يكون المبلغ أكبر من صفر';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildCategoryField(List<Category> categories) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'التصنيف',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textDirection: TextDirectionHelper.rtl,
            ),
            const Spacer(),
            if (_showCategorySuggestions && _suggestedCategories.isNotEmpty)
              TextButton.icon(
                onPressed: () => setState(() => _showCategorySuggestions = false),
                icon: const Icon(Icons.close, size: 16),
                label: const Text('إخفاء الاقتراحات'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),

        // Category suggestions (if note has content)
        if (_showCategorySuggestions && _suggestedCategories.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _suggestedCategories.map((category) => 
                GestureDetector(
                  onTap: () => setState(() {
                    _selectedCategoryId = category.id;
                    _showCategorySuggestions = false;
                  }),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          CategoryIcons.getIcon(category.icon),
                          size: 16,
                          color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          category.name,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                          textDirection: TextDirectionHelper.rtl,
                        ),
                      ],
                    ),
                  ),
                ),
              ).toList(),
            ),
          ),

        DropdownButtonFormField<String>(
          value: _selectedCategoryId,
          decoration: InputDecoration(
            hintText: 'اختر التصنيف',
            hintTextDirection: TextDirectionHelper.rtl,
            prefixIcon: _selectedCategoryId != null 
                ? Icon(
                    CategoryIcons.getIcon(
                      categories.firstWhere((c) => c.id == _selectedCategoryId).icon
                    ),
                    color: Color(int.parse(
                      categories.firstWhere((c) => c.id == _selectedCategoryId)
                          .color.replaceFirst('#', '0xFF')
                    )),
                  )
                : const Icon(LucideIcons.tag),
            filled: true,
            fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
          items: categories.map((category) => DropdownMenuItem(
            value: category.id,
            child: Row(
              children: [
                Icon(
                  CategoryIcons.getIcon(category.icon),
                  size: 20,
                  color: Color(int.parse(category.color.replaceFirst('#', '0xFF'))),
                ),
                const SizedBox(width: 12),
                Text(
                  category.name,
                  textDirection: TextDirectionHelper.rtl,
                ),
              ],
            ),
          )).toList(),
          onChanged: (value) => setState(() => _selectedCategoryId = value),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return 'التصنيف مطلوب';
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildNoteField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ملاحظة (اختياري)',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          textDirection: TextDirectionHelper.rtl,
        ),
        const SizedBox(height: 8),
        
        TextFormField(
          controller: _noteController,
          textDirection: TextDirectionHelper.rtl,
          maxLines: 3,
          onChanged: _onNoteChanged,
          decoration: InputDecoration(
            hintText: 'أضف ملاحظة أو وصف للعملية...',
            hintTextDirection: TextDirectionHelper.rtl,
            prefixIcon: const Icon(Icons.description),
            filled: true,
            fillColor: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'التاريخ والوقت',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          textDirection: TextDirectionHelper.rtl,
        ),
        const SizedBox(height: 8),
        
        InkWell(
          onTap: () => _selectDateTime(context),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(
                  LucideIcons.calendar,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 12),
                Text(
                  DateFormat('EEEE، d MMMM yyyy - HH:mm', 'ar').format(_selectedDate),
                  style: Theme.of(context).textTheme.bodyLarge,
                  textDirection: TextDirectionHelper.rtl,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'صورة الإيصال (اختياري)',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          textDirection: TextDirectionHelper.rtl,
        ),
        const SizedBox(height: 8),

        if (_selectedImage != null)
          Container(
            width: double.infinity,
            height: 200,
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
              ),
            ),
            child: Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    _selectedImage!,
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: IconButton(
                      onPressed: () => setState(() {
                        _selectedImage = null;
                        _compressedImageBase64 = null;
                      }),
                      icon: const Icon(
                        Icons.close,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _pickImage(ImageSource.camera),
                icon: const Icon(LucideIcons.camera),
                label: const Text('كاميرا'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _pickImage(ImageSource.gallery),
                icon: const Icon(LucideIcons.image),
                label: const Text('معرض الصور'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isLoading ? null : _saveTransaction,
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : Text(widget.editTransaction != null ? 'حفظ التعديلات' : 'إضافة العملية'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
        ),
      ],
    );
  }

  void _onNoteChanged(String value) {
    if (value.length > 3) {
      final categories = ref.read(localCategoriesProvider);
      final suggestions = _getSuggestedCategories(value, categories);
      
      setState(() {
        _suggestedCategories = suggestions;
        _showCategorySuggestions = suggestions.isNotEmpty;
      });
    } else {
      setState(() {
        _showCategorySuggestions = false;
        _suggestedCategories = [];
      });
    }
  }

  List<Category> _getSuggestedCategories(String text, List<Category> categories) {
    final suggestions = <Category>[];
    final textLower = text.toLowerCase();

    // Check against category names
    for (final category in categories) {
      if (category.name.toLowerCase().contains(textLower)) {
        suggestions.add(category);
      }
    }

    // Get smart suggestions based on text content
    final smartIcon = CategoryIcons.getSuggestedIcon(text);
    final smartCategories = categories.where((c) => c.icon == smartIcon).toList();
    
    for (final category in smartCategories) {
      if (!suggestions.contains(category)) {
        suggestions.add(category);
      }
    }

    return suggestions.take(3).toList(); // Limit to 3 suggestions
  }

  Future<void> _selectDateTime(BuildContext context) async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      locale: const Locale('ar'),
    );

    if (date != null && mounted) {
      final time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_selectedDate),
      );

      if (time != null && mounted) {
        setState(() {
          _selectedDate = DateTime(
            date.year,
            date.month,
            date.day,
            time.hour,
            time.minute,
          );
        });
      }
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final image = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 85,
      );

      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });

        // Show compression dialog
        if (mounted) {
          final compressedBase64 = await showDialog<String>(
            context: context,
            barrierDismissible: false,
            builder: (context) => ImageCompressionWidget(
              imageFile: _selectedImage!,
            ),
          );

          if (compressedBase64 != null) {
            setState(() {
              _compressedImageBase64 = compressedBase64;
            });
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ في اختيار الصورة: ${e.toString()}',
              textDirection: TextDirectionHelper.rtl,
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  Future<void> _saveTransaction() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final amount = double.parse(_amountController.text);
      final categories = ref.read(localCategoriesProvider);
      final selectedCategory = categories.firstWhere((c) => c.id == _selectedCategoryId);

      if (widget.editTransaction != null) {
        // Update existing transaction
        final updatedTransaction = widget.editTransaction!.copyWith(
          type: _selectedType,
          amount: amount,
          category: selectedCategory.name,
          note: _noteController.text.isEmpty ? null : _noteController.text,
          date: _selectedDate,
          receiptImage: _compressedImageBase64,
        );

        await ref.read(transactionRepositoryProvider).updateTransaction(updatedTransaction);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'تم تعديل العملية بنجاح',
                textDirection: TextDirectionHelper.rtl,
              ),
            ),
          );
        }
      } else {
        // Create new transaction
        final request = CreateTransactionRequest(
          type: _selectedType,
          amount: amount,
          category: selectedCategory.name,
          note: _noteController.text.isEmpty ? null : _noteController.text,
          date: _selectedDate,
          receiptImage: _compressedImageBase64,
        );

        await ref.read(transactionRepositoryProvider).createTransaction(request);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'تم إضافة العملية بنجاح',
                textDirection: TextDirectionHelper.rtl,
              ),
            ),
          );
        }
      }

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ في حفظ العملية: ${e.toString()}',
              textDirection: TextDirectionHelper.rtl,
            ),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _noteController.dispose();
    super.dispose();
  }
}