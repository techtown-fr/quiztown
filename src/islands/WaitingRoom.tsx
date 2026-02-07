import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  playerCount: number;
  lang: 'fr' | 'en';
  hostMessage?: string;
}

const labels = {
  fr: { waiting: 'En attente du Host...', citizens: 'Citizens connectés' },
  en: { waiting: 'Waiting for the Host...', citizens: 'Citizens connected' },
};

export default function WaitingRoom({ playerCount, lang, hostMessage }: Props) {
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background pulses */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: 300 + i * 100,
            height: 300 + i * 100,
            borderRadius: '50%',
            background: i === 0
              ? 'var(--color-electric-blue)'
              : i === 1
                ? 'var(--color-violet-pulse)'
                : 'var(--color-mint-pop)',
            filter: 'blur(80px)',
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 1.5rem',
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.8rem',
          }}
        >
          Q
        </motion.div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', opacity: 0.8, marginBottom: '2rem' }}>
          {t.waiting}
        </h2>

        <motion.div
          key={playerCount}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-mint-pop))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {playerCount}
        </motion.div>
        <p style={{ fontSize: '0.9rem', opacity: 0.5, marginTop: '0.25rem' }}>{t.citizens}</p>

        {hostMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-button)',
              fontSize: '0.95rem',
            }}
          >
            {hostMessage}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
