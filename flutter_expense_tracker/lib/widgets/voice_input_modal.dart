
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_lucide/flutter_lucide.dart';
import '../services/speech_recognition_service.dart';
import '../services/arabic_text_processor.dart';
import '../providers/offline_providers.dart';
import '../models/transaction.dart';
import 'dart:async';

class VoiceInputModal extends ConsumerStatefulWidget {
  const VoiceInputModal({super.key});

  @override
  ConsumerState<VoiceInputModal> createState() => _VoiceInputModalState();
}

class _VoiceInputModalState extends ConsumerState<VoiceInputModal>
    with SingleTickerProviderStateMixin {
  
  bool _isListening = false;
  bool _isProcessing = false;
  String _recognizedText = '';
  String _errorMessage = '';
  ParsedTransaction? _parsedTransaction;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  Timer? _listeningTimer;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _initializeSpeech();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _listeningTimer?.cancel();
    SpeechRecognitionService.stopListening();
    super.dispose();
  }

  Future<void> _initializeSpeech() async {
    final initialized = await SpeechRecognitionService.initialize();
    if (!initialized && mounted) {
      setState(() {
        _errorMessage = 'فشل في تهيئة خدمة التعرف على الكلام';
      });
    }
  }

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
              child: Column(
                children: [
                  // Title
                  Text(
                    'الإدخال الصوتي',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  
                  const SizedBox(height: 8),
                  
                  Text(
                    'قل شيئاً مثل: "صرفت خمسين جنيه أكل في المطعم"',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                    textDirection: TextDirection.rtl,
                    textAlign: TextAlign.center,
                  ),

                  const Spacer(),

                  // Voice animation and button
                  _buildVoiceInterface(),

                  const Spacer(),

                  // Results display
                  if (_recognizedText.isNotEmpty) ...[
                    _buildRecognizedText(),
                    const SizedBox(height: 16),
                  ],

                  if (_parsedTransaction != null) ...[
                    _buildParsedTransaction(),
                    const SizedBox(height: 16),
                  ],

                  if (_errorMessage.isNotEmpty) ...[
                    _buildErrorMessage(),
                    const SizedBox(height: 16),
                  ],

                  // Action buttons
                  _buildActionButtons(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVoiceInterface() {
    return Column(
      children: [
        GestureDetector(
          onTap: _isListening ? _stopListening : _startListening,
          child: AnimatedBuilder(
            animation: _scaleAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _isListening ? _scaleAnimation.value : 1.0,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isListening 
                        ? Theme.of(context).colorScheme.primary
                        : Theme.of(context).colorScheme.surfaceContainerHighest,
                    boxShadow: _isListening ? [
                      BoxShadow(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ] : null,
                  ),
                  child: Icon(
                    _isListening ? LucideIcons.mic_off : LucideIcons.mic,
                    size: 48,
                    color: _isListening 
                        ? Colors.white 
                        : Theme.of(context).colorScheme.primary,
                  ),
                ),
              );
            },
          ),
        ),
        
        const SizedBox(height: 16),
        
        Text(
          _isListening ? 'جاري الاستماع... انقر للتوقف' : 'انقر للبدء',
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
            color: _isListening 
                ? Theme.of(context).colorScheme.primary
                : Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          textDirection: TextDirection.rtl,
        ),
        
        if (_isProcessing) ...[
          const SizedBox(height: 8),
          const CircularProgressIndicator(),
          const SizedBox(height: 8),
          Text(
            'جاري معالجة النص...',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            textDirection: TextDirection.rtl,
          ),
        ],
      ],
    );
  }

  Widget _buildRecognizedText() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.message,
                size: 20,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'النص المُعرّف:',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.primary,
                ),
                textDirection: TextDirection.rtl,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _recognizedText,
            style: Theme.of(context).textTheme.bodyMedium,
            textDirection: TextDirection.rtl,
          ),
        ],
      ),
    );
  }

  Widget _buildParsedTransaction() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                LucideIcons.check,
                size: 20,
                color: Colors.green.shade600,
              ),
              const SizedBox(width: 8),
              Text(
                'تم تحليل العملية:',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade700,
                ),
                textDirection: TextDirection.rtl,
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTransactionDetail('النوع:', _parsedTransaction!.type == TransactionType.income ? 'دخل' : 'مصروف'),
          _buildTransactionDetail('المبلغ:', '${_parsedTransaction!.amount.toStringAsFixed(2)} ج.م'),
          _buildTransactionDetail('التصنيف:', _parsedTransaction!.category),
          if (_parsedTransaction!.note != null)
            _buildTransactionDetail('الملاحظة:', _parsedTransaction!.note!),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'مستوى الثقة: ${(_parsedTransaction!.confidence * 100).toInt()}%',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Colors.green.shade700,
                fontWeight: FontWeight.w500,
              ),
              textDirection: TextDirection.rtl,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              color: Colors.green.shade700,
            ),
            textDirection: TextDirection.rtl,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.green.shade800,
              ),
              textDirection: TextDirection.rtl,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.error.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.warning,
            size: 20,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _errorMessage,
              style: TextStyle(
                color: Theme.of(context).colorScheme.error,
              ),
              textDirection: TextDirection.rtl,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        if (_parsedTransaction != null)
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _saveTransaction,
              icon: const Icon(LucideIcons.plus),
              label: const Text('إضافة العملية'),
            ),
          ),
        
        const SizedBox(height: 8),
        
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _clearResults,
                icon: const Icon(Icons.refresh),
                label: const Text('مسح النتائج'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
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

  Future<void> _startListening() async {
    if (_isListening) return;

    setState(() {
      _errorMessage = '';
      _recognizedText = '';
      _parsedTransaction = null;
    });

    await SpeechRecognitionService.startListening(
      onResult: _onSpeechResult,
      onError: _onSpeechError,
      timeout: const Duration(seconds: 30),
    );

    setState(() {
      _isListening = true;
    });

    // Auto stop after 30 seconds
    _listeningTimer = Timer(const Duration(seconds: 30), () {
      if (_isListening) {
        _stopListening();
      }
    });
  }

  Future<void> _stopListening() async {
    _listeningTimer?.cancel();
    await SpeechRecognitionService.stopListening();
    setState(() {
      _isListening = false;
    });
  }

  void _onSpeechResult(String recognizedText) {
    setState(() {
      _recognizedText = recognizedText;
      _isProcessing = true;
    });

    // Process the recognized text
    final categories = ref.read(localCategoriesProvider);
    final parsed = ArabicTextProcessor.parseTransaction(recognizedText, categories);
    
    setState(() {
      _parsedTransaction = parsed;
      _isProcessing = false;
    });

    if (parsed == null) {
      setState(() {
        _errorMessage = 'لم أتمكن من فهم العملية من النص. حاول مرة أخرى بوضوح أكثر.';
      });
    }
  }

  void _onSpeechError(String error) {
    setState(() {
      _errorMessage = error;
      _isListening = false;
      _isProcessing = false;
    });
  }

  void _clearResults() {
    setState(() {
      _recognizedText = '';
      _parsedTransaction = null;
      _errorMessage = '';
    });
  }

  Future<void> _saveTransaction() async {
    if (_parsedTransaction == null) return;

    try {
      final request = CreateTransactionRequest(
        type: _parsedTransaction!.type,
        amount: _parsedTransaction!.amount,
        category: _parsedTransaction!.category,
        note: _parsedTransaction!.note,
        date: DateTime.now(),
        receiptImage: null,
      );

      await ref.read(transactionRepositoryProvider).createTransaction(request);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم إضافة العملية بنجاح',
              textDirection: TextDirection.rtl,
            ),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'فشل في حفظ العملية: ${e.toString()}';
        });
      }
    }
  }
}
