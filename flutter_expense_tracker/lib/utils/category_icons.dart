
import 'package:flutter_lucide/flutter_lucide.dart';
import 'package:flutter/material.dart';

class CategoryIcons {
  static const Map<String, IconData> _iconMapping = {
    // Transport
    'car': LucideIcons.car,
    'plane': LucideIcons.plane,
    'bus': LucideIcons.bus,
    'bike': LucideIcons.bike,
    'train': Icons.train, // fallback to Material Icons
    'fuel': LucideIcons.fuel,
    
    // Shopping
    'shopping-cart': LucideIcons.shopping_cart,
    'shopping-bag': LucideIcons.shopping_bag,
    'gift': LucideIcons.gift,
    'shirt': LucideIcons.shirt,
    'glasses': LucideIcons.glasses,
    
    // Entertainment
    'gamepad-2': LucideIcons.gamepad_2,
    'music': LucideIcons.music,
    'camera': LucideIcons.camera,
    'tv': LucideIcons.tv,
    'headphones': LucideIcons.headphones,
    'film': LucideIcons.film,
    'ticket': LucideIcons.ticket,
    
    // Education
    'graduation-cap': LucideIcons.graduation_cap,
    'book-open': LucideIcons.book_open,
    'pencil': LucideIcons.pencil,
    'calculator': LucideIcons.calculator,
    
    // Home & Utilities
    'home': Icons.home, // fallback to Material Icons
    'zap': LucideIcons.zap,
    'droplets': LucideIcons.droplets,
    'wifi': LucideIcons.wifi,
    'phone': LucideIcons.phone,
    'smartphone': LucideIcons.smartphone,
    
    // Finance
    'credit-card': LucideIcons.credit_card,
    'banknote': LucideIcons.banknote,
    'piggy-bank': LucideIcons.piggy_bank,
    'circle-dollar-sign': LucideIcons.circle_dollar_sign,
    'wallet': LucideIcons.wallet,
    'trending-up': LucideIcons.trending_up,
    'coins': LucideIcons.coins,
    
    // Health & Medical
    'heart': LucideIcons.heart,
    'pill': LucideIcons.pill,
    'stethoscope': LucideIcons.stethoscope,
    'activity': LucideIcons.activity,
    
    // Location & Travel
    'map-pin': LucideIcons.map_pin,
    'compass': LucideIcons.compass,
    'luggage': LucideIcons.luggage,
    'tent': LucideIcons.tent,
    'mountain': LucideIcons.mountain,
    
    // Sports & Fitness
    'dumbbell': LucideIcons.dumbbell,
    'football': Icons.sports_football, // fallback to Material Icons
    'bike': LucideIcons.bike,
    'trophy': LucideIcons.trophy,
    
    // Food & Dining
    'utensils': LucideIcons.utensils,
    'coffee': LucideIcons.coffee,
    'pizza': LucideIcons.pizza,
    'cake': LucideIcons.cake,
    'wine': LucideIcons.wine,
    
    // Default & Misc
    'more-horizontal': LucideIcons.moreHorizontal,
    'star': LucideIcons.star,
    'help-circle': LucideIcons.helpCircle,
    'settings': LucideIcons.settings,
    'alert-circle': LucideIcons.alertCircle,
  };

  static IconData getIcon(String iconName) {
    return _iconMapping[iconName] ?? LucideIcons.circle;
  }

  static String getIconName(IconData icon) {
    for (final entry in _iconMapping.entries) {
      if (entry.value == icon) {
        return entry.key;
      }
    }
    return 'circle';
  }

  static List<String> get availableIcons => _iconMapping.keys.toList();
  
  static Map<String, IconData> get iconMapping => _iconMapping;

  // Add suggested icon method that was missing
  static String getSuggestedIcon(String text) {
    final normalizedText = text.toLowerCase();
    
    // Arabic to icon mapping
    if (normalizedText.contains('أكل') || normalizedText.contains('طعام') || normalizedText.contains('مطعم')) {
      return 'utensils';
    }
    if (normalizedText.contains('مواصلات') || normalizedText.contains('سيارة') || normalizedText.contains('نقل')) {
      return 'car';
    }
    if (normalizedText.contains('سكن') || normalizedText.contains('بيت') || normalizedText.contains('منزل')) {
      return 'home';
    }
    if (normalizedText.contains('تسوق') || normalizedText.contains('شراء')) {
      return 'shopping-cart';
    }
    if (normalizedText.contains('صحة') || normalizedText.contains('طبيب') || normalizedText.contains('دواء')) {
      return 'heart';
    }
    if (normalizedText.contains('ترفيه') || normalizedText.contains('لعب')) {
      return 'gamepad-2';
    }
    if (normalizedText.contains('تعليم') || normalizedText.contains('دراسة')) {
      return 'graduation-cap';
    }
    if (normalizedText.contains('راتب') || normalizedText.contains('مال')) {
      return 'circle-dollar-sign';
    }
    
    return 'circle'; // default
  }
}
