import { useMemo } from 'react';
import type { Player } from '../types/session';

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  badge: string;
  score: number;
  streak: number;
  rank: number;
}

interface UseLeaderboardOptions {
  players: Record<string, Player>;
  currentPlayerId?: string;
  topN?: number;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  currentPlayerRank: number | null;
  currentPlayerEntry: LeaderboardEntry | null;
  totalPlayers: number;
}

export function useLeaderboard({
  players,
  currentPlayerId,
  topN = 5,
}: UseLeaderboardOptions): UseLeaderboardReturn {
  const result = useMemo(() => {
    const entries = Object.entries(players)
      .map(([id, player]) => ({
        id,
        nickname: player.nickname,
        badge: player.badge,
        score: player.score,
        streak: player.streak,
        rank: 0,
      }))
      .sort((a, b) => b.score - a.score);

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const leaderboard = entries.slice(0, topN);
    const totalPlayers = entries.length;

    let currentPlayerRank: number | null = null;
    let currentPlayerEntry: LeaderboardEntry | null = null;

    if (currentPlayerId) {
      const found = entries.find((e) => e.id === currentPlayerId);
      if (found) {
        currentPlayerRank = found.rank;
        currentPlayerEntry = found;
      }
    }

    return { leaderboard, currentPlayerRank, currentPlayerEntry, totalPlayers };
  }, [players, currentPlayerId, topN]);

  return result;
}
