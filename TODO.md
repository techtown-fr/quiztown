# TODO -- Revue feature Raffle

> Issus de la revue de code du feature raffle (mai 2026).
> Voir aussi `spec/PLAN.md` § Phase 12 pour le suivi macro.

## Légende

- 🔴 **Bug** -- comportement incorrect, à corriger
- 🟡 **CRAFT/DRY/KISS** -- qualité de code, refacto
- 🟢 **Quick win** -- fixable en quelques minutes
- 🔒 **Sécurité** -- risque résiduel, à durcir

---

## 🔴 Bugs à corriger

- [x] **Bug roulette #1 -- Winner affiché ≠ winner enregistré** 🟢
  Dans `RaffleHost.tsx` `handleDraw`, `Math.random()` est appelé deux fois (un pour le dernier `setRollingName`, un pour le `winner` réel). Visuellement, la roulette saute sur un autre nom au dernier moment.
  → Tirer le winner UNE seule fois et l'utiliser pour le `setRollingName` final + `revealWinner`.

- [x] **Bug roulette #2 -- Décélération `setInterval` cassée** 🟢
  `setInterval(fn, 80 + tick * 8)` : `setInterval` capture le `delay` une seule fois, donc la décélération promise par le code n'a jamais lieu. Idem dans `RaffleScreen.tsx` (`60 + tick * 5`).
  → Remplacer par `setTimeout` récursif ou `requestAnimationFrame` avec un vrai easing.

- [x] **Cleanup d'interval manquant à l'unmount** 🟢
  `RaffleHost.tsx` n'a pas de `useEffect(() => () => clearInterval(animationRef.current))`. Si l'host quitte la page pendant un tirage, l'intervalle continue + écrit en RTDB.

- [x] **Race condition double-clic "Tirer au sort"** 🟢
  `handleDraw` ne vérifie pas `isAnimating` avant de démarrer un nouveau setInterval. Deux clics rapides = deux roulettes en parallèle.
  → Ajouter `disabled={isAnimating}` sur le bouton + early return.

- [ ] **Promesses non-awaitées (silent failures)** 🟡
  `setPrizes`, `revealWinner`, `joinRaffle` dans certains chemins ne sont pas `await` → erreurs RTDB avalées sans feedback utilisateur.

- [x] **`playerId` regénéré à chaque reload** 🟢
  `useState(() => Math.random()...)` dans `RafflePlayer.tsx` : un refresh = nouvel ID = doublon dans la liste.
  → Persister dans `localStorage` (clé `raffle-player-id-{raffleId}`).

- [x] **Parsing d'URL fragile côté client** 🟡
  `pathParts.indexOf('raffle')` puis `pathParts[idx+1]` : casse si l'URL a un préfixe inattendu.
  → Centralisé dans `src/lib/raffleUrl.ts` (`getRaffleIdFromLocation`, `getRaffleScreenIdFromLocation`) avec une regex qui exclut explicitement `/raffle/screen/...` du player path. Pas de prop Astro car les pages sont pré-rendues uniquement avec `id=demo` (Firebase rewrite gère la dynamique).

- [ ] **Inconsistance des rewrites Firebase** 🟡 (préexistant, pas introduit par le raffle)
  `firebase.json` rewrite `/play/demo.html` mais Astro génère `/play/demo/index.html`. Le raffle utilise la bonne forme.
  → Auditer et harmoniser.

---

## 🎨 CRAFT -- Design tokens & alignement brand TechTown

> `AGENTS.md` (mai 2026) délègue désormais le design system au skill `.agents/skills/techtown-brand-guidelines`.
> Le code (notamment `src/styles/global.css` et les islands raffle) utilise encore l'ancien brand QuizTown (electric-blue / Space Grotesk / Inter). À aligner.

- [ ] **Migrer `src/styles/global.css` vers les tokens TechTown** 🟡
  Le skill définit `--color-primary: #1C62ED`, `--color-primary-dark: #1557D6`, `--color-accent: #3B7EFF`, `--color-text: #1F2937`, `--color-text-light: #6B7280`, `--color-background-alt: #F9FAFB`, `--color-border: #E5E7EB`, etc.
  → Étapes :
  1. Remplacer le bloc `@theme` + `:root` par les variables du skill (primary, primary-dark, accent, text, text-light, background, background-alt, border, gradient-light-start/end…).
  2. Garder les tokens QuizTown-spécifiques non couverts par le skill : `--color-tile-*` (VoteTile), `--shadow-glow-*`, `--radius-card`, `--radius-button`, `--duration-*`.
  3. Décider du sort des anciens alias (`--color-electric-blue`, `--color-violet-pulse`, `--color-mint-pop`, `--color-dark-slate`, `--color-soft-white`, `--color-alert-coral`) : supprimer ou rediriger vers `--color-primary` / `--color-text` / etc.

