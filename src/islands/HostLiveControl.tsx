import React from 'react';
import { motion } from 'framer-motion';
import type { SessionStatus } from '../types/session';

interface Props {
  sessionId: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerCount: number;
  responseCount: number;
  lang: 'fr' | 'en';
  onStart?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onShowLeaderboard?: () => void;
  onEnd?: () => void;
}

const labels = {
  fr: {
    title: 'ControlDeck',
    spot: 'Spot',
    citizens: 'Citizens',
    responses: 'Réponses',
    start: 'Démarrer',
    pause: 'Pause',
    next: 'Suivant',
    leaderboard: 'Classement',
    end: 'Terminer',
    lobby: 'Lobby',
    question: 'Question en cours',
    finished: 'Terminé',
  },
  en: {
    title: 'ControlDeck',
    spot: 'Spot',
    citizens: 'Citizens',
    responses: 'Responses',
    start: 'Start',
    pause: 'Pause',
    next: 'Next',
    leaderboard: 'Leaderboard',
    end: 'End',
    lobby: 'Lobby',
    question: 'Question active',
    finished: 'Finished',
  },
};

export default function HostLiveControl({
  status,
  currentQuestionIndex,
  totalQuestions,
  playerCount,
  responseCount,
  lang,
  onStart,
  onPause,
  onNext,
  onShowLeaderboard,
  onEnd,
}: Props) {
  const t = labels[lang];

  const statusLabel =
    status === 'lobby' ? t.lobby :
    status === 'question' ? t.question :
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

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {status === 'lobby' && (
          <ControlButton label={t.start} color="var(--color-electric-blue)" onClick={onStart} fullWidth />
        )}
        {status === 'question' && (
          <>
            <ControlButton label={t.pause} color="var(--color-violet-pulse)" onClick={onPause} />
            <ControlButton label={t.next} color="var(--color-electric-blue)" onClick={onNext} />
          </>
        )}
        {(status === 'feedback' || status === 'question') && (
          <ControlButton label={t.leaderboard} color="var(--color-mint-pop)" onClick={onShowLeaderboard} />
        )}
        <ControlButton label={t.end} color="var(--color-alert-coral)" onClick={onEnd} />
      </div>
    </div>
  );
}

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
  fullWidth,
}: {
  label: string;
  color: string;
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
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
        gridColumn: fullWidth ? '1 / -1' : undefined,
        transition: 'transform 0.15s',
      }}
    >
      {label}
    </motion.button>
  );
}
