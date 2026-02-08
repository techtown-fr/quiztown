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
  default: ({ onSelect, onClose }: { onSelect: (url: string, alt: string) => void; onClose: () => void }) => (
    <div data-testid="gif-picker">
      <button data-testid="gif-select" onClick={() => onSelect('https://giphy.com/test.gif', 'Test GIF')}>
        Select GIF
      </button>
      <button data-testid="gif-close" onClick={onClose}>Close</button>
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
import type { QuizQuestion } from '../../src/types/quiz';

const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q_existing_1',
    type: 'multiple-choice',
    label: 'Quelle est la capitale de la France ?',
    options: [
      { id: 'opt1', text: 'Paris', isCorrect: true },
      { id: 'opt2', text: 'Lyon', isCorrect: false },
      { id: 'opt3', text: 'Marseille', isCorrect: false },
      { id: 'opt4', text: 'Toulouse', isCorrect: false },
    ],
    timeLimit: 20,
  },
  {
    id: 'q_existing_2',
    type: 'multiple-choice',
    label: 'Quel langage pour le web ?',
    options: [
      { id: 'opt5', text: 'JavaScript', isCorrect: true },
      { id: 'opt6', text: 'Python', isCorrect: false },
      { id: 'opt7', text: 'Java', isCorrect: false },
      { id: 'opt8', text: 'C++', isCorrect: false },
    ],
    timeLimit: 30,
  },
];