- [ ] **Passer la typographie à Poppins** 🟡
  Le skill impose `Poppins` (sans-serif). Aujourd'hui : `Space Grotesk` (`--font-display`) + `Inter` (`--font-body`).
  → Étapes :
  1. Charger Poppins (woff2 dans `public/fonts/` + `@font-face` dans `global.css`).
  2. Remplacer `--font-display` / `--font-body` par un unique `--font-body: 'Poppins', sans-serif` (ou garder display = body, comme le skill).
  3. Supprimer les `@font-face` Space Grotesk / Inter et les fichiers `public/fonts/SpaceGrotesk-Variable.woff2` / `Inter-Variable.woff2`.
  4. Auditer les composants qui référencent `var(--font-display)` explicitement.

- [ ] **Remplacer les ~120+ hex hardcodés par les CSS variables** 🟡
  Les 3 islands raffle utilisent partout `#1C62ED`, `#1F2937`, `#3B7EFF`, `'Poppins', sans-serif`… inline.
  → Après la migration ci-dessus, remplacer par `var(--color-primary)`, `var(--color-text)`, `var(--color-accent)`, `var(--font-body)`. Mieux : extraire des classes CSS et supprimer la majorité des `style={{...}}`.

- [ ] **Aligner `spec/GENERAL.md` (et `spec/DESIGN.md`) sur le skill** 🟡
  Les specs décrivent encore vraisemblablement la palette QuizTown originale. Faire pointer vers le skill TechTown ou réécrire la section couleurs/typo.

- [ ] **Décider du sort de la section "VoteTile Colors"** 🟢
  Conservée dans `AGENTS.md` car spécifique à l'accessibilité daltonisme. Vérifier que la palette VoteTile (cross/circle/triangle/square) reste cohérente visuellement avec le bleu primaire TechTown (`#1C62ED` = `--color-tile-cross`, OK).

---

## ♻️ DRY -- Duplications à éliminer

- [x] **Extraire `useQrCode(url, opts)`** 🟢
  Logique `import('qrcode').then(...)` dupliquée dans `HostLiveControl.tsx`, `RaffleHost.tsx`, `RaffleScreen.tsx` (~30 lignes dupliquées). Hook créé dans `src/hooks/useQrCode.ts`, utilisé par les 3 composants. Bonus : annule le set sur unmount (fuite mémoire évitée).

- [x] **Extraire `useRaffle(raffleId)`** 🟢
  Subscription `onRaffleChange` + setRaffle/setError dupliquée 3x. Hook créé dans `src/hooks/useRaffle.ts`, utilisé par les 3 islands raffle.

- [ ] **Extraire un composant `<WinnerReveal />`** 🟡
  Carte gradient + 🎉 + nom + lot dupliquée entre Host/Player/Screen.

- [ ] **Extraire un composant `<Roulette />`** 🟡
  Animation roulette dupliquée entre Host (control) et Screen (projection).

- [ ] **Extraire un `<Spinner />`** 🟡
  `@keyframes spin` inline dupliqué 3x.

- [ ] **Externaliser les labels raffle dans `src/i18n/`** 🟡
  Chaque island a son `labels = { fr, en }` avec ~60% de chevauchement (`title`, `scan`, `winner`, `won`, `results`, `prize`...).

---

## 🎯 KISS -- Simplification

- [ ] **Splitter `RaffleHost.tsx` (826 lignes)** 🟡
  → `RaffleSetup`, `RaffleLobby`, `RaffleDrawing`, `RaffleReveal`, `RaffleFinished`, `PrizeEditor`, `WinnerHistory`.

- [ ] **Splitter `RaffleScreen.tsx` (530 lignes)** 🟡
  → Un sous-composant par phase.

- [ ] **Splitter `RafflePlayer.tsx` (593 lignes)** 🟡
  → S'inspirer de l'orchestrateur `PlayerSession.tsx`.

- [x] **Supprimer le state `phase` de `RafflePlayer`** 🟡
  Doublon avec `raffle.status`. Maintenant : juste `hasJoined: boolean`, le reste est dérivé de `raffle.status` (single source of truth). Supprime aussi le `useEffect` qui synchronisait `phase` ← `raffle.status`.

---

## 🚀 Plus loin

