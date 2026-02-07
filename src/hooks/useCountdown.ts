import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCountdownOptions {
  duration: number; // seconds
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  timeLeft: number;
  progress: number; // 0 to 1 (1 = full, 0 = expired)
  isRunning: boolean;
  isExpired: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export function useCountdown({
  duration,
  onComplete,
  autoStart = false,
}: UseCountdownOptions): UseCountdownReturn {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(duration);
    setIsRunning(false);
  }, [duration, clearTimer]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer]);

  // Reset when duration changes
  useEffect(() => {
    setTimeLeft(duration);
    if (autoStart) {
      setIsRunning(true);
    }
  }, [duration, autoStart]);

  const progress = duration > 0 ? timeLeft / duration : 0;
  const isExpired = timeLeft <= 0;

  return { timeLeft, progress, isRunning, isExpired, start, pause, reset };
}
