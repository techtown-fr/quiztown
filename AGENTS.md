# QuizTown -- Agent Instructions

## Project Overview

QuizTown is a real-time interactive quiz platform for conferences, companies, and schools. Built with Astro 5 + React Islands + Firebase.

**Tagline**: "Play. Vote. Learn."

## Tech Stack

- **Astro 5.x** -- Static site generation, routing, i18n (FR/EN)
- **React 19** -- Interactive islands (buzzer, leaderboard, control deck)
- **TypeScript** -- Strict mode, zero `any`
- **Tailwind CSS v4** + CSS custom properties (design tokens)
- **Framer Motion** -- Animations (vote tiles, leaderboard, countdown)
- **Firebase Auth** -- Google SSO for hosts
- **Cloud Firestore** -- Quiz storage, results, history
- **Firebase Realtime Database** -- Live engine (sessions, votes, scores)
- **Firebase Hosting** -- Deployment
- **GIPHY API** (`@giphy/js-fetch-api`) -- GIF search for quiz questions
- **qrcode** (`qrcode` + `@types/qrcode`) -- QR code generation for session join links
- **Vitest** + **React Testing Library** -- Unit tests
- **Playwright** -- E2E tests (quiz creation, dashboard, live sessions, player flow)

## Architecture Rules

### DRY Principle

- Never duplicate code between FR/EN pages. Use shared components with `lang` prop.
- Astro pages are minimal wrappers. Business logic lives in components/islands.
- Shared types in `src/types/`. Re-export from `src/types/index.ts`.

### File Structure

- **Pages**: `kebab-case.astro` (e.g., `index.astro`)
- **Astro Components**: `PascalCase.astro` (e.g., `Header.astro`) in `src/components/`
- **React Islands**: `PascalCase.tsx` (e.g., `PlayerBuzzer.tsx`) in `src/islands/`
- **React UI components**: `PascalCase.tsx` in `src/islands/ui/`
- **Hooks**: `camelCase.ts` (e.g., `useSession.ts`) in `src/hooks/`
- **Lib helpers**: `camelCase.ts` in `src/lib/` (e.g., `giphy.ts`)
- **Firebase helpers**: `camelCase.ts` in `src/firebase/`
- **Types**: `camelCase.ts` in `src/types/`
- **Tests**: mirror source structure in `tests/`
- **E2E tests**: `e2e/**/*.spec.ts`

### CSS & Styling

- **Design tokens** defined as CSS custom properties in `src/styles/global.css`
- **Always use** `var(--color-*)`, `var(--spacing-*)`, `var(--font-*)` -- never hardcode values
- **Tailwind classes** reference CSS variables via theme config
- **Scoped styles** in Astro components (`<style>` block)
- **Mobile-first** responsive design

### Color Palette

| Token                    | Value     | Usage                    |
| ------------------------ | --------- | ------------------------ |
| `--color-electric-blue`  | `#2563EB` | Primary, trust, tech     |
| `--color-violet-pulse`   | `#7C3AED` | Energy, live interaction |
| `--color-mint-pop`       | `#2DD4BF` | Success, validation      |
| `--color-dark-slate`     | `#0F172A` | Dark backgrounds         |
| `--color-soft-white`     | `#F8FAFC` | Light backgrounds        |
| `--color-alert-coral`    | `#FB7185` | Error, tension           |

### VoteTile Colors (Colorblind-Accessible)

Each VoteTile uses **triple redundancy**: pictogram (shape) + color + position. Never rely on color alone.

| Tile | Pictogram   | Token                  | Value     |
| ---- | ----------- | ---------------------- | --------- |
| A    | ✕ Cross     | `--color-tile-cross`   | `#2563EB` |
| B    | ○ Circle    | `--color-tile-circle`  | `#F59E0B` |
| C    | △ Triangle  | `--color-tile-triangle`| `#10B981` |
| D    | □ Square    | `--color-tile-square`  | `#EC4899` |

- Pictograms are PlayStation-inspired (✕ ○ △ □), rendered as Unicode with SVG fallback
- Colors chosen for **luminance variance** across all color blindness types (protanopia, deuteranopia, tritanopia)
- Pictogram always visible in the 32×32px badge (48×48px on projection screens)
- `aria-label` must include the pictogram name (e.g., "Answer A - Cross")

### Typography

- **Display/Headings**: `Space Grotesk` (`--font-display`)
- **Body/UI**: `Inter` (`--font-body`)

### i18n

- Use `useTranslations(lang)` pattern from `src/i18n/index.ts`
- All user-facing text externalized as translation keys
- Keys namespaced: `section.element` (e.g., `join.title`, `quiz.question`)
- Support FR (default) and EN

### React Islands (Hydration)

- Use `client:load` for immediately interactive components (buzzer, controls)
- Use `client:visible` for below-fold components (leaderboard, stats)
- Keep islands minimal -- only what needs client-side interactivity

### TypeScript

- Strict mode enabled
- Explicit types for all function parameters and return values
- Use interfaces for component props
- No `any` -- use `unknown` + type guards when needed

### Firebase

