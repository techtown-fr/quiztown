# QuizTown

> **Play. Vote. Learn.**

QuizTown is a real-time interactive quiz platform designed for conferences, companies, and schools. Engage your audience with live quizzes, real-time voting, and dynamic leaderboards.

## Features

- **Instant Join** -- Scan a QR code or enter a short code. No account needed.
- **Live Quizzes** -- Real-time question sync, countdown timer, instant feedback.
- **Leaderboard** -- Animated rankings based on speed + accuracy.
- **Host Control Deck** -- Start, pause, skip questions. Monitor participation live.
- **Public Screen** -- Projection-optimized 16:9 display with giant text and vote bars.
- **Quiz Studio** -- Create and manage quizzes with multiple-choice questions, images, and code snippets.
- **Multilingual** -- French and English support.

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
| Language       | TypeScript (strict)              |

## Prerequisites

- **Node.js** 20+ (recommended: 22.x)
- **npm** 10+
- **Firebase CLI** (`npm install -g firebase-tools`)
- A Firebase project with Auth, Firestore, and Realtime Database enabled

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

Required variables:

```
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=
PUBLIC_FIREBASE_DATABASE_URL=
```

## Deployment

```bash
# Login to Firebase
firebase login

# Deploy to Firebase Hosting
firebase deploy
```

## Project Structure

```
src/
├── components/    # Astro components (static)
├── islands/       # React islands (interactive)
│   └── ui/        # Design system components
├── firebase/      # Firebase SDK helpers
├── hooks/         # Custom React hooks
├── i18n/          # Translations (FR/EN)
├── layouts/       # Page layouts
├── pages/         # Astro pages (routes)
├── styles/        # Global CSS + design tokens
└── types/         # TypeScript type definitions
```

## License

Private -- TechTown internal project.
