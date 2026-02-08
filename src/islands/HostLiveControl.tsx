import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SessionStatus, Player, CurrentQuestion } from '../types/session';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface Props {
  sessionId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerCount: number;
  responseCount: number;
  lang: 'fr' | 'en';
  joinUrl?: string;
  /** Time limit in seconds for current question */
  timeLimit?: number;
  /** Timestamp (ms) when the current question started */
  startedAt?: number;
  /** Whether current question is the last one */
  isLastQuestion?: boolean;
  /** Current question data (label, media, options) */
  currentQuestion?: CurrentQuestion | null;
  /** Correct option ID (set during feedback phase) */
  correctOptionId?: string;
  /** Players data for leaderboard display */
  players?: Record<string, Player>;
  onStart?: () => void;
  onNext?: () => void;
  onShowResults?: () => void;
  onShowLeaderboard?: () => void;
}

const labels = {
  fr: {
    title: 'ControlDeck',
    spot: 'Question',
    citizens: 'Citizens',
    responses: 'Réponses',
    start: 'Démarrer',
    next: 'Question suivante',
    showResults: 'Afficher les résultats',
    leaderboard: 'Classement',
    finishQuiz: 'Terminer le quiz',
    lobby: 'Lobby',
    question: 'Question en cours',
    feedback: 'Résultats',
    leaderboardStatus: 'Classement',
    finished: 'Terminé',
    scan: 'Scannez pour rejoindre',
    joinLink: 'Ou utilisez ce lien :',
    copyLink: 'Copier',
    copied: 'Copié !',
    timeUp: 'Temps écoulé !',
    allAnswered: 'Tous ont répondu !',
    sessionEnded: 'Session terminée',
  },
  en: {
    title: 'ControlDeck',
    spot: 'Question',
    citizens: 'Citizens',
    responses: 'Responses',
    start: 'Start',
    next: 'Next question',
    showResults: 'Show results',
    leaderboard: 'Leaderboard',
    finishQuiz: 'Finish quiz',
    lobby: 'Lobby',
    question: 'Question active',
    feedback: 'Results',
    leaderboardStatus: 'Leaderboard',
    finished: 'Finished',
    scan: 'Scan to join',
    joinLink: 'Or use this link:',
    copyLink: 'Copy',
    copied: 'Copied!',
    timeUp: 'Time\'s up!',
    allAnswered: 'All answered!',
    sessionEnded: 'Session ended',
  },
};

