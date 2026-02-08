import {
  ref,
  set,
  update,
  remove,
  onValue,
  push,
  type DatabaseReference,
} from 'firebase/database';
import { getFirebaseDatabase } from './config';
import type { Session, SessionStatus, Player, PlayerResponse, CurrentQuestion } from '../types/session';

// ==========================================
// Session management
// ==========================================

export function getSessionRef(sessionId: string): DatabaseReference {
  return ref(getFirebaseDatabase(), `sessions/${sessionId}`);
}

export async function createSession(
  quizId: string,
  hostId: string,
  totalQuestions: number
): Promise<string> {
  const db = getFirebaseDatabase();
  const sessionsRef = ref(db, 'sessions');
  const newSessionRef = push(sessionsRef);
  const sessionId = newSessionRef.key!;

  const session: Omit<Session, 'id'> = {
    quizId,
    status: 'lobby',
    currentQuestion: null,
    currentQuestionIndex: -1,
    totalQuestions,
    players: {},
    responses: {},
    createdAt: Date.now(),
    hostId,
  };

  await set(newSessionRef, session);
  return sessionId;
}

export async function updateSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
  const sessionRef = getSessionRef(sessionId);
  await update(sessionRef, { status });
}

export async function setCurrentQuestion(
  sessionId: string,
  question: CurrentQuestion,
  questionIndex: number
): Promise<void> {
  const sessionRef = getSessionRef(sessionId);
  await update(sessionRef, {
    currentQuestion: question,
    currentQuestionIndex: questionIndex,
    status: 'question' as SessionStatus,
  });
}

// ==========================================
// Player management
// ==========================================

export async function joinSession(
  sessionId: string,
  player: Player
): Promise<void> {
  const playerRef = ref(getFirebaseDatabase(), `sessions/${sessionId}/players/${player.id}`);
  await set(playerRef, player);
}

export async function leaveSession(sessionId: string, playerId: string): Promise<void> {
  const playerRef = ref(getFirebaseDatabase(), `sessions/${sessionId}/players/${playerId}`);
  await remove(playerRef);
}

export async function updatePlayerScore(
  sessionId: string,
  playerId: string,
  score: number,
  streak: number
): Promise<void> {
  const playerRef = ref(getFirebaseDatabase(), `sessions/${sessionId}/players/${playerId}`);
  await update(playerRef, { score, streak });
}

// ==========================================
// Response management
// ==========================================

export async function submitResponse(
  sessionId: string,
  questionId: string,
  playerId: string,
  response: PlayerResponse
): Promise<void> {
  const responseRef = ref(
    getFirebaseDatabase(),
    `sessions/${sessionId}/responses/${questionId}/${playerId}`
  );
  await set(responseRef, response);
}

// ==========================================
// Answer reveal
// ==========================================

export async function revealAnswer(sessionId: string, correctOptionId: string): Promise<void> {
  const sessionRef = getSessionRef(sessionId);
  await update(sessionRef, { correctOptionId, status: 'feedback' as SessionStatus });
}

export async function clearCorrectOption(sessionId: string): Promise<void> {
  const sessionRef = getSessionRef(sessionId);
  await update(sessionRef, { correctOptionId: null });
}

// ==========================================
// Listeners
// ==========================================

export function onSessionChange(
  sessionId: string,
  callback: (session: Session | null) => void
): () => void {
  const sessionRef = getSessionRef(sessionId);
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({ id: sessionId, ...data } as Session);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
}

export function onPlayersChange(
  sessionId: string,
  callback: (players: Record<string, Player>) => void
): () => void {
  const playersRef = ref(getFirebaseDatabase(), `sessions/${sessionId}/players`);
  const unsubscribe = onValue(playersRef, (snapshot) => {
    callback(snapshot.val() ?? {});
  });
  return unsubscribe;
}

// ==========================================
// Scoring
// ==========================================

export function calculateScore(
  isCorrect: boolean,
  responseTimeMs: number,
  timeLimitMs: number,
  basePoints: number = 1000
): number {
  if (!isCorrect) return 0;

  // Faster responses get more points (linear scale)
  const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  const speedBonus = Math.round(timeRatio * basePoints * 0.5);

  return Math.round(basePoints * 0.5) + speedBonus;
}
