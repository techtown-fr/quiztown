export type SessionStatus = 'lobby' | 'question' | 'feedback' | 'leaderboard' | 'finished';

export type BadgeId = 'rocket' | 'star' | 'lightning' | 'fire' | 'brain' | 'heart';

export interface Player {
  id: string;
  nickname: string;
  badge: BadgeId;
  score: number;
  streak: number;
  connected: boolean;
}

export interface PlayerResponse {
  optionId: string;
  timestamp: number;
  device?: string;
}

export interface CurrentQuestion {
  id: string;
  label: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  timeLimit: number;
  startedAt: number;
}

export interface Session {
  id: string;
  quizId: string;
  status: SessionStatus;
  currentQuestion: CurrentQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  players: Record<string, Player>;
  responses: Record<string, Record<string, PlayerResponse>>;
  createdAt: number;
  hostId: string;
}

export interface SessionConfig {
  showLeaderboard: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay: number; // seconds
}
