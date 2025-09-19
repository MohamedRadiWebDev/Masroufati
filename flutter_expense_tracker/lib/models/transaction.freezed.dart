// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'transaction.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Transaction _$TransactionFromJson(Map<String, dynamic> json) {
  return _Transaction.fromJson(json);
}

/// @nodoc
mixin _$Transaction {
  String get id => throw _privateConstructorUsedError;
  TransactionType get type => throw _privateConstructorUsedError;
  double get amount => throw _privateConstructorUsedError;
  String get category => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;
  DateTime get date => throw _privateConstructorUsedError;
  @JsonKey(name: 'receipt_image')
  String? get receiptImage => throw _privateConstructorUsedError;
  @JsonKey(name: 'created_at')
  DateTime get createdAt => throw _privateConstructorUsedError;

  /// Serializes this Transaction to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $TransactionCopyWith<Transaction> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $TransactionCopyWith<$Res> {
  factory $TransactionCopyWith(
          Transaction value, $Res Function(Transaction) then) =
      _$TransactionCopyWithImpl<$Res, Transaction>;
  @useResult
  $Res call(
      {String id,
      TransactionType type,
      double amount,
      String category,
      String? note,
      DateTime date,
      @JsonKey(name: 'receipt_image') String? receiptImage,
      @JsonKey(name: 'created_at') DateTime createdAt});
}

/// @nodoc
class _$TransactionCopyWithImpl<$Res, $Val extends Transaction>
    implements $TransactionCopyWith<$Res> {
  _$TransactionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? amount = null,
    Object? category = null,
    Object? note = freezed,
    Object? date = null,
    Object? receiptImage = freezed,
    Object? createdAt = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      receiptImage: freezed == receiptImage
          ? _value.receiptImage
          : receiptImage // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$TransactionImplCopyWith<$Res>
    implements $TransactionCopyWith<$Res> {
  factory _$$TransactionImplCopyWith(
          _$TransactionImpl value, $Res Function(_$TransactionImpl) then) =
      __$$TransactionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      TransactionType type,
      double amount,
      String category,
      String? note,
      DateTime date,
      @JsonKey(name: 'receipt_image') String? receiptImage,
      @JsonKey(name: 'created_at') DateTime createdAt});
}

/// @nodoc
class __$$TransactionImplCopyWithImpl<$Res>
    extends _$TransactionCopyWithImpl<$Res, _$TransactionImpl>
    implements _$$TransactionImplCopyWith<$Res> {
  __$$TransactionImplCopyWithImpl(
      _$TransactionImpl _value, $Res Function(_$TransactionImpl) _then)
      : super(_value, _then);

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? type = null,
    Object? amount = null,
    Object? category = null,
    Object? note = freezed,
    Object? date = null,
    Object? receiptImage = freezed,
    Object? createdAt = null,
  }) {
    return _then(_$TransactionImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime,
      receiptImage: freezed == receiptImage
          ? _value.receiptImage
          : receiptImage // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$TransactionImpl implements _Transaction {
  const _$TransactionImpl(
      {required this.id,
      required this.type,
      required this.amount,
      required this.category,
      this.note,
      required this.date,
      @JsonKey(name: 'receipt_image') this.receiptImage,
      @JsonKey(name: 'created_at') required this.createdAt});

  factory _$TransactionImpl.fromJson(Map<String, dynamic> json) =>
      _$$TransactionImplFromJson(json);

  @override
  final String id;
  @override
  final TransactionType type;
  @override
  final double amount;
  @override
  final String category;
  @override
  final String? note;
  @override
  final DateTime date;
  @override
  @JsonKey(name: 'receipt_image')
  final String? receiptImage;
  @override
  @JsonKey(name: 'created_at')
  final DateTime createdAt;

  @override
  String toString() {
    return 'Transaction(id: $id, type: $type, amount: $amount, category: $category, note: $note, date: $date, receiptImage: $receiptImage, createdAt: $createdAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$TransactionImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.note, note) || other.note == note) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.receiptImage, receiptImage) ||
                other.receiptImage == receiptImage) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, type, amount, category, note,
      date, receiptImage, createdAt);

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$TransactionImplCopyWith<_$TransactionImpl> get copyWith =>
      __$$TransactionImplCopyWithImpl<_$TransactionImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$TransactionImplToJson(
      this,
    );
  }
}

abstract class _Transaction implements Transaction {
  const factory _Transaction(
          {required final String id,
          required final TransactionType type,
          required final double amount,
          required final String category,
          final String? note,
          required final DateTime date,
          @JsonKey(name: 'receipt_image') final String? receiptImage,
          @JsonKey(name: 'created_at') required final DateTime createdAt}) =
      _$TransactionImpl;

  factory _Transaction.fromJson(Map<String, dynamic> json) =
      _$TransactionImpl.fromJson;

  @override
  String get id;
  @override
  TransactionType get type;
  @override
  double get amount;
  @override
  String get category;
  @override
  String? get note;
  @override
  DateTime get date;
  @override
  @JsonKey(name: 'receipt_image')
  String? get receiptImage;
  @override
  @JsonKey(name: 'created_at')
  DateTime get createdAt;

