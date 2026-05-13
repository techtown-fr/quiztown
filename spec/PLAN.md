# QuizTown -- Plan d'implémentation

> Stack technique et conventions : voir `AGENTS.md`
> Design system et identité visuelle : voir `spec/GENERAL.md`
> Écrans et UX flows : voir `spec/DESIGN.md`
> Modèles de données et architecture : voir `spec/TECH.md`

## Architecture des fichiers

```
quiztown/
├── AGENTS.md                          # Instructions IA (conventions, stack, règles)
├── README.md                          # Documentation projet + deploy
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── firebase.json
├── .firebaserc
├── vitest.config.ts
├── playwright.config.ts
├── public/
│   ├── fonts/
│   │   ├── SpaceGrotesk-*.woff2
│   │   └── Inter-*.woff2
│   ├── images/
│   │   └── quiztown-logo.svg
│   └── manifest.json
├── src/
│   ├── components/                    # Composants Astro (statique)
│   │   ├── SEOHead.astro
│   │   ├── Header.astro
│   │   └── Footer.astro
│   ├── islands/                       # React Islands (interactif)
│   │   ├── AuthGuard.tsx              # Garde auth Google SSO
│   │   ├── JoinForm.tsx              # Ecran 01: Join Town
│   │   ├── WaitingRoom.tsx           # Ecran 02: Lobby
│   │   ├── PlayerBuzzer.tsx          # Ecran 03: Spot (question + vote)
│   │   ├── FeedbackScreen.tsx        # Ecran 05: Feedback perso
│   │   ├── Leaderboard.tsx           # Ecran 06: Classement
│   │   ├── PublicScreen.tsx          # Ecran projection (16:9)
│   │   ├── HostDashboard.tsx         # Dashboard host (listing + lancement)
│   │   ├── HostCreatePage.tsx        # Wrapper création quiz + auth + redirect
│   │   ├── HostEditPage.tsx          # Wrapper édition quiz (Firestore + QuizEditor + updateQuiz)
│   │   ├── HostLivePage.tsx          # Wrapper live session (query string + RTDB + callbacks)
│   │   ├── HostLiveControl.tsx       # ControlDeck live (QR code lobby + controls)
│   │   ├── PlayerSession.tsx         # Orchestrateur session joueur Firebase
│   │   ├── QuizEditor.tsx            # Studio: création / édition quiz
│   │   ├── RaffleHost.tsx            # Host raffle (AuthGuard + lobby + draw + history)
│   │   ├── RafflePlayer.tsx          # Joueur raffle (join + waiting + reveal)
│   │   ├── RaffleScreen.tsx          # Ecran projection raffle (QR + roulette + winner)
│   │   └── ui/                       # Design system React
│   │       ├── VoteTile.tsx
│   │       ├── CountdownRing.tsx
│   │       ├── XPBadge.tsx
│   │       ├── LeaderboardRow.tsx
│   │       └── GifPicker.tsx          # Modal recherche GIF (GIPHY)
│   ├── lib/                           # Helpers externes
│   │   └── giphy.ts                  # Wrapper API GIPHY (search, trending)
│   ├── firebase/                      # Firebase SDK + helpers
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── realtime.ts
│   │   └── raffle.ts                 # RTDB helpers raffle (createRaffle, joinRaffle, drawWinner...)
│   ├── hooks/                         # React hooks custom
│   │   ├── useSession.ts
│   │   ├── useCountdown.ts
│   │   ├── useLeaderboard.ts
│   │   └── useAuth.ts
│   ├── i18n/
│   │   └── index.ts                  # Traductions FR/EN
│   ├── layouts/
│   │   ├── Layout.astro              # Layout principal
│   │   └── GameLayout.astro          # Layout joueur (plein écran)
│   ├── pages/
│   │   ├── index.astro               # Landing page (FR)
│   │   ├── play/
│   │   │   └── [id].astro            # Joueur: rejoint session
│   │   ├── host/
│   │   │   ├── index.astro           # Dashboard host
│   │   │   ├── create.astro          # Création quiz
│   │   │   ├── edit.astro            # Édition quiz (?id=xxx)
│   │   │   └── live/
│   │   │       ├── index.astro       # Control deck (?session=xxx)
│   │   │       └── [id].astro        # Control deck (demo)
│   │   ├── screen/
│   │   │   └── [id].astro            # Ecran public/projection
│   │   ├── raffle/
│   │   │   ├── [id].astro            # Joueur raffle (rejoint via QR/lien)
│   │   │   └── screen/
│   │   │       └── [id].astro        # Ecran projection raffle
│   │   └── en/
│   │       └── index.astro           # Landing page (EN)
│   ├── styles/
│   │   └── global.css                # Design tokens + base
│   ├── types/
│   │   ├── quiz.ts
│   │   ├── session.ts
│   │   ├── raffle.ts                 # Raffle, RaffleParticipant, RafflePrize
│   │   └── index.ts
│   └── utils/
│       └── scoring.ts                # Calcul de score (vitesse + exactitude)
├── tests/                             # Tests unitaires (Vitest)
│   ├── setup.ts
│   ├── hooks/
│   ├── islands/
│   └── utils/
├── e2e/                               # Tests E2E (Playwright)
│   ├── quiz-flow.spec.ts
│   ├── quiz-edit.spec.ts
│   └── live-session.spec.ts
└── spec/
    ├── GENERAL.md                     # Identité visuelle, design system
    ├── DESIGN.md                      # Écrans, UX flows
    ├── TECH.md                        # Modèles de données, architecture
    ├── EPIC.md                        # User stories
    ├── PLAN.md                        # Ce fichier (phases + progrès)
    └── NEW_FEATURES.md                # Backlog features (feedbacks utilisateurs)
```

