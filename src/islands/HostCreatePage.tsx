// import AuthGuard from './AuthGuard'; // TODO: restore auth
import QuizEditor from './QuizEditor';
import { useAuth } from '../hooks/useAuth';
import { createQuiz } from '../firebase/firestore';
import type { Lang } from '../i18n';
import type { QuizQuestion } from '../types/quiz';

interface Props {
  lang: Lang;
}

function CreatePageContent({ lang }: Props): JSX.Element {
  const { user } = useAuth();
  const userId = user?.uid ?? 'dev-user'; // TODO: restore auth check

  const handleSave = async (
    title: string,
    description: string,
    questions: QuizQuestion[]
  ): Promise<{ success: boolean; message: string }> => {
    try {
      await createQuiz({
        metadata: {
          title,
          description,
          authorId: userId,
          createdAt: new Date().toISOString(),
          tags: [],
        },
        settings: {
          isPublic: true,
          shuffleQuestions: false,
          pointsPerQuestion: 100,
          theme: 'light',
        },
        questions,
      });

      // Redirect to dashboard after a short delay so the user sees the toast
      const dashboardUrl = lang === 'en' ? '/en/host/' : '/host/';
      setTimeout(() => { window.location.href = dashboardUrl; }, 1500);

      return {
        success: true,
        message: lang === 'fr' ? 'Quiz sauvegardé avec succès !' : 'Quiz saved successfully!',
      };
    } catch (err) {
      console.error('Failed to save quiz:', err);
      return {
        success: false,
        message: lang === 'fr' ? 'Erreur lors de la sauvegarde.' : 'Failed to save the quiz.',
      };
    }
  };

  return <QuizEditor lang={lang} onSave={handleSave} />;
}

export default function HostCreatePage({ lang }: Props): JSX.Element {
  // TODO: restore <AuthGuard lang={lang}> wrapper
  return <CreatePageContent lang={lang} />;
}
