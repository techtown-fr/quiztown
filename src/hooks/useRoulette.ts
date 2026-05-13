import { useEffect, useRef, useState } from 'react';

/**
 * Number of ticks before the wheel locks on the winner.
 * Tuned for ~3.5s total visual duration with a perceptible deceleration.
 */
const ROULETTE_TICKS = 22;
const ROULETTE_START_MS = 60;
const ROULETTE_END_MS = 320;

interface UseRouletteOptions {
  /** Names cycled during the spin. */
  names: string[];
  /** Index in `names` where the wheel must settle. `null` = idle. */
  winnerIndex: number | null;
  /** Bumps to (re)start a spin even if `winnerIndex` is unchanged. */
  spinKey: string | number | null;
  /** Fired once when the wheel settles on `winnerIndex`. */
  onSettle?: () => void;
}

interface UseRouletteResult {
  displayedName: string;
  isRolling: boolean;
}

/**
 * Decelerating roulette that lands deterministically on `winnerIndex`,
 * so the last name shown is guaranteed to match the recorded winner.
 *
 * Restart semantics: the spin re-runs whenever `spinKey` changes (and
 * is non-null with a valid `winnerIndex`); pass `null` to stop.
 */
export function useRoulette({
  names,
  winnerIndex,
  spinKey,
  onSettle,
}: UseRouletteOptions): UseRouletteResult {
  const [displayedIdx, setDisplayedIdx] = useState<number>(0);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest values without re-triggering the spin effect on every render.
  const namesRef = useRef(names);
  namesRef.current = names;
  const onSettleRef = useRef(onSettle);
  onSettleRef.current = onSettle;

  useEffect(() => {
    if (
      spinKey === null ||
      winnerIndex === null ||
      winnerIndex < 0 ||
      namesRef.current.length === 0
    ) {
      return;
    }

    setIsRolling(true);
    let tick = 0;
    const step = () => {
      tick++;
      const isLast = tick >= ROULETTE_TICKS;
      const len = namesRef.current.length;
      setDisplayedIdx(
        isLast ? winnerIndex : Math.floor(Math.random() * len)
      );
      if (isLast) {
        timeoutRef.current = null;
        setIsRolling(false);
        onSettleRef.current?.();
        return;
      }
      const progress = tick / ROULETTE_TICKS;
      const delay =
        ROULETTE_START_MS +
        (ROULETTE_END_MS - ROULETTE_START_MS) * progress;
      timeoutRef.current = setTimeout(step, delay);
    };
    timeoutRef.current = setTimeout(step, ROULETTE_START_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsRolling(false);
    };
  }, [spinKey, winnerIndex]);

  return {
    displayedName: names[displayedIdx] ?? '',
    isRolling,
  };
}