export default function HostLiveControl({
  status,
  currentQuestionIndex,
  totalQuestions,
  playerCount,
  responseCount,
  lang,
  joinUrl,
  timeLimit,
  startedAt,
  isLastQuestion,
  currentQuestion,
  correctOptionId,
  players,
  onStart,
  onNext,
  onShowResults,
  onShowLeaderboard,
}: Props) {
  const t = labels[lang];

  // ==========================================
  // Countdown timer
  // ==========================================
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear previous interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status !== 'question' || !timeLimit || !startedAt) {
      setRemainingSeconds(null);
      return;
    }

    const computeRemaining = (): number => {
      const elapsedS = (Date.now() - startedAt) / 1000;
      return Math.max(0, Math.ceil(timeLimit - elapsedS));
    };

    setRemainingSeconds(computeRemaining());

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining();
      setRemainingSeconds(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, timeLimit, startedAt]);

  const isTimeUp = remainingSeconds !== null && remainingSeconds <= 0;
  const allAnswered = playerCount > 0 && responseCount >= playerCount;
  const shouldHighlightResults = isTimeUp || allAnswered;

  const statusLabel =
    status === 'lobby' ? t.lobby :
    status === 'question' ? t.question :
    status === 'feedback' ? t.feedback :
    status === 'leaderboard' ? t.leaderboardStatus :
    status === 'finished' ? t.finished :
    status;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
        {t.title}
      </h1>

      {/* Stats Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <StatCard label={t.spot} value={`${Math.max(0, currentQuestionIndex + 1)} / ${totalQuestions}`} color="var(--color-electric-blue)" />
        <StatCard label={t.citizens} value={String(playerCount)} color="var(--color-violet-pulse)" />
        <StatCard label={t.responses} value={`${responseCount} / ${playerCount}`} color="var(--color-mint-pop)" />
      </div>

      {/* Status */}
      <div
        style={{
          textAlign: 'center',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(37, 99, 235, 0.1)',
          color: 'var(--color-electric-blue)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.85rem',
          marginBottom: '2rem',
          display: 'inline-block',
        }}
      >
        {statusLabel}
      </div>

      {/* QR Code + Join Link in Lobby */}
      {status === 'lobby' && joinUrl && (
        <LobbyJoinSection joinUrl={joinUrl} lang={lang} />
      )}

      {/* Question Preview -- visible during question & feedback phases */}
      {(status === 'question' || status === 'feedback') && currentQuestion && (
        <QuestionPreview
          question={currentQuestion}
          correctOptionId={status === 'feedback' ? correctOptionId : undefined}
          remainingSeconds={status === 'question' ? remainingSeconds : null}
          isTimeUp={isTimeUp}
          allAnswered={allAnswered}
          lang={lang}
        />
      )}

      {/* Leaderboard -- visible during leaderboard & finished phases */}
      {(status === 'leaderboard' || status === 'finished') && players && (
        <HostLeaderboard players={players} lang={lang} />
      )}

      {/* Action Buttons -- strict linear flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {status === 'lobby' && (
          <ControlButton label={t.start} color="var(--color-electric-blue)" onClick={onStart} />
        )}

        {status === 'question' && (
          <ControlButton
            label={t.showResults}
            color="var(--color-violet-pulse)"
            onClick={onShowResults}
            pulsing={shouldHighlightResults}
          />
        )}

        {status === 'feedback' && (
          <ControlButton
            label={t.leaderboard}
            color="var(--color-mint-pop)"
            onClick={onShowLeaderboard}
          />
        )}

        {status === 'leaderboard' && !isLastQuestion && (
          <ControlButton
            label={t.next}
            color="var(--color-electric-blue)"
            onClick={onNext}
          />
        )}

        {status === 'leaderboard' && isLastQuestion && (
          <ControlButton
            label={t.finishQuiz}
            color="var(--color-alert-coral)"
            onClick={onNext}
          />
        )}

        {status === 'finished' && (
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            opacity: 0.6,
          }}>
            {t.sessionEnded}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Host Leaderboard (compact, for ControlDeck)
// ==========================================

function HostLeaderboard({ players, lang }: { players: Record<string, Player>; lang: 'fr' | 'en' }) {
  const t = labels[lang];
  const { leaderboard } = useLeaderboard({ players, topN: 5 });

  if (leaderboard.length === 0) return null;

  const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div
      style={{
        marginBottom: '2rem',
        padding: '1rem',
        borderRadius: 'var(--radius-card)',
        background: 'white',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '0.85rem',
        margin: '0 0 0.75rem',
        color: 'var(--color-violet-pulse)',
        textAlign: 'center',
      }}>
        {t.leaderboardStatus}
      </p>
      {leaderboard.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.5rem',
            borderRadius: 'var(--radius-button)',
          }}
        >
          <span style={{
            width: 28,
            textAlign: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: entry.rank <= 3 ? '1.1rem' : '0.85rem',
          }}>
            {MEDALS[entry.rank] ?? `#${entry.rank}`}
          </span>
          <span style={{
            flex: 1,
            fontSize: '0.9rem',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {entry.nickname}
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--color-violet-pulse)',
          }}>
            {entry.score.toLocaleString()} XP
          </span>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// Lobby Join Section (QR + Link)
// ==========================================

function LobbyJoinSection({ joinUrl, lang }: { joinUrl: string; lang: 'fr' | 'en' }) {
  const t = labels[lang];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    import('qrcode').then((QRCode) =>
      QRCode.toDataURL(joinUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#0F172A', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => { /* QR generation failed, link still works */ })
    );
  }, [joinUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }, [joinUrl]);

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1.5rem',
        marginBottom: '2rem',
        borderRadius: 'var(--radius-card)',
        background: 'white',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* QR Code */}
      {qrDataUrl && (
        <div style={{ marginBottom: '1rem' }}>
          <img
            src={qrDataUrl}
            alt={`QR Code - ${t.scan}`}
            style={{ width: 200, height: 200, borderRadius: 8 }}
          />
        </div>
      )}

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '1rem',
          color: 'var(--color-electric-blue)',
          margin: '0 0 1rem',
        }}
      >
        {t.scan}
      </p>

      {/* Join link */}
      <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 0.5rem' }}>{t.joinLink}</p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <code
          style={{
            fontSize: '0.75rem',
            background: 'rgba(37, 99, 235, 0.05)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-button)',
            border: '1px solid rgba(37, 99, 235, 0.15)',
            wordBreak: 'break-all',
            maxWidth: '100%',
          }}
          data-testid="join-url"
        >
          {joinUrl}
        </code>
        <button
          onClick={handleCopy}
          style={{
            padding: '0.4rem 0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            background: copied ? 'var(--color-mint-pop)' : 'var(--color-electric-blue)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer',
            transition: 'background 0.15s',
            whiteSpace: 'nowrap',
          }}
          aria-label={t.copyLink}
        >
          {copied ? t.copied : t.copyLink}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Question Preview (text + GIF + answers)
// ==========================================

