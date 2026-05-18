# QuizTown -- Agent Instructions

QuizTown is a real-time interactive quiz platform for conferences, companies, and schools. Tagline: "Play. Vote. Learn."

## Tech Stack

- **Astro 5** (SSG, routing, i18n FR/EN) + **React 19** islands + **TypeScript** strict
- **Tailwind CSS v4** with CSS custom properties (design tokens)
- **Firebase**: Auth (Google SSO), Firestore (quizzes/results), Realtime Database (live sessions), Hosting
- **Framer Motion** (animations), **GIPHY API** (`@giphy/js-fetch-api`), **qrcode**
- **Vitest** + RTL (unit), **Playwright** (E2E)

## Design System

**Always follow the `techtown-brand-guidelines` skill** for colors, typography (Poppins), spacing, shadows, buttons, cards, and logo usage. Never hardcode values — use the CSS variables defined in `src/styles/global.css` (`--color-*`, `--spacing-*`, `--font-*`).

### QuizTown-specific tokens (not in the brand skill)

**VoteTile colors** use **triple redundancy** (pictogram + color + position) — never rely on color alone. Pictograms are PlayStation-inspired Unicode (✕ ○ △ □), and `aria-label` must include the pictogram name (e.g., "Answer A - Cross").

| Tile | Pictogram   | Token                   | Value     |
| ---- | ----------- | ----------------------- | --------- |
| A    | ✕ Cross     | `--color-tile-cross`    | `#2563EB` |
| B    | ○ Circle    | `--color-tile-circle`   | `#F59E0B` |
| C    | △ Triangle  | `--color-tile-triangle` | `#10B981` |
| D    | □ Square    | `--color-tile-square`   | `#EC4899` |

Colors are tuned for luminance variance across protanopia, deuteranopia, and tritanopia.

## Architecture Rules

### DRY & file structure

- No duplication between FR/EN pages — use shared components with a `lang` prop.
- Astro pages are minimal wrappers; logic lives in components/islands.
- Shared types in `src/types/`, re-exported from `src/types/index.ts`.

| Kind                 | Location          | Convention             |
| -------------------- | ----------------- | ---------------------- |
| Pages                | `src/pages/`      | `kebab-case.astro`     |
| Astro components     | `src/components/` | `PascalCase.astro`     |
| React islands        | `src/islands/`    | `PascalCase.tsx`       |
| UI components        | `src/islands/ui/` | `PascalCase.tsx`       |
| Hooks                | `src/hooks/`      | `camelCase.ts`         |
| Lib / utils / fb     | `src/{lib,utils,firebase}/` | `camelCase.ts` |
| Unit tests           | `tests/`          | mirrors source         |
| E2E tests            | `e2e/`            | `*.spec.ts`            |

### TypeScript, islands, i18n

- Strict mode, no `any` (use `unknown` + type guards). Explicit types on public APIs.
- `client:load` for immediately interactive islands; `client:visible` for below-fold.
- Use `useTranslations(lang)` from `src/i18n/index.ts`. Keys namespaced `section.element`. FR is default.

### Firebase

- **Firestore** = persistent (quizzes, results). **RTDB** = live sessions (low latency).
- **Never send `isCorrect` to players** — `sanitizeQuestion()` in `HostLivePage.tsx` strips it before pushing to RTDB. `correctOptionId` is only written when the host reveals results.
- **Never write `undefined` to RTDB** — use `null` or omit the field.
- Config via `PUBLIC_FIREBASE_CONFIG` (single-line JSON in `.env`).
- European RTDB URL format: `https://<db-name>.<region>.firebasedatabase.app`.

### Auth Guard

- All `/host/*` pages wrapped by the `AuthGuard` island (Google SSO via `signInWithPopup` — `signInWithRedirect` has known issues).
- Host pages combine `AuthGuard` + content: `HostDashboard`, `HostCreatePage`, `HostEditPage`, `HostLivePage`.
- `useAuth` hook exposes `{ user, loading, error, login, logout }`. COOP popup warnings are cosmetic.

### Live Session Flow

Session state machine: `lobby` → `question` → `feedback` → `leaderboard` → `finished`.

- **Host** (`HostLivePage` + `HostLiveControl`): creates session in lobby (shows QR + join URL), starts quiz, controls reveal / next / finish.
- **Player** (`PlayerSession` orchestrates `JoinForm` → `WaitingRoom` → `PlayerBuzzer` → `FeedbackScreen` → `Leaderboard`): reads `?session=` query, registers via `joinSession()`, listens with `onSessionChange()`, submits via `submitResponse()`.
- `firebase.json` rewrites: every dynamic route (`/play/**`, `/host/live/**`, `/host/edit/**`, `/screen/**`, `/raffle/**`, `/raffle/screen/**`) points to its `…/index.html`. The corresponding Astro pages are static `index.astro` (no `[id].astro`); the real session/raffle ID is read at runtime from `?session=` / `?id=` or the path segment.

### Animations & Accessibility

- Durations 150–300 ms, respect `prefers-reduced-motion`.
- Framer Motion for React, CSS transitions for Astro.
- WCAG AA contrast minimum. Color + shape + text feedback (never color alone, WCAG 2.1 §1.4.1).
- `aria-label` on all interactive elements; keyboard navigation supported.

### Testing

- Unit: Vitest + RTL + jsdom, Firebase SDK mocked, files in `tests/**/*.test.{ts,tsx}`.
- E2E: Playwright (Chromium only) against `http://localhost:4321`. Scripts: `npm run test:e2e`, `npm run test:e2e:ui`.

## Specs

- `spec/GENERAL.md` — brand & design system
- `spec/DESIGN.md` — screen layouts & UX flows
- `spec/TECH.md` — data models & architecture
- `spec/EPIC.md` — user stories
- `spec/PLAN.md` — phases & progress
