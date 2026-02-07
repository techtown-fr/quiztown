import React from 'react';
import { motion } from 'framer-motion';

export type VoteTileState = 'default' | 'selected' | 'locked' | 'correct' | 'incorrect';

/** PlayStation-inspired pictograms for each tile (colorblind-accessible) */
export const TILE_PICTOGRAMS = [
  { symbol: '✕', name: 'cross', ariaFr: 'Croix', ariaEn: 'Cross' },
  { symbol: '○', name: 'circle', ariaFr: 'Cercle', ariaEn: 'Circle' },
  { symbol: '△', name: 'triangle', ariaFr: 'Triangle', ariaEn: 'Triangle' },
  { symbol: '□', name: 'square', ariaFr: 'Carré', ariaEn: 'Square' },
] as const;

/** Colorblind-accessible palette with luminance variance across all CVD types */
export const TILE_COLORS = [
  { bg: '#2563EB', light: 'rgba(37, 99, 235, 0.15)' },    // Blue  (✕ Cross)
  { bg: '#F59E0B', light: 'rgba(245, 158, 11, 0.15)' },    // Orange (○ Circle)
  { bg: '#10B981', light: 'rgba(16, 185, 129, 0.15)' },     // Emerald (△ Triangle)
  { bg: '#EC4899', light: 'rgba(236, 72, 153, 0.15)' },     // Pink  (□ Square)
];

interface Props {
  label: string;
  text: string;
  state: VoteTileState;
  colorIndex: number;
  disabled?: boolean;
  lang?: 'fr' | 'en';
  onClick?: () => void;
}

export default function VoteTile({ label, text, state, colorIndex, disabled, lang = 'fr', onClick }: Props) {
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length];
  const pictogram = TILE_PICTOGRAMS[colorIndex % TILE_PICTOGRAMS.length];
  const pictogramLabel = lang === 'fr' ? pictogram.ariaFr : pictogram.ariaEn;

  const getStateStyles = (): React.CSSProperties => {
    switch (state) {
      case 'selected':
        return { background: color.bg, color: 'white', borderColor: color.bg };
      case 'locked':
        return { background: color.light, opacity: 0.6, borderColor: 'transparent' };
      case 'correct':
        return { background: 'var(--color-mint-pop)', color: 'white', borderColor: 'var(--color-mint-pop)' };
      case 'incorrect':
        return { background: 'var(--color-alert-coral)', color: 'white', borderColor: 'var(--color-alert-coral)' };
      default:
        return { background: color.light, borderColor: 'transparent' };
    }
  };

  const variants = {
    tap: { scale: 0.95 },
    correct: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 },
    },
    incorrect: {
      x: [0, -8, 8, -8, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || state === 'locked'}
      whileTap={state === 'default' ? 'tap' : undefined}
      animate={state === 'correct' ? 'correct' : state === 'incorrect' ? 'incorrect' : undefined}
      variants={variants}
      aria-label={`${lang === 'fr' ? 'Réponse' : 'Answer'} ${label} - ${pictogramLabel}: ${text}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '1rem 1.25rem',
        border: '2px solid',
        borderRadius: 'var(--radius-card)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
        fontWeight: 600,
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        ...getStateStyles(),
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: state === 'default' ? color.bg : 'rgba(255,255,255,0.2)',
          color: 'white',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1rem',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {pictogram.symbol}
      </span>
      <span>{text}</span>
    </motion.button>
  );
}