const TILE_PICTOGRAMS: Record<number, { symbol: string; label: string; color: string }> = {
  0: { symbol: '✕', label: 'Croix', color: 'var(--color-tile-cross)' },
  1: { symbol: '○', label: 'Cercle', color: 'var(--color-tile-circle)' },
  2: { symbol: '△', label: 'Triangle', color: 'var(--color-tile-triangle)' },
  3: { symbol: '□', label: 'Carré', color: 'var(--color-tile-square)' },
};

function QuestionPreview({
  question,
  correctOptionId,
  remainingSeconds,
  isTimeUp,
  allAnswered,
  lang,
}: {
  question: CurrentQuestion;
  correctOptionId?: string;
  remainingSeconds?: number | null;
  isTimeUp?: boolean;
  allAnswered?: boolean;
  lang?: 'fr' | 'en';
}) {
  const t = labels[lang ?? 'fr'];

  // Timer color: green > 10s, orange > 3s, red <= 3s
  const timerColor = isTimeUp
    ? 'var(--color-alert-coral)'
    : (remainingSeconds ?? 0) <= 3
      ? 'var(--color-alert-coral)'
      : (remainingSeconds ?? 0) <= 10
        ? '#F59E0B'
        : 'var(--color-mint-pop)';

  const timerStatusMessage = isTimeUp
    ? t.timeUp
    : allAnswered
      ? t.allAnswered
      : null;

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        padding: '1.25rem',
        borderRadius: 'var(--radius-card)',
        background: 'white',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Question title row + inline timer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          margin: '0 0 1rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.15rem',
            margin: 0,
            color: 'var(--color-dark-slate)',
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {question.label}
        </h2>

        {/* Inline countdown */}
        {remainingSeconds !== null && remainingSeconds !== undefined && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0,
              minWidth: 48,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={remainingSeconds}
                initial={{ scale: 1.15, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.8rem',
                  color: timerColor,
                  lineHeight: 1,
                }}
              >
                {isTimeUp ? '0' : remainingSeconds}
              </motion.span>
            </AnimatePresence>
            <span
              style={{
                fontSize: '0.6rem',
                opacity: 0.5,
                fontFamily: 'var(--font-body)',
                marginTop: 2,
              }}
            >
              {timerStatusMessage ?? 'sec'}
            </span>
          </div>
        )}
      </div>

      {/* GIF / Image */}
      {question.media?.url && (
        <div
          style={{
            marginBottom: '1rem',
            borderRadius: 'var(--radius-button)',
            overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.03)',
            textAlign: 'center',
          }}
        >
          <img
            src={question.media.url}
            alt=""
            style={{
              maxWidth: '100%',
              maxHeight: 200,
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
          />
        </div>
      )}

      {/* Answer options -- 2x2 grid (Kahoot-style) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
        }}
      >
        {question.options.map((option, index) => {
          const tile = TILE_PICTOGRAMS[index] ?? TILE_PICTOGRAMS[0];
          const isCorrect = correctOptionId === option.id;

          return (
            <div
              key={option.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-button)',
                background: isCorrect
                  ? 'rgba(45, 212, 191, 0.12)'
                  : 'rgba(15, 23, 42, 0.03)',
                border: isCorrect
                  ? '2px solid var(--color-mint-pop)'
                  : '2px solid transparent',
                transition: 'all 0.2s',
                minHeight: 44,
              }}
            >
              {/* Pictogram badge */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: tile.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                }}
                aria-label={tile.label}
              >
                {tile.symbol}
              </span>

              {/* Option text */}
              <span
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: isCorrect ? 600 : 400,
                  color: 'var(--color-dark-slate)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option.text}
              </span>

              {/* Correct indicator */}
              {isCorrect && (
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-mint-pop)',
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                  aria-label="Bonne réponse"
                >
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// Shared sub-components
// ==========================================

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '1rem',
        borderRadius: 'var(--radius-card)',
        background: 'white',
        boxShadow: 'var(--shadow-card)',
        textAlign: 'center',
      }}
    >
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', color, margin: 0 }}>
        {value}
      </p>
      <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: '0.25rem 0 0' }}>{label}</p>
    </div>
  );
}

function ControlButton({
  label,
  color,
  onClick,
  pulsing,
}: {
  label: string;
  color: string;
  onClick?: () => void;
  pulsing?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      animate={pulsing ? {
        scale: [1, 1.03, 1],
        boxShadow: [
          `0 0 0 0 ${color}40`,
          `0 0 0 12px ${color}00`,
          `0 0 0 0 ${color}40`,
        ],
      } : {}}
      transition={pulsing ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
      onClick={onClick}
      style={{
        padding: '1rem',
        background: color,
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-button)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
    >
      {label}
    </motion.button>
  );
}
