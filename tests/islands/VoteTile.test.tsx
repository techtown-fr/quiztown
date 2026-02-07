import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoteTile, { TILE_PICTOGRAMS, TILE_COLORS } from '../../src/islands/ui/VoteTile';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      animate,
      whileTap,
      variants,
      ...props
    }: React.HTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button {...props}>{children}</button>
    ),
  },
}));

describe('VoteTile', () => {
  const defaultProps = {
    label: 'A',
    text: 'Paris',
    state: 'default' as const,
    colorIndex: 0,
  };

  describe('Pictograms', () => {
    it('renders the correct pictogram for each colorIndex', () => {
      TILE_PICTOGRAMS.forEach((pictogram, index) => {
        const { unmount } = render(
          <VoteTile {...defaultProps} colorIndex={index} label={String.fromCharCode(65 + index)} />
        );
        expect(screen.getByText(pictogram.symbol)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays ✕ (cross) for tile A (index 0)', () => {
      render(<VoteTile {...defaultProps} colorIndex={0} />);
      expect(screen.getByText('✕')).toBeInTheDocument();
    });

    it('displays ○ (circle) for tile B (index 1)', () => {
      render(<VoteTile {...defaultProps} colorIndex={1} label="B" />);
      expect(screen.getByText('○')).toBeInTheDocument();
    });

    it('displays △ (triangle) for tile C (index 2)', () => {
      render(<VoteTile {...defaultProps} colorIndex={2} label="C" />);
      expect(screen.getByText('△')).toBeInTheDocument();
    });

    it('displays □ (square) for tile D (index 3)', () => {
      render(<VoteTile {...defaultProps} colorIndex={3} label="D" />);
      expect(screen.getByText('□')).toBeInTheDocument();
    });

    it('wraps colorIndex for values >= 4', () => {
      render(<VoteTile {...defaultProps} colorIndex={4} />);
      // index 4 % 4 = 0, should show cross
      expect(screen.getByText('✕')).toBeInTheDocument();
    });
  });

  describe('Accessibility (aria-label)', () => {
    it('includes pictogram name in aria-label (FR)', () => {
      render(<VoteTile {...defaultProps} lang="fr" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Réponse A - Croix: Paris');
    });

    it('includes pictogram name in aria-label (EN)', () => {
      render(<VoteTile {...defaultProps} lang="en" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Answer A - Cross: Paris');
    });

    it('includes the answer text in aria-label', () => {
      render(<VoteTile {...defaultProps} text="Lyon" lang="fr" />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('Lyon');
    });

    it('uses FR aria-label by default', () => {
      render(<VoteTile {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-label')).toContain('Réponse');
      expect(button.getAttribute('aria-label')).toContain('Croix');
    });

    it('marks the pictogram badge as aria-hidden', () => {
      render(<VoteTile {...defaultProps} />);
      const badge = screen.getByText('✕').closest('span');
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Colorblind-accessible palette', () => {
    it('has exactly 4 tile colors', () => {
      expect(TILE_COLORS).toHaveLength(4);
    });

    it('has exactly 4 pictograms', () => {
      expect(TILE_PICTOGRAMS).toHaveLength(4);
    });

    it('uses blue (#2563EB) for cross tile', () => {
      expect(TILE_COLORS[0].bg).toBe('#2563EB');
    });

    it('uses orange (#F59E0B) for circle tile', () => {
      expect(TILE_COLORS[1].bg).toBe('#F59E0B');
    });

    it('uses emerald (#10B981) for triangle tile', () => {
      expect(TILE_COLORS[2].bg).toBe('#10B981');
    });

    it('uses pink (#EC4899) for square tile', () => {
      expect(TILE_COLORS[3].bg).toBe('#EC4899');
    });

    it('all colors are distinct', () => {
      const bgs = TILE_COLORS.map((c) => c.bg);
      expect(new Set(bgs).size).toBe(4);
    });

    it('all pictogram symbols are distinct', () => {
      const symbols = TILE_PICTOGRAMS.map((p) => p.symbol);
      expect(new Set(symbols).size).toBe(4);
    });
  });

  describe('States', () => {
    it('renders in default state', () => {
      render(<VoteTile {...defaultProps} />);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });

    it('is disabled in locked state', () => {
      render(<VoteTile {...defaultProps} state="locked" />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<VoteTile {...defaultProps} disabled />);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('shows the answer text', () => {
      render(<VoteTile {...defaultProps} text="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClick when clicked in default state', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<VoteTile {...defaultProps} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledOnce();
    });

    it('does not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<VoteTile {...defaultProps} disabled onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when locked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<VoteTile {...defaultProps} state="locked" onClick={handleClick} />);

      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });
});
