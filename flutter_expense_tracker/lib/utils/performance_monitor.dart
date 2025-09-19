
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class PerformanceMonitor {
  static final Map<String, DateTime> _startTimes = {};
  static final Map<String, List<int>> _metrics = {};
  
  // Start measuring performance for a specific operation
  static void startMeasuring(String operation) {
    if (kDebugMode) {
      _startTimes[operation] = DateTime.now();
    }
  }
  
  // End measuring and log the result
  static void endMeasuring(String operation) {
    if (kDebugMode && _startTimes.containsKey(operation)) {
      final startTime = _startTimes[operation]!;
      final endTime = DateTime.now();
      final duration = endTime.difference(startTime).inMilliseconds;
      
      // Store metric
      _metrics[operation] ??= [];
      _metrics[operation]!.add(duration);
      
      // Log result
      debugPrint('⏱️ $operation: ${duration}ms');
      
      // Clean up
      _startTimes.remove(operation);
      
      // Keep only last 10 measurements
      if (_metrics[operation]!.length > 10) {
        _metrics[operation]!.removeAt(0);
      }
    }
  }
  
  // Get average performance for an operation
  static double getAverageTime(String operation) {
    if (!_metrics.containsKey(operation) || _metrics[operation]!.isEmpty) {
      return 0.0;
    }
    
    final measurements = _metrics[operation]!;
    final total = measurements.reduce((a, b) => a + b);
    return total / measurements.length;
  }
  
  // Log all performance metrics
  static void logAllMetrics() {
    if (kDebugMode) {
      debugPrint('📊 Performance Metrics:');
      for (final entry in _metrics.entries) {
        final avg = getAverageTime(entry.key);
        debugPrint('   ${entry.key}: ${avg.toStringAsFixed(2)}ms avg');
      }
    }
  }
  
  // Monitor memory usage
  static Future<void> logMemoryUsage(String context) async {
    if (kDebugMode) {
      try {
        // This would require platform-specific implementation
        // For now, we'll just log the context
        debugPrint('💾 Memory check: $context');
      } catch (e) {
        debugPrint('Failed to get memory usage: $e');
      }
    }
  }
  
  // Monitor widget build times
  static void measureWidgetBuild(String widgetName, VoidCallback buildFunction) {
    startMeasuring('build_$widgetName');
    buildFunction();
    endMeasuring('build_$widgetName');
  }
}

// Extension for easy performance monitoring
extension PerformanceExtension<T> on Future<T> {
  Future<T> measurePerformance(String operation) async {
    PerformanceMonitor.startMeasuring(operation);
    try {
      final result = await this;
      PerformanceMonitor.endMeasuring(operation);
      return result;
    } catch (e) {
      PerformanceMonitor.endMeasuring(operation);
      rethrow;
    }
  }
}
