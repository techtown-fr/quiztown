import React from 'react';
import { motion } from 'framer-motion';
import XPBadge from './ui/XPBadge';

interface Props {
  isCorrect: boolean;
  xpEarned: number;
  streak: number;
  rank: number;
  totalPlayers: number;
  lang: 'fr' | 'en';
}

const labels = {
  fr: {
    correct: 'Correct !',
    incorrect: 'Raté !',
    streak: 'Streak',
    position: 'Position',
  },
  en: {
    correct: 'Correct!',
    incorrect: 'Wrong!',
    streak: 'Streak',
    position: 'Position',
  },
};

export default function FeedbackScreen({
  isCorrect,
  xpEarned,
  streak,
  rank,
  totalPlayers,
  lang,
}: Props) {
  const t = labels[lang];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '2rem',
        background: 'var(--color-dark-slate)',
        color: 'var(--color-soft-white)',
        textAlign: 'center',
      }}
    >
      {/* Result icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: isCorrect ? 'var(--color-mint-pop)' : 'var(--color-alert-coral)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          marginBottom: '1.5rem',
        }}
      >
        {isCorrect ? '✓' : '✕'}
      </motion.div>

      {/* Result text */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: isCorrect ? 'var(--color-mint-pop)' : 'var(--color-alert-coral)',
          marginBottom: '1rem',
        }}
      >
        {isCorrect ? t.correct : t.incorrect}
      </motion.h2>

      {/* XP Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '1.5rem' }}
      >
        <XPBadge xp={xpEarned} isCorrect={isCorrect} />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'flex', gap: '2rem' }}
      >
        {streak > 1 && (
          <div>
            <p style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
              x{streak}
            </p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>{t.streak}</p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: 700, margin: 0 }}>
            {rank} <span style={{ fontSize: '0.9rem', opacity: 0.4 }}>/ {totalPlayers}</span>
          </p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>{t.position}</p>
        </div>
      </motion.div>
    </div>
  );
}
