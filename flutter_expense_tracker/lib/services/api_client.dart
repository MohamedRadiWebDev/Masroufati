import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import '../models/transaction.dart';
import '../models/category.dart';
import '../models/user.dart';
import '../models/api_response.dart';

part 'api_client.g.dart';

@RestApi()
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  // Health check endpoint
  @GET('/api/health')
  Future<HealthResponse> checkHealth();

  // Transaction endpoints
  @GET('/api/transactions')
  Future<List<Transaction>> getTransactions({
    @Query('page') int? page,
    @Query('limit') int? limit,
    @Query('type') String? type,
    @Query('category') String? category,
  });

  @POST('/api/transactions')
  Future<Transaction> createTransaction(@Body() CreateTransactionRequest request);

  @PUT('/api/transactions/{id}')
  Future<Transaction> updateTransaction(
    @Path('id') String id,
    @Body() CreateTransactionRequest request,
  );

  @DELETE('/api/transactions/{id}')
  Future<void> deleteTransaction(@Path('id') String id);

  // Category endpoints
  @GET('/api/categories')
  Future<List<Category>> getCategories({
    @Query('type') String? type,
  });

  @POST('/api/categories')
  Future<Category> createCategory(@Body() CreateCategoryRequest request);

  @PUT('/api/categories/{id}')
  Future<Category> updateCategory(
    @Path('id') String id,
    @Body() CreateCategoryRequest request,
  );

  @DELETE('/api/categories/{id}')
  Future<void> deleteCategory(@Path('id') String id);

  // User/Auth endpoints
  @POST('/api/auth/login')
  Future<AuthResponse> login(@Body() LoginRequest request);

  @POST('/api/auth/register')
  Future<AuthResponse> register(@Body() LoginRequest request);

  @GET('/api/auth/me')
  Future<User> getCurrentUser();
}