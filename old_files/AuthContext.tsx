// C:\Users\PC\Desktop\Connectshub\client\src\context\AuthContext.tsx

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

// --- 1. Interfaces ---

export interface User {
  id: string;
  email: string;
  name?: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<void>;
}

// --- 2. Create Context ---

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 3. AuthProvider ---

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Auth] Attempting login for: ${email}`);
      // TODO: Replace this with real API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (email === 'test@example.com' && password === 'password123') {
        const fetchedUser: User = { id: 'user-123', email, name: 'Proff Yusluv' };
        setUser(fetchedUser);
        console.log('[Auth] Login successful!');
        // router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err: any) {
      console.error('[Auth] Login failed:', err?.message);
      setError(err?.message || 'Login failed. Please try again.');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Auth] Attempting logout');
      // TODO: Replace this with real API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setUser(null);
      console.log('[Auth] Logout successful!');
      // router.push('/login');
    } catch (err: any) {
      console.error('[Auth] Logout failed:', err?.message);
      setError(err?.message || 'Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (userData: Omit<User, 'id'> & { password: string }): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        console.log('[Auth] Attempting registration for:', userData.email);
        // TODO: Replace with real API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const newUser: User = { id: `user-${Date.now()}`, email: userData.email, name: userData.name };
        setUser(newUser);
        console.log('[Auth] Registration successful!');
        // router.push('/dashboard');
      } catch (err: any) {
        console.error('[Auth] Registration failed:', err?.message);
        setError(err?.message || 'Registration failed. Please try again.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const checkUserSession = async (): Promise<void> => {
      setLoading(true);
      try {
        console.log('[Auth] Checking initial user session...');
        // TODO: Implement real session check logic (token/API call)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setUser(null); // Default no user logged in
        console.log('[Auth] Initial session check complete.');
      } catch (err: any) {
        console.error('[Auth] Error during initial session check:', err?.message);
        setError('Failed to load user session.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const value = React.useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      login,
      logout,
      register,
    }),
    [user, loading, error, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// --- 4. useAuth hook ---

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
