// Production-ready admin authentication service
import axios from 'axios';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  lastLogin: string;
  twoFactorEnabled: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
  twoFactorCode?: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: AdminUser;
  expiresIn: number;
}

class AdminAuthService {
  private static instance: AdminAuthService;
  private apiClient;
  private refreshTimer?: NodeJS.Timeout;

  private constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            await this.refreshToken();
            return this.apiClient.request(error.config);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiClient.post<AuthResponse>('/api/v1/admin/auth/login', credentials);
      const { token, refreshToken, user, expiresIn } = response.data;

      // Store tokens securely
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_refresh_token', refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(user));

      // Setup auto-refresh
      this.setupTokenRefresh(expiresIn);

      // Log security event
      this.logSecurityEvent('LOGIN_SUCCESS', user.id);

      return response.data;
    } catch (error) {
      this.logSecurityEvent('LOGIN_FAILED', credentials.username);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        await this.apiClient.post('/api/v1/admin/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');

      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.apiClient.post<AuthResponse>('/api/v1/admin/auth/refresh', {
      refreshToken
    });

    const { token, refreshToken: newRefreshToken, expiresIn } = response.data;

    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_refresh_token', newRefreshToken);

    this.setupTokenRefresh(expiresIn);
  }

  private setupTokenRefresh(expiresIn: number) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch(() => {
        this.logout();
        window.location.href = '/admin/login';
      });
    }, refreshTime);
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || user?.role === 'super_admin' || false;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.apiClient.post('/api/v1/admin/auth/change-password', {
      currentPassword,
      newPassword
    });
  }

  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    const response = await this.apiClient.post('/api/v1/admin/auth/2fa/enable');
    return response.data;
  }

  async verifyTwoFactor(code: string): Promise<void> {
    await this.apiClient.post('/api/v1/admin/auth/2fa/verify', { code });

    // Update user info
    const user = this.getCurrentUser();
    if (user) {
      user.twoFactorEnabled = true;
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
  }

  async disableTwoFactor(password: string): Promise<void> {
    await this.apiClient.post('/api/v1/admin/auth/2fa/disable', { password });

    // Update user info
    const user = this.getCurrentUser();
    if (user) {
      user.twoFactorEnabled = false;
      localStorage.setItem('admin_user', JSON.stringify(user));
    }
  }

  private async logSecurityEvent(event: string, identifier: string) {
    try {
      await this.apiClient.post('/api/v1/admin/security/log', {
        event,
        identifier,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: await this.getClientIP()
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Development fallback for testing
  async loginWithFallback(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      return await this.login(credentials);
    } catch (error) {
      // Development fallback
      if (process.env.NODE_ENV === 'development' &&
          credentials.username === 'admin' &&
          credentials.password === 'admin123') {

        const mockResponse: AuthResponse = {
          token: 'dev_token_' + Date.now(),
          refreshToken: 'dev_refresh_' + Date.now(),
          user: {
            id: 'dev_admin',
            username: 'admin',
            email: 'admin@ppituruppaturu.com',
            role: 'super_admin',
            permissions: ['*'],
            lastLogin: new Date().toISOString(),
            twoFactorEnabled: false
          },
          expiresIn: 3600
        };

        localStorage.setItem('admin_token', mockResponse.token);
        localStorage.setItem('admin_refresh_token', mockResponse.refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(mockResponse.user));

        return mockResponse;
      }
      throw error;
    }
  }
}

export default AdminAuthService;
export type { AdminUser, LoginCredentials, AuthResponse };