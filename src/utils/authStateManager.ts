import { createComponentLogger } from '@/utils/logger';

interface AuthStateStorage {
  user: any;
  token: string;
  loginTime: number;
}

class AuthStateManager {
  private logger = createComponentLogger('AuthStateManager');
  private readonly STORAGE_KEY = 'auth-state';
  private readonly TOKEN_KEY = 'auth-token';
  private readonly USER_KEY = 'user';
  private readonly LOGIN_TIME_KEY = 'lastLoginTime';

  // Atomic save operation
  saveAuthState(user: any, token: string): void {
    try {
      const authState: AuthStateStorage = {
        user,
        token,
        loginTime: Date.now(),
      };

      // Atomic localStorage operations
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      localStorage.setItem(this.LOGIN_TIME_KEY, authState.loginTime.toString());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authState));

      this.logger.info('Auth state saved successfully');
    } catch (error) {
      this.logger.error('Failed to save auth state', error);
    }
  }

  // Get auth state with validation
  getAuthState(): AuthStateStorage | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      const userStr = localStorage.getItem(this.USER_KEY);
      const loginTimeStr = localStorage.getItem(this.LOGIN_TIME_KEY);

      if (!token || !userStr || !loginTimeStr) {
        return null;
      }

      return {
        user: JSON.parse(userStr),
        token,
        loginTime: parseInt(loginTimeStr),
      };
    } catch (error) {
      this.logger.error('Failed to get auth state', error);
      this.clearAuthState();
      return null;
    }
  }

  // Check if user logged in recently
  isRecentLogin(withinMs: number = 60000): boolean {
    const authState = this.getAuthState();
    if (!authState) return false;

    return Date.now() - authState.loginTime < withinMs;
  }

  // Atomic clear operation
  clearAuthState(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.LOGIN_TIME_KEY);
      localStorage.removeItem(this.STORAGE_KEY);
      
      this.logger.info('Auth state cleared successfully');
    } catch (error) {
      this.logger.error('Failed to clear auth state', error);
    }
  }

  // Validate auth state integrity
  validateAuthState(): boolean {
    const authState = this.getAuthState();
    if (!authState) return false;

    // Check if all required fields exist
    return !!(authState.user && authState.token && authState.loginTime);
  }
}

export const authStateManager = new AuthStateManager();