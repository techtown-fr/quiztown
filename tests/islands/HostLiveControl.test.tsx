import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props as Record<string, unknown>;
      return <button {...(rest as React.HTMLAttributes<HTMLButtonElement>)}>{children as React.ReactNode}</button>;
    },
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>;
      return <p {...(rest as React.HTMLAttributes<HTMLParagraphElement>)}>{children as React.ReactNode}</p>;
    },
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & Record<string, unknown>) => {
      const { initial, animate, exit, transition, ...rest } = props as Record<string, unknown>;
      return <span {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>{children as React.ReactNode}</span>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock qrcode
const mockToDataURL = vi.fn().mockResolvedValue('data:image/png;base64,fake');
vi.mock('qrcode', () => {
  const mod = { toDataURL: mockToDataURL };
  return { default: mod, __esModule: true, ...mod };
});

import HostLiveControl from '../../src/islands/HostLiveControl';
import type { Player, CurrentQuestion } from '../../src/types/session';

describe('HostLiveControl', () => {
  const baseProps = {
    sessionId: 'test-session-123',
    status: 'lobby' as const,
    currentQuestionIndex: 0,
    totalQuestions: 3,
    playerCount: 5,
    responseCount: 0,
    lang: 'fr' as const,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ==========================================
  // Stats bar rendering
  // ==========================================

  describe('stats bar', () => {
    it('renders question progress', () => {
      render(<HostLiveControl {...baseProps} currentQuestionIndex={1} />);
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('renders player count', () => {
      render(<HostLiveControl {...baseProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders response count', () => {
      render(<HostLiveControl {...baseProps} responseCount={3} />);
      expect(screen.getByText('3 / 5')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Status badge
  // ==========================================

  describe('status badge', () => {
    it('shows "Lobby" in lobby status', () => {
      render(<HostLiveControl {...baseProps} status="lobby" />);
      expect(screen.getByText('Lobby')).toBeInTheDocument();
    });

    it('shows "Question en cours" in question status', () => {
      render(<HostLiveControl {...baseProps} status="question" />);
      expect(screen.getByText('Question en cours')).toBeInTheDocument();
    });

    it('shows "Résultats" in feedback status', () => {
      render(<HostLiveControl {...baseProps} status="feedback" />);
      expect(screen.getByText('Résultats')).toBeInTheDocument();
    });

    it('shows "Classement" in leaderboard status', () => {
      render(<HostLiveControl {...baseProps} status="leaderboard" />);
      expect(screen.getByText('Classement')).toBeInTheDocument();
    });

    it('shows "Terminé" in finished status', () => {
      render(<HostLiveControl {...baseProps} status="finished" />);
      expect(screen.getByText('Terminé')).toBeInTheDocument();
    });

    it('uses English labels when lang=en', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="question" />);
      expect(screen.getByText('Question active')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Linear flow: one button per state
  // ==========================================

  describe('linear flow -- buttons per state', () => {
    it('lobby: shows only "Démarrer" button', () => {
      const onStart = vi.fn();
      render(<HostLiveControl {...baseProps} status="lobby" onStart={onStart} />);

      const btn = screen.getByRole('button', { name: 'Démarrer' });
      expect(btn).toBeInTheDocument();

      // No other action buttons
      expect(screen.queryByRole('button', { name: /Afficher|Classement|Question suivante|Terminer/i })).not.toBeInTheDocument();
    });

    it('lobby: "Démarrer" calls onStart', () => {
      const onStart = vi.fn();
      render(<HostLiveControl {...baseProps} status="lobby" onStart={onStart} />);

      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('question: shows only "Afficher les résultats" button', () => {
      const onShowResults = vi.fn();
      render(<HostLiveControl {...baseProps} status="question" onShowResults={onShowResults} />);

      expect(screen.getByRole('button', { name: 'Afficher les résultats' })).toBeInTheDocument();

      // No next/leaderboard/finish buttons
      expect(screen.queryByRole('button', { name: /Question suivante|Classement|Terminer|Démarrer/i })).not.toBeInTheDocument();
    });

    it('question: "Afficher les résultats" calls onShowResults', () => {
      const onShowResults = vi.fn();
      render(<HostLiveControl {...baseProps} status="question" onShowResults={onShowResults} />);

      fireEvent.click(screen.getByRole('button', { name: 'Afficher les résultats' }));
      expect(onShowResults).toHaveBeenCalledTimes(1);
    });

    it('feedback: shows only "Classement" button', () => {
      const onShowLeaderboard = vi.fn();
      render(<HostLiveControl {...baseProps} status="feedback" onShowLeaderboard={onShowLeaderboard} />);

      expect(screen.getByRole('button', { name: 'Classement' })).toBeInTheDocument();

      // No other action buttons
      expect(screen.queryByRole('button', { name: /Afficher|Question suivante|Terminer|Démarrer/i })).not.toBeInTheDocument();
    });

    it('feedback: "Classement" calls onShowLeaderboard', () => {
      const onShowLeaderboard = vi.fn();
      render(<HostLiveControl {...baseProps} status="feedback" onShowLeaderboard={onShowLeaderboard} />);

      fireEvent.click(screen.getByRole('button', { name: 'Classement' }));
      expect(onShowLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('leaderboard (not last question): shows "Question suivante"', () => {
      const onNext = vi.fn();
      render(<HostLiveControl {...baseProps} status="leaderboard" isLastQuestion={false} onNext={onNext} />);

      expect(screen.getByRole('button', { name: 'Question suivante' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Terminer le quiz/i })).not.toBeInTheDocument();
    });

    it('leaderboard (last question): shows "Terminer le quiz"', () => {
      const onNext = vi.fn();
      render(<HostLiveControl {...baseProps} status="leaderboard" isLastQuestion={true} onNext={onNext} />);

      expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Question suivante/i })).not.toBeInTheDocument();
    });

    it('leaderboard: "Question suivante" calls onNext', () => {
      const onNext = vi.fn();
      render(<HostLiveControl {...baseProps} status="leaderboard" isLastQuestion={false} onNext={onNext} />);

      fireEvent.click(screen.getByRole('button', { name: 'Question suivante' }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('leaderboard: "Terminer le quiz" calls onNext', () => {
      const onNext = vi.fn();
      render(<HostLiveControl {...baseProps} status="leaderboard" isLastQuestion={true} onNext={onNext} />);

      fireEvent.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('finished: shows no action buttons, only "Session terminée" message', () => {
      render(<HostLiveControl {...baseProps} status="finished" />);

      expect(screen.getByText('Session terminée')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Countdown timer
  // ==========================================

  describe('countdown timer (inline with question)', () => {
    const timerQuestion: CurrentQuestion = {
      id: 'q1',
      label: 'Timer test question',
      options: [
        { id: 'opt1', text: 'A' },
        { id: 'opt2', text: 'B' },
      ],
      timeLimit: 20,
      startedAt: Date.now(),
    };

    it('shows timer inline during question phase', () => {
      const now = Date.now();
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          timeLimit={20}
          startedAt={now}
          currentQuestion={{ ...timerQuestion, startedAt: now }}
        />
      );

      // Timer should show ~20 seconds
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('sec')).toBeInTheDocument();
    });

    it('counts down over time', () => {
      const now = Date.now();
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          timeLimit={20}
          startedAt={now}
          currentQuestion={{ ...timerQuestion, startedAt: now }}
        />
      );

      // Advance 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('shows "Temps écoulé !" when timer reaches 0', () => {
      const now = Date.now();
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          timeLimit={5}
          startedAt={now}
          currentQuestion={{ ...timerQuestion, timeLimit: 5, startedAt: now }}
        />
      );

      // Advance past the time limit
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Temps écoulé !')).toBeInTheDocument();
    });

    it('shows "Time\'s up!" in English', () => {
      const now = Date.now();
      render(
        <HostLiveControl
          {...baseProps}
          lang="en"
          status="question"
          timeLimit={3}
          startedAt={now}
          currentQuestion={{ ...timerQuestion, timeLimit: 3, startedAt: now }}
        />
      );

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByText("Time's up!")).toBeInTheDocument();
    });

    it('shows "Tous ont répondu !" when all players answered', () => {
      const now = Date.now();
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          timeLimit={20}
          startedAt={now}
          playerCount={3}
          responseCount={3}
          currentQuestion={{ ...timerQuestion, startedAt: now }}
        />
      );

      expect(screen.getByText('Tous ont répondu !')).toBeInTheDocument();
    });

    it('does not show timer in lobby', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="lobby"
          timeLimit={20}
          startedAt={Date.now()}
        />
      );

      expect(screen.queryByText('sec')).not.toBeInTheDocument();
    });

    it('does not show timer in feedback', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="feedback"
        />
      );

      expect(screen.queryByText('sec')).not.toBeInTheDocument();
    });

    it('does not show timer without timeLimit/startedAt', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
        />
      );

      expect(screen.queryByText('sec')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // English labels
  // ==========================================

  describe('i18n -- English labels', () => {
    it('lobby: shows "Start" button', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="lobby" />);
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    });

    it('question: shows "Show results" button', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="question" />);
      expect(screen.getByRole('button', { name: 'Show results' })).toBeInTheDocument();
    });

    it('feedback: shows "Leaderboard" button', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="feedback" />);
      expect(screen.getByRole('button', { name: 'Leaderboard' })).toBeInTheDocument();
    });

    it('leaderboard (not last): shows "Next question" button', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="leaderboard" isLastQuestion={false} />);
      expect(screen.getByRole('button', { name: 'Next question' })).toBeInTheDocument();
    });

    it('leaderboard (last): shows "Finish quiz" button', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="leaderboard" isLastQuestion={true} />);
      expect(screen.getByRole('button', { name: 'Finish quiz' })).toBeInTheDocument();
    });

    it('finished: shows "Session ended"', () => {
      render(<HostLiveControl {...baseProps} lang="en" status="finished" />);
      expect(screen.getByText('Session ended')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Lobby QR code section
  // ==========================================

  describe('lobby QR code', () => {
    it('shows QR section only in lobby with joinUrl', () => {
      render(<HostLiveControl {...baseProps} status="lobby" joinUrl="https://example.com/play?session=abc" />);
      expect(screen.getByText('Scannez pour rejoindre')).toBeInTheDocument();
    });

    it('hides QR section in non-lobby states', () => {
      render(<HostLiveControl {...baseProps} status="question" joinUrl="https://example.com/play?session=abc" />);
      expect(screen.queryByText('Scannez pour rejoindre')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // Host leaderboard on ControlDeck
  // ==========================================

  describe('host leaderboard', () => {
    const mockPlayers: Record<string, Player> = {
      p1: { id: 'p1', nickname: 'Alice', badge: 'star', score: 1500, streak: 2, connected: true },
      p2: { id: 'p2', nickname: 'Bob', badge: 'rocket', score: 1200, streak: 1, connected: true },
      p3: { id: 'p3', nickname: 'Charlie', badge: 'fire', score: 900, streak: 0, connected: true },
    };

    it('shows leaderboard during leaderboard phase', () => {
      render(<HostLiveControl {...baseProps} status="leaderboard" players={mockPlayers} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('shows player scores in XP', () => {
      render(<HostLiveControl {...baseProps} status="leaderboard" players={mockPlayers} />);

      expect(screen.getByText(/1,500 XP|1\.500 XP|1 500 XP/)).toBeInTheDocument();
      expect(screen.getByText(/1,200 XP|1\.200 XP|1 200 XP/)).toBeInTheDocument();
    });

    it('shows leaderboard during finished phase', () => {
      render(<HostLiveControl {...baseProps} status="finished" players={mockPlayers} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('does not show leaderboard during question phase', () => {
      render(<HostLiveControl {...baseProps} status="question" players={mockPlayers} />);

      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('does not show leaderboard during feedback phase', () => {
      render(<HostLiveControl {...baseProps} status="feedback" players={mockPlayers} />);

      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('does not show leaderboard without players prop', () => {
      render(<HostLiveControl {...baseProps} status="leaderboard" />);

      // No crash, just no leaderboard content (besides the status badge)
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('shows medals for top 3', () => {
      render(<HostLiveControl {...baseProps} status="leaderboard" players={mockPlayers} />);

      expect(screen.getByText('🥇')).toBeInTheDocument();
      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('🥉')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Question preview (text + GIF + answers)
  // ==========================================

  describe('question preview', () => {
    const mockQuestion: CurrentQuestion = {
      id: 'q1',
      label: 'Quel est le meilleur framework ?',
      options: [
        { id: 'opt1', text: 'React' },
        { id: 'opt2', text: 'Vue' },
        { id: 'opt3', text: 'Angular' },
        { id: 'opt4', text: 'Svelte' },
      ],
      timeLimit: 20,
      startedAt: Date.now(),
    };

    const mockQuestionWithMedia: CurrentQuestion = {
      ...mockQuestion,
      media: { type: 'gif', url: 'https://media.giphy.com/test.gif' },
    };

    it('shows question text during question phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.getByText('Quel est le meilleur framework ?')).toBeInTheDocument();
    });

    it('shows all answer options with pictograms during question phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Vue')).toBeInTheDocument();
      expect(screen.getByText('Angular')).toBeInTheDocument();
      expect(screen.getByText('Svelte')).toBeInTheDocument();

      // Pictograms
      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByText('○')).toBeInTheDocument();
      expect(screen.getByText('△')).toBeInTheDocument();
      expect(screen.getByText('□')).toBeInTheDocument();
    });

    it('shows pictogram aria-labels for accessibility', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.getByLabelText('Croix')).toBeInTheDocument();
      expect(screen.getByLabelText('Cercle')).toBeInTheDocument();
      expect(screen.getByLabelText('Triangle')).toBeInTheDocument();
      expect(screen.getByLabelText('Carré')).toBeInTheDocument();
    });

    it('shows GIF/image when media is present', () => {
      const { container } = render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestionWithMedia}
        />
      );

      const img = container.querySelector('img[src="https://media.giphy.com/test.gif"]');
      expect(img).toBeInTheDocument();
    });

    it('does not show image when no media', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestion}
        />
      );

      // Only images should be the potential QR code etc., not a media image
      const images = screen.queryAllByRole('img');
      const mediaImg = images.find((img) => img.getAttribute('src')?.includes('giphy'));
      expect(mediaImg).toBeUndefined();
    });

    it('shows question preview during feedback phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="feedback"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.getByText('Quel est le meilleur framework ?')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Vue')).toBeInTheDocument();
    });

    it('highlights correct answer during feedback phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="feedback"
          currentQuestion={mockQuestion}
          correctOptionId="opt1"
        />
      );

      // The correct answer should have a check mark
      expect(screen.getByLabelText('Bonne réponse')).toBeInTheDocument();
    });

    it('does not highlight correct answer during question phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={mockQuestion}
          correctOptionId="opt1"
        />
      );

      // Should NOT show check mark during question phase (correctOptionId is stripped)
      expect(screen.queryByLabelText('Bonne réponse')).not.toBeInTheDocument();
    });

    it('does not show question preview in lobby', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="lobby"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.queryByText('Quel est le meilleur framework ?')).not.toBeInTheDocument();
    });

    it('does not show question preview in leaderboard phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="leaderboard"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.queryByText('Quel est le meilleur framework ?')).not.toBeInTheDocument();
    });

    it('does not show question preview in finished phase', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="finished"
          currentQuestion={mockQuestion}
        />
      );

      expect(screen.queryByText('Quel est le meilleur framework ?')).not.toBeInTheDocument();
    });

    it('does not crash when currentQuestion is null', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={null}
        />
      );

      // Should render without errors, just no preview
      expect(screen.getByText('ControlDeck')).toBeInTheDocument();
    });

    it('does not crash when currentQuestion is undefined', () => {
      render(
        <HostLiveControl
          {...baseProps}
          status="question"
        />
      );

      expect(screen.getByText('ControlDeck')).toBeInTheDocument();
    });

    it('shows GIF during feedback phase with media', () => {
      const { container } = render(
        <HostLiveControl
          {...baseProps}
          status="feedback"
          currentQuestion={mockQuestionWithMedia}
          correctOptionId="opt1"
        />
      );

      const img = container.querySelector('img[src="https://media.giphy.com/test.gif"]');
      expect(img).toBeInTheDocument();
      expect(screen.getByLabelText('Bonne réponse')).toBeInTheDocument();
    });

    it('handles question with only 2 options', () => {
      const twoOptionQuestion: CurrentQuestion = {
        id: 'q2',
        label: 'Vrai ou faux ?',
        options: [
          { id: 'opt1', text: 'Vrai' },
          { id: 'opt2', text: 'Faux' },
        ],
        timeLimit: 10,
        startedAt: Date.now(),
      };

      render(
        <HostLiveControl
          {...baseProps}
          status="question"
          currentQuestion={twoOptionQuestion}
        />
      );

      expect(screen.getByText('Vrai ou faux ?')).toBeInTheDocument();
      expect(screen.getByText('Vrai')).toBeInTheDocument();
      expect(screen.getByText('Faux')).toBeInTheDocument();
      // Only first 2 pictograms
      expect(screen.getByText('✕')).toBeInTheDocument();
      expect(screen.getByText('○')).toBeInTheDocument();
      expect(screen.queryByText('△')).not.toBeInTheDocument();
      expect(screen.queryByText('□')).not.toBeInTheDocument();
    });
  });
});
