import { useEffect, useState } from 'react';
import { onHostRafflesChange } from '../firebase/raffle';
import type { Raffle } from '../types/raffle';

interface UseHostRafflesReturn {
  raffles: Raffle[];
  loading: boolean;
}

/**
 * Subscribe to the host's recent raffles. Pass `null` to disable the
 * subscription (e.g. while the user is already inside a raffle).
 */
export function useHostRaffles(hostId: string | null, limit = 10): UseHostRafflesReturn {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(hostId));

  useEffect(() => {
    if (!hostId) {
      setRaffles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onHostRafflesChange(hostId, (list) => {
      setRaffles(list);
      setLoading(false);
    }, limit);
    return unsubscribe;
  }, [hostId, limit]);

  return { raffles, loading };
}
