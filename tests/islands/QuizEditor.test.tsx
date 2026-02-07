import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>;
    },
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
      const { whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <button {...(rest as React.HTMLAttributes<HTMLButtonElement>)}>{children as React.ReactNode}</button>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the lazy-loaded components
vi.mock('../../src/islands/ui/GifPicker', () => ({
  default: ({ onSelect, onClose, lang }: { onSelect: (url: string, alt: string) => void; onClose: () => void; lang: string }) => (
    <div data-testid="gif-picker">
      <button data-testid="gif-select" onClick={() => onSelect('https://giphy.com/test.gif', 'Test GIF')}>
        Select GIF
      </button>
      <button data-testid="gif-close" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../src/islands/ui/EmojiPickerPopover', () => ({
  default: ({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) => (
    <div data-testid="emoji-picker">
      <button data-testid="emoji-select" onClick={() => onSelect('🎉')}>
        Select Emoji
      </button>
    </div>
  ),
}));

// Mock VoteTile exports
vi.mock('../../src/islands/ui/VoteTile', () => ({
  TILE_PICTOGRAMS: [
    { symbol: '✕', name: 'cross' },
    { symbol: '○', name: 'circle' },
    { symbol: '△', name: 'triangle' },
    { symbol: '□', name: 'square' },
  ],
  TILE_COLORS: [
    { bg: '#2563EB', light: 'rgba(37,99,235,0.15)' },
    { bg: '#F59E0B', light: 'rgba(245,158,11,0.15)' },
    { bg: '#10B981', light: 'rgba(16,185,129,0.15)' },
    { bg: '#EC4899', light: 'rgba(236,72,153,0.15)' },
  ],
}));

import QuizEditor from '../../src/islands/QuizEditor';

describe('QuizEditor -- Media features', () => {
  const defaultProps = {
    lang: 'fr' as const,
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GIF button', () => {
    it('renders a GIF button for each question', () => {
      render(<QuizEditor {...defaultProps} />);
      const gifButtons = screen.getAllByTitle('GIF');
      expect(gifButtons).toHaveLength(1);
    });

    it('opens GIF picker when GIF button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      const gifButton = screen.getByTitle('GIF');
      await user.click(gifButton);

      await waitFor(() => {
        expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
      });
    });

    it('sets media on question when a GIF is selected', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      // Open GIF picker
      await user.click(screen.getByTitle('GIF'));

      await waitFor(() => {
        expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
      });

      // Select a GIF
      await user.click(screen.getByTestId('gif-select'));

      // GIF picker should close
      await waitFor(() => {
        expect(screen.queryByTestId('gif-picker')).not.toBeInTheDocument();
      });

      // Preview should be visible
      await waitFor(() => {
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://giphy.com/test.gif');
      });
    });

    it('closes GIF picker when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      await user.click(screen.getByTitle('GIF'));

      await waitFor(() => {
        expect(screen.getByTestId('gif-picker')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('gif-close'));

      await waitFor(() => {
        expect(screen.queryByTestId('gif-picker')).not.toBeInTheDocument();
      });
    });
  });

  describe('Media preview', () => {
    it('shows remove button on media preview', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      // Add a GIF
      await user.click(screen.getByTitle('GIF'));
      await waitFor(() => screen.getByTestId('gif-picker'));
      await user.click(screen.getByTestId('gif-select'));

      // Check remove button exists
      await waitFor(() => {
        expect(screen.getByTitle('Supprimer le média')).toBeInTheDocument();
      });
    });

    it('removes media when remove button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      // Add a GIF
      await user.click(screen.getByTitle('GIF'));
      await waitFor(() => screen.getByTestId('gif-picker'));
      await user.click(screen.getByTestId('gif-select'));

      // Wait for preview to appear
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // Click remove
      await user.click(screen.getByTitle('Supprimer le média'));

      // Image should be gone
      await waitFor(() => {
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });
  });

  describe('Emoji button', () => {
    it('renders an emoji button for each question', () => {
      render(<QuizEditor {...defaultProps} />);
      const emojiButtons = screen.getAllByTitle('Emoji');
      expect(emojiButtons).toHaveLength(1);
    });

    it('opens emoji picker when emoji button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      const emojiButton = screen.getByTitle('Emoji');
      await user.click(emojiButton);

      await waitFor(() => {
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      });
    });

    it('appends emoji to question label when selected', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      // Type a question first
      const questionInput = screen.getByPlaceholderText('Écris ta question ici...');
      await user.type(questionInput, 'Test');

      // Open emoji picker and select
      await user.click(screen.getByTitle('Emoji'));
      await waitFor(() => screen.getByTestId('emoji-picker'));
      await user.click(screen.getByTestId('emoji-select'));

      // Emoji should be appended
      await waitFor(() => {
        expect(questionInput).toHaveValue('Test🎉');
      });
    });
  });

  describe('i18n labels', () => {
    it('uses French labels by default', () => {
      render(<QuizEditor {...defaultProps} />);
      expect(screen.getByTitle('GIF')).toBeInTheDocument();
      expect(screen.getByTitle('Emoji')).toBeInTheDocument();
    });

    it('uses English labels when lang=en', () => {
      render(<QuizEditor {...defaultProps} lang="en" />);
      expect(screen.getByTitle('GIF')).toBeInTheDocument();
      expect(screen.getByTitle('Emoji')).toBeInTheDocument();
    });

    it('shows French remove media label', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      await user.click(screen.getByTitle('GIF'));
      await waitFor(() => screen.getByTestId('gif-picker'));
      await user.click(screen.getByTestId('gif-select'));

      await waitFor(() => {
        expect(screen.getByTitle('Supprimer le média')).toBeInTheDocument();
      });
    });

    it('shows English remove media label', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} lang="en" />);

      await user.click(screen.getByTitle('GIF'));
      await waitFor(() => screen.getByTestId('gif-picker'));
      await user.click(screen.getByTestId('gif-select'));

      await waitFor(() => {
        expect(screen.getByTitle('Remove media')).toBeInTheDocument();
      });
    });
  });

  describe('multiple questions', () => {
    it('GIF buttons are independent per question', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...defaultProps} />);

      // Add a second question
      await user.click(screen.getByText('+ Ajouter une question'));

      const gifButtons = screen.getAllByTitle('GIF');
      expect(gifButtons).toHaveLength(2);
    });
  });
});
