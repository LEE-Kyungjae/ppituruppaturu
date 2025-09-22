import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';

import '../models/user.dart';

class AuthService {
  final Dio _dio;
  final SharedPreferences _prefs;

  late final StreamController<User?> _authStateController;
  Stream<User?> get authStateStream => _authStateController.stream;

  User? _currentUser;
  User? get currentUser => _currentUser;

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  AuthService({
    required Dio dio,
    required SharedPreferences prefs,
  }) : _dio = dio,
        _prefs = prefs {
    _authStateController = StreamController<User?>.broadcast();
    _initializeAuth();
  }

  Future<void> _initializeAuth() async {
    try {
      final token = _prefs.getString(_tokenKey);
      final userData = _prefs.getString(_userKey);

      if (token != null && userData != null) {
        _currentUser = User.fromJson(userData);
        _setAuthHeader(token);
        _authStateController.add(_currentUser);

        // Verify token is still valid
        await _validateToken();
      } else {
        _authStateController.add(null);
      }
    } catch (e) {
      print('[AuthService] Initialization error: $e');
      await logout();
    }
  }

  Future<bool> _validateToken() async {
    try {
      final response = await _dio.get('/auth/me');
      if (response.statusCode == 200) {
        final userData = response.data['user'];
        _currentUser = User.fromMap(userData);
        await _saveUserData(_currentUser!);
        _authStateController.add(_currentUser);
        return true;
      }
      return false;
    } catch (e) {
      print('[AuthService] Token validation failed: $e');
      await logout();
      return false;
    }
  }

