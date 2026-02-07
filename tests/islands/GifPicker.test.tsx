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

// Mock GIPHY lib
const mockSearchGifs = vi.fn();
const mockTrendingGifs = vi.fn();

vi.mock('../../src/lib/giphy', () => ({
  searchGifs: (...args: unknown[]) => mockSearchGifs(...args),
  trendingGifs: (...args: unknown[]) => mockTrendingGifs(...args),
}));

import GifPicker from '../../src/islands/ui/GifPicker';

const fakeGifs = [
  { id: 'g1', title: 'Funny cat', url: 'https://giphy.com/g1.gif', previewUrl: 'https://giphy.com/g1-small.gif', width: 480, height: 360 },
  { id: 'g2', title: 'Dancing dog', url: 'https://giphy.com/g2.gif', previewUrl: 'https://giphy.com/g2-small.gif', width: 480, height: 360 },
];

describe('GifPicker', () => {
  const defaultProps = {
    lang: 'fr' as const,
    onSelect: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTrendingGifs.mockResolvedValue({ gifs: fakeGifs, totalCount: 100, offset: 2 });
    mockSearchGifs.mockResolvedValue({ gifs: fakeGifs, totalCount: 50, offset: 2 });
  });

  it('renders search input', async () => {
    render(<GifPicker {...defaultProps} />);
    expect(screen.getByPlaceholderText('Rechercher un GIF...')).toBeInTheDocument();
  });

  it('uses English placeholder when lang=en', async () => {
    render(<GifPicker {...defaultProps} lang="en" />);
    expect(screen.getByPlaceholderText('Search for a GIF...')).toBeInTheDocument();
  });

  it('loads trending GIFs on mount', async () => {
    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      expect(mockTrendingGifs).toHaveBeenCalledWith(0);
    });
  });

  it('renders GIF thumbnails from trending results', async () => {
    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      // Filter to GIF images (exclude the GIPHY logo)
      const gifImages = images.filter(img => img.getAttribute('alt') !== 'GIPHY');
      expect(gifImages.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows "Tendances" label in French when no search query', async () => {
    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Tendances')).toBeInTheDocument();
    });
  });

  it('shows "Trending" label in English when no search query', async () => {
    render(<GifPicker {...defaultProps} lang="en" />);

    await waitFor(() => {
      expect(screen.getByText('Trending')).toBeInTheDocument();
    });
  });

  it('calls searchGifs when user types in search input', async () => {
    const user = userEvent.setup();
    render(<GifPicker {...defaultProps} />);

    const input = screen.getByPlaceholderText('Rechercher un GIF...');
    await user.type(input, 'cat');

    await waitFor(() => {
      expect(mockSearchGifs).toHaveBeenCalledWith('cat', 0);
    }, { timeout: 1000 });
  });

  it('calls onSelect with url and alt when a GIF is clicked', async () => {
    const user = userEvent.setup();
    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByAltText('Funny cat')).toBeInTheDocument();
    });

    const gifButton = screen.getByAltText('Funny cat').closest('button')!;
    await user.click(gifButton);

    expect(defaultProps.onSelect).toHaveBeenCalledWith(
      'https://giphy.com/g1.gif',
      'Funny cat'
    );
  });

  it('renders close button with aria-label', async () => {
    render(<GifPicker {...defaultProps} />);
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<GifPicker {...defaultProps} />);

    await user.click(screen.getByLabelText('Fermer'));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays GIPHY attribution', async () => {
    render(<GifPicker {...defaultProps} />);
    expect(screen.getByText('GIPHY')).toBeInTheDocument();
    expect(screen.getByText('Propulsé par')).toBeInTheDocument();
  });

  it('displays "Powered by" in English', async () => {
    render(<GifPicker {...defaultProps} lang="en" />);
    expect(screen.getByText('Powered by')).toBeInTheDocument();
  });

  it('shows "Load more" button when more results available', async () => {
    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Charger plus')).toBeInTheDocument();
    });
  });

  it('shows "No results" when search returns empty', async () => {
    mockTrendingGifs.mockResolvedValue({ gifs: [], totalCount: 0, offset: 0 });

    render(<GifPicker {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    });
  });
});
