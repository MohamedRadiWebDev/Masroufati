import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// The title of the application
  ///
  /// In ar, this message translates to:
  /// **'مدير المالية الشخصية'**
  String get appTitle;

  /// No description provided for @home.
  ///
  /// In ar, this message translates to:
  /// **'الرئيسية'**
  String get home;

  /// No description provided for @transactions.
  ///
  /// In ar, this message translates to:
  /// **'المعاملات'**
  String get transactions;

  /// No description provided for @analytics.
  ///
  /// In ar, this message translates to:
  /// **'التحليلات'**
  String get analytics;

  /// No description provided for @reports.
  ///
  /// In ar, this message translates to:
  /// **'التقارير'**
  String get reports;

  /// No description provided for @addTransaction.
  ///
  /// In ar, this message translates to:
  /// **'إضافة معاملة'**
  String get addTransaction;

  /// No description provided for @income.
  ///
  /// In ar, this message translates to:
  /// **'إيراد'**
  String get income;

  /// No description provided for @expense.
  ///
  /// In ar, this message translates to:
  /// **'مصروف'**
  String get expense;

  /// No description provided for @amount.
  ///
  /// In ar, this message translates to:
  /// **'المبلغ'**
  String get amount;

  /// No description provided for @category.
  ///
  /// In ar, this message translates to:
  /// **'الفئة'**
  String get category;

  /// No description provided for @description.
  ///
  /// In ar, this message translates to:
  /// **'الوصف'**
  String get description;

  /// No description provided for @date.
  ///
  /// In ar, this message translates to:
  /// **'التاريخ'**
  String get date;

  /// No description provided for @save.
  ///
  /// In ar, this message translates to:
  /// **'حفظ'**
  String get save;

  /// No description provided for @cancel.
  ///
  /// In ar, this message translates to:
  /// **'إلغاء'**
  String get cancel;

  /// No description provided for @edit.
  ///
  /// In ar, this message translates to:
  /// **'تعديل'**
  String get edit;

  /// No description provided for @delete.
  ///
  /// In ar, this message translates to:
  /// **'حذف'**
  String get delete;

  /// No description provided for @total.
  ///
  /// In ar, this message translates to:
  /// **'المجموع'**
  String get total;

  /// No description provided for @balance.
  ///
  /// In ar, this message translates to:
  /// **'الرصيد'**
  String get balance;

  /// No description provided for @monthlyExpenses.
  ///
  /// In ar, this message translates to:
  /// **'المصروفات الشهرية'**
  String get monthlyExpenses;

  /// No description provided for @monthlyIncome.
  ///
  /// In ar, this message translates to:
  /// **'الإيرادات الشهرية'**
  String get monthlyIncome;

  /// No description provided for @thisMonth.
  ///
  /// In ar, this message translates to:
  /// **'هذا الشهر'**
  String get thisMonth;

  /// No description provided for @lastMonth.
  ///
  /// In ar, this message translates to:
  /// **'الشهر الماضي'**
  String get lastMonth;

  /// No description provided for @foodAndDrinks.
  ///
  /// In ar, this message translates to:
  /// **'الطعام والشراب'**
  String get foodAndDrinks;

  /// No description provided for @transportation.
  ///
  /// In ar, this message translates to:
  /// **'المواصلات'**
  String get transportation;

  /// No description provided for @entertainment.
  ///
  /// In ar, this message translates to:
  /// **'الترفيه'**
  String get entertainment;

  /// No description provided for @healthcare.
  ///
  /// In ar, this message translates to:
  /// **'الرعاية الصحية'**
  String get healthcare;

  /// No description provided for @utilities.
  ///
  /// In ar, this message translates to:
  /// **'الخدمات'**
  String get utilities;

  /// No description provided for @shopping.
  ///
  /// In ar, this message translates to:
  /// **'التسوق'**
  String get shopping;

  /// No description provided for @other.
  ///
  /// In ar, this message translates to:
  /// **'أخرى'**
  String get other;

  /// No description provided for @salary.
  ///
  /// In ar, this message translates to:
  /// **'الراتب'**
  String get salary;

  /// No description provided for @freelancing.
  ///
  /// In ar, this message translates to:
  /// **'العمل الحر'**
  String get freelancing;

  /// No description provided for @investments.
  ///
  /// In ar, this message translates to:
  /// **'الاستثمارات'**
  String get investments;

  /// No description provided for @voiceInput.
  ///
  /// In ar, this message translates to:
  /// **'الإدخال الصوتي'**
  String get voiceInput;

  /// No description provided for @startRecording.
  ///
  /// In ar, this message translates to:
  /// **'بدء التسجيل'**
  String get startRecording;

  /// No description provided for @stopRecording.
  ///
  /// In ar, this message translates to:
  /// **'إيقاف التسجيل'**
  String get stopRecording;

  /// No description provided for @fileImport.
  ///
  /// In ar, this message translates to:
  /// **'استيراد الملفات'**
  String get fileImport;

  /// No description provided for @selectFile.
  ///
  /// In ar, this message translates to:
  /// **'اختر ملف'**
  String get selectFile;

  /// No description provided for @importData.
  ///
  /// In ar, this message translates to:
  /// **'استيراد البيانات'**
  String get importData;

  /// No description provided for @exportData.
  ///
  /// In ar, this message translates to:
  /// **'تصدير البيانات'**
  String get exportData;

  /// No description provided for @settings.
  ///
  /// In ar, this message translates to:
  /// **'الإعدادات'**
  String get settings;

  /// No description provided for @currency.
  ///
  /// In ar, this message translates to:
  /// **'العملة'**
  String get currency;

  /// No description provided for @language.
  ///
  /// In ar, this message translates to:
  /// **'اللغة'**
  String get language;

  /// No description provided for @notifications.
  ///
  /// In ar, this message translates to:
  /// **'الإشعارات'**
  String get notifications;

  /// No description provided for @goals.
  ///
  /// In ar, this message translates to:
  /// **'الأهداف'**
  String get goals;

  /// No description provided for @setGoal.
  ///
  /// In ar, this message translates to:
  /// **'وضع هدف'**
  String get setGoal;

  /// No description provided for @goalAmount.
  ///
  /// In ar, this message translates to:
  /// **'مبلغ الهدف'**
  String get goalAmount;

  /// No description provided for @targetDate.
  ///
  /// In ar, this message translates to:
  /// **'التاريخ المستهدف'**
  String get targetDate;

  /// No description provided for @progress.
  ///
  /// In ar, this message translates to:
  /// **'التقدم'**
  String get progress;

  /// No description provided for @achieved.
  ///
  /// In ar, this message translates to:
  /// **'محقق'**
  String get achieved;

  /// No description provided for @remaining.
  ///
  /// In ar, this message translates to:
  /// **'المتبقي'**
  String get remaining;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