---

## Phases d'implémentation

### Phase 0 : Bootstrap projet

- [x] `AGENTS.md`, `README.md`, `.gitignore`
- [x] `git init` + premier commit

### Phase 1 : Fondations

- [x] Initialiser projet Astro 5 + React + Tailwind v4
- [x] Configurer Firebase (auth, firestore, realtime)
- [x] Configurer Vitest + React Testing Library + jsdom
- [x] Créer le design system (tokens CSS, composants de base)
- [x] Layout principal + i18n (FR/EN)
- [x] Landing page (hero CTA: "Créer un quiz")
- [x] Responsive mobile-first

### Phase 2 : Studio Quiz (Host)

- [x] `QuizEditor.tsx` -- création quiz (QCM + timer + media)
- [x] Sauvegarde Firestore
- [x] `HostDashboard.tsx` -- listing, lancement, suppression
- [x] `AuthGuard.tsx` -- Google SSO
- [x] `HostCreatePage.tsx` -- wrapper auth + sauvegarde + redirect
- [x] `HostEditPage.tsx` -- édition quiz existant (charge Firestore, pré-remplit, `updateQuiz`)
- [x] Route `/host/edit?id=xxx`
- [x] Mode édition dans QuizEditor (props `initialTitle`, `initialDescription`, `initialQuestions`)
- [x] `HostLivePage.tsx` -- session ID via query string + RTDB
- [x] Route `/host/live/?session=xxx`

### Phase 3 : Moteur Live

- [x] Création session Realtime DB
- [x] Génération QR Code (lib `qrcode`, lobby HostLiveControl)
- [x] Hooks : `useSession`, `useCountdown`, `useLeaderboard`
- [x] Scoring (vitesse + exactitude)
- [x] State machine (lobby → question → feedback → leaderboard → finished)
- [x] Callbacks HostLivePage : Démarrer, Suivant, Résultats, Terminer
- [x] `PlayerSession.tsx` : orchestrateur Firebase joueur
- [x] Rewrites Firebase Hosting (`/play/**`, `/host/live/**`, `/screen/**`)

### Phase 4 : Expérience Joueur

- [x] `JoinForm.tsx` -- pseudo + badge, join en 5s
- [x] `WaitingRoom.tsx` -- animation + compteur
- [x] `PlayerBuzzer.tsx` -- VoteTiles avec Framer Motion
- [x] Vote lock intégré dans PlayerBuzzer
- [x] `FeedbackScreen.tsx` -- correct/incorrect + XP + streak
- [x] `Leaderboard.tsx` -- top 5 animé + position perso

### Phase 5 : Host ControlDeck

