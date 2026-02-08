// import AuthGuard from './AuthGuard'; // TODO: restore auth
import React, { useState, useEffect, useCallback, useRef } from 'react';
import HostLiveControl from './HostLiveControl';
import { onSessionChange, setCurrentQuestion, updateSessionStatus, revealAnswer, clearCorrectOption } from '../firebase/realtime';
import { getQuiz } from '../firebase/firestore';
import type { Session, CurrentQuestion } from '../types/session';
import type { Quiz, QuizQuestion } from '../types/quiz';
import type { Lang } from '../i18n';

interface Props {
  sessionId?: string;
  lang: Lang;
}

/** Strip isCorrect from quiz options before pushing to RTDB (security).
 *  Firebase RTDB does not accept `undefined` values, so optional fields use null. */
function sanitizeQuestion(q: QuizQuestion): CurrentQuestion {
  const sanitized: CurrentQuestion = {
    id: q.id,
    label: q.label,
    options: q.options.map(({ id, text }) => ({ id, text })),
    timeLimit: q.timeLimit,
    startedAt: Date.now(),
  };
  if (q.media) {
    sanitized.media = { type: q.media.type, url: q.media.url };
  }
  return sanitized;
}

export default function HostLivePage({ sessionId: propSessionId, lang }: Props): React.JSX.Element {
  const [sessionId, setSessionId] = useState<string | null>(propSessionId ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string>('');

  // Read session ID from query string if not provided as prop
  useEffect(() => {
    if (!propSessionId) {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('session');
      if (id) {
        setSessionId(id);
      } else {
        setError(lang === 'fr' ? 'Aucune session spécifiée.' : 'No session specified.');
      }
    }
  }, [propSessionId, lang]);

  // Build join URL once we have a session ID
  useEffect(() => {
    if (sessionId) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      setJoinUrl(`${origin}/play/demo?session=${sessionId}`);
    }
  }, [sessionId]);

  // Subscribe to session updates from Realtime DB
  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = onSessionChange(sessionId, (s) => {
      if (s) {
        setSession(s);
      } else {
        setError(lang === 'fr' ? 'Session introuvable.' : 'Session not found.');
      }
    });
    return unsubscribe;
  }, [sessionId, lang]);

  // Fetch quiz data from Firestore when session is available
  useEffect(() => {
    if (!session?.quizId || quiz) return;
    setQuizLoading(true);
    getQuiz(session.quizId)
      .then((q) => {
        if (q) {
          setQuiz(q);
        } else {
          setError(lang === 'fr' ? 'Impossible de charger le quiz.' : 'Failed to load quiz.');
        }
      })
      .catch(() => {
        setError(lang === 'fr' ? 'Impossible de charger le quiz.' : 'Failed to load quiz.');
      })
      .finally(() => setQuizLoading(false));
  }, [session?.quizId, quiz, lang]);

  // Handler: Start the quiz (push first question)
  const handleStart = useCallback(async () => {
    if (!sessionId || !quiz) {
      console.error('[HostLive] handleStart: missing data', { sessionId, quizLoaded: !!quiz });
      return;
    }
    if (!quiz.questions || quiz.questions.length === 0) {
      console.error('[HostLive] handleStart: quiz has no questions', quiz);
      return;
    }
    try {
      const firstQuestion = quiz.questions[0];
      const sanitized = sanitizeQuestion(firstQuestion);
      await clearCorrectOption(sessionId);
      await setCurrentQuestion(sessionId, sanitized, 0);
    } catch (err) {
      console.error('[HostLive] handleStart failed:', err);
      setError(lang === 'fr' ? 'Erreur au démarrage du quiz.' : 'Failed to start quiz.');
    }
  }, [sessionId, quiz, lang]);

  // Handler: Next question
  const handleNext = useCallback(async () => {
    if (!sessionId || !session || !quiz) return;
    try {
      const nextIndex = session.currentQuestionIndex + 1;
      if (nextIndex < quiz.questions.length) {
        const nextQuestion = quiz.questions[nextIndex];
        const sanitized = sanitizeQuestion(nextQuestion);
        await clearCorrectOption(sessionId);
        await setCurrentQuestion(sessionId, sanitized, nextIndex);
      } else {
        // No more questions -> finished
        await updateSessionStatus(sessionId, 'finished');
      }
    } catch (err) {
      console.error('[HostLive] handleNext failed:', err);
    }
  }, [sessionId, session, quiz]);

  // Handler: Show results (reveal correct answer)
  const handleShowResults = useCallback(async () => {
    if (!sessionId || !session?.currentQuestion || !quiz) return;
    try {
      const currentQ = quiz.questions[session.currentQuestionIndex];
      if (!currentQ) return;
      const correctOption = currentQ.options.find((o) => o.isCorrect);
      if (correctOption) {
        await revealAnswer(sessionId, correctOption.id);
      }
    } catch (err) {
      console.error('[HostLive] handleShowResults failed:', err);
    }
  }, [sessionId, session, quiz]);

  // Handler: Show leaderboard
  const handleShowLeaderboard = useCallback(async () => {
    if (!sessionId) return;
    await updateSessionStatus(sessionId, 'leaderboard');
  }, [sessionId]);

  // ==========================================
  // Auto-advance: all players answered → reveal → leaderboard
  // ==========================================
  const autoAdvancedQuestionRef = useRef<string>('');

  useEffect(() => {
    if (!session || !sessionId || !quiz) return;
    if (!session.currentQuestion) return;

    const qId = session.currentQuestion.id;
    const pCount = session.players ? Object.keys(session.players).length : 0;
    const rCount = Object.keys(session.responses?.[qId] ?? {}).length;
    const allAnswered = pCount > 0 && rCount >= pCount;

    // Step 1: all answered during question → auto-reveal results
    if (session.status === 'question' && allAnswered && autoAdvancedQuestionRef.current !== qId) {
      autoAdvancedQuestionRef.current = qId;
      const currentQ = quiz.questions[session.currentQuestionIndex];
      if (currentQ) {
        const correctOption = currentQ.options.find((o) => o.isCorrect);
        if (correctOption) {
          revealAnswer(sessionId, correctOption.id).catch((err) =>
            console.error('[HostLive] auto-reveal failed:', err)
          );
        }
      }
    }

    // Step 2: feedback after auto-reveal → auto-show leaderboard after brief delay
    if (session.status === 'feedback' && autoAdvancedQuestionRef.current === qId) {
      const timer = setTimeout(() => {
        updateSessionStatus(sessionId, 'leaderboard').catch((err) =>
          console.error('[HostLive] auto-leaderboard failed:', err)
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, sessionId, quiz]);

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--color-alert-coral)' }}>{error}</p>
      </div>
    );
  }

  if (!sessionId || !session) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(37,99,235,0.2)', borderTopColor: 'var(--color-electric-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ opacity: 0.6 }}>{lang === 'fr' ? 'Chargement de la session...' : 'Loading session...'}</p>
      </div>
    );
  }

  if (quizLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(37,99,235,0.2)', borderTopColor: 'var(--color-electric-blue)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ opacity: 0.6 }}>{lang === 'fr' ? 'Chargement du quiz...' : 'Loading quiz...'}</p>
      </div>
    );
  }

  const playerCount = session.players ? Object.keys(session.players).length : 0;
  const responseCount = session.responses && session.currentQuestion
    ? Object.keys(session.responses[session.currentQuestion.id] ?? {}).length
    : 0;

  const isLastQuestion = session.currentQuestionIndex >= session.totalQuestions - 1;

  // TODO: restore <AuthGuard lang={lang}> wrapper
  return (
    <HostLiveControl
      sessionId={sessionId}
      status={session.status}
      currentQuestionIndex={session.currentQuestionIndex}
      totalQuestions={session.totalQuestions}
      playerCount={playerCount}
      responseCount={responseCount}
      lang={lang}
      joinUrl={joinUrl}
      timeLimit={session.currentQuestion?.timeLimit}
      startedAt={session.currentQuestion?.startedAt}
      isLastQuestion={isLastQuestion}
      currentQuestion={session.currentQuestion}
      correctOptionId={session.correctOptionId}
      players={session.players}
      onStart={handleStart}
      onNext={handleNext}
      onShowResults={handleShowResults}
      onShowLeaderboard={handleShowLeaderboard}
    />
  );
}
