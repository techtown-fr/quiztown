import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicScreen from './PublicScreen';
import LeaderboardRow from './ui/LeaderboardRow';
import { useCountdown } from '../hooks/useCountdown';
import { DEMO_QUIZ, DEMO_BOTS, simulateBotAnswer } from '../lib/demoData';
import { DEMO_CHANNEL_NAME } from '../lib/demoBroadcast';
import type { Player, BadgeId } from '../types/session';
import type { QuizQuestion } from '../types/quiz';

type ScreenPhase = 'lobby' | 'question' | 'finished';

const LABELS = ['A', 'B', 'C', 'D'];

/** How long lobby waits before starting (ms) */
const LOBBY_DURATION = 8000;

interface Props {
  lang: 'fr' | 'en';
}

const labels = {
  fr: {
    demoBanner: 'Écran Projection -- Mode Demo',
    lobbyTitle: 'Tech Culture Quiz',
    lobbySubtitle: 'Le quiz démarre bientôt...',
    citizens: 'Citizens connectés',
    questionOf: 'Question {current} / {total}',
    showResults: 'Afficher les résultats',
    nextQuestion: 'Question suivante',
    finalPodium: 'Classement final',
    podiumTitle: 'Classement Final',
    replay: 'Rejouer',
  },
  en: {
    demoBanner: 'Projection Screen -- Demo Mode',
    lobbyTitle: 'Tech Culture Quiz',
    lobbySubtitle: 'Quiz starting soon...',
    citizens: 'Citizens connected',
    questionOf: 'Question {current} / {total}',
    showResults: 'Show results',
    nextQuestion: 'Next question',
    finalPodium: 'Final ranking',
    podiumTitle: 'Final Ranking',
    replay: 'Play again',
  },
};

/** Calculate score: faster = more points */
function calcScore(isCorrect: boolean, responseTimeMs: number, timeLimitMs: number): number {
  if (!isCorrect) return 0;
  const timeRatio = Math.max(0, 1 - responseTimeMs / timeLimitMs);
  return Math.round(500 + timeRatio * 500);
}

