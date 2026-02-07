import React from 'react';
import { motion } from 'framer-motion';
import LeaderboardRow from './ui/LeaderboardRow';
import type { Player } from '../types/session';
import { useLeaderboard } from '../hooks/useLeaderboard';

interface Props {
  players: Record<string, Player>;
  currentPlayerId?: string;
  lang: 'fr' | 'en';
}

const labels = {
  fr: { title: 'Classement', yourPosition: 'Ta position' },
  en: { title: 'Leaderboard', yourPosition: 'Your position' },
};

export default function Leaderboard({ players, currentPlayerId, lang }: Props) {
  const t = labels[lang];
  const { leaderboard, currentPlayerRank, totalPlayers } = useLeaderboard({
    players,
    currentPlayerId,
    topN: 5,
  });

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
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {t.title}
      </motion.h2>

      <div style={{ width: '100%', maxWidth: 500 }}>
        {leaderboard.map((entry, index) => (
          <LeaderboardRow
            key={entry.id}
            rank={entry.rank}
            nickname={entry.nickname}
            score={entry.score}
            isCurrentPlayer={entry.id === currentPlayerId}
            index={index}
          />
        ))}
      </div>

      {/* Current player position (if not in top 5) */}
      {currentPlayerRank && currentPlayerRank > 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            borderRadius: 'var(--radius-button)',
            background: 'rgba(37, 99, 235, 0.1)',
            border: '2px solid var(--color-electric-blue)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: '0 0 0.25rem' }}>{t.yourPosition}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>
            #{currentPlayerRank} <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>/ {totalPlayers}</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}
