// import AuthGuard from './AuthGuard'; // TODO: restore auth
import { useState, useEffect } from 'react';
import { getAllQuizzes, deleteQuiz } from '../firebase/firestore';
import { createSession } from '../firebase/realtime';
import type { Quiz } from '../types/quiz';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
}

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    title: 'Dashboard',
    create: 'Créer un quiz',
    emptyText: 'Créez votre premier quiz pour commencer !',
    launch: 'Lancer',
    edit: 'Modifier',
    delete: 'Supprimer',
    questions: 'questions',
    loading: 'Chargement...',
    errorLoad: 'Erreur lors du chargement des quizzes.',
    confirmDelete: 'Supprimer ce quiz ?',
    launching: 'Lancement...',
  },
  en: {
    title: 'Dashboard',
    create: 'Create a quiz',
    emptyText: 'Create your first quiz to get started!',
    launch: 'Launch',
    edit: 'Edit',
    delete: 'Delete',
    questions: 'questions',
    loading: 'Loading...',
    errorLoad: 'Failed to load quizzes.',
    confirmDelete: 'Delete this quiz?',
    launching: 'Launching...',
  },
};

export default function HostDashboard({ lang }: Props): JSX.Element {
  const t = translations[lang];
  const createUrl = lang === 'en' ? '/en/host/create' : '/host/create';
  const editBaseUrl = lang === 'en' ? '/en/host/edit' : '/host/edit';
  const liveBaseUrl = lang === 'en' ? '/en/host/live/' : '/host/live/';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes(): Promise<void> {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
      setError(t.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunch(quiz: Quiz): Promise<void> {
    try {
      setLaunchingId(quiz.id);
      const sessionId = await createSession(quiz.id, 'dev-user', quiz.questions.length);
      window.location.href = `${liveBaseUrl}?session=${sessionId}`;
    } catch (err) {
      console.error('Failed to launch quiz:', err);
      setLaunchingId(null);
    }
  }

  async function handleDelete(quizId: string): Promise<void> {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  }

  // TODO: restore <AuthGuard lang={lang}> wrapper
  return (
    <>
      <section style={styles.dashboard}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t.title}</h1>
          <a href={createUrl} style={styles.btnCreate}>
            + {t.create}
          </a>
        </div>

        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.spinner} />
            <p style={{ opacity: 0.6 }}>{t.loading}</p>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--color-alert-coral)', textAlign: 'center' }}>{error}</p>
        )}

        {!loading && !error && quizzes.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <span style={styles.emptyIconText}>Q</span>
            </div>
            <p style={styles.emptyText}>{t.emptyText}</p>
            <a href={createUrl} style={styles.btnStart}>
              {t.create}
            </a>
          </div>
        )}

        {!loading && quizzes.length > 0 && (
          <div style={styles.quizGrid}>
            {quizzes.map((quiz) => (
              <div key={quiz.id} style={styles.quizCard}>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{quiz.metadata.title}</h3>
                  {quiz.metadata.description && (
                    <p style={styles.cardDescription}>{quiz.metadata.description}</p>
                  )}
                  <p style={styles.cardMeta}>
                    {quiz.questions.length} {t.questions}
                  </p>
                </div>
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleLaunch(quiz)}
                    disabled={launchingId === quiz.id}
                    style={{
                      ...styles.btnLaunch,
                      opacity: launchingId === quiz.id ? 0.7 : 1,
                      cursor: launchingId === quiz.id ? 'not-allowed' : 'pointer',
                    }}
                    aria-label={`${t.launch} ${quiz.metadata.title}`}
                  >
                    {launchingId === quiz.id ? t.launching : t.launch}
                  </button>
                  <a
                    href={`${editBaseUrl}?id=${quiz.id}`}
                    style={styles.btnEdit}
                    aria-label={`${t.edit} ${quiz.metadata.title}`}
                  >
                    {t.edit}
                  </a>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    style={styles.btnDelete}
                    aria-label={`${t.delete} ${quiz.metadata.title}`}
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dashboard: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: 'var(--spacing-2xl) var(--spacing-lg)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-2xl)',
    flexWrap: 'wrap' as const,
    gap: 'var(--spacing-md)',
  },
  title: {
    fontSize: 'clamp(1.5rem, 4vw, 2rem)',
    margin: 0,
    fontFamily: 'var(--font-display)',
  },
  btnCreate: {
    padding: 'var(--spacing-sm) var(--spacing-xl)',
    background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.9rem',
    transition: 'transform 150ms, box-shadow 150ms',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-3xl)',
    gap: '1rem',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid rgba(37,99,235,0.2)',
    borderTopColor: 'var(--color-electric-blue)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: 'var(--spacing-3xl) var(--spacing-lg)',
    background: 'var(--color-card-bg)',
    color: 'var(--color-card-text)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    margin: '0 auto var(--spacing-lg)',
    background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
    color: 'white',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyIconText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '2rem',
  },
  emptyText: {
    fontSize: '1.1rem',
    opacity: 0.6,
    marginBottom: 'var(--spacing-xl)',
  },
  btnStart: {
    display: 'inline-block',
    padding: 'var(--spacing-md) var(--spacing-2xl)',
    background: 'var(--color-electric-blue)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    transition: 'transform 150ms',
  },
  quizGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 'var(--spacing-lg)',
  },
  quizCard: {
    background: 'var(--color-card-bg)',
    color: 'var(--color-card-text)',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    transition: 'transform 150ms, box-shadow 150ms',
  },
  cardBody: {
    padding: 'var(--spacing-lg)',
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    margin: '0 0 0.5rem',
  },
  cardDescription: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    opacity: 0.6,
    margin: '0 0 0.75rem',
    lineHeight: 1.4,
  },
  cardMeta: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    opacity: 0.5,
    margin: 0,
  },
  cardActions: {
    display: 'flex',
    gap: 0,
    borderTop: '1px solid var(--color-card-border)',
  },
  btnLaunch: {
    flex: 1,
    padding: 'var(--spacing-sm) var(--spacing-md)',
    background: 'var(--color-electric-blue)',
    color: 'white',
    border: 'none',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'background 150ms',
  },
  btnEdit: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    background: 'transparent',
    color: 'var(--color-violet-pulse)',
    border: 'none',
    borderLeft: '1px solid var(--color-card-border)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 150ms',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDelete: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    background: 'transparent',
    color: 'var(--color-alert-coral)',
    border: 'none',
    borderLeft: '1px solid var(--color-card-border)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background 150ms',
  },
};
