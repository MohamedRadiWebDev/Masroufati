// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryImpl _$$CategoryImplFromJson(Map<String, dynamic> json) =>
    _$CategoryImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      nameAr: json['name_ar'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      icon: json['icon'] as String,
      color: json['color'] as String,
    );

Map<String, dynamic> _$$CategoryImplToJson(_$CategoryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'name_ar': instance.nameAr,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'icon': instance.icon,
      'color': instance.color,
    };

const _$TransactionTypeEnumMap = {
  TransactionType.income: 'income',
  TransactionType.expense: 'expense',
};

_$CreateCategoryRequestImpl _$$CreateCategoryRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateCategoryRequestImpl(
      name: json['name'] as String,
      nameAr: json['name_ar'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      icon: json['icon'] as String,
      color: json['color'] as String,
    );

Map<String, dynamic> _$$CreateCategoryRequestImplToJson(
        _$CreateCategoryRequestImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'name_ar': instance.nameAr,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'icon': instance.icon,
      'color': instance.color,
    };
