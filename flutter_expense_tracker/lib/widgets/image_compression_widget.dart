import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image/image.dart' as img;
import 'package:lucide_icons/lucide_icons.dart';

class ImageCompressionWidget extends StatefulWidget {
  final File imageFile;
  final int? maxWidth;
  final int? maxHeight;
  final int? quality;

  const ImageCompressionWidget({
    super.key,
    required this.imageFile,
    this.maxWidth = 1024,
    this.maxHeight = 1024,
    this.quality = 85,
  });

  @override
  State<ImageCompressionWidget> createState() => _ImageCompressionWidgetState();
}

class _ImageCompressionWidgetState extends State<ImageCompressionWidget> {
  bool _isCompressing = false;
  double _compressionProgress = 0.0;
  String? _originalSize;
  String? _compressedSize;
  String? _compressionRatio;
  String? _compressedBase64;

  @override
  void initState() {
    super.initState();
    _startCompression();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text(
        'ضغط الصورة',
        textDirection: TextDirection.rtl,
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Image Preview
            Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(
                  widget.imageFile,
                  fit: BoxFit.cover,
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Compression Progress
            if (_isCompressing) ...[
              Row(
                children: [
                  Icon(
                    LucideIcons.loader2,
                    size: 20,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'جاري ضغط الصورة...',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                        const SizedBox(height: 4),
                        LinearProgressIndicator(
                          value: _compressionProgress,
                          backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${(_compressionProgress * 100).toInt()}%',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textDirection: TextDirection.rtl,
              ),
            ],

            // Compression Results
            if (!_isCompressing && _compressedBase64 != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'تم ضغط الصورة بنجاح',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          textDirection: TextDirection.rtl,
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildInfoItem(
                          'الحجم الأصلي',
                          _originalSize ?? '---',
                          LucideIcons.fileImage,
                        ),
                        _buildInfoItem(
                          'الحجم المضغوط',
                          _compressedSize ?? '---',
                          LucideIcons.package,
                        ),
                      ],
                    ),
                    
                    if (_compressionRatio != null) ...[
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            LucideIcons.trendingDown,
                            color: Theme.of(context).colorScheme.primary,
                            size: 16,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'توفير في المساحة: $_compressionRatio',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w500,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            textDirection: TextDirection.rtl,
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],

            // Error State
            if (!_isCompressing && _compressedBase64 == null) ...[
              Container(
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
                      LucideIcons.alertCircle,
                      color: Theme.of(context).colorScheme.error,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'فشل في ضغط الصورة. جرب مرة أخرى.',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                        textDirection: TextDirection.rtl,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
      actions: [
        if (!_isCompressing) ...[
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          if (_compressedBase64 != null)
            FilledButton(
              onPressed: () => Navigator.of(context).pop(_compressedBase64),
              child: const Text('استخدام الصورة'),
            ),
          if (_compressedBase64 == null)
            FilledButton(
              onPressed: _startCompression,
              child: const Text('إعادة المحاولة'),
            ),
        ],
      ],
    );
  }

  Widget _buildInfoItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          size: 16,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          textDirection: TextDirection.rtl,
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
          textDirection: TextDirection.rtl,
        ),
      ],
    );
  }

  Future<void> _startCompression() async {
    setState(() {
      _isCompressing = true;
      _compressionProgress = 0.0;
      _compressedBase64 = null;
    });

    try {
      // Get original file size
      final originalBytes = await widget.imageFile.readAsBytes();
      final originalSizeKB = (originalBytes.length / 1024).round();
      setState(() {
        _originalSize = _formatFileSize(originalBytes.length);
        _compressionProgress = 0.1;
      });

      // Decode image
      final originalImage = img.decodeImage(originalBytes);
      if (originalImage == null) {
        throw Exception('فشل في قراءة الصورة');
      }

      setState(() {
        _compressionProgress = 0.3;
      });

      // Resize image if needed
      img.Image processedImage = originalImage;
      if (widget.maxWidth != null && widget.maxHeight != null) {
        if (originalImage.width > widget.maxWidth! || originalImage.height > widget.maxHeight!) {
          processedImage = img.copyResize(
            originalImage,
            width: widget.maxWidth,
            height: widget.maxHeight,
            interpolation: img.Interpolation.linear,
          );
        }
      }

      setState(() {
        _compressionProgress = 0.6;
      });

      // Encode with compression
      final compressedBytes = img.encodeJpg(
        processedImage,
        quality: widget.quality ?? 85,
      );

      setState(() {
        _compressionProgress = 0.8;
      });

      // Convert to base64
      final base64String = base64Encode(compressedBytes);

      setState(() {
        _compressionProgress = 1.0;
      });

      // Calculate compression stats
      final compressedSizeKB = (compressedBytes.length / 1024).round();
      final compressionPercent = ((originalSizeKB - compressedSizeKB) / originalSizeKB * 100).round();

      setState(() {
        _compressedBase64 = base64String;
        _compressedSize = _formatFileSize(compressedBytes.length);
        _compressionRatio = compressionPercent > 0 ? '$compressionPercent%' : 'لا يوجد توفير';
        _isCompressing = false;
      });

    } catch (e) {
      setState(() {
        _isCompressing = false;
        _compressedBase64 = null;
      });
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes ب';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} ك.ب';
    } else {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} م.ب';
    }
  }
}