import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  progress: number; // 0 to 1
  timeLeft: number;
  size?: number;
}

export default function CountdownRing({ progress, timeLeft, size = 80 }: Props) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  // Color transitions: green -> yellow -> orange -> red
  const getColor = (p: number) => {
    if (p > 0.6) return 'var(--color-mint-pop)';
    if (p > 0.3) return '#f59e0b'; // amber
    if (p > 0.1) return '#f97316'; // orange
    return 'var(--color-alert-coral)';
  };

  const color = getColor(progress);
  const isUrgent = timeLeft <= 3 && timeLeft > 0;

  return (
    <motion.div
      style={{ position: 'relative', width: size, height: size }}
      animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
      transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: 'linear' }}
        />
      </svg>
      {/* Timer text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: size * 0.3,
          color,
        }}
      >
        {timeLeft}
      </div>
    </motion.div>
  );
}
