import { useEffect, useState } from 'react';
import { onRaffleChange } from '../firebase/raffle';
import type { Raffle } from '../types/raffle';

interface UseRaffleReturn {
  raffle: Raffle | null;
  loading: boolean;
  error: string | null;
}

/**
 * Subscribe to a raffle in RTDB and expose its live state.
 * `error` is set when the raffle node disappears (deleted / never existed).
 */
export function useRaffle(raffleId: string | null): UseRaffleReturn {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(raffleId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raffleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsubscribe = onRaffleChange(raffleId, (data) => {
      setLoading(false);
      if (data) {
        setRaffle(data);
      } else {
        setRaffle(null);
        setError('not_found');
      }
    });
    return unsubscribe;
  }, [raffleId]);

  return { raffle, loading, error };
}
