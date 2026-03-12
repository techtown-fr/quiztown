import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, signOut, UnauthorizedDomainError } from '../firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorType: 'domain' | 'generic' | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    errorType: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setState({ user, loading: false, error: null, errorType: null });
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null, errorType: null }));
      await signInWithGoogle();
    } catch (err) {
      const isDomain = err instanceof UnauthorizedDomainError;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Login failed',
        errorType: isDomain ? 'domain' : 'generic',
      }));
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Logout failed',
      }));
    }
  };

  return { ...state, login, logout };
}
