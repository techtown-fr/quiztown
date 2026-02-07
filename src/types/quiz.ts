export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizMedia {
  type: 'image' | 'gif' | 'video';
  url: string;
  alt?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'boolean' | 'code-snippet';
  label: string;
  media?: QuizMedia;
  codeSnippet?: string;
  options: QuizOption[];
  timeLimit: number; // seconds
}

export interface QuizSettings {
  isPublic: boolean;
  shuffleQuestions: boolean;
  pointsPerQuestion: number;
  theme: 'light' | 'dark-mode';
}

export interface QuizMetadata {
  title: string;
  description: string;
  authorId: string;
  createdAt: string;
  tags: string[];
}

export interface Quiz {
  id: string;
  metadata: QuizMetadata;
  settings: QuizSettings;
  questions: QuizQuestion[];
}
