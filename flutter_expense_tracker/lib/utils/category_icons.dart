import 'package:flutter/material.dart';
import 'package:flutter_lucide/flutter_lucide.dart';

class CategoryIcons {
  static const Map<String, IconData> _iconMap = {
    // Food & Dining
    'utensils': LucideIcons.utensils,
    'coffee': LucideIcons.coffee,
    'wine': LucideIcons.wine,
    'pizza': LucideIcons.pizza,
    'apple': LucideIcons.apple,

    // Transportation
    'car': LucideIcons.car,
    'bus': LucideIcons.bus,
    'plane': LucideIcons.plane,
    'train': LucideIcons.zap,
    'bike': LucideIcons.bike,
    'fuel': LucideIcons.fuel,

    // Shopping
    'shopping-cart': LucideIcons.shoppingCart,
    'shopping-bag': LucideIcons.shoppingBag,
    'shirt': LucideIcons.shirt,
    'gift': LucideIcons.gift,
    'tag': LucideIcons.tag,

    // Entertainment
    'gamepad-2': LucideIcons.gamepad2,
    'music': LucideIcons.music,
    'film': LucideIcons.film,
    'headphones': LucideIcons.headphones,
    'camera': LucideIcons.camera,

    // Health & Medical
    'heart': LucideIcons.heart,
    'activity': LucideIcons.activity,
    'pills': LucideIcons.pill,
    'stethoscope': LucideIcons.stethoscope,

    // Education
    'graduation-cap': LucideIcons.graduationCap,
    'book-open': LucideIcons.bookOpen,
    'pencil': LucideIcons.pencil,
    'calculator': LucideIcons.calculator,

    // Home & Utilities
    'home': LucideIcons.home,
    'lightbulb': LucideIcons.lightbulb,
    'droplets': LucideIcons.droplets,
    'wifi': LucideIcons.wifi,
    'zap': LucideIcons.zap,

    // Work & Business
    'briefcase': LucideIcons.briefcase,
    'laptop': LucideIcons.laptop,
    'monitor': LucideIcons.monitor,
    'printer': LucideIcons.printer,

    // Finance & Banking
    'credit-card': LucideIcons.creditCard,
    'banknote': LucideIcons.banknote,
    'piggy-bank': LucideIcons.piggyBank,
    'circle-dollar-sign': LucideIcons.circleDollarSign,
    'wallet': LucideIcons.wallet,
    'trending-up': LucideIcons.trendingUp,

    // Technology
    'smartphone': LucideIcons.smartphone,
    'tablet': LucideIcons.tablet,
    'headphones': LucideIcons.headphones,
    'watch': LucideIcons.watch,

    // Travel & Hotels
    'map-pin': LucideIcons.mapPin,
    'compass': LucideIcons.compass,
    'luggage': LucideIcons.luggage,
    'bed': LucideIcons.bed,

    // Sports & Fitness
    'dumbbell': LucideIcons.dumbbell,
    'bike': LucideIcons.bike,
    'football': LucideIcons.football,
    'trophy': LucideIcons.trophy,

    // Miscellaneous
    'circle': LucideIcons.circle,
    'square': LucideIcons.square,
    'star': LucideIcons.star,
    'heart': LucideIcons.heart,
    'plus': LucideIcons.plus,
    'minus': LucideIcons.minus,
    'more-horizontal': LucideIcons.moreHorizontal,
    'settings': LucideIcons.settings,
    'help-circle': LucideIcons.helpCircle,
    'info': LucideIcons.info,
    'alert-circle': LucideIcons.alertCircle,
    'check': LucideIcons.check,
    'x': LucideIcons.x,
  };

  static IconData getIcon(String iconName) {
    return _iconMap[iconName] ?? LucideIcons.circle;
  }

  static List<String> get availableIcons => _iconMap.keys.toList();

  static Map<String, IconData> get allIcons => Map.from(_iconMap);

