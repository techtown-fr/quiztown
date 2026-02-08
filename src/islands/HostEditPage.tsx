import { useState, useEffect } from 'react';
import QuizEditor from './QuizEditor';
import { useAuth } from '../hooks/useAuth';
import { getQuiz, updateQuiz } from '../firebase/firestore';
import type { Lang } from '../i18n';
import type { Quiz, QuizQuestion } from '../types/quiz';

interface Props {
  lang: Lang;
}

function EditPageContent({ lang }: Props): JSX.Element {
  const { user } = useAuth();
  const userId = user?.uid ?? 'dev-user'; // TODO: restore auth check

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quizId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('id')
    : null;

  const t = {
    fr: {
      loading: 'Chargement du quiz...',
      errorNotFound: 'Quiz introuvable.',
      errorLoad: 'Erreur lors du chargement du quiz.',
      noId: 'Aucun identifiant de quiz fourni.',
      successUpdate: 'Quiz mis à jour avec succès !',
      errorUpdate: 'Erreur lors de la mise à jour.',
      backToDashboard: 'Retour au Dashboard',
    },
    en: {
      loading: 'Loading quiz...',
      errorNotFound: 'Quiz not found.',
      errorLoad: 'Failed to load quiz.',
      noId: 'No quiz ID provided.',
      successUpdate: 'Quiz updated successfully!',
      errorUpdate: 'Failed to update the quiz.',
      backToDashboard: 'Back to Dashboard',
    },
  }[lang];

  useEffect(() => {
    if (!quizId) {
      setError(t.noId);
      setLoading(false);
      return;
    }
    loadQuiz(quizId);
  }, [quizId]);

  async function loadQuiz(id: string): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuiz(id);
      if (!data) {
        setError(t.errorNotFound);
      } else {
        setQuiz(data);
      }
    } catch (err) {
      console.error('Failed to load quiz:', err);
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (
    title: string,
    description: string,
    questions: QuizQuestion[]
  ): Promise<{ success: boolean; message: string }> => {
    if (!quizId) {
      return { success: false, message: t.noId };
    }

    try {
      await updateQuiz(quizId, {
        'metadata.title': title,
        'metadata.description': description,
        questions,
      });

      // Redirect to dashboard after a short delay so the user sees the toast
      const dashboardUrl = lang === 'en' ? '/en/host/' : '/host/';
      setTimeout(() => { window.location.href = dashboardUrl; }, 1500);

      return {
        success: true,
        message: t.successUpdate,
      };
    } catch (err) {
      console.error('Failed to update quiz:', err);
      return {
        success: false,
        message: t.errorUpdate,
      };
    }
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ opacity: 0.6, fontFamily: 'var(--font-body)' }}>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    const dashboardUrl = lang === 'en' ? '/en/host/' : '/host/';
    return (
      <div style={styles.centered}>
        <p style={{ color: 'var(--color-alert-coral)', fontFamily: 'var(--font-body)', fontSize: '1.1rem' }}>
          {error}
        </p>
        <a href={dashboardUrl} style={styles.backLink}>
          {t.backToDashboard}
        </a>
      </div>
    );
  }

  if (!quiz) return <></>;

  return (
    <QuizEditor
      lang={lang}
      onSave={handleSave}
      initialTitle={quiz.metadata.title}
      initialDescription={quiz.metadata.description}
      initialQuestions={quiz.questions}
    />
  );
}

export default function HostEditPage({ lang }: Props): JSX.Element {
  // TODO: restore <AuthGuard lang={lang}> wrapper
  return <EditPageContent lang={lang} />;
}

const styles: Record<string, React.CSSProperties> = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-3xl)',
    gap: '1rem',
    minHeight: '50vh',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(37,99,235,0.2)',
    borderTopColor: 'var(--color-electric-blue)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  backLink: {
    padding: 'var(--spacing-sm) var(--spacing-xl)',
    background: 'var(--color-electric-blue)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'transform 150ms',
  },
};
