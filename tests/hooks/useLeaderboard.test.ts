import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLeaderboard } from '../../src/hooks/useLeaderboard';
import type { Player } from '../../src/types/session';

const createPlayer = (id: string, score: number, nickname?: string): Player => ({
  id,
  nickname: nickname ?? `Player_${id}`,
  badge: 'rocket',
  score,
  streak: 0,
  connected: true,
});

describe('useLeaderboard', () => {
  it('returns empty leaderboard for no players', () => {
    const { result } = renderHook(() =>
      useLeaderboard({ players: {} })
    );

    expect(result.current.leaderboard).toHaveLength(0);
    expect(result.current.totalPlayers).toBe(0);
  });

  it('sorts players by score descending', () => {
    const players: Record<string, Player> = {
      a: createPlayer('a', 300),
      b: createPlayer('b', 500),
      c: createPlayer('c', 100),
    };

    const { result } = renderHook(() =>
      useLeaderboard({ players })
    );

    expect(result.current.leaderboard[0].id).toBe('b');
    expect(result.current.leaderboard[1].id).toBe('a');
    expect(result.current.leaderboard[2].id).toBe('c');
  });

  it('assigns correct ranks', () => {
    const players: Record<string, Player> = {
      a: createPlayer('a', 300),
      b: createPlayer('b', 500),
      c: createPlayer('c', 100),
    };

    const { result } = renderHook(() =>
      useLeaderboard({ players })
    );

    expect(result.current.leaderboard[0].rank).toBe(1);
    expect(result.current.leaderboard[1].rank).toBe(2);
    expect(result.current.leaderboard[2].rank).toBe(3);
  });

  it('limits to topN players', () => {
    const players: Record<string, Player> = {};
    for (let i = 0; i < 10; i++) {
      players[`p${i}`] = createPlayer(`p${i}`, i * 100);
    }

    const { result } = renderHook(() =>
      useLeaderboard({ players, topN: 3 })
    );

    expect(result.current.leaderboard).toHaveLength(3);
    expect(result.current.totalPlayers).toBe(10);
  });

  it('finds current player rank', () => {
    const players: Record<string, Player> = {
      a: createPlayer('a', 500),
      b: createPlayer('b', 300),
      me: createPlayer('me', 100),
    };

    const { result } = renderHook(() =>
      useLeaderboard({ players, currentPlayerId: 'me' })
    );

    expect(result.current.currentPlayerRank).toBe(3);
    expect(result.current.currentPlayerEntry?.nickname).toBe('Player_me');
  });

  it('returns null rank for missing player', () => {
    const players: Record<string, Player> = {
      a: createPlayer('a', 500),
    };

    const { result } = renderHook(() =>
      useLeaderboard({ players, currentPlayerId: 'unknown' })
    );

    expect(result.current.currentPlayerRank).toBeNull();
    expect(result.current.currentPlayerEntry).toBeNull();
  });

  it('defaults topN to 5', () => {
    const players: Record<string, Player> = {};
    for (let i = 0; i < 10; i++) {
      players[`p${i}`] = createPlayer(`p${i}`, i * 100);
    }

    const { result } = renderHook(() =>
      useLeaderboard({ players })
    );

    expect(result.current.leaderboard).toHaveLength(5);
  });
});
