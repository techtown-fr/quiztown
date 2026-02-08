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
# Firebase (required) -- Single JSON string on one line (recommended)
PUBLIC_FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"...","databaseURL":"...","storageBucket":"...","messagingSenderId":"...","appId":"..."}

# Or use individual keys instead:
# PUBLIC_FIREBASE_API_KEY=your-api-key
# PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.europe-west1.firebasedatabase.app

# GIPHY (optional -- enables GIF search in quiz editor)
PUBLIC_GIPHY_API_KEY=your-giphy-api-key
```

> **Important**: The `PUBLIC_FIREBASE_CONFIG` value must be valid JSON on a **single line** (no quotes around the value, no multiline). Copy the config object directly from the Firebase Console.

> **Database URL**: If your Realtime Database is in a non-default region (e.g., `europe-west1`), the URL format is `https://<db-name>.europe-west1.firebasedatabase.app` (not `firebaseio.com`).

> **GIPHY API key**: Create a free account at [developers.giphy.com](https://developers.giphy.com/), then create an app to get an API key. The free tier is sufficient (no credit card needed). If omitted, the GIF picker will still open but search results will be empty.

## Firebase Setup

### 1. Create a Firebase project

Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.

### 2. Register a Web app

In the Firebase Console, go to **Project Settings > General > Your apps** and click the **Web** icon (`</>`). Register your app (e.g., "QuizTown Web") -- this gives you the Firebase SDK config needed for the `.env` file.

### 3. Enable services

- **Authentication**: Go to Authentication > Sign-in method, enable **Google** provider
- **Cloud Firestore**: Create database in your preferred region
- **Realtime Database**: Run `firebase init database` to create the database instance, choose your region (e.g., `europe-west1`)

### 4. Login and associate project

```bash
# Login to Firebase
firebase login

# Associate your project
firebase use --add
# Select your project from the list
```

### 5. Apply security rules

```bash
# Deploy Firestore + Realtime Database rules
firebase deploy --only firestore:rules,database
```

> **Note**: `firebase.json` includes both `firestore.rules` and `database.rules.json` references. These are deployed together.

### 6. Get your config

In Firebase Console > Project Settings > General > Your apps > Web app, copy the `firebaseConfig` object and paste it as a single-line JSON into `PUBLIC_FIREBASE_CONFIG` in your `.env` file.

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
2. Builds the project with Firebase config injected from secrets
3. Deploys Firebase security rules (Firestore + Realtime Database)
4. Deploys to Firebase Hosting on push to `main`

**Required GitHub Secrets:**

| Secret | Description |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON key |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID (e.g., `quiztown-app`) |
| `PUBLIC_FIREBASE_CONFIG` | Firebase SDK config as single-line JSON (same as `.env`) |
| `PUBLIC_GIPHY_API_KEY` | *(optional)* GIPHY API key for GIF search |

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

| Route              | Description                              |
| ------------------ | ---------------------------------------- |
| `/`                | Landing page (FR)                        |
| `/en/`             | Landing page (EN)                        |
| `/host`            | Host dashboard (auth required)           |
| `/host/create`     | Quiz editor (auth required)              |
| `/host/live/:id`   | Host control deck (auth required)        |
| `/play/:id`        | Player join + game                       |
| `/screen/:id`      | Public projection screen                 |
| `/demo`            | Demo player (no Firebase needed)         |
| `/demo/screen`     | Demo projection screen (no Firebase)     |

> **Auth guard**: All `/host/*` pages are protected by an `AuthGuard` React island that requires Google sign-in. Unauthenticated users see a login screen.

## Specs

- See `spec/GENERAL.md` for brand identity and design system
- See `spec/DESIGN.md` for detailed screen layouts and UX flows
- See `spec/TECH.md` for data models and technical architecture
- See `spec/EPIC.md` for user stories
- See `spec/PLAN.md` for implementation phases and progress

## License

Private -- TechTown internal project.
