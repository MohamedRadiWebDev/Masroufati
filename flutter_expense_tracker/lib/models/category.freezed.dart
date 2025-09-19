// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'category.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Category _$CategoryFromJson(Map<String, dynamic> json) {
  return _Category.fromJson(json);
}

/// @nodoc
mixin _$Category {
  String get id => throw _privateConstructorUsedError;
  String get name => throw _privateConstructorUsedError;
  String get nameAr => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;
  String get color => throw _privateConstructorUsedError;
  TransactionType get type => throw _privateConstructorUsedError;
  DateTime? get createdAt => throw _privateConstructorUsedError;
  String? get serverId => throw _privateConstructorUsedError;
  bool get isDefault => throw _privateConstructorUsedError;

  /// Serializes this Category to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CategoryCopyWith<Category> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CategoryCopyWith<$Res> {
  factory $CategoryCopyWith(Category value, $Res Function(Category) then) =
      _$CategoryCopyWithImpl<$Res, Category>;
  @useResult
  $Res call(
      {String id,
      String name,
      String nameAr,
      String icon,
      String color,
      TransactionType type,
      DateTime? createdAt,
      String? serverId,
      bool isDefault});
}

/// @nodoc
class _$CategoryCopyWithImpl<$Res, $Val extends Category>
    implements $CategoryCopyWith<$Res> {
  _$CategoryCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? nameAr = null,
    Object? icon = null,
    Object? color = null,
    Object? type = null,
    Object? createdAt = freezed,
    Object? serverId = freezed,
    Object? isDefault = null,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameAr: null == nameAr
          ? _value.nameAr
          : nameAr // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      serverId: freezed == serverId
          ? _value.serverId
          : serverId // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _value.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CategoryImplCopyWith<$Res>
    implements $CategoryCopyWith<$Res> {
  factory _$$CategoryImplCopyWith(
          _$CategoryImpl value, $Res Function(_$CategoryImpl) then) =
      __$$CategoryImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String name,
      String nameAr,
      String icon,
      String color,
      TransactionType type,
      DateTime? createdAt,
      String? serverId,
      bool isDefault});
}

/// @nodoc
class __$$CategoryImplCopyWithImpl<$Res>
    extends _$CategoryCopyWithImpl<$Res, _$CategoryImpl>
    implements _$$CategoryImplCopyWith<$Res> {
  __$$CategoryImplCopyWithImpl(
      _$CategoryImpl _value, $Res Function(_$CategoryImpl) _then)
      : super(_value, _then);

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = null,
    Object? nameAr = null,
    Object? icon = null,
    Object? color = null,
    Object? type = null,
    Object? createdAt = freezed,
    Object? serverId = freezed,
    Object? isDefault = null,
  }) {
    return _then(_$CategoryImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameAr: null == nameAr
          ? _value.nameAr
          : nameAr // ignore: cast_nullable_to_non_nullable
              as String,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime?,
      serverId: freezed == serverId
          ? _value.serverId
          : serverId // ignore: cast_nullable_to_non_nullable
              as String?,
      isDefault: null == isDefault
          ? _value.isDefault
          : isDefault // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CategoryImpl implements _Category {
  const _$CategoryImpl(
      {required this.id,
      required this.name,
      required this.nameAr,
      required this.icon,
      required this.color,
      required this.type,
      this.createdAt,
      this.serverId,
      this.isDefault = false});

  factory _$CategoryImpl.fromJson(Map<String, dynamic> json) =>
      _$$CategoryImplFromJson(json);

  @override
  final String id;
  @override
  final String name;
  @override
  final String nameAr;
  @override
  final String icon;
  @override
  final String color;
  @override
  final TransactionType type;
  @override
  final DateTime? createdAt;
  @override
  final String? serverId;
  @override
  @JsonKey()
  final bool isDefault;

  @override
  String toString() {
    return 'Category(id: $id, name: $name, nameAr: $nameAr, icon: $icon, color: $color, type: $type, createdAt: $createdAt, serverId: $serverId, isDefault: $isDefault)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CategoryImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.nameAr, nameAr) || other.nameAr == nameAr) &&
            (identical(other.icon, icon) || other.icon == icon) &&
            (identical(other.color, color) || other.color == color) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.serverId, serverId) ||
                other.serverId == serverId) &&
            (identical(other.isDefault, isDefault) ||
                other.isDefault == isDefault));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, nameAr, icon, color,
      type, createdAt, serverId, isDefault);

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CategoryImplCopyWith<_$CategoryImpl> get copyWith =>
      __$$CategoryImplCopyWithImpl<_$CategoryImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CategoryImplToJson(
      this,
    );
  }
}

abstract class _Category implements Category {
  const factory _Category(
      {required final String id,
      required final String name,
      required final String nameAr,
      required final String icon,
      required final String color,
      required final TransactionType type,
      final DateTime? createdAt,
      final String? serverId,
      final bool isDefault}) = _$CategoryImpl;

  factory _Category.fromJson(Map<String, dynamic> json) =
      _$CategoryImpl.fromJson;

  @override
  String get id;
  @override
  String get name;
  @override
  String get nameAr;
  @override
  String get icon;
  @override
  String get color;
  @override
  TransactionType get type;
  @override
  DateTime? get createdAt;
  @override
  String? get serverId;
  @override
  bool get isDefault;

