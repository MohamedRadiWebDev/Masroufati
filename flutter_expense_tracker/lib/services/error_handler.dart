import 'package:dio/dio.dart';
import '../models/api_response.dart';

class ApiErrorHandler {
  static ApiError handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return const ApiError(
          message: 'انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى',
          statusCode: 408,
        );
        
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode ?? 500;
        final message = _extractErrorMessage(error.response?.data) ??
            _getDefaultErrorMessage(statusCode);
        
        return ApiError(
          message: message,
          statusCode: statusCode,
          details: error.response?.data is Map<String, dynamic> 
              ? error.response!.data as Map<String, dynamic>
              : {},
        );
        
      case DioExceptionType.cancel:
        return const ApiError(
          message: 'تم إلغاء الطلب',
          statusCode: 499,
        );
        
      case DioExceptionType.unknown:
      case DioExceptionType.connectionError:
      case DioExceptionType.badCertificate:
      default:
        return const ApiError(
          message: 'خطأ في الاتصال، يرجى التحقق من الإنترنت',
          statusCode: 500,
        );
    }
  }

  static String? _extractErrorMessage(dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      return responseData['message'] as String? ??
             responseData['error'] as String? ??
             responseData['msg'] as String?;
    }
    return null;
  }

  static String _getDefaultErrorMessage(int statusCode) {
    switch (statusCode) {
      case 400:
        return 'طلب غير صحيح';
      case 401:
        return 'غير مصرح لك بالوصول';
      case 403:
        return 'ممنوع الوصول';
      case 404:
        return 'المورد غير موجود';
      case 422:
        return 'بيانات غير صحيحة';
      case 500:
        return 'خطأ في الخادم';
      default:
        return 'حدث خطأ غير متوقع';
    }
  }
}