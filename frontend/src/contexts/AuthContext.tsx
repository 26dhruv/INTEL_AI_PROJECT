import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, LoginRequest, RegisterRequest } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user
          const user = await authService.getCurrentUser();
          if (user) {
            dispatch({ type: 'SET_USER', payload: user });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'LOGOUT' });
      }
    };

    initAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const expiresStr = localStorage.getItem('authExpires');
        if (!expiresStr) return;

        const expires = new Date(expiresStr).getTime();
        const now = new Date().getTime();
        const timeUntilExpiry = expires - now;

        // Refresh token if it expires within 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000) {
          await authService.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh error:', error);
        dispatch({ type: 'LOGOUT' });
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [state.isAuthenticated]);

  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.error || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.register(userData);
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
    } catch (error: unknown) {
      const errorMessage = (error as any)?.response?.data?.error || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const hasPermission = (permission: string): boolean => {
    return state.user?.permissions.includes(permission) || false;
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
    clearError,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 