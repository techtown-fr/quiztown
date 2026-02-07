/**
 * Calculate player score based on correctness and response speed.
 *
 * @param isCorrect - Whether the answer is correct
 * @param responseTimeMs - Time taken to respond in milliseconds
 * @param timeLimitMs - Total time limit in milliseconds
 * @param basePoints - Base points for a correct answer (default: 1000)
 * @returns Score between 0 and basePoints
 */
export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number,
  basePoints: number = 1000
): number {
  if (!isCorrect) return 0;
  if (timeLimitMs <= 0) return basePoints;

  // Faster responses get more points (linear scale)
  const timeRatio = Math.max(0, Math.min(1, 1 - responseTimeMs / timeLimitMs));
  const speedBonus = Math.round(timeRatio * basePoints * 0.5);

  return Math.round(basePoints * 0.5) + speedBonus;
}

/**
 * Session status state machine: validate transitions.
 */
export type SessionStatus = 'lobby' | 'question' | 'feedback' | 'leaderboard' | 'finished';

const VALID_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  lobby: ['question', 'finished'],
  question: ['feedback', 'leaderboard', 'finished'],
  feedback: ['leaderboard', 'question', 'finished'],
  leaderboard: ['question', 'finished'],
  finished: [],
};

export function isValidTransition(from: SessionStatus, to: SessionStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStatus(current: SessionStatus, hasMoreQuestions: boolean): SessionStatus {
  if (current === 'lobby') return 'question';
  if (current === 'question') return 'feedback';
  if (current === 'feedback') return 'leaderboard';
  if (current === 'leaderboard') return hasMoreQuestions ? 'question' : 'finished';
  return 'finished';
}
