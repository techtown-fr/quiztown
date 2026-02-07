import React, { useState, useCallback, useEffect, useRef } from 'react';
import WaitingRoom from './WaitingRoom';
import PlayerBuzzer from './PlayerBuzzer';
import FeedbackScreen from './FeedbackScreen';
import Leaderboard from './Leaderboard';
import type { Player, BadgeId } from '../types/session';
import type { QuizQuestion } from '../types/quiz';
import { DEMO_QUIZ, DEMO_BOTS, getCorrectOptionId, simulateBotAnswer } from '../lib/demoData';
import { DEMO_CHANNEL_NAME } from '../lib/demoBroadcast';
import type { HostStatePayload } from '../lib/demoBroadcast';

const BADGES: { id: BadgeId; emoji: string }[] = [
  { id: 'rocket', emoji: '🚀' },
  { id: 'star', emoji: '⭐' },
  { id: 'lightning', emoji: '⚡' },
  { id: 'fire', emoji: '🔥' },
  { id: 'brain', emoji: '🧠' },
  { id: 'heart', emoji: '❤️' },
];

type DemoPhase = 'join' | 'waiting' | 'question' | 'feedback' | 'leaderboard' | 'finished';

interface Props {
  lang: 'fr' | 'en';
}

const labels = {
  fr: {
    demoBanner: 'Mode Demo -- Aucune connexion Firebase requise',
    connectedBanner: 'Connecté à l\'écran de projection',
    quizTitle: 'Tech Culture Quiz',
    questionOf: 'Question {current} / {total}',
    nextQuestion: 'Question suivante',
    seeLeaderboard: 'Voir le classement',
    playAgain: 'Rejouer',
    backHome: 'Retour accueil',
    finalTitle: 'Quiz terminé !',
    finalSubtitle: 'Merci d\'avoir joué !',
    yourScore: 'Ton score',
    autoStart: 'Le quiz démarre automatiquement...',
    detecting: 'Recherche de l\'écran...',
    answerSubmitted: 'Vote verrouillé ! En attente des résultats...',
    waitingForQuestion: 'Prochaine question...',
  },
  en: {
    demoBanner: 'Demo Mode -- No Firebase connection required',
    connectedBanner: 'Connected to projection screen',
    quizTitle: 'Tech Culture Quiz',
    questionOf: 'Question {current} / {total}',
    nextQuestion: 'Next question',
    seeLeaderboard: 'See leaderboard',
    playAgain: 'Play again',
    backHome: 'Back to home',
    finalTitle: 'Quiz finished!',
    finalSubtitle: 'Thanks for playing!',
    yourScore: 'Your score',
    autoStart: 'Quiz starts automatically...',
    detecting: 'Looking for screen...',
    answerSubmitted: 'Vote locked! Waiting for results...',
    waitingForQuestion: 'Next question...',
  },
};

/** Calculate score: faster = more points */
function calcScore(isCorrect: boolean, responseTimeMs: number, timeLimitMs: number): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  return Math.round(500 + timeRatio * 500);
}

/* ============================================================
 * Main component — detects host and picks connected vs solo mode
 * ============================================================ */

export default function DemoSession({ lang }: Props) {
  const [mode, setMode] = useState<'detecting' | 'solo' | 'connected'>('detecting');

  useEffect(() => {
    const channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
    let detected = false;

    channel.onmessage = (e: MessageEvent) => {
      if (e.data?.from === 'host' && (e.data?.type === 'pong' || e.data?.type === 'state')) {
        if (!detected) {
          detected = true;
          setMode('connected');
        }
      }
    };

    // Ping to check if a host (/demo/screen) is running
    channel.postMessage({ from: 'player', type: 'ping' });

    // If no response within 600ms → solo mode
    const timeout = setTimeout(() => {
      if (!detected) setMode('solo');
    }, 600);

    return () => {
      clearTimeout(timeout);
      channel.close();
    };
  }, []);

  if (mode === 'detecting') {
    return <DetectingScreen lang={lang} />;
  }

  if (mode === 'connected') {
    return <ConnectedDemoSession lang={lang} />;
  }

  return <SoloDemoSession lang={lang} />;
}

/* ============================================================
 * Detecting screen — brief loading while checking for host
 * ============================================================ */

