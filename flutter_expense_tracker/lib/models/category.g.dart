// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CategoryImpl _$$CategoryImplFromJson(Map<String, dynamic> json) =>
    _$CategoryImpl(
      id: json['id'] as String,
      name: json['name'] as String,
      nameAr: json['nameAr'] as String,
      icon: json['icon'] as String,
      color: json['color'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      serverId: json['serverId'] as String?,
      isDefault: json['isDefault'] as bool? ?? false,
    );

Map<String, dynamic> _$$CategoryImplToJson(_$CategoryImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'nameAr': instance.nameAr,
      'icon': instance.icon,
      'color': instance.color,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'createdAt': instance.createdAt?.toIso8601String(),
      'serverId': instance.serverId,
      'isDefault': instance.isDefault,
    };

const _$TransactionTypeEnumMap = {
  TransactionType.income: 'income',
  TransactionType.expense: 'expense',
};

_$CreateCategoryRequestImpl _$$CreateCategoryRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateCategoryRequestImpl(
      name: json['name'] as String,
      nameAr: json['nameAr'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      icon: json['icon'] as String,
      color: json['color'] as String,
    );

Map<String, dynamic> _$$CreateCategoryRequestImplToJson(
        _$CreateCategoryRequestImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'nameAr': instance.nameAr,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'icon': instance.icon,
      'color': instance.color,
    };