export default function DemoPublicScreen({ lang }: Props) {
  const t = labels[lang];
  const quiz = DEMO_QUIZ;

  const [phase, setPhase] = useState<ScreenPhase>('lobby');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bots, setBots] = useState<Player[]>(DEMO_BOTS.map((b) => ({ ...b })));
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const botTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- BroadcastChannel host state -----
  const [realPlayers, setRealPlayers] = useState<Record<string, Player>>({});
  const channelRef = useRef<BroadcastChannel | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Refs for latest state (avoid stale closures)
  const botsRef = useRef(bots);
  const realPlayersRef = useRef(realPlayers);
  const questionIndexRef = useRef(questionIndex);
  const phaseRef = useRef(phase);
  const showResultsRef = useRef(showResults);
  const countdownDoneRef = useRef(countdownDone);

  useEffect(() => { botsRef.current = bots; }, [bots]);
  useEffect(() => { realPlayersRef.current = realPlayers; }, [realPlayers]);
  useEffect(() => { questionIndexRef.current = questionIndex; }, [questionIndex]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { showResultsRef.current = showResults; }, [showResults]);
  useEffect(() => { countdownDoneRef.current = countdownDone; }, [countdownDone]);

  const currentQuestion: QuizQuestion | undefined = quiz.questions[questionIndex];
  const totalPlayerCount = bots.length + Object.keys(realPlayers).length;
  const isLastQuestion = questionIndex >= quiz.questions.length - 1;

  // ----- Broadcast state -----
  const broadcastState = useCallback(() => {
    const ch = channelRef.current;
    if (!ch) return;

    const currentQ = quiz.questions[questionIndexRef.current];
    const allPlayers = [
      ...botsRef.current,
      ...Object.values(realPlayersRef.current),
    ].sort((a, b) => b.score - a.score);

    // Map internal phase to broadcast phase
    let broadcastPhase: string = phaseRef.current;
    if (phaseRef.current === 'question' && showResultsRef.current) {
      broadcastPhase = 'results';
    }

    ch.postMessage({
      from: 'host',
      type: 'state',
      phase: broadcastPhase,
      questionIndex: questionIndexRef.current,
      totalQuestions: quiz.questions.length,
      question: currentQ ? {
        label: currentQ.label,
        options: currentQ.options.map(o => ({ id: o.id, text: o.text })),
        timeLimit: currentQ.timeLimit,
      } : undefined,
      timeStartedAt: questionStartTimeRef.current,
      playerCount: allPlayers.length,
      leaderboard: allPlayers.map(p => ({
        id: p.id,
        nickname: p.nickname,
        badge: p.badge ?? 'rocket',
        score: p.score,
        streak: p.streak,
      })),
    });
  }, [quiz.questions]);

  // ----- BroadcastChannel setup (host) -----
  useEffect(() => {
    const channel = new BroadcastChannel(DEMO_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg?.from !== 'player') return;

      switch (msg.type) {
        case 'ping': {
          channel.postMessage({ from: 'host', type: 'pong' });
          setTimeout(() => broadcastState(), 50);
          break;
        }

        case 'join': {
          const newPlayer: Player = {
            id: msg.id, nickname: msg.nickname,
            badge: (msg.badge as BadgeId) ?? 'rocket',
            score: 0, streak: 0, connected: true,
          };
          setRealPlayers(prev => {
            const updated = { ...prev, [msg.id]: newPlayer };
            realPlayersRef.current = updated;
            return updated;
          });
          channel.postMessage({ from: 'host', type: 'player-joined', playerId: msg.id });
          setTimeout(() => broadcastState(), 100);
          break;
        }

        case 'answer': {
          const question = quiz.questions[msg.questionIndex];
          if (!question || msg.questionIndex !== questionIndexRef.current) break;

          const correctId = question.options.find(o => o.isCorrect)?.id;
          const isCorrect = msg.optionId === correctId;
          const xp = calcScore(isCorrect, msg.responseTimeMs, question.timeLimit * 1000);

          setVoteCounts(prev => ({
            ...prev,
            [msg.optionId]: (prev[msg.optionId] ?? 0) + 1,
          }));

          setRealPlayers(prev => {
            const player = prev[msg.playerId];
            if (!player) return prev;
            const updated: Player = {
              ...player,
              score: player.score + xp,
              streak: isCorrect ? player.streak + 1 : 0,
            };
            const newState = { ...prev, [msg.playerId]: updated };
            realPlayersRef.current = newState;

            const allScores = [
              ...botsRef.current.map(b => b.score),
              ...Object.values(newState).map(p => p.score),
            ].sort((a, b) => b - a);
            const rank = allScores.indexOf(updated.score) + 1;
            const total = botsRef.current.length + Object.keys(newState).length;

            channel.postMessage({
              from: 'host', type: 'feedback',
              playerId: msg.playerId, isCorrect, xp,
              streak: updated.streak, rank, totalPlayers: total,
            });

            return newState;
          });
          break;
        }
      }
    };

    return () => { channel.close(); };
  }, [quiz.questions, broadcastState]);

  // Broadcast on state changes
  useEffect(() => { broadcastState(); }, [phase, questionIndex, showResults, broadcastState]);

  // Cleanup
  useEffect(() => {
    return () => {
      botTimersRef.current.forEach(clearTimeout);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, []);

  // Auto-start from lobby
  useEffect(() => {
    if (phase === 'lobby') {
      phaseTimerRef.current = setTimeout(() => startQuestion(0), LOBBY_DURATION);
      return () => { if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current); };
    }
  }, [phase]);

  /** Start a question */
  const startQuestion = useCallback((idx: number) => {
    setQuestionIndex(idx);
    setShowResults(false);
    setCountdownDone(false);
    setVoteCounts({});
    setPhase('question');
    questionStartTimeRef.current = Date.now();

    const question = quiz.questions[idx];
    if (!question) return;

    botTimersRef.current.forEach(clearTimeout);
    botTimersRef.current = [];

    bots.forEach((bot) => {
      const sim = simulateBotAnswer(question);
      const timer = setTimeout(() => {
        setVoteCounts((prev) => ({
          ...prev,
          [sim.optionId]: (prev[sim.optionId] ?? 0) + 1,
        }));
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

  /** Countdown finished — wait for host controls */
  const handleTimeUp = useCallback(() => {
    setCountdownDone(true);
  }, []);

  /** Host: show correct answer */
  const handleShowResults = useCallback(() => {
    setShowResults(true);
  }, []);

  /** Host: advance to next question or podium */
  const handleAdvance = useCallback(() => {
    if (isLastQuestion) {
      setPhase('finished');
    } else {
      startQuestion(questionIndex + 1);
    }
  }, [isLastQuestion, questionIndex, startQuestion]);

  /** Host: restart the demo */
  const handleReplay = useCallback(() => {
    setBots(DEMO_BOTS.map((b) => ({ ...b })));
    setRealPlayers({});
    realPlayersRef.current = {};
    setQuestionIndex(0);
    setVoteCounts({});
    setShowResults(false);
    setCountdownDone(false);
    setPhase('lobby');
  }, []);

  // Build vote bars
  const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);
  const voteBars = currentQuestion
    ? currentQuestion.options.map((opt, idx) => ({
        label: LABELS[idx],
        text: opt.text,
        percentage: totalVotes > 0 ? (voteCounts[opt.id] ?? 0) / totalVotes * 100 : 0,
        isCorrect: opt.isCorrect,
      }))
    : [];

  // All players sorted
  const allSortedPlayers = [...bots, ...Object.values(realPlayers)].sort((a, b) => b.score - a.score);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Demo banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
        color: 'white', textAlign: 'center', padding: '0.4rem 1rem',
        fontSize: 'clamp(0.7rem, 1vw, 0.85rem)', fontFamily: 'var(--font-display)',
        fontWeight: 600, letterSpacing: '0.02em', flexShrink: 0,
      }}>
        {t.demoBanner}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
        {/* LOBBY */}
        {phase === 'lobby' && (
          <LobbyScreen title={t.lobbyTitle} subtitle={t.lobbySubtitle}
            citizenCount={totalPlayerCount} citizenLabel={t.citizens} />
        )}

        {/* QUESTION */}
        {phase === 'question' && currentQuestion && (
          <QuestionScreen
            key={`q-${questionIndex}`}
            question={currentQuestion}
            questionIndex={questionIndex}
            totalQuestions={quiz.questions.length}
            questionOfLabel={t.questionOf}
            voteBars={voteBars}
            totalVotes={totalVotes}
            showResults={showResults}
            onTimeUp={handleTimeUp}
          />
        )}

        {/* PODIUM */}
        {phase === 'finished' && (
          <PodiumScreen
            players={allSortedPlayers}
            title={t.podiumTitle}
            replayLabel={t.replay}
            onReplay={handleReplay}
            lang={lang}
          />
        )}

        {/* HOST CONTROLS — shown after countdown ends */}
        <AnimatePresence>
          {phase === 'question' && countdownDone && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: 'clamp(1rem, 3vw, 2rem) clamp(1.5rem, 4vw, 3rem)',
                background: 'linear-gradient(transparent, rgba(15,23,42,0.95) 40%)',
                display: 'flex', gap: 'clamp(0.75rem, 2vw, 1.25rem)',
                justifyContent: 'center', alignItems: 'center',
                zIndex: 50,
              }}
            >
              {!showResults && (
                <HostButton
                  label={t.showResults}
                  variant="secondary"
                  icon="👁"
                  onClick={handleShowResults}
                />
              )}
              <HostButton
                label={isLastQuestion ? t.finalPodium : t.nextQuestion}
                variant="primary"
                icon={isLastQuestion ? '🏆' : '→'}
                onClick={handleAdvance}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================
 * Host control button — QuizTown branded
 * ============================================ */

function HostButton({ label, variant = 'primary', icon, onClick }: {
  label: string;
  variant?: 'primary' | 'secondary';
  icon?: string;
  onClick: () => void;
}) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: isPrimary
          ? 'clamp(0.75rem, 1.8vw, 1.1rem) clamp(1.5rem, 4vw, 2.5rem)'
          : 'clamp(0.65rem, 1.5vw, 0.95rem) clamp(1.2rem, 3vw, 2rem)',
        background: isPrimary
          ? 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))'
          : 'rgba(255,255,255,0.06)',
        border: isPrimary
          ? 'none'
          : '1.5px solid rgba(255,255,255,0.15)',
        borderRadius: 'var(--radius-button)',
        color: 'white',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: isPrimary
          ? 'clamp(0.9rem, 1.8vw, 1.2rem)'
          : 'clamp(0.8rem, 1.5vw, 1rem)',
        cursor: 'pointer',
        letterSpacing: '0.03em',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: isPrimary
          ? '0 0 24px rgba(37,99,235,0.4), 0 0 60px rgba(124,58,237,0.15), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(0.4rem, 0.8vw, 0.6rem)',
        overflow: 'hidden',
        textTransform: 'uppercase' as const,
      }}
    >
      {/* Shimmer effect on primary */}
      {isPrimary && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
            pointerEvents: 'none',
          }}
        />
      )}
      {icon && (
        <span style={{
          fontSize: isPrimary ? 'clamp(1rem, 2vw, 1.3rem)' : 'clamp(0.85rem, 1.5vw, 1.1rem)',
          lineHeight: 1,
        }}>
          {icon}
        </span>
      )}
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </motion.button>
  );
}

