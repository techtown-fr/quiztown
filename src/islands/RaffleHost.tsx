import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthGuard from './AuthGuard';
import { useAuth } from '../hooks/useAuth';
import { useRaffle } from '../hooks/useRaffle';
import { useHostRaffles } from '../hooks/useHostRaffles';
import { useQrCode } from '../hooks/useQrCode';
import { useRoulette } from '../hooks/useRoulette';
import {
  createRaffle,
  deleteRaffle,
  setPrizes,
  startDrawing,
  revealWinner,
  updateRaffleStatus,
} from '../firebase/raffle';
import type { Raffle, RafflePrize, RaffleStatus } from '../types/raffle';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
}

const labels = {
  fr: {
    title: 'Raffle',
    createRaffle: 'Créer un Raffle',
    prizes: 'Lots à gagner',
    addPrize: 'Ajouter',
    prizePlaceholder: 'Ex: T-shirt, Stickers, Mug...',
    participants: 'Participants',
    draw: 'Tirer au sort !',
    nextDraw: 'Lot suivant',
    finish: 'Terminer',
    drawing: 'Tirage en cours...',
    winner: 'Gagnant',
    won: 'a gagné',
    scan: 'Scannez pour participer',
    joinLink: 'Ou utilisez ce lien :',
    copy: 'Copier',
    copied: 'Copié !',
    noPrizes: 'Ajoutez au moins un lot',
    noParticipants: 'En attente de participants...',
    allDrawn: 'Tous les lots ont été attribués !',
    history: 'Résultats',
    backDashboard: 'Retour au dashboard',
    screenLink: 'Ouvrir l\'écran de projection',
    remove: 'Retirer',
    lobby: 'Lobby',
    drawStatus: 'Tirage',
    reveal: 'Résultat',
    finished: 'Terminé',
    recentRaffles: 'Raffles récents',
    noRecentRaffles: 'Aucun raffle pour le moment',
    openRaffle: 'Ouvrir',
    prizesDrawn: 'lots tirés',
    deleteRaffle: 'Supprimer',
    confirmDelete: 'Supprimer ce raffle ? Cette action est irréversible.',
  },
  en: {
    title: 'Raffle',
    createRaffle: 'Create a Raffle',
    prizes: 'Prizes',
    addPrize: 'Add',
    prizePlaceholder: 'E.g. T-shirt, Stickers, Mug...',
    participants: 'Participants',
    draw: 'Draw winner!',
    nextDraw: 'Next prize',
    finish: 'Finish',
    drawing: 'Drawing...',
    winner: 'Winner',
    won: 'won',
    scan: 'Scan to participate',
    joinLink: 'Or use this link:',
    copy: 'Copy',
    copied: 'Copied!',
    noPrizes: 'Add at least one prize',
    noParticipants: 'Waiting for participants...',
    allDrawn: 'All prizes have been drawn!',
    history: 'Results',
    backDashboard: 'Back to dashboard',
    screenLink: 'Open projection screen',
    remove: 'Remove',
    lobby: 'Lobby',
    drawStatus: 'Drawing',
    reveal: 'Result',
    finished: 'Finished',
    recentRaffles: 'Recent raffles',
    noRecentRaffles: 'No raffles yet',
    openRaffle: 'Open',
    prizesDrawn: 'prizes drawn',
    deleteRaffle: 'Delete',
    confirmDelete: 'Delete this raffle? This action cannot be undone.',
  },
};

type Labels = typeof labels.fr;

function getStatusLabel(status: RaffleStatus, t: Labels): string {
  if (status === 'lobby') return t.lobby;
  if (status === 'drawing') return t.drawStatus;
  if (status === 'reveal') return t.reveal;
  return t.finished;
}

