import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../l10n/app_localizations.dart';

class MainLayout extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainLayout({super.key, required this.navigationShell});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(
        title: Text(_getAppBarTitle(navigationShell.currentIndex, l10n)),
      ),
      body: navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: navigationShell.currentIndex,
        onTap: (index) => _onItemTapped(index),
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home),
            label: l10n.home,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.list_alt),
            label: l10n.transactions,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.analytics),
            label: l10n.analytics,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.assessment),
            label: l10n.reports,
          ),
        ],
      ),
      floatingActionButton: _showFab(navigationShell.currentIndex)
          ? FloatingActionButton(
              onPressed: () {
                // TODO: Navigate to add transaction
              },
              backgroundColor: const Color(0xFF2E7D32),
              foregroundColor: Colors.white,
              child: const Icon(Icons.add),
            )
          : null,
    );
  }

  String _getAppBarTitle(int index, AppLocalizations l10n) {
    switch (index) {
      case 0:
        return l10n.home;
      case 1:
        return l10n.transactions;
      case 2:
        return l10n.analytics;
      case 3:
        return l10n.reports;
      default:
        return l10n.home;
    }
  }

  bool _showFab(int index) {
    // Show FAB only on home and transactions screens
    return index == 0 || index == 1;
  }

  void _onItemTapped(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }
}