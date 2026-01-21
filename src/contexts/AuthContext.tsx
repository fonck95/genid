import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  initializeAuth,
  startLoginFlow,
  logout as logoutService,
  getValidAccessToken,
  isOAuth2Configured,
  type AuthState,
  type GoogleUser,
} from '../services/googleAuth';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string | null>;
  isOAuth2Available: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    isLoading: true,
    error: null,
  });

  const isOAuth2Available = isOAuth2Configured();

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      try {
        const state = await initializeAuth();
        setAuthState(state);
      } catch (err) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Error inicializando autenticacion',
        });
      }
    };

    init();
  }, []);

  const login = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await startLoginFlow();
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Error iniciando sesion',
      }));
    }
  }, []);

  const logout = useCallback(() => {
    logoutService();
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getValidAccessToken();
      if (token) {
        setAuthState(prev => ({ ...prev, accessToken: token }));
      }
      return token;
    } catch (err) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: err instanceof Error ? err.message : 'Error refrescando token',
      }));
      return null;
    }
  }, []);

  // Update user state helper (used after successful authentication)
  const updateUser = useCallback((user: GoogleUser, accessToken: string) => {
    setAuthState({
      isAuthenticated: true,
      user,
      accessToken,
      isLoading: false,
      error: null,
    });
  }, []);

  // Listen for storage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key?.startsWith('genid_google_')) {
        const state = await initializeAuth();
        setAuthState(state);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        refreshToken,
        isOAuth2Available,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export for type checking
export type { AuthContextType };
