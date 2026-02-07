import type { Quiz, QuizQuestion } from '../types/quiz';
import type { Player } from '../types/session';

/**
 * Sample quiz for demo mode -- works 100% offline, no Firebase needed.
 */
export const DEMO_QUIZ: Quiz = {
  id: 'demo-quiz-001',
  metadata: {
    title: 'Tech Culture Quiz',
    description: 'Testez vos connaissances tech avec ce quiz demo !',
    authorId: 'demo-host',
    createdAt: new Date().toISOString(),
    tags: ['tech', 'demo', 'culture'],
  },
  settings: {
    isPublic: true,
    shuffleQuestions: false,
    pointsPerQuestion: 1000,
    theme: 'dark-mode',
  },
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      label: 'Quel langage de programmation a été créé par Brendan Eich en 10 jours ?',
      options: [
        { id: 'q1a', text: 'Python', isCorrect: false },
        { id: 'q1b', text: 'JavaScript', isCorrect: true },
        { id: 'q1c', text: 'Ruby', isCorrect: false },
        { id: 'q1d', text: 'PHP', isCorrect: false },
      ],
      timeLimit: 20,
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      label: 'Que signifie "HTML" ?',
      options: [
        { id: 'q2a', text: 'HyperText Markup Language', isCorrect: true },
        { id: 'q2b', text: 'High Tech Modern Language', isCorrect: false },
        { id: 'q2c', text: 'Home Tool Markup Language', isCorrect: false },
        { id: 'q2d', text: 'HyperTransfer Mode Link', isCorrect: false },
      ],
      timeLimit: 15,
    },
    {
      id: 'q3',
      type: 'multiple-choice',
      label: 'Quel est le raccourci clavier pour "Annuler" sur Mac ?',
      options: [
        { id: 'q3a', text: 'Ctrl + Z', isCorrect: false },
        { id: 'q3b', text: 'Alt + Z', isCorrect: false },
        { id: 'q3c', text: 'Cmd + Z', isCorrect: true },
        { id: 'q3d', text: 'Shift + Z', isCorrect: false },
      ],
      timeLimit: 10,
    },
    {
      id: 'q4',
      type: 'multiple-choice',
      label: 'Quelle entreprise a créé le framework React ?',
      options: [
        { id: 'q4a', text: 'Google', isCorrect: false },
        { id: 'q4b', text: 'Microsoft', isCorrect: false },
        { id: 'q4c', text: 'Apple', isCorrect: false },
        { id: 'q4d', text: 'Meta (Facebook)', isCorrect: true },
      ],
      timeLimit: 15,
    },
    {
      id: 'q5',
      type: 'multiple-choice',
      label: 'Combien de bits dans un octet ?',
      options: [
        { id: 'q5a', text: '4', isCorrect: false },
        { id: 'q5b', text: '8', isCorrect: true },
        { id: 'q5c', text: '16', isCorrect: false },
        { id: 'q5d', text: '32', isCorrect: false },
      ],
      timeLimit: 10,
    },
  ],
};

/**
 * Simulated bot players for demo mode.
 * They "answer" questions with random delays.
 */
export const DEMO_BOTS: Player[] = [
  { id: 'bot-1', nickname: 'AlgoBot', badge: 'lightning', score: 0, streak: 0, connected: true },
  { id: 'bot-2', nickname: 'PixelPal', badge: 'star', score: 0, streak: 0, connected: true },
  { id: 'bot-3', nickname: 'ByteMe', badge: 'fire', score: 0, streak: 0, connected: true },
  { id: 'bot-4', nickname: 'NullPtr', badge: 'brain', score: 0, streak: 0, connected: true },
  { id: 'bot-5', nickname: 'CSSWiz', badge: 'rocket', score: 0, streak: 0, connected: true },
];

/**
 * Get the correct option id for a question.
 */
export function getCorrectOptionId(question: QuizQuestion): string {
  const correct = question.options.find((o) => o.isCorrect);
  return correct?.id ?? question.options[0].id;
}

/**
 * Simulate a bot answer: 60% chance correct, random delay.
 */
export function simulateBotAnswer(
  question: QuizQuestion
): { optionId: string; delayMs: number; isCorrect: boolean } {
  const isCorrect = Math.random() < 0.6;
  const correctId = getCorrectOptionId(question);

  let optionId: string;
  if (isCorrect) {
    optionId = correctId;
  } else {
    const wrongOptions = question.options.filter((o) => !o.isCorrect);
    optionId = wrongOptions[Math.floor(Math.random() * wrongOptions.length)].id;
  }

  // Random delay between 1s and 80% of timeLimit
  const maxDelay = question.timeLimit * 0.8 * 1000;
  const delayMs = 1000 + Math.random() * (maxDelay - 1000);

  return { optionId, delayMs, isCorrect };
}