/* ============================================
 * Lobby screen
 * ============================================ */

function LobbyScreen({ title, subtitle, citizenCount, citizenLabel }: {
  title: string; subtitle: string; citizenCount: number; citizenLabel: string;
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
      position: 'relative', overflow: 'hidden',
    }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i}
          animate={{ scale: [1, 1.4, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 400 + i * 150, height: 400 + i * 150, borderRadius: '50%',
            background: i === 0 ? 'var(--color-electric-blue)' : i === 1 ? 'var(--color-violet-pulse)' : 'var(--color-mint-pop)',
            filter: 'blur(100px)',
          }}
        />
      ))}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 100, height: 100, margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
            borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'white',
          }}
        >Q</motion.div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          margin: '0 0 1rem',
        }}>{title}</h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', opacity: 0.6, margin: '0 0 3rem' }}>{subtitle}</p>
        <motion.div key={citizenCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          style={{
            fontSize: 'clamp(3rem, 7vw, 5rem)', fontFamily: 'var(--font-display)', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-mint-pop))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >{citizenCount}</motion.div>
        <p style={{ fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)', opacity: 0.4 }}>{citizenLabel}</p>
      </div>
    </div>
  );
}

/* ============================================
 * Question screen with countdown
 * ============================================ */

function QuestionScreen({ question, questionIndex, totalQuestions, questionOfLabel,
  voteBars, totalVotes, showResults, onTimeUp }: {
  question: QuizQuestion; questionIndex: number; totalQuestions: number;
  questionOfLabel: string;
  voteBars: Array<{ label: string; text: string; percentage: number; isCorrect?: boolean }>;
  totalVotes: number; showResults: boolean; onTimeUp: () => void;
}) {
  const { timeLeft } = useCountdown({
    duration: question.timeLimit, autoStart: true, onComplete: onTimeUp,
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem',
        textAlign: 'center', fontFamily: 'var(--font-display)',
        fontSize: 'clamp(0.8rem, 1.2vw, 1rem)', color: 'var(--color-soft-white)',
        opacity: 0.5, flexShrink: 0,
      }}>
        {questionOfLabel
          .replace('{current}', String(questionIndex + 1))
          .replace('{total}', String(totalQuestions))}
      </div>
      <div style={{ flex: 1 }}>
        <PublicScreen
          question={question.label}
          timeLeft={showResults ? 0 : timeLeft}
          timeLimit={question.timeLimit}
          voteBars={voteBars}
          showResults={showResults}
          totalVotes={totalVotes}
        />
      </div>
    </div>
  );
}

