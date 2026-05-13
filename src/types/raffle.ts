export type RaffleStatus = 'lobby' | 'drawing' | 'reveal' | 'finished';

export interface RaffleParticipant {
  id: string;
  name: string;
  joinedAt: number;
}

export interface RafflePrize {
  id: string;
  label: string;
  winnerId: string | null;
  winnerName: string | null;
}

export interface Raffle {
  id: string;
  hostId: string;
  status: RaffleStatus;
  participants: Record<string, RaffleParticipant>;
  prizes: RafflePrize[];
  currentDrawIndex: number;
  currentWinner: string | null;
  createdAt: number;
}