  /// Create a copy of Category
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CategoryImplCopyWith<_$CategoryImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

CreateCategoryRequest _$CreateCategoryRequestFromJson(
    Map<String, dynamic> json) {
  return _CreateCategoryRequest.fromJson(json);
}

/// @nodoc
mixin _$CreateCategoryRequest {
  String get name => throw _privateConstructorUsedError;
  String get nameAr => throw _privateConstructorUsedError;
  TransactionType get type => throw _privateConstructorUsedError;
  String get icon => throw _privateConstructorUsedError;
  String get color => throw _privateConstructorUsedError;

  /// Serializes this CreateCategoryRequest to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CreateCategoryRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CreateCategoryRequestCopyWith<CreateCategoryRequest> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CreateCategoryRequestCopyWith<$Res> {
  factory $CreateCategoryRequestCopyWith(CreateCategoryRequest value,
          $Res Function(CreateCategoryRequest) then) =
      _$CreateCategoryRequestCopyWithImpl<$Res, CreateCategoryRequest>;
  @useResult
  $Res call(
      {String name,
      String nameAr,
      TransactionType type,
      String icon,
      String color});
}

/// @nodoc
class _$CreateCategoryRequestCopyWithImpl<$Res,
        $Val extends CreateCategoryRequest>
    implements $CreateCategoryRequestCopyWith<$Res> {
  _$CreateCategoryRequestCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CreateCategoryRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? nameAr = null,
    Object? type = null,
    Object? icon = null,
    Object? color = null,
  }) {
    return _then(_value.copyWith(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameAr: null == nameAr
          ? _value.nameAr
          : nameAr // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$CreateCategoryRequestImplCopyWith<$Res>
    implements $CreateCategoryRequestCopyWith<$Res> {
  factory _$$CreateCategoryRequestImplCopyWith(
          _$CreateCategoryRequestImpl value,
          $Res Function(_$CreateCategoryRequestImpl) then) =
      __$$CreateCategoryRequestImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String name,
      String nameAr,
      TransactionType type,
      String icon,
      String color});
}

/// @nodoc
class __$$CreateCategoryRequestImplCopyWithImpl<$Res>
    extends _$CreateCategoryRequestCopyWithImpl<$Res,
        _$CreateCategoryRequestImpl>
    implements _$$CreateCategoryRequestImplCopyWith<$Res> {
  __$$CreateCategoryRequestImplCopyWithImpl(_$CreateCategoryRequestImpl _value,
      $Res Function(_$CreateCategoryRequestImpl) _then)
      : super(_value, _then);

  /// Create a copy of CreateCategoryRequest
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? name = null,
    Object? nameAr = null,
    Object? type = null,
    Object? icon = null,
    Object? color = null,
  }) {
    return _then(_$CreateCategoryRequestImpl(
      name: null == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String,
      nameAr: null == nameAr
          ? _value.nameAr
          : nameAr // ignore: cast_nullable_to_non_nullable
              as String,
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as TransactionType,
      icon: null == icon
          ? _value.icon
          : icon // ignore: cast_nullable_to_non_nullable
              as String,
      color: null == color
          ? _value.color
          : color // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$CreateCategoryRequestImpl implements _CreateCategoryRequest {
  const _$CreateCategoryRequestImpl(
      {required this.name,
      required this.nameAr,
      required this.type,
      required this.icon,
      required this.color});

  factory _$CreateCategoryRequestImpl.fromJson(Map<String, dynamic> json) =>
      _$$CreateCategoryRequestImplFromJson(json);

  @override
  final String name;
  @override
  final String nameAr;
  @override
  final TransactionType type;
  @override
  final String icon;
  @override
  final String color;

  @override
  String toString() {
    return 'CreateCategoryRequest(name: $name, nameAr: $nameAr, type: $type, icon: $icon, color: $color)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CreateCategoryRequestImpl &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.nameAr, nameAr) || other.nameAr == nameAr) &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.icon, icon) || other.icon == icon) &&
            (identical(other.color, color) || other.color == color));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, name, nameAr, type, icon, color);

  /// Create a copy of CreateCategoryRequest
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CreateCategoryRequestImplCopyWith<_$CreateCategoryRequestImpl>
      get copyWith => __$$CreateCategoryRequestImplCopyWithImpl<
          _$CreateCategoryRequestImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$CreateCategoryRequestImplToJson(
      this,
    );
  }
}

abstract class _CreateCategoryRequest implements CreateCategoryRequest {
  const factory _CreateCategoryRequest(
      {required final String name,
      required final String nameAr,
      required final TransactionType type,
      required final String icon,
      required final String color}) = _$CreateCategoryRequestImpl;

  factory _CreateCategoryRequest.fromJson(Map<String, dynamic> json) =
      _$CreateCategoryRequestImpl.fromJson;

  @override
  String get name;
  @override
  String get nameAr;
  @override
  TransactionType get type;
  @override
  String get icon;
  @override
  String get color;

  /// Create a copy of CreateCategoryRequest
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CreateCategoryRequestImplCopyWith<_$CreateCategoryRequestImpl>
      get copyWith => throw _privateConstructorUsedError;
}
