import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { BadgeId } from '../types/session';

interface Props {
  sessionId: string;
  lang: 'fr' | 'en';
  onJoin?: (nickname: string, badge: BadgeId) => void;
}

const BADGES: { id: BadgeId; emoji: string }[] = [
  { id: 'rocket', emoji: '🚀' },
  { id: 'star', emoji: '⭐' },
  { id: 'lightning', emoji: '⚡' },
  { id: 'fire', emoji: '🔥' },
  { id: 'brain', emoji: '🧠' },
  { id: 'heart', emoji: '❤️' },
];

const labels = {
  fr: {
    title: 'Join the Town',
    nickname: 'Ton pseudo...',
    badge: 'Choisis ton badge',
    join: 'JOIN',
    errorEmpty: 'Entre un pseudo',
    errorLong: '12 caractères max',
  },
  en: {
    title: 'Join the Town',
    nickname: 'Your nickname...',
    badge: 'Choose your badge',
    join: 'JOIN',
    errorEmpty: 'Enter a nickname',
    errorLong: '12 characters max',
  },
};

export default function JoinForm({ sessionId, lang, onJoin }: Props) {
  const t = labels[lang];
  const [nickname, setNickname] = useState('');
  const [badge, setBadge] = useState<BadgeId>('rocket');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();

    if (!trimmed) {
      setError(t.errorEmpty);
      return;
    }
    if (trimmed.length > 12) {
      setError(t.errorLong);
      return;
    }

    setError('');
    onJoin?.(trimmed, badge);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        padding: '2rem 1.5rem',
        background: 'var(--color-dark-slate)',
        color: 'var(--color-soft-white)',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1.8rem',
          color: 'white',
          marginBottom: '1.5rem',
        }}
      >
        Q
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          margin: '0 0 2rem',
          background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {t.title}
      </motion.h1>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 360 }}>
        {/* Nickname */}
        <motion.input
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(''); }}
          placeholder={t.nickname}
          maxLength={12}
          autoFocus
          style={{
            width: '100%',
            padding: '1rem 1.25rem',
            fontSize: '1.1rem',
            fontFamily: 'var(--font-body)',
            background: 'rgba(255,255,255,0.08)',
            border: `2px solid ${error ? 'var(--color-alert-coral)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 'var(--radius-button)',
            color: 'var(--color-soft-white)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
        />
        {error && (
          <p style={{ color: 'var(--color-alert-coral)', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
            {error}
          </p>
        )}

        {/* Badge Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ margin: '1.5rem 0' }}
        >
          <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>{t.badge}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {BADGES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBadge(b.id)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `3px solid ${badge === b.id ? 'var(--color-electric-blue)' : 'rgba(255,255,255,0.1)'}`,
                  background: badge === b.id ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.05)',
                  fontSize: '1.4rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
                  transform: badge === b.id ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {b.emoji}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Submit */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.2rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {t.join}
        </motion.button>
      </form>
    </div>
  );
}