  /// Create a copy of Transaction
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$TransactionImplCopyWith<_$TransactionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreateTransactionRequest _$CreateTransactionRequestFromJson(
    Map<String, dynamic> json) {
  return _CreateTransactionRequest.fromJson(json);
}

/// @nodoc
mixin _$CreateTransactionRequest {
  TransactionType get type => throw _privateConstructorUsedError;
  double get amount => throw _privateConstructorUsedError;
  String get category => throw _privateConstructorUsedError;
  String? get note => throw _privateConstructorUsedError;
  DateTime? get date => throw _privateConstructorUsedError;
  @JsonKey(name: 'receipt_image')
  String? get receiptImage => throw _privateConstructorUsedError;

  /// Serializes this CreateTransactionRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CreateTransactionRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CreateTransactionRequestCopyWith<CreateTransactionRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateTransactionRequestCopyWith<$Res> {
  factory $CreateTransactionRequestCopyWith(CreateTransactionRequest value,
          $Res Function(CreateTransactionRequest) then) =
      _$CreateTransactionRequestCopyWithImpl<$Res, CreateTransactionRequest>;
  @useResult
  $Res call(
      {TransactionType type,
      double amount,
      String category,
      String? note,
      DateTime? date,
      @JsonKey(name: 'receipt_image') String? receiptImage});
}

/// @nodoc
class _$CreateTransactionRequestCopyWithImpl<$Res,
        $Val extends CreateTransactionRequest>
    implements $CreateTransactionRequestCopyWith<$Res> {
  _$CreateTransactionRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CreateTransactionRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? amount = null,
    Object? category = null,
    Object? note = freezed,
    Object? date = freezed,
    Object? receiptImage = freezed,
  }) {
    return _then(_value.copyWith(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      date: freezed == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      receiptImage: freezed == receiptImage
          ? _value.receiptImage
          : receiptImage // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateTransactionRequestImplCopyWith<$Res>
    implements $CreateTransactionRequestCopyWith<$Res> {
  factory _$$CreateTransactionRequestImplCopyWith(
          _$CreateTransactionRequestImpl value,
          $Res Function(_$CreateTransactionRequestImpl) then) =
      __$$CreateTransactionRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {TransactionType type,
      double amount,
      String category,
      String? note,
      DateTime? date,
      @JsonKey(name: 'receipt_image') String? receiptImage});
}

/// @nodoc
class __$$CreateTransactionRequestImplCopyWithImpl<$Res>
    extends _$CreateTransactionRequestCopyWithImpl<$Res,
        _$CreateTransactionRequestImpl>
    implements _$$CreateTransactionRequestImplCopyWith<$Res> {
  __$$CreateTransactionRequestImplCopyWithImpl(
      _$CreateTransactionRequestImpl _value,
      $Res Function(_$CreateTransactionRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of CreateTransactionRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? amount = null,
    Object? category = null,
    Object? note = freezed,
    Object? date = freezed,
    Object? receiptImage = freezed,
  }) {
    return _then(_$CreateTransactionRequestImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      amount: null == amount
          ? _value.amount
          : amount // ignore: cast_nullable_to_non_nullable
              as double,
      category: null == category
          ? _value.category
          : category // ignore: cast_nullable_to_non_nullable
              as String,
      note: freezed == note
          ? _value.note
          : note // ignore: cast_nullable_to_non_nullable
              as String?,
      date: freezed == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      receiptImage: freezed == receiptImage
          ? _value.receiptImage
          : receiptImage // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateTransactionRequestImpl implements _CreateTransactionRequest {
  const _$CreateTransactionRequestImpl(
      {required this.type,
      required this.amount,
      required this.category,
      this.note,
      this.date,
      @JsonKey(name: 'receipt_image') this.receiptImage});

  factory _$CreateTransactionRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateTransactionRequestImplFromJson(json);

  @override
  final TransactionType type;
  @override
  final double amount;
  @override
  final String category;
  @override
  final String? note;
  @override
  final DateTime? date;
  @override
  @JsonKey(name: 'receipt_image')
  final String? receiptImage;

  @override
  String toString() {
    return 'CreateTransactionRequest(type: $type, amount: $amount, category: $category, note: $note, date: $date, receiptImage: $receiptImage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateTransactionRequestImpl &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.amount, amount) || other.amount == amount) &&
            (identical(other.category, category) ||
                other.category == category) &&
            (identical(other.note, note) || other.note == note) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.receiptImage, receiptImage) ||
                other.receiptImage == receiptImage));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType, type, amount, category, note, date, receiptImage);

  /// Create a copy of CreateTransactionRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateTransactionRequestImplCopyWith<_$CreateTransactionRequestImpl>
      get copyWith => __$$CreateTransactionRequestImplCopyWithImpl<
          _$CreateTransactionRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateTransactionRequestImplToJson(
      this,
    );
  }
}

abstract class _CreateTransactionRequest implements CreateTransactionRequest {
  const factory _CreateTransactionRequest(
          {required final TransactionType type,
          required final double amount,
          required final String category,
          final String? note,
          final DateTime? date,
          @JsonKey(name: 'receipt_image') final String? receiptImage}) =
      _$CreateTransactionRequestImpl;

  factory _CreateTransactionRequest.fromJson(Map<String, dynamic> json) =
      _$CreateTransactionRequestImpl.fromJson;

  @override
  TransactionType get type;
  @override
  double get amount;
  @override
  String get category;
  @override
  String? get note;
  @override
  DateTime? get date;
  @override
  @JsonKey(name: 'receipt_image')
  String? get receiptImage;

  /// Create a copy of CreateTransactionRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CreateTransactionRequestImplCopyWith<_$CreateTransactionRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
