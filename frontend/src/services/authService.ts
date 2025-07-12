import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  department?: string;
  permissions: string[];
  created_at: string;
  last_login?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  department?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_at: string;
}

export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, token, expires_at } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authExpires', expires_at);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Register new user
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, token, expires_at } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authExpires', expires_at);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear stored auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authExpires');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      this.clearAuthData();
      return null;
    }
  },

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/refresh');
      const { user, token, expires_at } = response.data;
      
      // Update stored auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
      localStorage.setItem('authExpires', expires_at);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const expires = localStorage.getItem('authExpires');
    
    if (!token || !expires) return false;
    
    // Check if token is expired
    const expirationTime = new Date(expires).getTime();
    const currentTime = new Date().getTime();
    
    if (currentTime >= expirationTime) {
      this.clearAuthData();
      return false;
    }
    
    return true;
  },

  // Get stored user data
  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('authUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  },

  // Clear auth data
  clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('authExpires');
  },

  // Check if user has permission
  hasPermission(permission: string): boolean {
    const user = this.getStoredUser();
    return user?.permissions.includes(permission) || false;
  },

  // Check if user has role
  hasRole(role: string): boolean {
    const user = this.getStoredUser();
    return user?.role === role;
  }
}; 