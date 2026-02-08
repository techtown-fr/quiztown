import { useAuth } from '../hooks/useAuth';
import type { Lang } from '../i18n';
import type { ReactNode } from 'react';

interface AuthGuardProps {
  lang: Lang;
  children: ReactNode;
}

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    'auth.login': 'Se connecter avec Google',
    'auth.logout': 'Déconnexion',
    'auth.login.title': 'Connexion requise',
    'auth.login.description':
      "Connectez-vous avec votre compte Google pour accéder à l'espace organisateur.",
    'auth.error': 'Erreur de connexion. Réessayez.',
    'auth.welcome': 'Bonjour',
    'auth.loading': 'Chargement...',
  },
  en: {
    'auth.login': 'Sign in with Google',
    'auth.logout': 'Sign out',
    'auth.login.title': 'Sign in required',
    'auth.login.description':
      'Sign in with your Google account to access the host dashboard.',
    'auth.error': 'Login failed. Please try again.',
    'auth.welcome': 'Hello',
    'auth.loading': 'Loading...',
  },
};

function t(lang: Lang, key: string): string {
  return translations[lang][key] ?? key;
}

/** Google "G" logo as inline SVG */
function GoogleIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function AuthGuard({ lang, children }: AuthGuardProps): JSX.Element {
  const { user, loading, error, login, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>{t(lang, 'auth.loading')}</p>
      </div>
    );
  }

  // Not authenticated — show login screen
  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.loginIcon}>
            <span style={styles.loginIconText}>Q</span>
          </div>
          <h2 style={styles.loginTitle}>{t(lang, 'auth.login.title')}</h2>
          <p style={styles.loginDescription}>{t(lang, 'auth.login.description')}</p>

          {error && <p style={styles.errorText}>{t(lang, 'auth.error')}</p>}

          <button
            onClick={login}
            style={styles.googleButton}
            aria-label={t(lang, 'auth.login')}
          >
            <GoogleIcon />
            <span>{t(lang, 'auth.login')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Authenticated — show user bar + children
  return (
    <div>
      <div style={styles.userBar}>
        <div style={styles.userInfo}>
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              style={styles.avatar}
              referrerPolicy="no-referrer"
            />
          )}
          <span style={styles.userName}>
            {t(lang, 'auth.welcome')}, <strong>{user.displayName ?? user.email}</strong>
          </span>
        </div>
        <button
          onClick={logout}
          style={styles.logoutButton}
          aria-label={t(lang, 'auth.logout')}
        >
          {t(lang, 'auth.logout')}
        </button>
      </div>
      {children}
    </div>
  );
}

/* ============================================
 * Inline styles — design tokens via CSS vars
 * ============================================ */

const styles: Record<string, React.CSSProperties> = {
  // Loading
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
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
  loadingText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    opacity: 0.6,
  },

  // Login
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: 'var(--spacing-lg)',
  },
  loginCard: {
    textAlign: 'center' as const,
    padding: 'var(--spacing-3xl) var(--spacing-2xl)',
    background: 'white',
    borderRadius: 'var(--radius-card)',
    boxShadow: 'var(--shadow-card)',
    maxWidth: 420,
    width: '100%',
  },
  loginIcon: {
    width: 80,
    height: 80,
    margin: '0 auto var(--spacing-lg)',
    background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginIconText: {
    color: 'white',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '2rem',
  },
  loginTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    marginBottom: 'var(--spacing-sm)',
  },
  loginDescription: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    opacity: 0.6,
    marginBottom: 'var(--spacing-xl)',
    lineHeight: 1.5,
  },
  errorText: {
    color: 'var(--color-alert-coral)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    marginBottom: 'var(--spacing-md)',
  },
  googleButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
    padding: 'var(--spacing-md) var(--spacing-xl)',
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'var(--color-dark-slate)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },

  // User bar
  userBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--spacing-sm) var(--spacing-lg)',
    background: 'rgba(37,99,235,0.05)',
    borderRadius: 'var(--radius-button)',
    margin: '0 auto var(--spacing-lg)',
    maxWidth: 1000,
    flexWrap: 'wrap' as const,
    gap: 'var(--spacing-sm)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-sm)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  userName: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
  },
  logoutButton: {
    padding: 'var(--spacing-xs) var(--spacing-md)',
    background: 'transparent',
    border: '1px solid rgba(37,99,235,0.3)',
    borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.8rem',
    color: 'var(--color-electric-blue)',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
};
