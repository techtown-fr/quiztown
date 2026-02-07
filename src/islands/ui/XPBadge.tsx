import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  xp: number;
  isCorrect: boolean;
}

export default function XPBadge({ xp, isCorrect }: Props) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1.25rem',
        borderRadius: 'var(--radius-full)',
        background: isCorrect ? 'var(--color-mint-pop)' : 'var(--color-alert-coral)',
        color: 'white',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.25rem',
      }}
    >
      {isCorrect ? '+' : ''}{xp} XP
    </motion.div>
  );
}
