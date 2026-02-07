import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>;
      return <h1 {...(rest as React.HTMLAttributes<HTMLHeadingElement>)}>{children as React.ReactNode}</h1>;
    },
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>;
    },
  },
}));

// Mock CountdownRing
vi.mock('../../src/islands/ui/CountdownRing', () => ({
  default: ({ timeLeft }: { timeLeft: number }) => <div data-testid="countdown">{timeLeft}</div>,
}));

import PublicScreen from '../../src/islands/PublicScreen';

describe('PublicScreen', () => {
  const defaultProps = {
    question: 'What is JavaScript?',
    timeLeft: 15,
    timeLimit: 20,
    voteBars: [
      { label: 'A', text: 'A language', percentage: 60, isCorrect: true },
      { label: 'B', text: 'A framework', percentage: 40, isCorrect: false },
    ],
    showResults: false,
    totalVotes: 10,
  };

  it('renders the question text', () => {
    render(<PublicScreen {...defaultProps} />);
    expect(screen.getByText('What is JavaScript?')).toBeInTheDocument();
  });

  it('renders vote bars', () => {
    render(<PublicScreen {...defaultProps} />);
    expect(screen.getByText('A language')).toBeInTheDocument();
    expect(screen.getByText('A framework')).toBeInTheDocument();
  });

  it('renders total votes count', () => {
    render(<PublicScreen {...defaultProps} />);
    expect(screen.getByText('10 votes')).toBeInTheDocument();
  });

  describe('media rendering', () => {
    it('renders a GIF image when media is provided', () => {
      const { container } = render(
        <PublicScreen
          {...defaultProps}
          media={{ type: 'gif', url: 'https://giphy.com/funny.gif' }}
        />
      );

      const img = container.querySelector('img[src="https://giphy.com/funny.gif"]');
      expect(img).toBeInTheDocument();
    });

    it('renders a static image when media type is image', () => {
      const { container } = render(
        <PublicScreen
          {...defaultProps}
          media={{ type: 'image', url: 'https://example.com/photo.png' }}
        />
      );

      const img = container.querySelector('img[src="https://example.com/photo.png"]');
      expect(img).toBeInTheDocument();
    });

    it('does not render an image when no media is provided', () => {
      const { container } = render(<PublicScreen {...defaultProps} />);

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(0);
    });

    it('does not render an image when media url is empty', () => {
      const { container } = render(
        <PublicScreen
          {...defaultProps}
          media={{ type: 'gif', url: '' }}
        />
      );

      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(0);
    });

    it('constrains image size for projection readability', () => {
      const { container } = render(
        <PublicScreen
          {...defaultProps}
          media={{ type: 'gif', url: 'https://giphy.com/big.gif' }}
        />
      );

      const img = container.querySelector('img') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.style.maxHeight).toBe('40vh');
      expect(img.style.objectFit).toBe('contain');
    });
  });

  describe('backward compatibility', () => {
    it('works correctly without media prop', () => {
      render(<PublicScreen {...defaultProps} />);

      expect(screen.getByText('What is JavaScript?')).toBeInTheDocument();
      expect(screen.getByText('A language')).toBeInTheDocument();
      expect(screen.getByText('10 votes')).toBeInTheDocument();
    });
  });
});
