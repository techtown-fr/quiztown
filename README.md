# QuizTown

> **Play. Vote. Learn.**

QuizTown is a real-time interactive quiz platform designed for conferences, companies, and schools. Engage your audience with live quizzes, real-time voting, and dynamic leaderboards.

## Features

- **Instant Join** -- Scan a QR code or enter a short code. No account needed.
- **Live Quizzes** -- Real-time question sync, countdown timer, instant feedback.
- **Leaderboard** -- Animated rankings based on speed + accuracy.
- **Host Control Deck** -- Start, pause, skip questions. Monitor participation live.
- **Public Screen** -- Projection-optimized 16:9 display with giant text and vote bars.
- **Quiz Studio** -- Create and manage quizzes with multiple-choice questions, GIFs, images, and code snippets.
- **GIF Search** -- Built-in GIPHY search to add animated GIFs to questions (Kahoot-style).
- **Emoji Picker** -- Quick emoji insertion in question text.
- **Multilingual** -- French and English support.
- **Dark Mode** -- Automatic dark mode support via system preference.
- **PWA** -- Installable on mobile devices.

## Tech Stack

| Layer          | Technology                       |
| -------------- | -------------------------------- |
| Frontend       | Astro 5, React 19 (Islands)     |
| Styling        | Tailwind CSS v4, CSS Variables   |
| Animations     | Framer Motion                    |
| Auth           | Firebase Auth (Google SSO)       |
| Database       | Cloud Firestore                  |
| Live Engine    | Firebase Realtime Database       |
| Hosting        | Firebase Hosting                 |
| Tests          | Vitest, React Testing Library    |
| CI/CD          | GitHub Actions                   |
| Language       | TypeScript (strict)              |

## Prerequisites

- **Node.js** 20+ (recommended: 22.x)
- **npm** 10+
- **Firebase CLI** (`npm install -g firebase-tools`)
- A Firebase project with Auth, Firestore, and Realtime Database enabled

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd quiztown

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Firebase config in .env

# Start development server
npm run dev
```

The dev server starts at `http://localhost:4321`.

## Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start dev server (port 4321)    |
| `npm run build`        | Build for production            |
| `npm run preview`      | Preview production build        |
| `npm test`             | Run all tests                   |
| `npm run test:watch`   | Run tests in watch mode         |
| `npm run test:coverage`| Run tests with coverage report  |

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```
# Firebase (required)
PUBLIC_FIREBASE_API_KEY=your-api-key
PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
PUBLIC_FIREBASE_PROJECT_ID=your-project-id
PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# GIPHY (optional -- enables GIF search in quiz editor)
PUBLIC_GIPHY_API_KEY=your-giphy-api-key
```

> **GIPHY API key**: Create a free account at [developers.giphy.com](https://developers.giphy.com/), then create an app to get an API key. The free tier is sufficient (no credit card needed). If omitted, the GIF picker will still open but search results will be empty.

## Firebase Setup

### 1. Create a Firebase project

Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.

### 2. Enable services

- **Authentication**: Enable Google sign-in provider
- **Cloud Firestore**: Create database (start in test mode, then apply rules)
- **Realtime Database**: Create database (apply rules from `database.rules.json`)

### 3. Apply security rules

```bash
# Login to Firebase
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

### 4. Get your config

In Firebase Console > Project Settings > General, copy the Firebase SDK config and paste values into your `.env` file.

## Deployment

### Manual deployment

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### CI/CD (GitHub Actions)

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:

1. Runs tests on every push and PR
2. Builds the project
3. Deploys to Firebase Hosting on push to `main`

**Setup required GitHub Secrets:**

- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

## Project Structure

```
src/
├── components/    # Astro components (static)
├── islands/       # React islands (interactive)
│   └── ui/        # Design system components
├── lib/           # External API helpers (GIPHY)
├── firebase/      # Firebase SDK helpers
├── hooks/         # Custom React hooks
├── i18n/          # Translations (FR/EN)
├── layouts/       # Page layouts
├── pages/         # Astro pages (routes)
├── styles/        # Global CSS + design tokens
├── types/         # TypeScript type definitions
└── utils/         # Business logic (scoring, state machine)
tests/
├── hooks/         # Hook tests
├── islands/       # Component tests
└── utils/         # Business logic tests
```

## Key URLs

| Route              | Description                |
| ------------------ | -------------------------- |
| `/`                | Landing page               |
| `/host`            | Host dashboard             |
| `/host/create`     | Quiz editor                |
| `/host/live/:id`   | Host control deck          |
| `/play/:id`        | Player join + game         |
| `/screen/:id`      | Public projection screen   |
| `/en/`             | English landing page       |

## Specs

- See `spec/GENERAL.md` for brand identity and design system
- See `spec/DESIGN.md` for detailed screen layouts and UX flows
- See `spec/TECH.md` for data models and technical architecture
- See `spec/EPIC.md` for user stories
- See `spec/PLAN.md` for implementation phases and progress

## License

Private -- TechTown internal project.
