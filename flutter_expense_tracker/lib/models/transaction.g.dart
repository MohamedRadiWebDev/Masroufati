// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transaction.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TransactionImpl _$$TransactionImplFromJson(Map<String, dynamic> json) =>
    _$TransactionImpl(
      id: json['id'] as String,
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      amount: (json['amount'] as num).toDouble(),
      category: json['category'] as String,
      note: json['note'] as String?,
      date: DateTime.parse(json['date'] as String),
      receiptImage: json['receipt_image'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );

Map<String, dynamic> _$$TransactionImplToJson(_$TransactionImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'amount': instance.amount,
      'category': instance.category,
      'note': instance.note,
      'date': instance.date.toIso8601String(),
      'receipt_image': instance.receiptImage,
      'created_at': instance.createdAt.toIso8601String(),
    };

const _$TransactionTypeEnumMap = {
  TransactionType.income: 'income',
  TransactionType.expense: 'expense',
};

_$CreateTransactionRequestImpl _$$CreateTransactionRequestImplFromJson(
        Map<String, dynamic> json) =>
    _$CreateTransactionRequestImpl(
      type: $enumDecode(_$TransactionTypeEnumMap, json['type']),
      amount: (json['amount'] as num).toDouble(),
      category: json['category'] as String,
      note: json['note'] as String?,
      date:
          json['date'] == null ? null : DateTime.parse(json['date'] as String),
      receiptImage: json['receipt_image'] as String?,
    );

Map<String, dynamic> _$$CreateTransactionRequestImplToJson(
        _$CreateTransactionRequestImpl instance) =>
    <String, dynamic>{
      'type': _$TransactionTypeEnumMap[instance.type]!,
      'amount': instance.amount,
      'category': instance.category,
      'note': instance.note,
      'date': instance.date?.toIso8601String(),
      'receipt_image': instance.receiptImage,
    };
