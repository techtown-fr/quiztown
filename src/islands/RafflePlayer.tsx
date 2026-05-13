import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { joinRaffle } from '../firebase/raffle';
import { useRaffle } from '../hooks/useRaffle';
import { getRaffleIdFromLocation } from '../lib/raffleUrl';
import type { RaffleParticipant } from '../types/raffle';
import type { Lang } from '../i18n';

type PlayerPhase = 'join' | 'waiting' | 'drawing' | 'reveal' | 'finished';

interface Props {
  lang: Lang;
}

/**
 * Stable per-raffle player ID, persisted in localStorage so refreshing the
 * page doesn't create a duplicate participant.
 */
function getOrCreatePlayerId(raffleId: string): string {
  const key = `raffle-player-id:${raffleId}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh = `rp-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    // Private mode / storage disabled -- fall back to ephemeral ID
    return `rp-${Math.random().toString(36).slice(2, 10)}`;
  }
}

const labels = {
  fr: {
    title: 'Raffle',
    subtitle: 'Participez au tirage au sort !',
    namePlaceholder: 'Votre prénom...',
    join: 'PARTICIPER',
    errorEmpty: 'Entrez votre prénom',
    errorLong: '20 caractères max',
    waiting: 'Vous êtes inscrit !',
    participantCount: '{count} participants',
    drawingTitle: 'Tirage en cours...',
    drawingSubtitle: 'Qui sera le gagnant ?',
    youWon: 'Vous avez gagné !',
    prize: 'Lot',
    winnerIs: 'Le gagnant est...',
    finishedTitle: 'Merci !',
    finishedSubtitle: 'Le raffle est terminé',
    results: 'Résultats',
    noSession: 'Aucun raffle trouvé.',
    loading: 'Connexion...',
    sessionError: 'Raffle introuvable.',
    nextDraw: 'Prochain tirage bientôt...',
    notYou: 'Pas cette fois !',
    won: 'a gagné',
  },
  en: {
    title: 'Raffle',
    subtitle: 'Enter the draw!',
    namePlaceholder: 'Your first name...',
    join: 'ENTER',
    errorEmpty: 'Enter your name',
    errorLong: '20 characters max',
    waiting: "You're in!",
    participantCount: '{count} participants',
    drawingTitle: 'Drawing...',
    drawingSubtitle: 'Who will win?',
    youWon: 'You won!',
    prize: 'Prize',
    winnerIs: 'The winner is...',
    finishedTitle: 'Thanks!',
    finishedSubtitle: 'The raffle is over',
    results: 'Results',
    noSession: 'No raffle found.',
    loading: 'Connecting...',
    sessionError: 'Raffle not found.',
    nextDraw: 'Next draw coming soon...',
    notYou: 'Not this time!',
    won: 'won',
  },
};

