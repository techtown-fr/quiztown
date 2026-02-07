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
- **Vitest** + **React Testing Library** -- Unit tests

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
- **Firebase helpers**: `camelCase.ts` in `src/firebase/`
- **Types**: `camelCase.ts` in `src/types/`
- **Tests**: mirror source structure in `tests/`

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
- **Never send `isCorrect`** to players -- validate server-side
- Firebase config via environment variables (`.env`)

### Testing

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **jsdom** environment for DOM tests
- Mock Firebase SDK in tests
- Test files: `tests/**/*.test.{ts,tsx}`

### Animations

- Duration: 150-300ms (never blocking)
- Use Framer Motion for React components
- CSS transitions for Astro components
- Respect `prefers-reduced-motion`

### Accessibility

- Minimum AA contrast ratio
- Large text for projection screens
- Color + text feedback (never color alone)
- Keyboard navigation support

## Key Specs

- See `spec/GENERAL.md` for brand identity and design system
- See `spec/DESIGN.md` for detailed screen layouts and UX flows
- See `spec/TECH.md` for data models and technical architecture
- See `spec/EPIC.md` for user stories
- See `spec/PLAN.md` for implementation phases and progress
