import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchGifs, trendingGifs, type GifResult } from '../../lib/giphy';

interface Props {
  lang: 'fr' | 'en';
  onSelect: (url: string, alt: string) => void;
  onClose: () => void;
}

const labels = {
  fr: {
    searchPlaceholder: 'Rechercher un GIF...',
    trending: 'Tendances',
    poweredBy: 'Propulsé par',
    loadMore: 'Charger plus',
    noResults: 'Aucun résultat',
    loading: 'Chargement...',
    close: 'Fermer',
  },
  en: {
    searchPlaceholder: 'Search for a GIF...',
    trending: 'Trending',
    poweredBy: 'Powered by',
    loadMore: 'Load more',
    noResults: 'No results',
    loading: 'Loading...',
    close: 'Close',
  },
};

export default function GifPicker({ lang, onSelect, onClose }: Props) {
  const t = labels[lang];
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load trending on mount
  useEffect(() => {
    loadTrending();
    inputRef.current?.focus();
  }, []);

  const loadTrending = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = await trendingGifs(0);
      setGifs(result.gifs);
      setTotalCount(result.totalCount);
      setOffset(result.gifs.length);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      await loadTrending();
      return;
    }
    setLoading(true);
    try {
      const result = await searchGifs(searchQuery, 0);
      setGifs(result.gifs);
      setTotalCount(result.totalCount);
      setOffset(result.gifs.length);
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleLoadMore = async (): Promise<void> => {
    setLoading(true);
    try {
      const result = query.trim()
        ? await searchGifs(query, offset)
        : await trendingGifs(offset);
      setGifs((prev) => [...prev, ...result.gifs]);
      setOffset((prev) => prev + result.gifs.length);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const hasMore = gifs.length < totalCount;

  return (
    <AnimatePresence>
      <motion.div
        ref={backdropRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={handleBackdropClick}
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          padding: '1rem',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--color-soft-white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: 560,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header with search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1rem 0.75rem',
              borderBottom: '1px solid rgba(15,23,42,0.08)',
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.1rem',
                  opacity: 0.4,
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={t.searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  border: '2px solid rgba(15,23,42,0.1)',
                  borderRadius: 'var(--radius-button)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                  background: 'white',
                }}
              />
            </div>
            <button
              onClick={onClose}
              aria-label={t.close}
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(15,23,42,0.05)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                color: 'var(--color-dark-slate)',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Section label */}
          <div
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              opacity: 0.4,
            }}
          >
            {query.trim() ? `"${query}"` : t.trending}
          </div>

          {/* GIF grid */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 0.5rem 0.5rem',
            }}
          >
            {gifs.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {gifs.map((gif) => (
                  <motion.button
                    key={gif.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(gif.url, gif.title)}
                    style={{
                      border: 'none',
                      borderRadius: 'var(--radius-button)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: 0,
                      background: 'rgba(15,23,42,0.05)',
                      aspectRatio: '1',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </motion.button>
                ))}
              </div>
            ) : !loading ? (
              <p
                style={{
                  textAlign: 'center',
                  opacity: 0.4,
                  padding: '2rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                }}
              >
                {t.noResults}
              </p>
            ) : null}

            {/* Loading indicator */}
            {loading && (
              <p
                style={{
                  textAlign: 'center',
                  opacity: 0.4,
                  padding: '1rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                }}
              >
                {t.loading}
              </p>
            )}

            {/* Load more button */}
            {hasMore && !loading && gifs.length > 0 && (
              <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                <button
                  onClick={handleLoadMore}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    background: 'transparent',
                    color: 'var(--color-electric-blue)',
                    border: '2px solid var(--color-electric-blue)',
                    borderRadius: 'var(--radius-button)',
                    cursor: 'pointer',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {t.loadMore}
                </button>
              </div>
            )}
          </div>

          {/* GIPHY attribution (required) */}
          <div
            style={{
              padding: '0.5rem 1rem',
              borderTop: '1px solid rgba(15,23,42,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              opacity: 0.5,
              fontSize: '0.7rem',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span>{t.poweredBy}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 164 35"
              aria-label="GIPHY"
              style={{ height: 14 }}
            >
              <g fill="none">
                <path d="M0 3h4v29H0z" fill="#04FF8E" />
                <path d="M0 31h16v4H0z" fill="#8E2EFF" />
                <path d="M0 0h16v4H0z" fill="#FFF152" />
                <path d="M12 15h4v20h-4z" fill="#00C5FF" />
                <path d="M8 15h8v4H8z" fill="#FF6666" />
                <path d="M12 0h4v19h-4z" fill="#00C5FF" />
              </g>
              <text
                x="24"
                y="27"
                fontFamily="Arial Black, Arial, Helvetica, sans-serif"
                fontWeight="900"
                fontSize="28"
                fill="#1a1a1a"
              >
                GIPHY
              </text>
            </svg>
            <span style={{ fontWeight: 700 }}>GIPHY</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
