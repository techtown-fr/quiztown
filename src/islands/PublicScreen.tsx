import React from 'react';
import { motion } from 'framer-motion';
import CountdownRing from './ui/CountdownRing';

interface VoteBar {
  label: string;
  text: string;
  percentage: number;
  isCorrect?: boolean;
}

interface Props {
  question: string;
  timeLeft: number;
  timeLimit: number;
  voteBars: VoteBar[];
  showResults: boolean;
  totalVotes: number;
}

const BAR_COLORS = [
  'var(--color-electric-blue)',
  'var(--color-alert-coral)',
  'var(--color-mint-pop)',
  'var(--color-violet-pulse)',
];

export default function PublicScreen({
  question,
  timeLeft,
  timeLimit,
  voteBars,
  showResults,
  totalVotes,
}: Props) {
  const progress = timeLimit > 0 ? timeLeft / timeLimit : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'clamp(2rem, 4vw, 4rem)',
        background: 'var(--color-dark-slate)',
        color: 'var(--color-soft-white)',
        fontFamily: 'var(--font-display)',
      }}
    >
      {/* Top bar: timer + branding */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'clamp(2rem, 4vw, 4rem)',
        }}
      >
        <CountdownRing progress={progress} timeLeft={timeLeft} size={100} />
        <div style={{ opacity: 0.3, fontSize: 'clamp(0.8rem, 1.5vw, 1rem)' }}>
          QuizTown
        </div>
      </div>

      {/* Question */}
      <motion.h1
        key={question}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          lineHeight: 1.2,
          textAlign: 'center',
          marginBottom: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: 700,
        }}
      >
        {question}
      </motion.h1>

      {/* Vote Bars */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(0.75rem, 1.5vw, 1.5rem)',
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
        }}
      >
        {voteBars.map((bar, index) => (
          <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Label */}
            <span
              style={{
                width: 'clamp(36px, 4vw, 56px)',
                height: 'clamp(36px, 4vw, 56px)',
                borderRadius: 12,
                background: BAR_COLORS[index],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                flexShrink: 0,
              }}
            >
              {bar.label}
            </span>

            {/* Bar */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                style={{
                  height: 'clamp(32px, 4vw, 48px)',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bar.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    borderRadius: 10,
                    background: showResults && bar.isCorrect
                      ? 'var(--color-mint-pop)'
                      : BAR_COLORS[index],
                    opacity: showResults && !bar.isCorrect ? 0.3 : 0.8,
                  }}
                />
              </div>

              {/* Text + percentage */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 1rem',
                  fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)',
                  fontWeight: 600,
                }}
              >
                <span>{bar.text}</span>
                <span style={{ opacity: 0.7 }}>{Math.round(bar.percentage)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total votes */}
      <p
        style={{
          textAlign: 'center',
          opacity: 0.3,
          marginTop: 'clamp(1rem, 2vw, 2rem)',
          fontSize: 'clamp(0.7rem, 1vw, 0.9rem)',
        }}
      >
        {totalVotes} votes
      </p>
    </div>
  );
}
