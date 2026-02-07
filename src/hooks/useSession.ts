import { useState, useEffect } from 'react';
import { onSessionChange } from '../firebase/realtime';
import type { Session } from '../types/session';

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export function useSession(sessionId: string | null): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const unsubscribe = onSessionChange(sessionId, (data) => {
        setSession(data);
        setLoading(false);
      });

      return unsubscribe;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setLoading(false);
    }
  }, [sessionId]);

  return { session, loading, error };
}