  Future<AuthResult> login({
    required String username,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final userData = data['user'];

        _currentUser = User.fromMap(userData);

        await _saveAuthData(token, _currentUser!);
        _setAuthHeader(token);
        _authStateController.add(_currentUser);

        return AuthResult.success(_currentUser!);
      } else {
        return AuthResult.failure('Login failed');
      }
    } on DioException catch (e) {
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      return AuthResult.failure('Unexpected error: $e');
    }
  }

  Future<AuthResult> socialLogin({
    required SocialProvider provider,
    required String accessToken,
  }) async {
    try {
      final response = await _dio.post('/auth/social/${provider.name}', data: {
        'access_token': accessToken,
      });

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final userData = data['user'];

        _currentUser = User.fromMap(userData);

        await _saveAuthData(token, _currentUser!);
        _setAuthHeader(token);
        _authStateController.add(_currentUser);

        return AuthResult.success(_currentUser!);
      } else {
        return AuthResult.failure('Social login failed');
      }
    } on DioException catch (e) {
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      return AuthResult.failure('Social login error: $e');
    }
  }

  Future<AuthResult> register({
    required String username,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'username': username,
        'email': email,
        'password': password,
      });

      if (response.statusCode == 201) {
        final data = response.data;
        final token = data['token'];
        final userData = data['user'];

        _currentUser = User.fromMap(userData);

        await _saveAuthData(token, _currentUser!);
        _setAuthHeader(token);
        _authStateController.add(_currentUser);

        return AuthResult.success(_currentUser!);
      } else {
        return AuthResult.failure('Registration failed');
      }
    } on DioException catch (e) {
      return AuthResult.failure(_handleDioError(e));
    } catch (e) {
      return AuthResult.failure('Registration error: $e');
    }
  }

  Future<void> logout() async {
    try {
      // Notify server of logout
      await _dio.post('/auth/logout').catchError((e) {
        // Ignore logout errors from server
        print('[AuthService] Server logout error: $e');
      });
    } finally {
      // Always clear local data
      await _clearAuthData();
      _currentUser = null;
      _removeAuthHeader();
      _authStateController.add(null);
    }
  }

  Future<bool> refreshToken() async {
    try {
      final response = await _dio.post('/auth/refresh');

      if (response.statusCode == 200) {
        final data = response.data;
        final newToken = data['token'];

        await _prefs.setString(_tokenKey, newToken);
        _setAuthHeader(newToken);

        return true;
      }
      return false;
    } catch (e) {
      print('[AuthService] Token refresh failed: $e');
      await logout();
      return false;
    }
  }

  Future<bool> updateProfile({
    String? username,
    String? email,
    String? avatar,
  }) async {
    try {
      final updateData = <String, dynamic>{};
      if (username != null) updateData['username'] = username;
      if (email != null) updateData['email'] = email;
      if (avatar != null) updateData['avatar'] = avatar;

      final response = await _dio.put('/auth/profile', data: updateData);

      if (response.statusCode == 200) {
        final userData = response.data['user'];
        _currentUser = User.fromMap(userData);
        await _saveUserData(_currentUser!);
        _authStateController.add(_currentUser);
        return true;
      }
      return false;
    } catch (e) {
      print('[AuthService] Profile update failed: $e');
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _dio.put('/auth/password', data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      });

      return response.statusCode == 200;
    } catch (e) {
      print('[AuthService] Password change failed: $e');
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    try {
      final response = await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });

      return response.statusCode == 200;
    } catch (e) {
      print('[AuthService] Forgot password failed: $e');
      return false;
    }
  }

  Future<bool> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    try {
      final response = await _dio.post('/auth/reset-password', data: {
        'token': token,
        'password': newPassword,
      });

      return response.statusCode == 200;
    } catch (e) {
      print('[AuthService] Password reset failed: $e');
      return false;
    }
  }

  Future<void> _saveAuthData(String token, User user) async {
    await Future.wait([
      _prefs.setString(_tokenKey, token),
      _prefs.setString(_userKey, user.toJson()),
    ]);
  }

  Future<void> _saveUserData(User user) async {
    await _prefs.setString(_userKey, user.toJson());
  }

  Future<void> _clearAuthData() async {
    await Future.wait([
      _prefs.remove(_tokenKey),
      _prefs.remove(_userKey),
    ]);
  }

  void _setAuthHeader(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void _removeAuthHeader() {
    _dio.options.headers.remove('Authorization');
  }

  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return 'Connection timeout';
      case DioExceptionType.receiveTimeout:
        return 'Receive timeout';
      case DioExceptionType.sendTimeout:
        return 'Send timeout';
      case DioExceptionType.connectionError:
        return 'Connection error';
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['message'] ?? 'Unknown error';

        switch (statusCode) {
          case 400:
            return 'Bad request: $message';
          case 401:
            return 'Invalid credentials';
          case 403:
            return 'Access forbidden';
          case 404:
            return 'Service not found';
          case 409:
            return 'User already exists';
          case 422:
            return 'Validation error: $message';
          case 500:
            return 'Server error';
          default:
            return 'Error $statusCode: $message';
        }
      case DioExceptionType.cancel:
        return 'Request cancelled';
      case DioExceptionType.unknown:
        return 'Network error';
      default:
        return 'Unknown error occurred';
    }
  }

  void dispose() {
    _authStateController.close();
  }
}

// Auth result wrapper
class AuthResult {
  final bool isSuccess;
  final User? user;
  final String? error;

  AuthResult._({
    required this.isSuccess,
    this.user,
    this.error,
  });

  factory AuthResult.success(User user) {
    return AuthResult._(isSuccess: true, user: user);
  }

  factory AuthResult.failure(String error) {
    return AuthResult._(isSuccess: false, error: error);
  }
}

// Social provider enum
enum SocialProvider {
  kakao,
  google,
  apple,
  facebook,
}

extension SocialProviderExtension on SocialProvider {
  String get name {
    switch (this) {
      case SocialProvider.kakao:
        return 'kakao';
      case SocialProvider.google:
        return 'google';
      case SocialProvider.apple:
        return 'apple';
      case SocialProvider.facebook:
        return 'facebook';
    }
  }

  String get displayName {
    switch (this) {
      case SocialProvider.kakao:
        return 'Kakao';
      case SocialProvider.google:
        return 'Google';
      case SocialProvider.apple:
        return 'Apple';
      case SocialProvider.facebook:
        return 'Facebook';
    }
  }
}