export default function RafflePlayer({ lang }: Props): React.JSX.Element {
  const t = labels[lang];

  const [raffleId, setRaffleId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { raffle, error: raffleError } = useRaffle(raffleId);
  const [, setPlayerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Resolve raffle ID + stable player ID once on mount
  useEffect(() => {
    const id = getRaffleIdFromLocation();
    if (id) {
      setRaffleId(id);
      setPlayerId(getOrCreatePlayerId(id));
    } else {
      setJoinError(t.noSession);
    }
  }, [t.noSession]);

  // Derive the visible phase from raffle.status. The only piece of local
  // state we need is "did the user submit the join form" -- everything
  // else is dictated by the host (single source of truth).
  const phase: PlayerPhase = !hasJoined
    ? 'join'
    : raffle?.status === 'finished'
      ? 'finished'
      : raffle?.status === 'drawing'
        ? 'drawing'
        : raffle?.status === 'reveal'
          ? 'reveal'
          : 'waiting';

  const error =
    joinError ??
    (raffleError === 'not_found' ? t.sessionError : null);

  const handleJoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setInputError(t.errorEmpty);
      return;
    }
    if (trimmed.length > 20) {
      setInputError(t.errorLong);
      return;
    }
    if (!raffleId || !playerId) return;

    const participant: RaffleParticipant = {
      id: playerId,
      name: trimmed,
      joinedAt: Date.now(),
    };

    setPlayerName(trimmed);
    setHasJoined(true);

    try {
      await joinRaffle(raffleId, participant);
    } catch {
      setJoinError(lang === 'fr' ? 'Impossible de rejoindre.' : 'Failed to join.');
    }

    if (navigator.vibrate) navigator.vibrate(50);
  }, [nameInput, raffleId, playerId, lang, t]);

  // Error state
  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: '#1F2937', color: 'white',
        padding: '2rem', textAlign: 'center',
      }}>
        <p style={{ fontSize: '1.2rem', color: '#FB7185' }}>{error}</p>
      </div>
    );
  }

  // Loading
  if (!raffleId || (!raffle && phase === 'join')) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', background: '#1F2937', color: 'white',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid rgba(28,98,237,0.2)',
          borderTopColor: '#1C62ED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem',
        }} />
        <p style={{ opacity: 0.5, fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
          {t.loading}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const participantCount = Object.keys(raffle?.participants ?? {}).length;
  const didIWin = raffle?.currentWinner === playerId;
  const currentPrize = raffle?.prizes[raffle.currentDrawIndex];

  // JOIN form
  if (phase === 'join') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh', padding: '2rem 1.5rem',
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: 'white',
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          style={{
            width: 72, height: 72,
            background: '#1C62ED',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.2rem',
            marginBottom: '1.5rem',
          }}
        >
          🎁
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            margin: '0 0 0.5rem',
            color: '#3B7EFF',
          }}
        >
          {t.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.2 }}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            margin: '0 0 2rem',
          }}
        >
          {t.subtitle}
        </motion.p>

        <form onSubmit={handleJoin} style={{ width: '100%', maxWidth: 360 }}>
          <motion.input
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setInputError(''); }}
            placeholder={t.namePlaceholder}
            maxLength={20}
            autoFocus
            style={{
              width: '100%',
              padding: '1rem 1.25rem',
              fontSize: '1.1rem',
              fontFamily: "'Poppins', sans-serif",
              background: 'rgba(255,255,255,0.08)',
              border: `2px solid ${inputError ? '#FB7185' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '0.5rem',
              color: 'white',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          {inputError && (
            <p style={{ color: '#FB7185', fontSize: '0.8rem', margin: '0.5rem 0 0' }}>
              {inputError}
            </p>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: '1rem',
              fontSize: '1.2rem',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              background: '#1C62ED',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
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

  // WAITING
  if (phase === 'waiting') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: 'white', textAlign: 'center', padding: '2rem',
      }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 80, height: 80,
            background: 'rgba(28,98,237,0.15)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '1.5rem',
          }}
        >
          ✓
        </motion.div>
        <h2 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          margin: '0 0 0.5rem',
          color: '#3B7EFF',
        }}>
          {t.waiting}
        </h2>
        <p style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          opacity: 0.5,
          margin: 0,
        }}>
          {t.participantCount.replace('{count}', String(participantCount))}
        </p>
      </div>
    );
  }

  // DRAWING
  if (phase === 'drawing') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: 'white', textAlign: 'center', padding: '2rem',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 64, height: 64,
            border: '4px solid rgba(28,98,237,0.2)',
            borderTopColor: '#1C62ED',
            borderRadius: '50%',
            marginBottom: '2rem',
          }}
        />
        <h2 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
          color: '#3B7EFF',
          margin: '0 0 0.5rem',
        }}>
          {t.drawingTitle}
        </h2>
        <p style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          opacity: 0.5,
        }}>
          {t.drawingSubtitle}
        </p>
      </div>
    );
  }

  // REVEAL
  if (phase === 'reveal' && currentPrize) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh',
        background: didIWin
          ? 'linear-gradient(180deg, #1C62ED 0%, #7C3AED 100%)'
          : 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: 'white', textAlign: 'center', padding: '2rem',
      }}>
        <AnimatePresence mode="wait">
          {didIWin ? (
            <motion.div
              key="winner"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(1.8rem, 6vw, 3rem)',
                fontWeight: 700,
                margin: '0 0 0.75rem',
              }}>
                {t.youWon}
              </h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: '1rem 2rem',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '1rem',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.8rem',
                  opacity: 0.7,
                  margin: '0 0 0.25rem',
                }}>
                  {t.prize}
                </p>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                  margin: 0,
                }}>
                  🎁 {currentPrize.label}
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="loser"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🎁</div>
              <h2 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                color: '#3B7EFF',
                margin: '0 0 0.5rem',
              }}>
                {t.winnerIs}
              </h2>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                margin: '0 0 0.5rem',
              }}>
                {currentPrize.winnerName}
              </p>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.9rem',
                opacity: 0.6,
                margin: '0 0 1.5rem',
              }}>
                {t.won} <strong>{currentPrize.label}</strong>
              </p>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.85rem',
                opacity: 0.4,
              }}>
                {t.nextDraw}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // FINISHED
  if (phase === 'finished') {
    const wonPrizes = raffle?.prizes.filter((p) => p.winnerId === playerId) ?? [];

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: 'white', textAlign: 'center', padding: '2rem',
      }}>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
          color: '#3B7EFF',
          margin: '0 0 0.5rem',
        }}>
          {t.finishedTitle}
        </h1>
        <p style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.9rem',
          opacity: 0.5,
          margin: '0 0 2rem',
        }}>
          {t.finishedSubtitle}
        </p>

        {wonPrizes.length > 0 && (
          <div style={{
            padding: '1.5rem 2rem',
            background: 'rgba(28,98,237,0.15)',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '2px solid rgba(28,98,237,0.3)',
          }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.85rem',
              opacity: 0.7,
              margin: '0 0 0.5rem',
            }}>
              {t.youWon}
            </p>
            {wonPrizes.map((p) => (
              <p key={p.id} style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '1.2rem',
                margin: '0.25rem 0',
              }}>
                🎁 {p.label}
              </p>
            ))}
          </div>
        )}

        {/* All results */}
        {raffle && raffle.prizes.some((p) => p.winnerId) && (
          <div style={{
            width: '100%',
            maxWidth: 400,
            padding: '1rem',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '1rem',
          }}>
            <p style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              opacity: 0.6,
              margin: '0 0 0.75rem',
            }}>
              {t.results}
            </p>
            {raffle.prizes.filter((p) => p.winnerId).map((p) => (
              <div key={p.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontSize: '0.85rem',
              }}>
                <span style={{ fontWeight: 600 }}>{p.winnerName}</span>
                <span style={{ opacity: 0.5 }}>{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', background: '#1F2937', color: 'white',
    }}>
      <p style={{ opacity: 0.5 }}>{t.loading}</p>
    </div>
  );
}
