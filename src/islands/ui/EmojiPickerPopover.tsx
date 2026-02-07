import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';

interface Props {
  lang: 'fr' | 'en';
  onSelect: (emoji: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export default function EmojiPickerPopover({ lang, onSelect, onClose, anchorRef }: Props) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, anchorRef]);

  const handleEmojiClick = (emojiData: EmojiClickData): void => {
    onSelect(emojiData.emoji);
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'absolute',
          zIndex: 999,
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0 15px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={Theme.LIGHT}
          searchPlaceHolder={lang === 'fr' ? 'Rechercher un emoji...' : 'Search emoji...'}
          width={350}
          height={400}
          lazyLoadEmojis
        />
      </motion.div>
    </AnimatePresence>
  );
}
