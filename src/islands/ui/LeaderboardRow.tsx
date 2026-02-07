import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  rank: number;
  nickname: string;
  score: number;
  isCurrentPlayer?: boolean;
  index: number;
}

const BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardRow({ rank, nickname, score, isCurrentPlayer, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
      layout
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-button)',
        background: isCurrentPlayer ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
        border: isCurrentPlayer ? '2px solid var(--color-electric-blue)' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      <span
        style={{
          width: 36,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: rank <= 3 ? '1.5rem' : '1rem',
          textAlign: 'center',
        }}
      >
        {BADGES[rank] ?? `#${rank}`}
      </span>
      <span
        style={{
          flex: 1,
          fontWeight: isCurrentPlayer ? 700 : 500,
          fontSize: '1rem',
        }}
      >
        {nickname}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--color-violet-pulse)',
        }}
      >
        {score.toLocaleString()} XP
      </span>
    </motion.div>
  );
}