- **Firestore** for persistent data (quizzes, results)
- **Realtime Database** for live sessions (low latency)
- **Never send `isCorrect`** to players -- validate server-side. The `sanitizeQuestion()` function in `HostLivePage.tsx` strips `isCorrect` before pushing to RTDB
- **Never write `undefined`** to Realtime Database -- use `null` or omit the field entirely (Firebase RTDB rejects `undefined` values)
- Firebase config via environment variables (`.env`) -- single-line JSON string (`PUBLIC_FIREBASE_CONFIG`) is the recommended format
- `firebase.json` declares `hosting`, `firestore` (rules), and `database` (rules) targets
- GIF media URLs hosted on GIPHY CDN (no Firebase Storage needed for GIFs)
- **Realtime Database URL** for European regions uses format: `https://<db-name>.<region>.firebasedatabase.app`

### Auth Guard Pattern

- All `/host/*` pages are protected by the `AuthGuard` React island
- `AuthGuard` wraps page content: shows login screen if unauthenticated, user bar + children if authenticated
- Uses `signInWithPopup` (Google SSO) -- `signInWithRedirect` has known issues with modern browsers
- Host pages use wrapper islands to combine AuthGuard + page content:
  - `HostDashboard` = AuthGuard + dashboard UI
  - `HostCreatePage` = AuthGuard + QuizEditor (with Firestore save)
  - `HostEditPage` = AuthGuard + QuizEditor in edit mode (loads quiz via `getQuiz`, pre-fills editor, uses `updateQuiz`)
  - `HostLivePage` = AuthGuard + HostLiveControl (with wired-up session callbacks)
- The `useAuth` hook manages auth state (`user`, `loading`, `error`, `login`, `logout`)
- COOP warnings in the console from `signInWithPopup` are cosmetic -- authentication works correctly

### Live Session Flow

The live session connects Host and Players via Firebase Realtime Database:

- **Host side** (`HostLivePage.tsx` + `HostLiveControl.tsx`):
  - Session is created from `HostDashboard` (status: `lobby`)
  - Lobby view shows QR code + join URL (generated via `qrcode` library)
  - "Demarrer" fetches quiz from Firestore, sanitizes first question (strips `isCorrect`), pushes to RTDB
  - Host controls: "Afficher les resultats" (reveals `correctOptionId`), "Suivant" (next question), "Terminer" (finished)
  - Session state machine: `lobby` -> `question` -> `feedback` -> `leaderboard` -> `finished`
- **Player side** (`PlayerSession.tsx` orchestrates `JoinForm` -> `WaitingRoom` -> `PlayerBuzzer` -> `FeedbackScreen` -> `Leaderboard`):
  - Reads session ID from URL query param (`?session=xxx`)
  - `JoinForm` calls `joinSession()` to register player in RTDB
  - Listens to `onSessionChange()` for host-driven state transitions
  - Submits answers via `submitResponse()`
  - Feedback computed client-side when host reveals `correctOptionId`
- **Firebase rewrites** in `firebase.json`: `/play/**` -> `/play/demo.html`, `/host/live/**` -> `/host/live.html` (serves pre-built pages for dynamic session IDs)
- **Security**: `correctOptionId` is only written when host explicitly reveals results (never sent with the question)

### Testing

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **jsdom** environment for DOM tests
- Mock Firebase SDK in tests
- Test files: `tests/**/*.test.{ts,tsx}`
- **Playwright** for E2E tests
- E2E test files: `e2e/**/*.spec.ts`
- Playwright config: `playwright.config.ts`
- Runs against Astro dev server (`http://localhost:4321`)
- Chromium only (for speed)
- Scripts: `npm run test:e2e`, `npm run test:e2e:ui`

### Animations

- Duration: 150-300ms (never blocking)
- Use Framer Motion for React components
- CSS transitions for Astro components
- Respect `prefers-reduced-motion`

### Accessibility

- Minimum AA contrast ratio
- Large text for projection screens
- Color + shape + text feedback (never color alone) -- WCAG 2.1 § 1.4.1
- VoteTiles use pictograms (✕ ○ △ □) + accessible color palette for colorblind users
- `aria-label` on all interactive elements
- Keyboard navigation support

### Demo Mode

- **BroadcastChannel API** (`quiztown-demo`) syncs `/demo` (player) with `/demo/screen` (host)
- `/demo/screen` is the **source of truth** — it manages quiz state, bots, and real players
- `/demo` auto-detects the host via ping/pong (600ms timeout) and falls back to solo mode
- Message types defined in `src/lib/demoBroadcast.ts`
- **Host controls**: results are never auto-shown — host clicks "Afficher les résultats" (optional) then "Suivant"
- **Podium reveal**: final leaderboard reveals players one by one (5→4→3 bronze→2 silver→1 gold + spotlight)
- No framer-motion in `DemoJoinForm` (causes hydration issues with Astro) — use plain HTML elements
- Demo data in `src/lib/demoData.ts` — 5 bot players, 5 quiz questions

## Key Specs

- See `spec/GENERAL.md` for brand identity and design system
- See `spec/DESIGN.md` for detailed screen layouts and UX flows
- See `spec/TECH.md` for data models and technical architecture
- See `spec/EPIC.md` for user stories
- See `spec/PLAN.md` for implementation phases and progress