describe('QuizEditor -- Edit mode', () => {
  const editProps = {
    lang: 'fr' as const,
    onSave: vi.fn(),
    initialTitle: 'Mon Quiz Existant',
    initialDescription: 'Description de test',
    initialQuestions: MOCK_QUESTIONS,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // Pre-filled data
  // ==========================================

  describe('pre-filled data', () => {
    it('pre-fills title from initialTitle', () => {
      render(<QuizEditor {...editProps} />);
      const titleInput = screen.getByPlaceholderText('Mon super quiz...');
      expect(titleInput).toHaveValue('Mon Quiz Existant');
    });

    it('pre-fills description from initialDescription', () => {
      render(<QuizEditor {...editProps} />);
      const descInput = screen.getByPlaceholderText('De quoi parle ce quiz ?');
      expect(descInput).toHaveValue('Description de test');
    });

    it('pre-fills all questions from initialQuestions', () => {
      render(<QuizEditor {...editProps} />);
      expect(screen.getByDisplayValue('Quelle est la capitale de la France ?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Quel langage pour le web ?')).toBeInTheDocument();
    });

    it('pre-fills answer options', () => {
      render(<QuizEditor {...editProps} />);
      expect(screen.getByDisplayValue('Paris')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Lyon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('JavaScript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Python')).toBeInTheDocument();
    });

    it('preserves correct answer selection', () => {
      render(<QuizEditor {...editProps} />);
      const radios = screen.getAllByRole('radio');
      // First question: first option is correct
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
      // Second question: first option is correct
      expect(radios[4]).toBeChecked();
      expect(radios[5]).not.toBeChecked();
    });

    it('renders correct number of questions', () => {
      render(<QuizEditor {...editProps} />);
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Edit mode button label
  // ==========================================

  describe('button label', () => {
    it('shows "Mettre à jour" in French edit mode', () => {
      render(<QuizEditor {...editProps} />);
      expect(screen.getByRole('button', { name: 'Mettre à jour' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sauvegarder' })).not.toBeInTheDocument();
    });

    it('shows "Update" in English edit mode', () => {
      render(<QuizEditor {...editProps} lang="en" />);
      expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    });

    it('shows "Sauvegarder" in French create mode', () => {
      render(<QuizEditor lang="fr" onSave={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Sauvegarder' })).toBeInTheDocument();
    });

    it('shows "Save" in English create mode', () => {
      render(<QuizEditor lang="en" onSave={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  // ==========================================
  // Editing and saving
  // ==========================================

  describe('editing and saving', () => {
    it('allows editing the title', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} />);

      const titleInput = screen.getByPlaceholderText('Mon super quiz...');
      await user.clear(titleInput);
      await user.type(titleInput, 'Titre Modifié');
      expect(titleInput).toHaveValue('Titre Modifié');
    });

    it('allows editing a question label', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} />);

      const questionInput = screen.getByDisplayValue('Quelle est la capitale de la France ?');
      await user.clear(questionInput);
      await user.type(questionInput, 'Nouvelle question');
      expect(questionInput).toHaveValue('Nouvelle question');
    });

    it('allows editing an answer option', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} />);

      const optionInput = screen.getByDisplayValue('Paris');
      await user.clear(optionInput);
      await user.type(optionInput, 'Berlin');
      expect(optionInput).toHaveValue('Berlin');
    });

    it('calls onSave with updated data when "Mettre à jour" is clicked', async () => {
      const onSave = vi.fn().mockResolvedValue({ success: true, message: 'OK' });
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} onSave={onSave} />);

      // Edit title
      const titleInput = screen.getByPlaceholderText('Mon super quiz...');
      await user.clear(titleInput);
      await user.type(titleInput, 'Titre Modifié');

      // Click save
      await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
        expect(onSave).toHaveBeenCalledWith(
          'Titre Modifié',
          'Description de test',
          expect.arrayContaining([
            expect.objectContaining({ label: 'Quelle est la capitale de la France ?' }),
            expect.objectContaining({ label: 'Quel langage pour le web ?' }),
          ])
        );
      });
    });

    it('shows success toast after successful update', async () => {
      const onSave = vi.fn().mockResolvedValue({ success: true, message: 'Quiz mis à jour !' });
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} onSave={onSave} />);

      await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));

      await waitFor(() => {
        const toast = screen.getByRole('alert');
        expect(toast).toBeInTheDocument();
        expect(toast).toHaveTextContent('Quiz mis à jour !');
      });
    });

    it('can add a new question while in edit mode', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} />);

      // Initially 2 questions
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.getByText('Question 2')).toBeInTheDocument();
      expect(screen.queryByText('Question 3')).not.toBeInTheDocument();

      // Add question
      await user.click(screen.getByText('+ Ajouter une question'));

      expect(screen.getByText('Question 3')).toBeInTheDocument();
    });

    it('can remove a question while in edit mode', async () => {
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} />);

      // Get remove buttons (× character)
      const removeButtons = screen.getAllByTitle('Supprimer');
      expect(removeButtons).toHaveLength(2);

      // Remove first question
      await user.click(removeButtons[0]);

      // Should now only have Question 1 (renumbered)
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
      // The second question content should still be there
      expect(screen.getByDisplayValue('Quel langage pour le web ?')).toBeInTheDocument();
    });
  });

  // ==========================================
  // Validation in edit mode
  // ==========================================

  describe('validation in edit mode', () => {
    it('shows error if title is cleared', async () => {
      const onSave = vi.fn();
      const user = userEvent.setup();
      render(<QuizEditor {...editProps} onSave={onSave} />);

      // Clear the title
      const titleInput = screen.getByPlaceholderText('Mon super quiz...');
      await user.clear(titleInput);

      // Try to save
      await user.click(screen.getByRole('button', { name: 'Mettre à jour' }));

      await waitFor(() => {
        const toast = screen.getByRole('alert');
        expect(toast).toHaveTextContent('Le titre du quiz est requis.');
      });

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // Create mode fallback (no initial data)
  // ==========================================

  describe('create mode fallback', () => {
    it('starts with empty fields and one question when no initial data', () => {
      render(<QuizEditor lang="fr" onSave={vi.fn()} />);

      const titleInput = screen.getByPlaceholderText('Mon super quiz...');
      expect(titleInput).toHaveValue('');

      const descInput = screen.getByPlaceholderText('De quoi parle ce quiz ?');
      expect(descInput).toHaveValue('');

      // Only Question 1
      expect(screen.getByText('Question 1')).toBeInTheDocument();
      expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
    });
  });
});
