import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart';

// App locale provider
final localeProvider = StateProvider<Locale>((ref) => const Locale('ar'));

// Theme mode provider
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

// App settings provider
class AppSettings {
  final Locale locale;
  final ThemeMode themeMode;
  final String currency;
  final bool enableNotifications;
  final bool enableVoiceInput;

  const AppSettings({
    this.locale = const Locale('ar'),
    this.themeMode = ThemeMode.system,
    this.currency = 'EGP',
    this.enableNotifications = true,
    this.enableVoiceInput = true,
  });

  AppSettings copyWith({
    Locale? locale,
    ThemeMode? themeMode,
    String? currency,
    bool? enableNotifications,
    bool? enableVoiceInput,
  }) {
    return AppSettings(
      locale: locale ?? this.locale,
      themeMode: themeMode ?? this.themeMode,
      currency: currency ?? this.currency,
      enableNotifications: enableNotifications ?? this.enableNotifications,
      enableVoiceInput: enableVoiceInput ?? this.enableVoiceInput,
    );
  }
}

// App settings notifier
class AppSettingsNotifier extends StateNotifier<AppSettings> {
  AppSettingsNotifier() : super(const AppSettings());

  void updateLocale(Locale locale) {
    state = state.copyWith(locale: locale);
  }

  void updateThemeMode(ThemeMode themeMode) {
    state = state.copyWith(themeMode: themeMode);
  }

  void updateCurrency(String currency) {
    state = state.copyWith(currency: currency);
  }

  void toggleNotifications() {
    state = state.copyWith(enableNotifications: !state.enableNotifications);
  }

  void toggleVoiceInput() {
    state = state.copyWith(enableVoiceInput: !state.enableVoiceInput);
  }
}

// App settings provider
final appSettingsProvider = StateNotifierProvider<AppSettingsNotifier, AppSettings>((ref) {
  return AppSettingsNotifier();
});