  // Get icons by category for better organization in UI
  static Map<String, List<String>> get iconsByCategory => {
    'طعام وشراب': [
      'utensils', 'coffee', 'wine', 'pizza', 'apple'
    ],
    'مواصلات': [
      'car', 'bus', 'plane', 'train', 'bike', 'fuel'
    ],
    'تسوق': [
      'shopping-cart', 'shopping-bag', 'shirt', 'gift', 'tag'
    ],
    'ترفيه': [
      'gamepad-2', 'music', 'film', 'headphones', 'camera'
    ],
    'صحة': [
      'heart', 'activity', 'pills', 'stethoscope'
    ],
    'تعليم': [
      'graduation-cap', 'book-open', 'pencil', 'calculator'
    ],
    'منزل ومرافق': [
      'home', 'lightbulb', 'droplets', 'wifi', 'zap'
    ],
    'عمل': [
      'briefcase', 'laptop', 'monitor', 'printer'
    ],
    'مالية': [
      'credit-card', 'banknote', 'piggy-bank', 'circle-dollar-sign', 'wallet', 'trending-up'
    ],
    'تكنولوجيا': [
      'smartphone', 'tablet', 'headphones', 'watch'
    ],
    'سفر': [
      'map-pin', 'compass', 'luggage', 'bed'
    ],
    'رياضة': [
      'dumbbell', 'bike', 'football', 'trophy'
    ],
    'أخرى': [
      'circle', 'square', 'star', 'heart', 'plus', 'minus', 'more-horizontal',
      'settings', 'help-circle', 'info', 'alert-circle', 'check', 'x'
    ],
  };

  // Get a suggested icon based on category name (Arabic)
  static String getSuggestedIcon(String categoryName) {
    final name = categoryName.toLowerCase();

    // Food and dining suggestions
    if (name.contains('طعام') || name.contains('أكل') || name.contains('مطعم') || 
        name.contains('إفطار') || name.contains('غداء') || name.contains('عشاء')) {
      return 'utensils';
    }
    if (name.contains('قهوة') || name.contains('شاي') || name.contains('مشروب')) {
      return 'coffee';
    }

    // Transportation suggestions
    if (name.contains('سيارة') || name.contains('وقود') || name.contains('بنزين')) {
      return 'car';
    }
    if (name.contains('مواصلات') || name.contains('باص') || name.contains('أتوبيس')) {
      return 'bus';
    }
    if (name.contains('طيران') || name.contains('سفر')) {
      return 'plane';
    }

    // Shopping suggestions
    if (name.contains('تسوق') || name.contains('شراء') || name.contains('سوق')) {
      return 'shopping-cart';
    }
    if (name.contains('ملابس') || name.contains('لبس')) {
      return 'shirt';
    }
    if (name.contains('هدية') || name.contains('هدايا')) {
      return 'gift';
    }

    // Entertainment suggestions
    if (name.contains('ألعاب') || name.contains('لعب')) {
      return 'gamepad-2';
    }
    if (name.contains('موسيقى') || name.contains('أغاني')) {
      return 'music';
    }
    if (name.contains('سينما') || name.contains('فيلم')) {
      return 'film';
    }

    // Health suggestions
    if (name.contains('صحة') || name.contains('طبيب') || name.contains('دواء') || 
        name.contains('مستشفى') || name.contains('علاج')) {
      return 'heart';
    }

    // Education suggestions
    if (name.contains('تعليم') || name.contains('مدرسة') || name.contains('جامعة') || 
        name.contains('دراسة') || name.contains('كتب')) {
      return 'graduation-cap';
    }

    // Home and utilities suggestions
    if (name.contains('منزل') || name.contains('بيت') || name.contains('إيجار')) {
      return 'home';
    }
    if (name.contains('كهرباء')) {
      return 'zap';
    }
    if (name.contains('ماء') || name.contains('مياه')) {
      return 'droplets';
    }
    if (name.contains('إنترنت') || name.contains('واي فاي')) {
      return 'wifi';
    }

    // Work suggestions
    if (name.contains('عمل') || name.contains('وظيفة') || name.contains('راتب')) {
      return 'briefcase';
    }

    // Finance suggestions
    if (name.contains('بنك') || name.contains('فيزا') || name.contains('ماستر') || 
        name.contains('بطاقة')) {
      return 'credit-card';
    }
    if (name.contains('ادخار') || name.contains('توفير')) {
      return 'piggy-bank';
    }
    if (name.contains('دخل') || name.contains('راتب') || name.contains('مرتب')) {
      return 'trending-up';
    }

    // Technology suggestions
    if (name.contains('هاتف') || name.contains('موبايل') || name.contains('جوال')) {
      return 'smartphone';
    }
    if (name.contains('كمبيوتر') || name.contains('لاب توب')) {
      return 'laptop';
    }

    // Default icon
    return 'circle';
  }
}