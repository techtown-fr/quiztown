export type Lang = 'fr' | 'en';

const translations: Record<Lang, Record<string, string>> = {
  fr: {
    // SEO
    'seo.title': 'QuizTown - Play. Vote. Learn.',
    'seo.description': 'Plateforme de quiz interactifs en temps réel pour conférences, entreprises et écoles.',
    'seo.keywords': 'quiz, interactif, temps réel, conférence, vote, leaderboard, quiztown',

    // Navigation
    'nav.home': 'Accueil',
    'nav.host': 'Organiser',
    'nav.play': 'Jouer',
    'nav.lang': 'EN',

    // Landing
    'landing.hero.title': 'Play. Vote. Learn.',
    'landing.hero.subtitle': 'La plateforme de quiz interactifs en temps réel qui engage votre audience.',
    'landing.hero.cta.host': 'Créer un quiz',
    'landing.hero.cta.play': 'Rejoindre une partie',
    'landing.features.title': 'Pourquoi QuizTown ?',
    'landing.features.instant.title': 'Connexion instantanée',
    'landing.features.instant.description': 'Scannez un QR code ou entrez un code. Zéro compte, zéro friction.',
    'landing.features.realtime.title': 'Temps réel',
    'landing.features.realtime.description': 'Votes synchronisés, scores en direct, leaderboard animé.',
    'landing.features.fun.title': 'Fun & engageant',
    'landing.features.fun.description': 'Animations, haptic feedback, gamification avec XP et streaks.',
    'landing.features.screen.title': 'Écran géant',
    'landing.features.screen.description': 'Mode projection 16:9 optimisé, lisible à 20 mètres.',

    // Join
    'join.title': 'Join the Town',
    'join.nickname': 'Pseudo',
    'join.nickname.placeholder': 'Ton pseudo...',
    'join.badge': 'Choisis ton badge',
    'join.cta': 'JOIN',
    'join.error.taken': 'Ce pseudo est déjà pris',
    'join.error.empty': 'Entre un pseudo',
    'join.error.long': '12 caractères max',

    // Waiting Room
    'waiting.title': 'En attente du Host...',
    'waiting.citizens': 'Citizens connectés',

    // Quiz
    'quiz.vote.locked': 'Vote verrouillé !',
    'quiz.feedback.correct': 'Correct !',
    'quiz.feedback.incorrect': 'Raté !',
    'quiz.feedback.xp': 'XP',
    'quiz.feedback.streak': 'Streak',
    'quiz.feedback.position': 'Position',

    // Leaderboard
    'leaderboard.title': 'Classement',
    'leaderboard.your.position': 'Ta position',

    // Host
    'host.dashboard.title': 'Dashboard',
    'host.create.title': 'Créer un quiz',
    'host.live.start': 'Démarrer',
    'host.live.pause': 'Pause',
    'host.live.skip': 'Suivant',
    'host.live.lock': 'Verrouiller',
    'host.stats.participation': 'Participation',
    'host.stats.avg.time': 'Temps moyen',
    'host.stats.distribution': 'Distribution',

    // Footer
    'footer.powered': 'Propulsé par TechTown',
    'footer.tagline': 'Play. Vote. Learn.',
  },
  en: {
    // SEO
    'seo.title': 'QuizTown - Play. Vote. Learn.',
    'seo.description': 'Real-time interactive quiz platform for conferences, companies and schools.',
    'seo.keywords': 'quiz, interactive, real-time, conference, vote, leaderboard, quiztown',

    // Navigation
    'nav.home': 'Home',
    'nav.host': 'Host',
    'nav.play': 'Play',
    'nav.lang': 'FR',

    // Landing
    'landing.hero.title': 'Play. Vote. Learn.',
    'landing.hero.subtitle': 'The real-time interactive quiz platform that engages your audience.',
    'landing.hero.cta.host': 'Create a quiz',
    'landing.hero.cta.play': 'Join a game',
    'landing.features.title': 'Why QuizTown?',
    'landing.features.instant.title': 'Instant Join',
    'landing.features.instant.description': 'Scan a QR code or enter a short code. No account, no friction.',
    'landing.features.realtime.title': 'Real-time',
    'landing.features.realtime.description': 'Synced votes, live scores, animated leaderboard.',
    'landing.features.fun.title': 'Fun & engaging',
    'landing.features.fun.description': 'Animations, haptic feedback, gamification with XP and streaks.',
    'landing.features.screen.title': 'Big Screen',
    'landing.features.screen.description': 'Projection-optimized 16:9 display, readable at 20 meters.',

    // Join
    'join.title': 'Join the Town',
    'join.nickname': 'Nickname',
    'join.nickname.placeholder': 'Your nickname...',
    'join.badge': 'Choose your badge',
    'join.cta': 'JOIN',
    'join.error.taken': 'This nickname is already taken',
    'join.error.empty': 'Enter a nickname',
    'join.error.long': '12 characters max',

    // Waiting Room
    'waiting.title': 'Waiting for the Host...',
    'waiting.citizens': 'Citizens connected',

    // Quiz
    'quiz.vote.locked': 'Vote locked!',
    'quiz.feedback.correct': 'Correct!',
    'quiz.feedback.incorrect': 'Wrong!',
    'quiz.feedback.xp': 'XP',
    'quiz.feedback.streak': 'Streak',
    'quiz.feedback.position': 'Position',

    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.your.position': 'Your position',

    // Host
    'host.dashboard.title': 'Dashboard',
    'host.create.title': 'Create a quiz',
    'host.live.start': 'Start',
    'host.live.pause': 'Pause',
    'host.live.skip': 'Next',
    'host.live.lock': 'Lock',
    'host.stats.participation': 'Participation',
    'host.stats.avg.time': 'Avg. time',
    'host.stats.distribution': 'Distribution',

    // Footer
    'footer.powered': 'Powered by TechTown',
    'footer.tagline': 'Play. Vote. Learn.',
  },
};

export function getLangFromUrl(url: URL): Lang {
  const pathname = url.pathname;
  if (pathname.startsWith('/en')) return 'en';
  return 'fr';
}

export function useTranslations(lang: Lang) {
  return function t(key: string): string {
    return translations[lang][key] ?? key;
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  if (lang === 'en') {
    return `/en${path === '/' ? '' : path}`;
  }
  return path;
}