function RecentRafflesList({
  lang,
  raffles,
  onOpen,
  onDelete,
}: {
  lang: Lang;
  raffles: Raffle[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}): React.JSX.Element | null {
  const t = labels[lang];
  if (raffles.length === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section style={{ marginTop: '3rem', textAlign: 'left' }} aria-label={t.recentRaffles}>
      <h2 style={{
        fontFamily: "'Poppins', var(--font-display)",
        fontWeight: 600,
        fontSize: '0.95rem',
        color: '#6B7280',
        margin: '0 0 0.75rem',
      }}>
        {t.recentRaffles}
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
        {raffles.map((r) => {
          const drawn = r.prizes.filter((p) => p.winnerId).length;
          const total = r.prizes.length;
          const participantCount = Object.keys(r.participants).length;
          return (
            <li key={r.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
              <button
                type="button"
                onClick={() => onOpen(r.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'Poppins', var(--font-body)",
                  transition: 'border-color 0.15s, transform 0.15s',
                  minWidth: 0,
                }}
                aria-label={`${t.openRaffle} -- ${dateFmt.format(r.createdAt)}`}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#1F2937',
                  }}>
                    {dateFmt.format(r.createdAt)}
                  </p>
                  <p style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.75rem',
                    color: '#6B7280',
                  }}>
                    {participantCount} {t.participants.toLowerCase()} · {drawn}/{total} {t.prizesDrawn}
                  </p>
                </div>
                <span style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: 'rgba(28,98,237,0.1)',
                  color: '#1C62ED',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap',
                }}>
                  {getStatusLabel(r.status, t)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(r.id)}
                style={{
                  padding: '0 0.85rem',
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.75rem',
                  color: 'var(--color-alert-coral, #FB7185)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'border-color 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                aria-label={`${t.deleteRaffle} -- ${dateFmt.format(r.createdAt)}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RaffleHostContent({ lang }: Props): React.JSX.Element {
  const { user } = useAuth();
  const t = labels[lang];
  const homeHref = lang === 'en' ? '/en/host' : '/host';

  const [raffleId, setRaffleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { raffle, error: raffleError } = useRaffle(raffleId);
  const { raffles: recentRaffles } = useHostRaffles(
    raffleId ? null : (user?.uid ?? null),
  );
  const error = createError ?? (raffleError === 'not_found'
    ? (lang === 'fr' ? 'Raffle introuvable.' : 'Raffle not found.')
    : null);

  const openRaffle = useCallback((id: string) => {
    setRaffleId(id);
    window.history.replaceState({}, '', `?id=${id}`);
  }, []);

  const handleDeleteRaffle = useCallback(async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteRaffle(id);
    } catch {
      /* deletion errors are non-blocking; the listener will keep the list consistent */
    }
  }, [t.confirmDelete]);

  const [newPrize, setNewPrize] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) setRaffleId(id);
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const joinUrl = raffleId ? `${origin}/raffle/demo?id=${raffleId}` : '';
  const screenUrl = raffleId ? `${origin}/raffle/screen/demo?id=${raffleId}` : '';
  const qrDataUrl = useQrCode(joinUrl, { width: 200, dark: '#1C62ED' });

  // ==========================================
  // Roulette -- driven by `currentWinner` in DB so host & screen stay in sync.
  // The winner is chosen UPFRONT in `handleDraw` and written via
  // `startDrawing`, so the wheel always lands on the recorded name.
  // ==========================================
  const eligibleParticipants = useMemo(() => {
    if (!raffle) return [];
    const alreadyWon = new Set(
      raffle.prizes.filter((p) => p.winnerId).map((p) => p.winnerId)
    );
    return Object.values(raffle.participants).filter((p) => !alreadyWon.has(p.id));
  }, [raffle]);

  const isDrawing = raffle?.status === 'drawing';
  const winnerIndex = isDrawing && raffle?.currentWinner
    ? eligibleParticipants.findIndex((p) => p.id === raffle.currentWinner)
    : -1;

  const handleSettle = useCallback(() => {
    if (!raffleId || !raffle || !raffle.currentWinner) return;
    const winnerId = raffle.currentWinner;
    const winner = Object.values(raffle.participants).find((p) => p.id === winnerId);
    if (!winner) return;
    const updatedPrizes = raffle.prizes.map((p, i) =>
      i === raffle.currentDrawIndex
        ? { ...p, winnerId: winner.id, winnerName: winner.name }
        : p
    );
    revealWinner(raffleId, updatedPrizes).catch(() => {});
  }, [raffleId, raffle]);

  const { displayedName: rollingName, isRolling } = useRoulette({
    names: eligibleParticipants.map((p) => p.name),
    winnerIndex: isDrawing && winnerIndex >= 0 ? winnerIndex : null,
    spinKey: isDrawing && raffle?.currentWinner
      ? `${raffle.currentDrawIndex}:${raffle.currentWinner}`
      : null,
    onSettle: handleSettle,
  });

  const handleCreate = useCallback(async () => {
    if (!user) return;
    try {
      setCreating(true);
      const id = await createRaffle(user.uid);
      openRaffle(id);
    } catch {
      setCreateError(lang === 'fr' ? 'Erreur lors de la création.' : 'Failed to create raffle.');
    } finally {
      setCreating(false);
    }
  }, [user, lang, openRaffle]);

  const handleAddPrize = useCallback(() => {
    if (!raffleId || !raffle || !newPrize.trim()) return;
    const prize: RafflePrize = {
      id: `prize-${Date.now()}`,
      label: newPrize.trim(),
      winnerId: null,
      winnerName: null,
    };
    setPrizes(raffleId, [...raffle.prizes, prize]).catch(() => {});
    setNewPrize('');
  }, [raffleId, raffle, newPrize]);

  const handleRemovePrize = useCallback((prizeId: string) => {
    if (!raffleId || !raffle) return;
    setPrizes(raffleId, raffle.prizes.filter((p) => p.id !== prizeId)).catch(() => {});
  }, [raffleId, raffle]);

  const handleDraw = useCallback(async () => {
    if (!raffleId || !raffle || isRolling) return;
    if (eligibleParticipants.length === 0) return;

    const nextPrizeIndex = raffle.prizes.findIndex((p) => !p.winnerId);
    if (nextPrizeIndex === -1) return;

    // Pick the winner UPFRONT and broadcast it so every screen lands on the
    // same name -- this is what makes the roulette deterministic.
    const winner = eligibleParticipants[
      Math.floor(Math.random() * eligibleParticipants.length)
    ];
    await startDrawing(raffleId, nextPrizeIndex, winner.id);
  }, [raffleId, raffle, isRolling, eligibleParticipants]);

  const handleFinish = useCallback(async () => {
    if (!raffleId) return;
    await updateRaffleStatus(raffleId, 'finished');
  }, [raffleId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be unavailable; the link is still readable on screen */
    }
  }, [joinUrl]);

  // No raffle yet: show create button
  if (!raffleId) {
    return (
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 2rem',
          background: '#1C62ED',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
        }}>
          🎁
        </div>
        <h1 style={{
          fontFamily: "'Poppins', var(--font-display)",
          fontSize: 'clamp(1.5rem, 4vw, 2rem)',
          color: '#1F2937',
          marginBottom: '1rem',
        }}>
          {t.title}
        </h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          style={{
            padding: '1rem 2.5rem',
            background: '#1C62ED',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: creating ? 'not-allowed' : 'pointer',
            opacity: creating ? 0.7 : 1,
            transition: 'background 0.2s',
          }}
        >
          {creating ? '...' : t.createRaffle}
        </button>

        <RecentRafflesList
          lang={lang}
          raffles={recentRaffles}
          onOpen={openRaffle}
          onDelete={handleDeleteRaffle}
        />
      </div>
    );
  }

  // Loading
  if (!raffle) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div style={{
          width: 40, height: 40,
          border: '4px solid rgba(28,98,237,0.2)',
          borderTopColor: '#1C62ED',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#FB7185' }}>
        {error}
      </div>
    );
  }

  const participantCount = Object.keys(raffle.participants).length;
  const nextPrizeIndex = raffle.prizes.findIndex((p) => !p.winnerId);
  const allDrawn = raffle.prizes.length > 0 && nextPrizeIndex === -1;
  const alreadyWon = new Set(raffle.prizes.filter((p) => p.winnerId).map((p) => p.winnerId));
  const eligibleCount = Object.values(raffle.participants).filter((p) => !alreadyWon.has(p.id)).length;

  const canDraw = participantCount > 0 && raffle.prizes.length > 0 && !allDrawn && eligibleCount > 0;

  const statusLabel = getStatusLabel(raffle.status, t);

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{
          fontFamily: "'Poppins', var(--font-display)",
          fontSize: '1.5rem',
          margin: 0,
          color: '#1F2937',
        }}>
          🎁 {t.title}
        </h1>
        <span style={{
          padding: '0.35rem 1rem',
          borderRadius: '9999px',
          background: 'rgba(28,98,237,0.1)',
          color: '#1C62ED',
          fontFamily: "'Poppins', var(--font-display)",
          fontWeight: 600,
          fontSize: '0.8rem',
        }}>
          {statusLabel}
        </span>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          padding: '1rem',
          borderRadius: '1rem',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 700,
            fontSize: '1.5rem',
            color: '#1C62ED',
            margin: 0,
          }}>
            {participantCount}
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: '0.25rem 0 0' }}>
            {t.participants}
          </p>
        </div>
        <div style={{
          padding: '1rem',
          borderRadius: '1rem',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 700,
            fontSize: '1.5rem',
            color: '#7C3AED',
            margin: 0,
          }}>
            {raffle.prizes.filter((p) => p.winnerId).length} / {raffle.prizes.length}
          </p>
          <p style={{ fontSize: '0.75rem', opacity: 0.5, margin: '0.25rem 0 0' }}>
            {t.prizes}
          </p>
        </div>
      </div>

      {/* QR Code + Join Link */}
      {(raffle.status === 'lobby' || raffle.status === 'reveal') && (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderRadius: '1rem',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        }}>
          {qrDataUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <img
                src={qrDataUrl}
                alt={`QR Code - ${t.scan}`}
                style={{ width: 180, height: 180, borderRadius: 8 }}
              />
            </div>
          )}
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 600,
            fontSize: '0.95rem',
            color: '#1C62ED',
            margin: '0 0 0.75rem',
          }}>
            {t.scan}
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <code style={{
              fontSize: '0.7rem',
              background: 'rgba(28,98,237,0.05)',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid rgba(28,98,237,0.15)',
              wordBreak: 'break-all',
            }}>
              {joinUrl}
            </code>
            <button
              onClick={handleCopy}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontFamily: "'Poppins', var(--font-display)",
                fontWeight: 600,
                background: copied ? '#10B981' : '#1C62ED',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
          {screenUrl && (
            <a
              href={screenUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                fontSize: '0.8rem',
                color: '#6B7280',
                textDecoration: 'underline',
              }}
            >
              {t.screenLink}
            </a>
          )}
        </div>
      )}

      {/* Prize Editor (lobby only) */}
      {raffle.status === 'lobby' && (
        <div style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderRadius: '1rem',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        }}>
          <h3 style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 600,
            fontSize: '0.95rem',
            margin: '0 0 1rem',
            color: '#1F2937',
          }}>
            🎁 {t.prizes}
          </h3>

          {/* Add prize input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={newPrize}
              onChange={(e) => setNewPrize(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddPrize(); }}
              placeholder={t.prizePlaceholder}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                fontFamily: "'Poppins', var(--font-body)",
                border: '2px solid #E5E7EB',
                borderRadius: '0.5rem',
                outline: 'none',
                transition: 'border-color 0.15s',
                color: '#1F2937',
              }}
            />
            <button
              onClick={handleAddPrize}
              disabled={!newPrize.trim()}
              style={{
                padding: '0.75rem 1.25rem',
                background: newPrize.trim() ? '#1C62ED' : '#E5E7EB',
                color: newPrize.trim() ? 'white' : '#9CA3AF',
                border: 'none',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', var(--font-display)",
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: newPrize.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              {t.addPrize}
            </button>
          </div>

          {/* Prize list */}
          <AnimatePresence>
            {raffle.prizes.map((prize) => (
              <motion.div
                key={prize.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.75rem',
                  marginBottom: '0.5rem',
                  borderRadius: '0.5rem',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                }}
              >
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#1F2937',
                }}>
                  🎁 {prize.label}
                </span>
                <button
                  onClick={() => handleRemovePrize(prize.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'transparent',
                    color: '#FB7185',
                    border: 'none',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                  }}
                  aria-label={`${t.remove} ${prize.label}`}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {raffle.prizes.length === 0 && (
            <p style={{ fontSize: '0.85rem', opacity: 0.4, textAlign: 'center', margin: '0.5rem 0 0' }}>
              {t.noPrizes}
            </p>
          )}
        </div>
      )}

      {/* Drawing Animation */}
      {(raffle.status === 'drawing' || isRolling) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '2rem',
            marginBottom: '1.5rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #1C62ED, #7C3AED)',
            color: 'white',
          }}
        >
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontSize: '0.85rem',
            opacity: 0.7,
            margin: '0 0 0.5rem',
          }}>
            {t.drawing}
          </p>
          <motion.p
            key={rollingName}
            initial={{ opacity: 0.5, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontFamily: "'Poppins', var(--font-display)",
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              margin: 0,
            }}
          >
            {rollingName || '...'}
          </motion.p>
        </motion.div>
      )}

      {/* Winner Reveal */}
      {raffle.status === 'reveal' && raffle.currentWinner && !isRolling && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            textAlign: 'center',
            padding: '2rem',
            marginBottom: '1.5rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, #1C62ED, #3B7EFF)',
            color: 'white',
            boxShadow: '0 10px 40px rgba(28,98,237,0.3)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontSize: '0.85rem',
            opacity: 0.8,
            margin: '0 0 0.25rem',
          }}>
            {t.winner}
          </p>
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            margin: '0 0 0.5rem',
          }}>
            {raffle.prizes[raffle.currentDrawIndex]?.winnerName}
          </p>
          <p style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontSize: '1rem',
            opacity: 0.9,
            margin: 0,
          }}>
            {t.won} <strong>{raffle.prizes[raffle.currentDrawIndex]?.label}</strong>
          </p>
        </motion.div>
      )}

      {/* History of past draws */}
      {raffle.prizes.some((p) => p.winnerId) && (
        <div style={{
          padding: '1.25rem',
          marginBottom: '1.5rem',
          borderRadius: '1rem',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        }}>
          <h3 style={{
            fontFamily: "'Poppins', var(--font-display)",
            fontWeight: 600,
            fontSize: '0.95rem',
            margin: '0 0 0.75rem',
            color: '#1F2937',
          }}>
            🏆 {t.history}
          </h3>
          {raffle.prizes.filter((p) => p.winnerId).map((prize) => (
            <div
              key={prize.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1F2937' }}>
                {prize.winnerName}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                {prize.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {(raffle.status === 'lobby' || raffle.status === 'reveal') && canDraw && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleDraw}
            disabled={isRolling}
            style={{
              padding: '1rem',
              background: '#1C62ED',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontFamily: "'Poppins', var(--font-display)",
              fontWeight: 600,
              fontSize: '1.1rem',
              cursor: isRolling ? 'not-allowed' : 'pointer',
              opacity: isRolling ? 0.6 : 1,
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            {raffle.status === 'reveal' ? t.nextDraw : t.draw}
          </motion.button>
        )}

        {participantCount === 0 && raffle.status === 'lobby' && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            opacity: 0.5,
            margin: 0,
          }}>
            {t.noParticipants}
          </p>
        )}

        {allDrawn && raffle.status !== 'finished' && (
          <>
            <p style={{
              textAlign: 'center',
              fontFamily: "'Poppins', var(--font-display)",
              fontSize: '0.95rem',
              color: '#10B981',
              fontWeight: 600,
              margin: 0,
            }}>
              {t.allDrawn}
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              style={{
                padding: '1rem',
                background: '#1F2937',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', var(--font-display)",
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {t.finish}
            </motion.button>
          </>
        )}

        {raffle.status === 'finished' && (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{
              fontFamily: "'Poppins', var(--font-display)",
              fontSize: '1rem',
              opacity: 0.5,
              marginBottom: '1rem',
            }}>
              {t.finished}
            </p>
            <a
              href={homeHref}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#1C62ED',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                fontFamily: "'Poppins', var(--font-display)",
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {t.backDashboard}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RaffleHost({ lang }: Props): React.JSX.Element {
  return (
    <AuthGuard lang={lang}>
      <RaffleHostContent lang={lang} />
    </AuthGuard>
  );
}
