import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoteTile, { type VoteTileState } from './ui/VoteTile';
import CountdownRing from './ui/CountdownRing';
import { useCountdown } from '../hooks/useCountdown';

interface QuestionOption {
  id: string;
  text: string;
}

interface Props {
  question: string;
  options: QuestionOption[];
  timeLimit: number;
  lang: 'fr' | 'en';
  onAnswer?: (optionId: string) => void;
  onTimeUp?: () => void;
}

import { TILE_PICTOGRAMS } from './ui/VoteTile';

const LABELS = ['A', 'B', 'C', 'D'];

export default function PlayerBuzzer({
  question,
  options,
  timeLimit,
  lang,
  onAnswer,
  onTimeUp,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const { timeLeft, progress } = useCountdown({
    duration: timeLimit,
    autoStart: true,
    onComplete: () => {
      if (!isLocked) {
        setIsLocked(true);
        onTimeUp?.();
      }
    },
  });

  const handleSelect = useCallback(
    (optionId: string) => {
      if (isLocked || selectedId) return;

      setSelectedId(optionId);
      setIsLocked(true);

      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);

      onAnswer?.(optionId);
    },
    [isLocked, selectedId, onAnswer]
  );

  const getState = (optionId: string): VoteTileState => {
    if (isLocked && selectedId === optionId) return 'selected';
    if (isLocked) return 'locked';
    return 'default';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        padding: '1.5rem',
        background: 'var(--color-dark-slate)',
        color: 'var(--color-soft-white)',
      }}
    >
      {/* Countdown */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <CountdownRing progress={progress} timeLeft={timeLeft} size={72} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={question}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
            textAlign: 'center',
            lineHeight: 1.3,
            marginBottom: '2rem',
            flex: 0,
          }}
        >
          {question}
        </motion.h1>
      </AnimatePresence>

      {/* Vote Tiles -- 2x2 grid (Kahoot-style) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          flex: 1,
          alignContent: 'center',
          maxWidth: 600,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {options.map((option, index) => (
          <VoteTile
            key={option.id}
            label={LABELS[index]}
            text={option.text}
            state={getState(option.id)}
            colorIndex={index}
            disabled={isLocked}
            lang={lang}
            onClick={() => handleSelect(option.id)}
          />
        ))}
      </div>

      {/* Lock indicator */}
      {isLocked && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            opacity: 0.5,
            marginTop: '1rem',
          }}
        >
          {lang === 'fr' ? 'Vote verrouillé !' : 'Vote locked!'}
        </motion.p>
      )}
    </div>
  );
}
