import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRaffle } from '../hooks/useRaffle';
import { useQrCode } from '../hooks/useQrCode';
import { useRoulette } from '../hooks/useRoulette';
import { getRaffleScreenIdFromLocation } from '../lib/raffleUrl';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
}

const labels = {
  fr: {
    title: 'Raffle',
    scan: 'Scannez pour participer',
    participants: 'participants',
    drawing: 'Tirage en cours...',
    winner: 'Gagnant',
    won: 'a gagné',
    finished: 'Merci à tous !',
    results: 'Résultats',
    nextPrize: 'Prochain lot',
    waitingHost: 'En attente du tirage...',
  },
  en: {
    title: 'Raffle',
    scan: 'Scan to participate',
    participants: 'participants',
    drawing: 'Drawing...',
    winner: 'Winner',
    won: 'won',
    finished: 'Thanks everyone!',
    results: 'Results',
    nextPrize: 'Next prize',
    waitingHost: 'Waiting for draw...',
  },
};

export default function RaffleScreen({ lang }: Props): React.JSX.Element {
  const t = labels[lang];

  const [raffleId, setRaffleId] = useState<string | null>(null);
  const { raffle, error: raffleError } = useRaffle(raffleId);
  const error = raffleError === 'not_found'
    ? (lang === 'fr' ? 'Raffle introuvable.' : 'Raffle not found.')
    : null;

  useEffect(() => {
    setRaffleId(getRaffleScreenIdFromLocation());
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = raffleId ? `${origin}/raffle/${raffleId}` : '';
  const qrDataUrl = useQrCode(joinUrl, { width: 400, margin: 3, dark: '#1C62ED' });

  // ==========================================
  // Roulette -- the host writes the chosen winner to `currentWinner` BEFORE
  // we start spinning, so the wheel lands deterministically on the right name
  // and the reveal step shows the same person. No more bait-and-switch.
  // ==========================================
  const participantNames = useMemo(
    () => raffle ? Object.values(raffle.participants).map((p) => p.name) : [],
    [raffle]
  );

  const isDrawing = raffle?.status === 'drawing';
  const winnerIndex = isDrawing && raffle?.currentWinner
    ? Object.values(raffle.participants).findIndex((p) => p.id === raffle.currentWinner)
    : -1;

  const { displayedName: rollingName } = useRoulette({
    names: participantNames,
    winnerIndex: isDrawing && winnerIndex >= 0 ? winnerIndex : null,
    spinKey: isDrawing && raffle?.currentWinner
      ? `${raffle.currentDrawIndex}:${raffle.currentWinner}`
      : null,
  });

  if (error) {
    return (
      <div style={screenBase}>
        <p style={{ fontSize: '1.5rem', color: '#FB7185' }}>{error}</p>
      </div>
    );
  }

  if (!raffle) {
    return (
      <div style={screenBase}>
        <div style={{
          width: 60, height: 60,
          border: '4px solid rgba(28,98,237,0.2)',
          borderTopColor: '#1C62ED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const participantCount = Object.keys(raffle.participants).length;
  const currentPrize = raffle.prizes[raffle.currentDrawIndex];
  const nextPrize = raffle.prizes.find((p) => !p.winnerId);

  // LOBBY -- big QR + participant counter
  if (raffle.status === 'lobby') {
    return (
      <div style={screenBase}>
        {/* Branding */}
        <div style={{
          position: 'absolute',
          top: 'clamp(1.5rem, 3vw, 3rem)',
          left: 'clamp(1.5rem, 3vw, 3rem)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          opacity: 0.6,
        }}>
          <span style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)' }}>🎁</span>
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
          }}>
            {t.title}
          </span>
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <img
              src={qrDataUrl}
              alt={t.scan}
              style={{
                width: 'clamp(200px, 30vw, 400px)',
                height: 'clamp(200px, 30vw, 400px)',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(28,98,237,0.2)',
              }}
            />
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 'clamp(1.2rem, 3vw, 2rem)',
            color: '#3B7EFF',
            margin: '2rem 0 0.5rem',
          }}
        >
          {t.scan}
        </motion.p>

        <p style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
          opacity: 0.4,
          margin: '0 0 2rem',
        }}>
          {joinUrl}
        </p>

        {/* Participant counter */}
        <motion.div
          key={participantCount}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          style={{
            padding: '1rem 3rem',
            background: 'rgba(28,98,237,0.1)',
            borderRadius: '9999px',
            border: '2px solid rgba(28,98,237,0.2)',
          }}
        >
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 4vw, 3rem)',
            color: '#1C62ED',
          }}>
            {participantCount}
          </span>
          <span style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)',
            opacity: 0.6,
            marginLeft: '0.75rem',
          }}>
            {t.participants}
          </span>
        </motion.div>

        {/* Next prize preview */}
        {nextPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              marginTop: '2rem',
              padding: '0.75rem 2rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '0.75rem',
            }}
          >
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
              opacity: 0.5,
            }}>
              {t.nextPrize}:
            </span>{' '}
            <span style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
            }}>
              🎁 {nextPrize.label}
            </span>
          </motion.div>
        )}
      </div>
    );
  }

  // DRAWING -- roulette animation
  if (raffle.status === 'drawing') {
    return (
      <div style={screenBase}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            marginBottom: '2rem',
          }}
        >
          {t.drawing}
        </motion.p>

        {/* Prize being drawn */}
        {nextPrize && (
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            opacity: 0.4,
            marginBottom: '2rem',
          }}>
            🎁 {nextPrize.label}
          </p>
        )}

        {/* Rolling name */}
        <div style={{
          padding: '2rem 4rem',
          background: 'rgba(28,98,237,0.1)',
          borderRadius: '1rem',
          border: '3px solid rgba(28,98,237,0.3)',
          minWidth: 'clamp(300px, 40vw, 500px)',
          textAlign: 'center',
        }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={rollingName}
              initial={{ opacity: 0.3, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.06 }}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(2rem, 6vw, 5rem)',
                margin: 0,
                color: '#3B7EFF',
              }}
            >
              {rollingName || '...'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // REVEAL -- winner name + prize
  if (raffle.status === 'reveal' && currentPrize) {
    return (
      <div style={{
        ...screenBase,
        background: 'linear-gradient(135deg, #1C62ED 0%, #7C3AED 100%)',
      }}>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            marginBottom: '1rem',
          }}>
            🎉
          </div>

          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            opacity: 0.8,
            margin: '0 0 0.5rem',
          }}>
            {t.winner}
          </p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(3rem, 10vw, 8rem)',
              margin: '0 0 1rem',
              lineHeight: 1.1,
              textShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            {currentPrize.winnerName}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              padding: '1rem 3rem',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              display: 'inline-block',
            }}
          >
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: 'clamp(1rem, 2.5vw, 1.8rem)',
              margin: 0,
            }}>
              {t.won} <strong>🎁 {currentPrize.label}</strong>
            </p>
          </motion.div>
        </motion.div>

        {/* Past winners in bottom corner */}
        {raffle.prizes.filter((p) => p.winnerId && p.id !== currentPrize.id).length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: 'clamp(1rem, 2vw, 2rem)',
            right: 'clamp(1rem, 2vw, 2rem)',
            textAlign: 'right',
            opacity: 0.5,
          }}>
            {raffle.prizes.filter((p) => p.winnerId && p.id !== currentPrize.id).map((p) => (
              <p key={p.id} style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(0.7rem, 1vw, 0.9rem)',
                margin: '0.2rem 0',
              }}>
                {p.winnerName} — {p.label}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // FINISHED -- all results
  if (raffle.status === 'finished') {
    return (
      <div style={screenBase}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', maxWidth: 800 }}
        >
          <div style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700,
            color: '#3B7EFF',
            margin: '0 0 2rem',
          }}>
            {t.finished}
          </h1>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1rem',
            padding: '2rem',
          }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
              opacity: 0.5,
              margin: '0 0 1.5rem',
            }}>
              {t.results}
            </p>
            {raffle.prizes.filter((p) => p.winnerId).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  marginBottom: '0.5rem',
                  background: 'rgba(28,98,237,0.08)',
                  borderRadius: '0.75rem',
                }}
              >
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                }}>
                  {p.winnerName}
                </span>
                <span style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)',
                  opacity: 0.6,
                }}>
                  🎁 {p.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback
  return (
    <div style={screenBase}>
      <p style={{ opacity: 0.4, fontFamily: "'Poppins', sans-serif" }}>{t.waitingHost}</p>
    </div>
  );
}

const screenBase: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 'clamp(2rem, 4vw, 4rem)',
  background: '#1F2937',
  color: 'white',
  fontFamily: "'Poppins', sans-serif",
  position: 'relative',
  overflow: 'hidden',
};
