import 'dart:io';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ReceiptImageViewer extends StatelessWidget {
  final String imageData; // Can be URL or base64
  final String title;
  final VoidCallback? onDelete;

  const ReceiptImageViewer({
    super.key,
    required this.imageData,
    required this.title,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black.withOpacity(0.5),
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
          textDirection: TextDirection.rtl,
        ),
        actions: [
          IconButton(
            onPressed: () => _shareImage(context),
            icon: const Icon(
              LucideIcons.share2,
              color: Colors.white,
            ),
          ),
          if (onDelete != null)
            IconButton(
              onPressed: () => _showDeleteConfirmation(context),
              icon: const Icon(
                LucideIcons.trash2,
                color: Colors.white,
              ),
            ),
          IconButton(
            onPressed: () => _showImageOptions(context),
            icon: const Icon(
              LucideIcons.moreVertical,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Container(
        child: PhotoView(
          imageProvider: _getImageProvider(),
          backgroundDecoration: const BoxDecoration(
            color: Colors.black,
          ),
          minScale: PhotoViewComputedScale.contained,
          maxScale: PhotoViewComputedScale.covered * 3.0,
          initialScale: PhotoViewComputedScale.contained,
          heroAttributes: PhotoViewHeroAttributes(tag: imageData),
          loadingBuilder: (context, event) => Center(
            child: Container(
              width: 60,
              height: 60,
              padding: const EdgeInsets.all(16),
              child: CircularProgressIndicator(
                value: event == null
                    ? 0
                    : event.cumulativeBytesLoaded / (event.expectedTotalBytes ?? 1),
                valueColor: AlwaysStoppedAnimation<Color>(
                  Theme.of(context).colorScheme.primary,
                ),
                strokeWidth: 3,
              ),
            ),
          ),
          errorBuilder: (context, error, stackTrace) => Container(
            color: Colors.black,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LucideIcons.imageOff,
                    size: 64,
                    color: Colors.white.withOpacity(0.7),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'فشل في تحميل الصورة',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 16,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'العودة',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        color: Colors.black.withOpacity(0.5),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildActionButton(
                icon: LucideIcons.download,
                label: 'حفظ',
                onTap: () => _downloadImage(context),
              ),
              _buildActionButton(
                icon: LucideIcons.share2,
                label: 'مشاركة',
                onTap: () => _shareImage(context),
              ),
              _buildActionButton(
                icon: LucideIcons.zoom,
                label: 'تكبير',
                onTap: () => _showZoomInstructions(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: Colors.white,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
              ),
              textDirection: TextDirection.rtl,
            ),
          ],
        ),
      ),
    );
  }

  ImageProvider _getImageProvider() {
    if (imageData.startsWith('http')) {
      // Network image
      return CachedNetworkImageProvider(imageData);
    } else if (imageData.startsWith('/')) {
      // File path
      return FileImage(File(imageData));
    } else {
      // Base64 image
      final bytes = base64Decode(imageData);
      return MemoryImage(bytes);
    }
  }

  void _shareImage(BuildContext context) {
    if (imageData.startsWith('http')) {
      Share.share(imageData, subject: title);
    } else {
      // For local/base64 images, share a generic message
      Share.share('إيصال من تطبيق إدارة المصروفات', subject: title);
    }
  }

  void _downloadImage(BuildContext context) {
    // TODO: Implement image download functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'ميزة الحفظ قيد التطوير',
          textDirection: TextDirection.rtl,
        ),
        backgroundColor: Colors.orange,
      ),
    );
  }

  void _showZoomInstructions(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'تعليمات التكبير',
          textDirection: TextDirection.rtl,
        ),
        content: const Text(
          'يمكنك تكبير وتصغير الصورة باستخدام:\n'
          '• القرص بالأصابع\n'
          '• النقر المزدوج للتكبير السريع\n'
          '• السحب للتنقل في الصورة المكبرة',
          textDirection: TextDirection.rtl,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('فهمت'),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text(
          'حذف الصورة',
          textDirection: TextDirection.rtl,
        ),
        content: const Text(
          'هل أنت متأكد من حذف صورة الإيصال؟ لا يمكن التراجع عن هذا الإجراء.',
          textDirection: TextDirection.rtl,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pop(); // Close image viewer
              onDelete?.call();
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

  void _showImageOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
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

            ListTile(
              leading: const Icon(LucideIcons.download),
              title: const Text(
                'حفظ الصورة',
                textDirection: TextDirection.rtl,
              ),
              onTap: () {
                Navigator.of(context).pop();
                _downloadImage(context);
              },
            ),

            ListTile(
              leading: const Icon(LucideIcons.share2),
              title: const Text(
                'مشاركة الصورة',
                textDirection: TextDirection.rtl,
              ),
              onTap: () {
                Navigator.of(context).pop();
                _shareImage(context);
              },
            ),

            ListTile(
              leading: const Icon(LucideIcons.copy),
              title: const Text(
                'نسخ رابط الصورة',
                textDirection: TextDirection.rtl,
              ),
              onTap: () {
                Navigator.of(context).pop();
                _copyImageUrl(context);
              },
            ),

            if (onDelete != null)
              ListTile(
                leading: Icon(
                  LucideIcons.trash2,
                  color: Theme.of(context).colorScheme.error,
                ),
                title: Text(
                  'حذف الصورة',
                  textDirection: TextDirection.rtl,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
                onTap: () {
                  Navigator.of(context).pop();
                  _showDeleteConfirmation(context);
                },
              ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _copyImageUrl(BuildContext context) {
    // TODO: Implement copy to clipboard functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'تم نسخ رابط الصورة',
          textDirection: TextDirection.rtl,
        ),
      ),
    );
  }
}