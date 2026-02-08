import React, { useState, useEffect, useCallback, useRef } from 'react';
import JoinForm from './JoinForm';
import WaitingRoom from './WaitingRoom';
import PlayerBuzzer from './PlayerBuzzer';
import FeedbackScreen from './FeedbackScreen';
import Leaderboard from './Leaderboard';
import { onSessionChange, joinSession, submitResponse, calculateScore, updatePlayerScore } from '../firebase/realtime';
import type { Session, Player, BadgeId } from '../types/session';
import type { Lang } from '../i18n';

type PlayerPhase = 'join' | 'waiting' | 'question' | 'answered' | 'feedback' | 'leaderboard' | 'finished';

interface Props {
  lang: Lang;
}

const labels = {
  fr: {
    noSession: 'Aucune session trouvée.',
    loading: 'Connexion à la session...',
    sessionError: 'Session introuvable.',
    answerLocked: 'Vote verrouillé ! En attente des résultats...',
    timeUp: 'Temps écoulé !',
    waiting: 'Prochaine question...',
    finishedTitle: 'Quiz terminé !',
    finishedSubtitle: 'Merci d\'avoir joué !',
    yourScore: 'Ton score',
    backHome: 'Retour accueil',
    questionOf: 'Question {current} / {total}',
  },
  en: {
    noSession: 'No session found.',
    loading: 'Connecting to session...',
    sessionError: 'Session not found.',
    answerLocked: 'Vote locked! Waiting for results...',
    timeUp: 'Time\'s up!',
    waiting: 'Next question...',
    finishedTitle: 'Quiz finished!',
    finishedSubtitle: 'Thanks for playing!',
    yourScore: 'Your score',
    backHome: 'Back to home',
    questionOf: 'Question {current} / {total}',
  },
};

/**
 * PlayerSession -- Firebase-based player session orchestrator.
 *
 * Manages the full player lifecycle: join -> waiting -> question -> feedback -> leaderboard -> finished.
 * Reads session ID from URL query param (?session=xxx) or path segment (/play/xxx).
 * Listens to Firebase RTDB for host-driven state changes.
 */
