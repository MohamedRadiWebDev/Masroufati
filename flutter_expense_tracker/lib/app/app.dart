import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../screens/home_screen.dart';
import '../screens/transactions_screen.dart';
import '../screens/analytics_screen.dart';
import '../screens/reports_screen.dart';
import '../widgets/main_layout.dart';

class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();
  static final _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'home');
  static final _transactionsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'transactions');
  static final _analyticsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'analytics');
  static final _reportsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'reports');

  static final GoRouter router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainLayout(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeNavigatorKey,
            routes: [
              GoRoute(
                path: '/',
                name: 'home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _transactionsNavigatorKey,
            routes: [
              GoRoute(
                path: '/transactions',
                name: 'transactions',
                builder: (context, state) => const TransactionsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _analyticsNavigatorKey,
            routes: [
              GoRoute(
                path: '/analytics',
                name: 'analytics',
                builder: (context, state) => const AnalyticsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _reportsNavigatorKey,
            routes: [
              GoRoute(
                path: '/reports',
                name: 'reports',
                builder: (context, state) => const ReportsScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}