/* ============================================
 * Podium — dramatic reveal: 5→4→3→2→1
 * ============================================ */

const MEDAL_COLORS = {
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

function PodiumScreen({ players, title, replayLabel, onReplay, lang }: {
  players: Player[]; title: string; replayLabel: string;
  onReplay: () => void; lang: 'fr' | 'en';
}) {
  const [step, setStep] = useState(0);
  const top5 = players.slice(0, 5);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),    // title
      setTimeout(() => setStep(2), 2000),   // 4th + 5th
      setTimeout(() => setStep(3), 4000),   // 3rd (bronze)
      setTimeout(() => setStep(4), 6500),   // 2nd (silver)
      setTimeout(() => setStep(5), 9000),   // 1st (gold + spotlight)
      setTimeout(() => setStep(6), 11000),  // replay button
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-dark-slate)', color: 'var(--color-soft-white)',
      position: 'relative', overflow: 'hidden',
      padding: 'clamp(1rem, 3vw, 3rem)',
    }}>
      {/* Ambient glow — intensifies on gold reveal */}
      <motion.div
        animate={{
          opacity: step >= 5 ? 0.25 : 0.05,
          scale: step >= 5 ? 1.5 : 1,
        }}
        transition={{ duration: 2 }}
        style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: step >= 5
            ? `radial-gradient(circle, ${MEDAL_COLORS.gold}40, transparent 70%)`
            : 'radial-gradient(circle, var(--color-violet-pulse), transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 700, textAlign: 'center' }}>
        {/* Title */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.h1
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                margin: '0 0 clamp(1.5rem, 4vw, 3rem)',
              }}
            >
              {title}
            </motion.h1>
          )}
        </AnimatePresence>

        {/* 1st place — GOLD with spotlight */}
        <AnimatePresence>
          {step >= 5 && top5[0] && (
            <PodiumEntry
              player={top5[0]} rank={1}
              medalColor={MEDAL_COLORS.gold}
              medalLabel="🥇"
              isGold
              lang={lang}
            />
          )}
        </AnimatePresence>

        {/* 2nd + 3rd side by side */}
        <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', justifyContent: 'center', margin: 'clamp(0.5rem, 1.5vw, 1rem) 0' }}>
          <AnimatePresence>
            {step >= 4 && top5[1] && (
              <PodiumEntry
                player={top5[1]} rank={2}
                medalColor={MEDAL_COLORS.silver}
                medalLabel="🥈"
                lang={lang}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {step >= 3 && top5[2] && (
              <PodiumEntry
                player={top5[2]} rank={3}
                medalColor={MEDAL_COLORS.bronze}
                medalLabel="🥉"
                lang={lang}
              />
            )}
          </AnimatePresence>
        </div>

        {/* 4th + 5th */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: 'clamp(0.5rem, 1.5vw, 1rem)' }}
            >
              {top5.slice(3).map((p, i) => (
                <div key={p.id} style={{
                  padding: '0.5rem 1.5rem',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <span style={{ opacity: 0.4, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
                    #{i + 4}
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{p.nickname}</span>
                  <span style={{ opacity: 0.5, fontSize: '0.85rem' }}>{p.score} XP</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Replay button */}
        <AnimatePresence>
          {step >= 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: 'clamp(1.5rem, 3vw, 3rem)' }}
            >
              <HostButton label={replayLabel} variant="primary" icon="🔄" onClick={onReplay} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Single podium entry with medal glow */
function PodiumEntry({ player, rank, medalColor, medalLabel, isGold, lang }: {
  player: Player; rank: number; medalColor: string; medalLabel: string;
  isGold?: boolean; lang: 'fr' | 'en';
}) {
  return (
    <motion.div
      initial={isGold ? { opacity: 0, scale: 0, y: -60 } : { opacity: 0, x: rank === 2 ? -60 : 60 }}
      animate={isGold ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, x: 0 }}
      transition={isGold
        ? { type: 'spring', stiffness: 150, damping: 12, duration: 0.8 }
        : { type: 'spring', stiffness: 200, damping: 15 }
      }
      style={{
        flex: isGold ? undefined : 1,
        maxWidth: isGold ? undefined : 300,
        padding: isGold ? 'clamp(1.5rem, 3vw, 2.5rem)' : 'clamp(0.75rem, 2vw, 1.5rem)',
        background: isGold
          ? `linear-gradient(135deg, ${medalColor}15, ${medalColor}08)`
          : `rgba(255,255,255,0.04)`,
        borderRadius: isGold ? 20 : 14,
        border: `2px solid ${medalColor}${isGold ? '60' : '30'}`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Spotlight glow for gold */}
      {isGold && (
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -50, borderRadius: '50%',
            background: `radial-gradient(circle, ${medalColor}30, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: isGold ? 'clamp(2.5rem, 5vw, 4rem)' : 'clamp(1.5rem, 3vw, 2.5rem)', marginBottom: '0.25rem' }}>
          {medalLabel}
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: isGold ? 'clamp(1.8rem, 4vw, 2.5rem)' : 'clamp(1.1rem, 2.5vw, 1.5rem)',
          fontWeight: 700,
          color: isGold ? medalColor : 'var(--color-soft-white)',
          margin: '0 0 0.25rem',
        }}>
          {player.nickname}
        </h2>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: isGold ? 'clamp(1.2rem, 2.5vw, 1.6rem)' : 'clamp(0.85rem, 1.5vw, 1.1rem)',
          opacity: 0.7, margin: 0,
        }}>
          {player.score} XP
        </p>
      </div>
    </motion.div>
  );
}