- [ ] Support `prefers-reduced-motion` dans toutes les animations Framer Motion
- [ ] Tests unitaires raffle (Vitest)
- [ ] Tests E2E raffle (Playwright -- host + player + screen synchros)
- [x] **Durcir les RTDB rules raffle** (auth obligatoire pour write hors `participants`) 🔒
  Fait mai 2026 : `.write: true` au niveau `$raffleId` supprimé. Désormais seul le host authentifié (`hostId === auth.uid`) peut créer/modifier la raffle. Les non-auth ne peuvent qu'écrire dans `participants/$participantId` (create-only). Mêmes durcissements appliqués à `sessions/$sessionId` et lecture Firestore `quizzes` fermée aux non-`@techtown.fr`.
- [ ] Confetti côté joueur quand on gagne (déjà mentionné dans le plan, pas implémenté)
- [ ] Affichage "X autres ont aussi gagné" si plusieurs lots distribués au même joueur

---

## 🔒 Sécurité -- Risques résiduels (post-durcissement rules de mai 2026)

> Les rules Firestore + RTDB ont été durcies (cf. § Plus loin ci-dessus). Il reste deux risques liés au fait que **les joueurs ne sont pas authentifiés Firebase** (le `playerId` est un random `Math.random().toString(36)` côté client).

### Risque 1 -- Usurpation d'identité entre joueurs 🔒

**Symptôme.** Comme le `playerId` n'est pas lié à un `auth.uid`, la rule RTDB pour `sessions/$sid/players/$playerId` autorise n'importe quel client à écrire sur n'importe quel `$playerId`. Un joueur qui devine/voit l'ID d'un autre peut écraser son `nickname`, son `score` ou son `badge`.

**Probabilité.** Faible en pratique : le `playerId` n'est jamais affiché publiquement, il faudrait l'extraire via les devtools d'un autre poste ou via un sniff réseau.

**Correction (~30 min, gratuite).**
1. Activer Anonymous Auth dans la console Firebase (Authentication → Sign-in method → Anonymous → Enable).
2. Dans `JoinForm` (ou un wrapper amont), appeler `signInAnonymously(getFirebaseAuth())` avant le `joinSession()`. Aucun écran de login, c'est invisible côté UX.
3. Dans `PlayerSession.tsx`, remplacer `useState(() => 'player-' + Math.random()...)` par le `user.uid` retourné par l'auth anonyme.
4. Idem dans `RafflePlayer.tsx` (même pattern de random playerId).
5. Durcir la rule `sessions/$sid/players/$playerId/.write` :
   ```
   "$playerId === auth.uid || data.parent().parent().child('hostId').val() === auth.uid"
   ```
   Et symétriquement pour `responses/$qid/$pid/.write` :
   ```
   "$playerId === auth.uid && !data.exists()"
   ```
   Et pour `raffles/$raffleId/participants/$participantId/.write` :
   ```
   "$participantId === auth.uid && !data.exists()"
   ```

### Risque 2 -- Triche du score côté client 🔒

**Symptôme.** `calculateScore()` dans `src/firebase/realtime.ts` tourne dans le navigateur du joueur, qui appelle ensuite `updatePlayerScore()` avec la valeur calculée. Un utilisateur ouvrant les devtools peut appeler `updatePlayerScore(sid, monUid, 99999999, 999)` et finir premier sans avoir répondu.

**Probabilité.** Moyenne dès qu'il y a un enjeu (prix, classement public). Quasi nulle pour un usage interne entre collègues.

**Correction (~2-3 h, nécessite plan Blaze).**
1. Mettre à jour le projet Firebase au **plan Blaze** (Cloud Functions impossibles en plan Spark). Coût quasi nul pour ces volumes (free tier généreux).
2. `firebase init functions` → écrire une fonction TypeScript déclenchée par un trigger RTDB sur `sessions/{sid}/correctOptionId` (`onWrite`).
3. La fonction lit `sessions/{sid}/responses/{currentQid}`, compare chaque `optionId` à `correctOptionId`, calcule le score avec la formule actuelle, écrit dans `sessions/{sid}/players/{pid}/score` + `streak` via les credentials admin.
4. Retirer côté client : `calculateScore()` + l'appel à `updatePlayerScore()` dans `PlayerSession.tsx`. Le joueur n'écrit plus que dans `responses/`.
5. Durcir les rules : interdire `score` et `streak` aux joueurs.
   ```
   "score":  { ".write": "data.parent().parent().parent().child('hostId').val() === auth.uid" },
   "streak": { ".write": "data.parent().parent().parent().child('hostId').val() === auth.uid" }
   ```
   (Les Cloud Functions bypassent les rules avec leur token admin, mais ça empêche les joueurs d'écrire directement.)

### Décision actuelle

Pas de correction immédiate -- usage interne TechTown sans enjeu, le rapport effort/risque ne le justifie pas. À reprendre si QuizTown s'ouvre à des événements publics ou si des prix significatifs sont en jeu.
