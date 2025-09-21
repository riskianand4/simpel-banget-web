import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types/auth';
import { apiClient, ApiClientError, LoginResponse } from '@/services/apiClient';
import { toast } from 'sonner';
import { createComponentLogger } from '@/utils/logger';
import { authStateManager } from '@/utils/authStateManager';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuthManager = () => {
  const logger = createComponentLogger('AuthManager');
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Initialize auth state from localStorage with atomic operations
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('auth-token');
        const lastLoginTime = parseInt(localStorage.getItem('lastLoginTime') || '0');

        if (!savedUser || !savedToken) {
          if (isMounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
          return;
        }

        // Set token immediately for subsequent requests
        apiClient.setToken(savedToken);

        // Skip verification if user just logged in (within last 60 seconds)
        const shouldSkipVerification = Date.now() - lastLoginTime < 60000;

        if (shouldSkipVerification) {
          const userData = JSON.parse(savedUser);
          if (isMounted) {
            setAuthState({
              user: userData,
              isLoading: false,
              isAuthenticated: true,
              error: null,
            });
          }
          logger.info('Auth initialized without verification - recent login');
          return;
        }

        // Only verify if token is old enough to need checking
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Token verification timeout')), 3000)
          );
          
          const response = await Promise.race([
            apiClient.verifyToken(),
            timeoutPromise
          ]) as any;
          
          if (isMounted) {
            if (response && response.success) {
              setAuthState({
                user: JSON.parse(savedUser),
                isLoading: false,
                isAuthenticated: true,
                error: null,
              });
              logger.info('Token verified successfully');
            } else {
              throw new Error('Token verification failed');
            }
          }
        } catch (error) {
          // Token invalid or timeout, clear it
          logger.warn('Token verification failed, clearing auth', error);
          localStorage.removeItem('user');
          localStorage.removeItem('auth-token');
          localStorage.removeItem('lastLoginTime');
          apiClient.setToken(null);
          
          if (isMounted) {
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Session expired',
            }));
          }
        }
      } catch (error) {
        logger.error('Auth initialization error', error);
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Auth initialization failed',
          }));
        }
      }
    };

    // Small delay to prevent race conditions with AppContext
    const timer = setTimeout(initializeAuth, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // No dependencies to prevent re-runs

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      logger.info('Attempting login', { email });
      const response = await apiClient.login(email, password);
      logger.info('Login response received', { success: response.success });

      if (response.success && response.token && response.user) {
        // Standardize role format - backend uses 'super_admin', frontend uses 'superadmin'
        const normalizeRole = (role: string): 'user' | 'superadmin' => {
          if (role === 'super_admin') return 'superadmin';
          if (['user', 'superadmin'].includes(role)) return role as 'user' | 'superadmin';
          return 'user'; // default fallback
        };

        const userData: User = {
          id: response.user.id,
          username: response.user.email,
          email: response.user.email,
          role: normalizeRole(response.user.role),
          name: response.user.name || response.user.email,
        };

        // Save to localStorage using atomic operations
        authStateManager.saveAuthState(userData, response.token);
        
        // Set token in API client IMMEDIATELY
        apiClient.setToken(response.token);
        logger.info('Token set in apiClient', { tokenPreview: response.token.substring(0, 20) + '...' });

        setAuthState({
          user: userData,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });

        toast.success(`Welcome back, ${userData.name}!`);

        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'Login failed';

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      toast.error(`Login Failed: ${errorMessage}`);

      return false;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear state
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });

    // Clear storage atomically
    authStateManager.clearAuthState();
    
    // Clear API client token
    apiClient.setToken(null);

    toast.success('You have been successfully logged out.');
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data) {
        const tokenData = response.data as { token?: string };
        if (tokenData.token) {
          localStorage.setItem('auth-token', tokenData.token);
          apiClient.setToken(tokenData.token);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Token refresh failed', error);
      logout();
      return false;
    }
  }, [logout]);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    // Refresh token every 6 hours (token valid for 7 days)
    const interval = setInterval(() => {
      refreshAuth();
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, refreshAuth]);

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
  };
};