- [x] `HostLiveControl.tsx` -- QR code lobby + join URL + copie
- [x] CrowdStats intégrés dans HostLiveControl (stats bar)
- [x] Boutons : Démarrer, Afficher résultats, Suivant, Terminer
- [x] Timer countdown (vert → orange → rouge)
- [x] Flow linéaire obligatoire (un seul bouton d'action par phase)
- [x] Bouton "Afficher résultats" pulse quand timer=0 ou tous ont répondu
- [x] Classement après chaque question
- [x] Question preview dans ControlDeck (texte + GIF + réponses avec pictogrammes)

### Phase 6 : Ecran Public

- [x] `PublicScreen.tsx` -- 16:9, lisible à 20m
- [x] Question géante + countdown ring
- [x] Barres de votes animées
- [x] Résultat + bonne réponse highlighted

### Phase 7 : Tests

- [x] Vitest + React Testing Library + jsdom configurés
- [x] Tests hooks : `useCountdown`, `useLeaderboard`
- [x] Tests VoteTile (26 tests : pictogrammes, accessibilité, palette, états, interactions)
- [ ] Tests composants UI : `CountdownRing`, `JoinForm`, `Leaderboard`
- [x] Tests scoring + state machine session
- [ ] Mocks Firebase complets (Realtime DB, Firestore, Auth)
- [x] Playwright E2E configuré (Chromium)
- [x] E2E création quiz + dashboard + édition + session live complète
- [x] Scripts : `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`

### Phase 8 : Polish & Production

- [x] Mode sombre (`prefers-color-scheme`)
- [x] Animations micro-interactions (Framer Motion)
- [x] PWA manifest
- [ ] Performance audit (< 300ms animations)
- [ ] Tests accessibilité (contraste AA)
- [x] Accessibilité daltonisme VoteTiles (palette Bleu/Orange/Vert/Rose + pictogrammes ✕ ○ △ □)
- [ ] Valider contraste nouvelles couleurs sur fond clair ET sombre
- [x] Firebase Security Rules (Firestore + RTDB)

### Phase 9 : Documentation & CI/CD

- [x] README.md complet (prérequis, env, scripts, deploy, Firebase setup)
- [x] GitHub Actions CI/CD (lint, test, build, deploy on push to main)

### Phase 10 : Media (GIF)

- [x] Type `QuizMedia` étendu (`'gif'`, champ `alt`)
- [x] `media` optionnel dans `CurrentQuestion` (session.ts)
- [x] `@giphy/js-fetch-api` installé
- [x] `src/lib/giphy.ts` -- wrapper API GIPHY
- [x] `GifPicker.tsx` -- modal recherche GIF
- [x] `QuizEditor.tsx` -- bouton GIF, prévisualisation, suppression
- [ ] `PlayerBuzzer.tsx` -- afficher media (GIF/image) au-dessus des VoteTiles
- [x] `PublicScreen.tsx` -- afficher media (projection 16:9)
- [x] Propager media dans session RTDB (`setCurrentQuestion`)
- [x] Media dans ControlDeck host (question + GIF + réponses)
- [ ] Labels i18n FR/EN pour les textes GIF
- [x] `PUBLIC_GIPHY_API_KEY` dans `.env.example`

### Phase 12 : Raffle (Tirage au sort SWAG)

- [x] Types `Raffle`, `RaffleParticipant`, `RafflePrize` (`src/types/raffle.ts`)
- [x] Helpers RTDB raffle (`src/firebase/raffle.ts`) -- `createRaffle`, `joinRaffle`, `setPrizes`, `startDrawing`, `revealWinner`, `updateRaffleStatus`, `onRaffleChange`
- [x] `RaffleHost.tsx` -- AuthGuard + lobby QR + éditeur de lots + animation roulette + reveal + historique
- [x] `RafflePlayer.tsx` -- formulaire join + waiting room + reveal gagnant (différencié si je gagne ou non) + récap final
- [x] `RaffleScreen.tsx` -- écran projection : QR géant + roulette + reveal nom géant + résultats finaux
- [x] Pages Astro : `/host/raffle`, `/raffle/[id]`, `/raffle/screen/[id]` (avec `getStaticPaths` demo)
- [x] Rewrites Firebase Hosting (`/raffle/**`, `/raffle/screen/**`)
- [x] Règles RTDB (`raffles/$raffleId` -- read/write public, validation participants)
- [x] Bouton "🎁 Raffle" dans le `HostDashboard` à côté de "Créer un quiz"
- [ ] Refactor : extraire `useQrCode(url, opts)` (dupliqué 3x : `HostLiveControl`, `RaffleHost`, `RaffleScreen`)
- [ ] Refactor : extraire `useRaffle(raffleId, lang)` (subscription dupliquée 3x)
- [ ] Refactor : remplacer les hex hardcodés par les design tokens (`var(--color-*)`, `var(--spacing-*)`)
- [ ] Bug : roulette pick deux winners différents (un pour l'animation finale, un pour le reveal -- voir review)
- [ ] Bug : `setInterval` deceleration ne fonctionne pas (closure capture `tick=0`)
- [ ] Persister `playerId` raffle dans `localStorage` (déduplication si rejoint)
- [ ] Support `prefers-reduced-motion` dans les animations
- [ ] Tests unitaires + E2E raffle
