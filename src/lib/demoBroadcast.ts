/**
 * BroadcastChannel-based sync for demo mode.
 * Allows /demo (player) and /demo/screen (projection) tabs to communicate.
 * Works between tabs in the same browser — no server needed.
 */

export const DEMO_CHANNEL_NAME = 'quiztown-demo';

/**
 * Host state broadcast — sent by the screen to all connected players
 * whenever the game state changes (phase, question, scores).
 */
export interface HostStatePayload {
  from: 'host';
  type: 'state';
  phase: 'lobby' | 'question' | 'results' | 'leaderboard' | 'finished';
  questionIndex: number;
  totalQuestions: number;
  question?: {
    label: string;
    options: Array<{ id: string; text: string }>;
    timeLimit: number;
  };
  timeStartedAt: number;
  playerCount: number;
  leaderboard: Array<{
    id: string;
    nickname: string;
    badge: string;
    score: number;
    streak: number;
  }>;
}

/** Personal feedback — sent by the host to a specific player after they answer */
export interface HostFeedbackPayload {
  from: 'host';
  type: 'feedback';
  playerId: string;
  isCorrect: boolean;
  xp: number;
  streak: number;
  rank: number;
  totalPlayers: number;
}

/** Host pong — reply to a player ping */
export interface HostPongPayload {
  from: 'host';
  type: 'pong';
}

/** Host confirms player joined */
export interface HostPlayerJoinedPayload {
  from: 'host';
  type: 'player-joined';
  playerId: string;
}

export type HostMessage =
  | HostStatePayload
  | HostFeedbackPayload
  | HostPongPayload
  | HostPlayerJoinedPayload;

/** Player ping — check if a host is running */
export interface PlayerPingPayload {
  from: 'player';
  type: 'ping';
}

/** Player join — request to join the game */
export interface PlayerJoinPayload {
  from: 'player';
  type: 'join';
  id: string;
  nickname: string;
  badge: string;
}

/** Player answer — submit an answer */
export interface PlayerAnswerPayload {
  from: 'player';
  type: 'answer';
  playerId: string;
  questionIndex: number;
  optionId: string;
  responseTimeMs: number;
}

export type PlayerMessage =
  | PlayerPingPayload
  | PlayerJoinPayload
  | PlayerAnswerPayload;

export type DemoMessage = HostMessage | PlayerMessage;