export default function PlayerSession({ lang }: Props): React.JSX.Element {
  const t = labels[lang];

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [phase, setPhase] = useState<PlayerPhase>('join');
  const [playerId] = useState(() => `player-${Math.random().toString(36).slice(2, 10)}`);
  const [playerData, setPlayerData] = useState<Player | null>(null);

  // Track which question index we answered
  const [answeredQIdx, setAnsweredQIdx] = useState(-1);
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    xp: number;
    streak: number;
    rank: number;
    totalPlayers: number;
  } | null>(null);

  // Refs for latest values in callbacks
  const sessionRef = useRef<Session | null>(null);
  const playerDataRef = useRef<Player | null>(null);
  sessionRef.current = session;
  playerDataRef.current = playerData;

  // Track the previous session status + question index to detect transitions
  const prevStatusRef = useRef<string>('');
  const prevQIdxRef = useRef<number>(-1);

  // Track which question index we already computed feedback for (prevent infinite re-computation)
  const feedbackComputedForRef = useRef<number>(-1);

  // ==========================================
  // 1. Read session ID from URL
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('session');
    if (fromQuery) {
      setSessionId(fromQuery);
      return;
    }

    // Fallback: read from path /play/{sessionId}
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const playIdx = pathParts.indexOf('play');
    if (playIdx !== -1 && pathParts[playIdx + 1] && pathParts[playIdx + 1] !== 'demo') {
      setSessionId(pathParts[playIdx + 1]);
      return;
    }

    setError(t.noSession);
  }, [t.noSession]);

  // ==========================================
  // 2. Subscribe to session updates from RTDB
  // ==========================================
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = onSessionChange(sessionId, (s) => {
      if (s) {
        setSession(s);
      } else {
        setError(t.sessionError);
      }
    });
    return unsubscribe;
  }, [sessionId, t.sessionError]);

  // ==========================================
  // 3. React to session state changes (host-driven)
  // ==========================================
  useEffect(() => {
    if (!session || phase === 'join') return;

    const statusChanged = session.status !== prevStatusRef.current;
    const questionChanged = session.currentQuestionIndex !== prevQIdxRef.current;

    prevStatusRef.current = session.status;
    prevQIdxRef.current = session.currentQuestionIndex;

    // Session finished
    if (session.status === 'finished') {
      setPhase('finished');
      return;
    }

    // Leaderboard
    if (session.status === 'leaderboard') {
      setPhase('leaderboard');
      return;
    }

    // New question arrived
    if (session.status === 'question' && session.currentQuestion) {
      if (questionChanged || statusChanged) {
        // Reset for new question
        if (answeredQIdx !== session.currentQuestionIndex) {
          setPhase('question');
          setLastFeedback(null);
          feedbackComputedForRef.current = -1;
        }
      }
      return;
    }

    // Feedback (host revealed answer)
    if (session.status === 'feedback' && session.correctOptionId) {
      // Guard: only compute feedback once per question to avoid infinite streak increment
      if (feedbackComputedForRef.current === session.currentQuestionIndex) {
        return;
      }

      if (answeredQIdx === session.currentQuestionIndex && playerDataRef.current) {
        feedbackComputedForRef.current = session.currentQuestionIndex;
        // Compute feedback from the correct answer
        const myResponse = session.responses?.[session.currentQuestion?.id ?? '']?.[playerId];
        const isCorrect = myResponse?.optionId === session.correctOptionId;
        const responseTimeMs = myResponse ? myResponse.timestamp - (session.currentQuestion?.startedAt ?? 0) : 0;
        const xp = calculateScore(isCorrect, responseTimeMs, (session.currentQuestion?.timeLimit ?? 20) * 1000);

        // Update local player score + persist to RTDB
        const newStreak = isCorrect ? (playerDataRef.current.streak + 1) : 0;
        const updatedPlayer: Player = {
          ...playerDataRef.current,
          score: playerDataRef.current.score + xp,
          streak: newStreak,
        };
        setPlayerData(updatedPlayer);

        // Write score to Firebase so host leaderboard reflects it
        if (sessionId) {
          updatePlayerScore(sessionId, playerId, updatedPlayer.score, updatedPlayer.streak).catch(() => {
            // Score sync failed -- local state still correct for player
          });
        }

        // Compute rank
        const allScores = Object.values(session.players ?? {}).map((p) => {
          if (p.id === playerId) return updatedPlayer.score;
          return p.score;
        }).sort((a, b) => b - a);
        const rank = allScores.indexOf(updatedPlayer.score) + 1;

        setLastFeedback({
          isCorrect,
          xp,
          streak: newStreak,
          rank,
          totalPlayers: Object.keys(session.players ?? {}).length,
        });
        setPhase('feedback');
      } else {
        feedbackComputedForRef.current = session.currentQuestionIndex;
        // Player didn't answer -- show time's up feedback
        setLastFeedback({
          isCorrect: false,
          xp: 0,
          streak: 0,
          rank: 0,
          totalPlayers: Object.keys(session.players ?? {}).length,
        });
        setPhase('feedback');
      }
      return;
    }

    // Still in lobby
    if (session.status === 'lobby') {
      setPhase('waiting');
    }
  }, [session, phase, answeredQIdx, playerId]);

  // ==========================================
  // Handlers
  // ==========================================

  const handleJoin = useCallback(async (nickname: string, badge: BadgeId) => {
    if (!sessionId) return;

    const player: Player = {
      id: playerId,
      nickname,
      badge,
      score: 0,
      streak: 0,
      connected: true,
    };

    setPlayerData(player);
    setPhase('waiting');

    try {
      await joinSession(sessionId, player);
    } catch {
      setError(lang === 'fr' ? 'Impossible de rejoindre la session.' : 'Failed to join session.');
    }
  }, [sessionId, playerId, lang]);

  const handleAnswer = useCallback(async (optionId: string) => {
    if (!sessionId || !session?.currentQuestion) return;

    const timestamp = Date.now();
    setAnsweredQIdx(session.currentQuestionIndex);
    setPhase('answered');

    try {
      await submitResponse(sessionId, session.currentQuestion.id, playerId, {
        optionId,
        timestamp,
      });
    } catch {
      // Response submission failed -- player sees "locked" state anyway
    }
  }, [sessionId, session, playerId]);

  const handleTimeUp = useCallback(() => {
    if (!session) return;
    setAnsweredQIdx(session.currentQuestionIndex);
    setPhase('answered');
  }, [session]);

  // ==========================================
  // Render
  // ==========================================

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
        padding: '2rem', textAlign: 'center',
      }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-alert-coral)' }}>{error}</p>
      </div>
    );
  }

  // Loading state (waiting for session data)
  if (!sessionId || (!session && phase === 'join')) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
      }}>
        <div style={{
          width: 48, height: 48, border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: 'var(--color-electric-blue)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', marginBottom: '1rem',
        }} />
        <p style={{ opacity: 0.5, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
          {t.loading}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // JOIN
  if (phase === 'join') {
    return (
      <JoinForm
        sessionId={sessionId}
        lang={lang}
        onJoin={handleJoin}
      />
    );
  }

  // WAITING (lobby)
  if (phase === 'waiting') {
    const playerCount = session?.players ? Object.keys(session.players).length : 0;
    return <WaitingRoom playerCount={playerCount} lang={lang} />;
  }

  // QUESTION
  if (phase === 'question' && session?.currentQuestion) {
    // Calculate adjusted time limit for mid-question join
    const elapsed = (Date.now() - session.currentQuestion.startedAt) / 1000;
    const adjustedTimeLimit = Math.max(1, Math.round(session.currentQuestion.timeLimit - elapsed));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem',
          textAlign: 'center', fontFamily: 'var(--font-display)',
          fontSize: '0.85rem', color: 'var(--color-soft-white)',
          opacity: 0.7, flexShrink: 0,
        }}>
          {t.questionOf
            .replace('{current}', String(session.currentQuestionIndex + 1))
            .replace('{total}', String(session.totalQuestions))}
        </div>
        <div style={{ flex: 1 }}>
          <PlayerBuzzer
            key={`q-${session.currentQuestionIndex}`}
            question={session.currentQuestion.label}
            options={session.currentQuestion.options}
            timeLimit={adjustedTimeLimit}
            lang={lang}
            onAnswer={handleAnswer}
            onTimeUp={handleTimeUp}
          />
        </div>
      </div>
    );
  }

  // ANSWERED (waiting for host to reveal)
  if (phase === 'answered') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--color-electric-blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', marginBottom: '1rem',
        }}>✓</div>
        <p style={{ opacity: 0.6, fontFamily: 'var(--font-body)' }}>{t.answerLocked}</p>
      </div>
    );
  }

  // FEEDBACK
  if (phase === 'feedback' && lastFeedback) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <FeedbackScreen
          isCorrect={lastFeedback.isCorrect}
          xpEarned={lastFeedback.xp}
          streak={lastFeedback.streak}
          rank={lastFeedback.rank}
          totalPlayers={lastFeedback.totalPlayers}
          lang={lang}
        />
      </div>
    );
  }

  // Merge local player data into session players so the leaderboard
  // reflects the latest score even if RTDB write hasn't round-tripped yet
  const mergedPlayers: Record<string, Player> = { ...(session?.players ?? {}) };
  if (playerData && playerId) {
    mergedPlayers[playerId] = playerData;
  }

  // LEADERBOARD
  if (phase === 'leaderboard' && session) {
    return (
      <div style={{ minHeight: '100dvh' }}>
        <Leaderboard
          players={mergedPlayers}
          currentPlayerId={playerId}
          lang={lang}
        />
      </div>
    );
  }

  // FINISHED
  if (phase === 'finished') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
        padding: '2rem', textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-mint-pop))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: '0 0 1rem',
        }}>
          {t.finishedTitle}
        </h1>
        <p style={{ opacity: 0.5, margin: '0 0 2rem' }}>{t.finishedSubtitle}</p>

        {playerData && (
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '2rem' }}>
            {t.yourScore}: <strong style={{ color: 'var(--color-mint-pop)' }}>{playerData.score} XP</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              padding: '0.85rem 1.75rem', background: 'var(--color-electric-blue)',
              color: 'white', border: 'none', borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {t.backHome}
          </button>
        </div>
      </div>
    );
  }

  // Fallback: waiting
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
    }}>
      <p style={{ opacity: 0.5 }}>{t.waiting}</p>
    </div>
  );
}