function DetectingScreen({ lang }: Props) {
  const t = labels[lang];
  return (
    <div style={{
      height: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
    }}>
      <div style={{
        width: 48, height: 48,
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: 'var(--color-electric-blue)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: '1rem',
      }} />
      <p style={{ opacity: 0.5, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
        {t.detecting}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ============================================================
 * Connected mode — syncs with host via BroadcastChannel
 * ============================================================ */

function ConnectedDemoSession({ lang }: Props) {
  const t = labels[lang];

  // Channel
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Player identity
  const [playerId] = useState(() => `player-${Math.random().toString(36).slice(2, 8)}`);
  const playerIdRef = useRef('');
  playerIdRef.current = playerId;

  const [joined, setJoined] = useState(false);

  // Host state
  const [hostState, setHostState] = useState<HostStatePayload | null>(null);

  // Feedback from host
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean; xp: number; streak: number; rank: number; totalPlayers: number;
  } | null>(null);

  // Track which question index we answered
  const [answeredQIdx, setAnsweredQIdx] = useState(-1);

  // Set up BroadcastChannel
  useEffect(() => {
    const channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.from !== 'host') return;

      switch (msg.type) {
        case 'state':
          setHostState(msg as HostStatePayload);
          break;
        case 'feedback':
          if (msg.playerId === playerIdRef.current) {
            setFeedback({
              isCorrect: msg.isCorrect,
              xp: msg.xp,
              streak: msg.streak,
              rank: msg.rank,
              totalPlayers: msg.totalPlayers,
            });
          }
          break;
        case 'player-joined':
          if (msg.playerId === playerIdRef.current) {
            setJoined(true);
          }
          break;
      }
    };

    return () => { channel.close(); };
  }, []);

  // Reset feedback when question changes
  const prevQIdxRef = useRef(-1);
  useEffect(() => {
    if (hostState && hostState.questionIndex !== prevQIdxRef.current) {
      prevQIdxRef.current = hostState.questionIndex;
      setFeedback(null);
    }
  }, [hostState?.questionIndex]);

  // Join handler
  const handleJoin = useCallback((nickname: string, badge: BadgeId) => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        from: 'player', type: 'join',
        id: playerId, nickname, badge,
      });
    }
    setJoined(true); // optimistic
  }, [playerId]);

  // Answer handler
  const handleAnswer = useCallback((optionId: string) => {
    if (!hostState) return;
    const responseTimeMs = Date.now() - (hostState.timeStartedAt ?? Date.now());
    setAnsweredQIdx(hostState.questionIndex);

    if (channelRef.current) {
      channelRef.current.postMessage({
        from: 'player', type: 'answer',
        playerId, questionIndex: hostState.questionIndex,
        optionId, responseTimeMs,
      });
    }
  }, [playerId, hostState]);

  // Time up handler (player didn't answer in time)
  const handleTimeUp = useCallback(() => {
    if (!hostState) return;
    setAnsweredQIdx(hostState.questionIndex);
    // No answer sent — host gives 0 points
  }, [hostState]);

  const currentPhase = hostState?.phase ?? 'lobby';

  // Build players dict for Leaderboard component
  const allPlayers: Record<string, Player> = {};
  if (hostState?.leaderboard) {
    hostState.leaderboard.forEach(p => {
      allPlayers[p.id] = {
        id: p.id, nickname: p.nickname,
        badge: (p.badge as BadgeId) ?? 'rocket',
        score: p.score, streak: p.streak, connected: true,
      };
    });
  }

  // Calculate adjusted time limit for mid-question join
  const adjustedTimeLimit = hostState?.question
    ? Math.max(1, hostState.question.timeLimit - (Date.now() - (hostState.timeStartedAt ?? Date.now())) / 1000)
    : 20;

  // Has the player answered the current question?
  const hasAnsweredCurrent = hostState ? answeredQIdx === hostState.questionIndex : false;

  // ----- JOIN FORM -----
  if (!joined) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DemoBanner text={t.connectedBanner} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DemoJoinForm lang={lang} onJoin={handleJoin} />
        </div>
      </div>
    );
  }

  // ----- CONNECTED GAME -----
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DemoBanner text={t.connectedBanner} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* LOBBY */}
        {currentPhase === 'lobby' && (
          <WaitingRoom
            playerCount={hostState?.playerCount ?? 0}
            lang={lang}
            hostMessage={t.autoStart}
          />
        )}

        {/* QUESTION — show buzzer if not yet answered */}
        {currentPhase === 'question' && hostState?.question && !hasAnsweredCurrent && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem',
              textAlign: 'center', fontFamily: 'var(--font-display)',
              fontSize: '0.85rem', color: 'var(--color-soft-white)',
              opacity: 0.7, flexShrink: 0,
            }}>
              {t.questionOf
                .replace('{current}', String(hostState.questionIndex + 1))
                .replace('{total}', String(hostState.totalQuestions))}
            </div>
            <div style={{ flex: 1 }}>
              <PlayerBuzzer
                key={`q-${hostState.questionIndex}`}
                question={hostState.question.label}
                options={hostState.question.options}
                timeLimit={adjustedTimeLimit}
                lang={lang}
                onAnswer={handleAnswer}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>
        )}

        {/* ANSWERED — waiting for feedback or showing feedback */}
        {currentPhase === 'question' && hasAnsweredCurrent && feedback && (
          <div style={{ flex: 1 }}>
            <FeedbackScreen
              isCorrect={feedback.isCorrect}
              xpEarned={feedback.xp}
              streak={feedback.streak}
              rank={feedback.rank}
              totalPlayers={feedback.totalPlayers}
              lang={lang}
            />
          </div>
        )}

        {/* ANSWERED — no feedback yet */}
        {currentPhase === 'question' && hasAnsweredCurrent && !feedback && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--color-electric-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', marginBottom: '1rem',
            }}>✓</div>
            <p style={{ opacity: 0.6, fontFamily: 'var(--font-body)' }}>{t.answerSubmitted}</p>
          </div>
        )}

        {/* RESULTS — show feedback if available */}
        {currentPhase === 'results' && feedback && (
          <div style={{ flex: 1 }}>
            <FeedbackScreen
              isCorrect={feedback.isCorrect}
              xpEarned={feedback.xp}
              streak={feedback.streak}
              rank={feedback.rank}
              totalPlayers={feedback.totalPlayers}
              lang={lang}
            />
          </div>
        )}

        {/* RESULTS — no answer submitted */}
        {currentPhase === 'results' && !feedback && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--color-alert-coral)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', marginBottom: '1rem',
            }}>✕</div>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.3rem',
              color: 'var(--color-alert-coral)',
            }}>
              {lang === 'fr' ? 'Temps écoulé !' : 'Time\'s up!'}
            </p>
          </div>
        )}

        {/* LEADERBOARD */}
        {currentPhase === 'leaderboard' && (
          <div style={{ flex: 1 }}>
            <Leaderboard
              players={allPlayers}
              currentPlayerId={playerId}
              lang={lang}
            />
          </div>
        )}

        {/* FINISHED */}
        {currentPhase === 'finished' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
            padding: '2rem', textAlign: 'center',
          }}>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-mint-pop))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: '0 0 1rem',
            }}>
              {t.finalTitle}
            </h1>
            <p style={{ opacity: 0.5, margin: '0 0 2rem' }}>{t.finalSubtitle}</p>

            {/* Player's score from leaderboard */}
            {hostState?.leaderboard && (() => {
              const me = hostState.leaderboard.find(p => p.id === playerId);
              if (!me) return null;
              return (
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '2rem' }}>
                  {t.yourScore}: <strong style={{ color: 'var(--color-mint-pop)' }}>{me.score} XP</strong>
                </p>
              );
            })()}

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.85rem 1.75rem', background: 'var(--color-electric-blue)',
                color: 'white', border: 'none', borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {t.playAgain}
            </button>
          </div>
        )}

        {/* WAITING (between phases) */}
        {currentPhase !== 'lobby' && currentPhase !== 'question' && currentPhase !== 'results'
          && currentPhase !== 'leaderboard' && currentPhase !== 'finished' && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
          }}>
            <p style={{ opacity: 0.5 }}>{t.waitingForQuestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Solo mode — existing standalone demo (no host needed)
 * ============================================================ */

function SoloDemoSession({ lang }: Props) {
  const t = labels[lang];
  const quiz = DEMO_QUIZ;

  const [phase, setPhase] = useState<DemoPhase>('join');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bots, setBots] = useState<Player[]>(DEMO_BOTS.map((b) => ({ ...b })));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [lastFeedback, setLastFeedback] = useState({ isCorrect: false, xp: 0, streak: 0, rank: 1 });
  const botTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const currentQuestion: QuizQuestion | undefined = quiz.questions[questionIndex];

  const allPlayers: Record<string, Player> = {};
  if (currentPlayer) allPlayers[currentPlayer.id] = currentPlayer;
  bots.forEach((b) => { allPlayers[b.id] = b; });

  useEffect(() => {
    return () => { botTimersRef.current.forEach(clearTimeout); };
  }, []);

  const handleJoin = useCallback((nickname: string, badge: BadgeId) => {
    const player: Player = {
      id: 'player-local', nickname, badge,
      score: 0, streak: 0, connected: true,
    };
    setCurrentPlayer(player);
    setPhase('waiting');
    setTimeout(() => { startQuestion(0, player); }, 3000);
  }, []);

  const startQuestion = useCallback((idx: number, _player?: Player) => {
    setQuestionIndex(idx);
    setQuestionStartTime(Date.now());
    setPhase('question');

    const question = quiz.questions[idx];
    if (!question) return;

    botTimersRef.current.forEach(clearTimeout);
    botTimersRef.current = [];

    bots.forEach((bot) => {
      const sim = simulateBotAnswer(question);
      const timer = setTimeout(() => {
        const score = calcScore(sim.isCorrect, sim.delayMs, question.timeLimit * 1000);
        setBots((prev) =>
          prev.map((b) =>
            b.id === bot.id
              ? { ...b, score: b.score + score, streak: sim.isCorrect ? b.streak + 1 : 0 }
              : b
          )
        );
      }, sim.delayMs);
      botTimersRef.current.push(timer);
    });
  }, [bots, quiz.questions]);

  const handleAnswer = useCallback((optionId: string) => {
    if (!currentQuestion || !currentPlayer) return;
    const responseTimeMs = Date.now() - questionStartTime;
    const isCorrect = optionId === getCorrectOptionId(currentQuestion);
    const xp = calcScore(isCorrect, responseTimeMs, currentQuestion.timeLimit * 1000);
    const newStreak = isCorrect ? currentPlayer.streak + 1 : 0;

    const updatedPlayer: Player = { ...currentPlayer, score: currentPlayer.score + xp, streak: newStreak };
    setCurrentPlayer(updatedPlayer);

    const allScores = [updatedPlayer.score, ...bots.map((b) => b.score)];
    allScores.sort((a, b) => b - a);
    const rank = allScores.indexOf(updatedPlayer.score) + 1;

    setLastFeedback({ isCorrect, xp, streak: newStreak, rank });
    setTimeout(() => { setPhase('feedback'); }, 800);
  }, [currentQuestion, currentPlayer, questionStartTime, bots]);

  const handleTimeUp = useCallback(() => {
    if (!currentPlayer) return;
    const updatedPlayer: Player = { ...currentPlayer, streak: 0 };
    setCurrentPlayer(updatedPlayer);

    const allScores = [updatedPlayer.score, ...bots.map((b) => b.score)];
    allScores.sort((a, b) => b - a);
    const rank = allScores.indexOf(updatedPlayer.score) + 1;

    setLastFeedback({ isCorrect: false, xp: 0, streak: 0, rank });
    setTimeout(() => { setPhase('feedback'); }, 800);
  }, [currentPlayer, bots]);

  const handleNext = useCallback(() => {
    const nextIdx = questionIndex + 1;
    if (nextIdx < quiz.questions.length) {
      startQuestion(nextIdx);
    } else {
      setPhase('leaderboard');
    }
  }, [questionIndex, quiz.questions.length, startQuestion]);

  const handleShowLeaderboard = useCallback(() => { setPhase('leaderboard'); }, []);

  const handlePlayAgain = useCallback(() => {
    botTimersRef.current.forEach(clearTimeout);
    setCurrentPlayer(null);
    setBots(DEMO_BOTS.map((b) => ({ ...b })));
    setQuestionIndex(0);
    setLastFeedback({ isCorrect: false, xp: 0, streak: 0, rank: 1 });
    setPhase('join');
  }, []);

  const isLastQuestion = questionIndex >= quiz.questions.length - 1;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <DemoBanner text={t.demoBanner} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {phase === 'join' && (
          <DemoJoinForm lang={lang} onJoin={handleJoin} />
        )}

        {phase === 'waiting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <WaitingRoom
              playerCount={bots.length + 1}
              lang={lang}
              hostMessage={t.autoStart}
            />
          </div>
        )}

        {phase === 'question' && currentQuestion && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem',
              textAlign: 'center', fontFamily: 'var(--font-display)',
              fontSize: '0.85rem', color: 'var(--color-soft-white)',
              opacity: 0.7, flexShrink: 0,
            }}>
              {t.questionOf
                .replace('{current}', String(questionIndex + 1))
                .replace('{total}', String(quiz.questions.length))}
            </div>
            <div style={{ flex: 1 }}>
              <PlayerBuzzer
                question={currentQuestion.label}
                options={currentQuestion.options.map((o) => ({ id: o.id, text: o.text }))}
                timeLimit={currentQuestion.timeLimit}
                lang={lang}
                onAnswer={handleAnswer}
                onTimeUp={handleTimeUp}
              />
            </div>
          </div>
        )}

        {phase === 'feedback' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <FeedbackScreen
                isCorrect={lastFeedback.isCorrect}
                xpEarned={lastFeedback.xp}
                streak={lastFeedback.streak}
                rank={lastFeedback.rank}
                totalPlayers={bots.length + 1}
                lang={lang}
              />
            </div>
            <div style={{
              display: 'flex', gap: '0.75rem', padding: '1rem 1.5rem 2rem',
              background: 'var(--color-dark-slate)', justifyContent: 'center', flexShrink: 0,
            }}>
              {!isLastQuestion ? (
                <ActionButton label={t.nextQuestion} color="var(--color-electric-blue)" onClick={handleNext} />
              ) : (
                <ActionButton label={t.seeLeaderboard} color="var(--color-violet-pulse)" onClick={handleShowLeaderboard} />
              )}
            </div>
          </div>
        )}

        {phase === 'leaderboard' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <Leaderboard
                players={allPlayers}
                currentPlayerId={currentPlayer?.id}
                lang={lang}
              />
            </div>
            <div style={{
              padding: '1rem 1.5rem 2rem', background: 'var(--color-dark-slate)',
              textAlign: 'center', flexShrink: 0,
            }}>
              {currentPlayer && (
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: '1rem',
                  opacity: 0.7, marginBottom: '1rem',
                }}>
                  {t.yourScore}: <strong style={{ color: 'var(--color-mint-pop)' }}>{currentPlayer.score} XP</strong>
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {isLastQuestion && (
                  <ActionButton label={t.playAgain} color="var(--color-electric-blue)" onClick={handlePlayAgain} />
                )}
                {!isLastQuestion && (
                  <ActionButton label={t.nextQuestion} color="var(--color-electric-blue)" onClick={handleNext} />
                )}
                <ActionButton label={t.backHome} color="var(--color-alert-coral)" onClick={() => { window.location.href = '/'; }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Shared sub-components
 * ============================================================ */

/** Demo banner at the top of the page */
function DemoBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
        color: 'white',
        textAlign: 'center',
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {text}
    </div>
  );
}

