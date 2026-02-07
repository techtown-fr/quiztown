import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../src/hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with correct values', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 20 })
    );

    expect(result.current.timeLeft).toBe(20);
    expect(result.current.progress).toBe(1);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isExpired).toBe(false);
  });

  it('starts countdown when start is called', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 20 })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(19);
  });

  it('auto-starts when autoStart is true', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 10, autoStart: true })
    );

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.timeLeft).toBe(7);
  });

  it('pauses countdown', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 20, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(15);

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be 15 after pause
    expect(result.current.timeLeft).toBe(15);
    expect(result.current.isRunning).toBe(false);
  });

  it('resets countdown', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 20, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(15);

    act(() => {
      result.current.reset();
    });

    expect(result.current.timeLeft).toBe(20);
    expect(result.current.isRunning).toBe(false);
  });

  it('calls onComplete when timer expires', () => {
    const onComplete = vi.fn();
    renderHook(() =>
      useCountdown({ duration: 3, autoStart: true, onComplete })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('stops running when expired', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 2, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isRunning).toBe(false);
  });

  it('calculates progress correctly', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 10, autoStart: true })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.progress).toBe(0.5);
  });
});
