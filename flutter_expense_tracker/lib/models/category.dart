import 'package:freezed_annotation/freezed_annotation.dart';
import 'transaction.dart';

part 'category.freezed.dart';
part 'category.g.dart';

@freezed
class Category with _$Category {
  const factory Category({
    required String id,
    required String name,
    required String nameAr,
    required String icon,
    required String color,
    required TransactionType type,
    DateTime? createdAt,
    String? serverId,
    @Default(false) bool isDefault,
  }) = _Category;

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
}

@freezed
class CreateCategoryRequest with _$CreateCategoryRequest {
  const factory CreateCategoryRequest({
    required String name,
    required String nameAr,
    required TransactionType type,
    required String icon,
    required String color,
  }) = _CreateCategoryRequest;

  factory CreateCategoryRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateCategoryRequestFromJson(json);
}