/** Join form — no framer-motion to avoid hydration issues */
function DemoJoinForm({ lang, onJoin }: { lang: 'fr' | 'en'; onJoin: (nickname: string, badge: BadgeId) => void }) {
  const [nickname, setNickname] = useState('');
  const [badge, setBadge] = useState<BadgeId>('rocket');
  const [error, setError] = useState('');

  const tJoin = lang === 'fr'
    ? { title: 'Join the Town', placeholder: 'Ton pseudo...', badge: 'Choisis ton badge', cta: 'JOIN', errorEmpty: 'Entre un pseudo', errorLong: '12 caractères max' }
    : { title: 'Join the Town', placeholder: 'Your nickname...', badge: 'Choose your badge', cta: 'JOIN', errorEmpty: 'Enter a nickname', errorLong: '12 characters max' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) { setError(tJoin.errorEmpty); return; }
    if (trimmed.length > 12) { setError(tJoin.errorLong); return; }
    setError('');
    onJoin(trimmed, badge);
  };

  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem',
        background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
      }}
    >
      <div
        style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.8rem', color: 'white',
          marginBottom: '1.5rem',
        }}
      >
        Q
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          margin: '0 0 2rem',
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {tJoin.title}
      </h1>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
        <input
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(''); }}
          placeholder={tJoin.placeholder}
          maxLength={12}
          autoFocus
          style={{
            width: '100%', padding: '1rem 1.25rem', fontSize: '1.1rem',
            fontFamily: 'var(--font-body)',
            background: 'rgba(255,255,255,0.08)',
            border: `2px solid ${error ? 'var(--color-alert-coral)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius-button)',
            color: 'var(--color-soft-white)', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && <p style={{ color: 'var(--color-alert-coral)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>{error}</p>}

        <div style={{ margin: '1.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>{tJoin.badge}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {BADGES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBadge(b.id)}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: `3px solid ${badge === b.id ? 'var(--color-electric-blue)' : 'rgba(255,255,255,0.1)'}`,
                  background: badge === b.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.05)',
                  fontSize: '1.4rem', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
                  transform: badge === b.id ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {b.emoji}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          style={{
            width: '100%', padding: '1rem', fontSize: '1.2rem',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
            color: 'white', border: 'none', borderRadius: 'var(--radius-button)',
            cursor: 'pointer', letterSpacing: '0.05em',
          }}
        >
          {tJoin.cta}
        </button>
      </form>
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.85rem 1.75rem', background: color,
        color: 'white', border: 'none', borderRadius: 'var(--radius-button)',
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem',
        cursor: 'pointer', transition: 'transform 0.15s',
      }}
    >
      {label}
    </button>
  );
}
