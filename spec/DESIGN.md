📱 PARTICIPANT — FLOW UX
Écran 1 — Join

Objectif : entrer en 5 secondes

QR code ou code court

Champ pseudo

Sélection rapide d’un Badge

CTA : Join the Town

Specs :

1 champ max

Validation instantanée

Aucun compte requis

Écran 2 — Waiting Room

Animation légère (ville qui s’active)

Nombre de Citizens connectés

Message Host (“On démarre !”)

Écran 3 — Question (Spot)

Question en gros (H1)

Countdown Ring visible

2 à 4 VoteTiles max

Couleurs distinctes par réponse + pictogrammes (✕ ○ △ □)

Interactions :

Tap = sélection

Confirmation visuelle immédiate

Impossible de changer après lock

Écran 4 — Feedback

Correct / Incorrect

XP gagnée

Animation courte (≤ 1s)

Position temporaire au leaderboard

Écran 5 — Leaderboard (optionnel)

Top 5 animés

Position personnelle toujours visible

Transition fluide vers Spot suivant

🖥️ ÉCRAN PUBLIC (CONF / SALLE)
Affiche :

Question géante

Countdown

Barres de votes animées

Score global / top joueurs

Branding QuizTown discret

⚠️ Aucun texte inutile
⚠️ Lisible à 15–20 mètres

🎛️ HOST — CONTROLDECK
Fonctions

Lancer / Pause / Skip

Voir taux de réponses

Forcer lock

Masquer leaderboard

Changer mode live

UX :

Desktop ou tablette

Zéro surcharge visuelle

Boutons larges, état clair

⚙️ SPECS TECH UX (IMPORTANT)
Animation

150–300ms

Jamais bloquante

Désactivable (low bandwidth)

Responsive

Mobile first

Tablette Host

Écran géant 16:9

Accessibilité

Contraste AA

Texte scalable

Feedback couleur + texte + forme (jamais la couleur seule)

### Accessibilité des VoteTiles -- Couleurs & Pictogrammes

Les 4 tuiles de réponse utilisent un système **triple redondance** : **forme (pictogramme) + couleur + position**. Cela garantit la lisibilité pour les daltoniens (protanopie, deutéranopie, tritanopie) et respecte WCAG 2.1 "Use of Color" (1.4.1).

#### Pictogrammes PlayStation

Chaque tuile est identifiée par un pictogramme inspiré des boutons PlayStation, immédiatement reconnaissable :

| Tuile | Pictogramme | Symbole Unicode | SVG fallback |
|-------|-------------|-----------------|--------------|
| A     | ✕ Croix     | U+2715          | Oui          |
| B     | ○ Cercle    | U+25CB          | Oui          |
| C     | △ Triangle  | U+25B3          | Oui          |
| D     | □ Carré     | U+25A1          | Oui          |

Le pictogramme est affiché dans le badge coloré à gauche du texte de réponse (32×32px) ET en label d'accessibilité (`aria-label`).

#### Palette VoteTiles accessible

Les couleurs actuelles (Blue, Coral, Mint, Violet) posent problème pour les daltoniens : Coral et Mint sont quasi identiques en protanopie/deutéranopie. Nouvelle palette optimisée avec **variation de luminance ET de teinte** :

| Tuile | Pictogramme | Couleur         | Hex       | Token CSS                | Luminance relative |
|-------|-------------|-----------------|-----------|--------------------------|-------------------|
| A     | ✕ Croix     | Bleu            | `#2563EB` | `--color-tile-cross`     | Moyenne-basse     |
| B     | ○ Cercle    | Orange          | `#F59E0B` | `--color-tile-circle`    | Haute             |
| C     | △ Triangle  | Vert émeraude   | `#10B981` | `--color-tile-triangle`  | Moyenne           |
| D     | □ Carré     | Rose            | `#EC4899` | `--color-tile-square`    | Moyenne-haute     |

**Pourquoi ces couleurs ?**
- **Bleu** (#2563EB) : visible par tous les types de daltonisme
- **Orange** (#F59E0B) : luminance très haute, distinct du bleu et du vert même en protanopie/deutéranopie (remplace Coral)
- **Vert émeraude** (#10B981) : teinte plus sombre et saturée que le Mint (#2DD4BF), bien distinct de l'orange par luminance
- **Rose** (#EC4899) : teinte chaude distincte du bleu et du vert, bien séparé de l'orange par la teinte

#### Simulation daltonisme

| Type          | Bleu ✕  | Orange ○ | Vert △  | Rose □  | Distinguable ? |
|---------------|---------|----------|---------|---------|----------------|
| Vision normale| Bleu    | Orange   | Vert    | Rose    | ✓              |
| Protanopie    | Bleu    | Jaune    | Brun    | Gris    | ✓ (luminance)  |
| Deutéranopie  | Bleu    | Jaune    | Olive   | Gris    | ✓ (luminance)  |
| Tritanopie    | Bleu    | Rose     | Vert    | Rose    | ✓ (+ formes)   |

#### Règles d'affichage

- Le pictogramme est **toujours visible** (pas masqué au survol ou à la sélection)
- Sur l'écran public (projection 16:9), les pictogrammes sont affichés en **48×48px minimum**
- En mode sombre, les couleurs restent identiques (bon contraste sur `--color-dark-slate`)
- Les barres de vote sur l'écran public reprennent le même code couleur + pictogramme

Passons à du détail 

ÉCRAN 01 — JOIN TOWN
🎯 Objectif

Entrer dans la partie en moins de 5 secondes.

Layout (vertical)
[ Logo QuizTown ]

[ "Join the Town" ]

[ Input : Nickname ]

[ Badge selector (4–6 icônes) ]

[ CTA Primary : JOIN ]

Composants

Logo (petit, branding discret)

Input texte (max 12 caractères)

Badge picker (icônes rondes)

Bouton plein (couleur primaire)

Règles UX

Aucun scroll

Clavier auto-focus

Validation instantanée

Erreur douce si pseudo déjà pris

ÉCRAN 02 — WAITING ROOM
🎯 Objectif

Créer de l’attente + rassurer.

Layout
[ Animated City / Pulse Background ]

[ "Waiting for the Host…" ]

[ Citizens connected: 124 ]

[ Message Host (optionnel) ]

Composants

Animation légère en boucle

Compteur live

Message texte dynamique

Règles UX

Aucun input

Animation < 1fps (performance)

Transition fluide vers question

ÉCRAN 03 — SPOT (QUESTION)
🎯 Objectif

Lire → comprendre → voter vite.

Layout
[ Countdown Ring ]

[ QUESTION TEXT (H1) ]

[ VoteTile A ]
[ VoteTile B ]
[ VoteTile C ]
[ VoteTile D ]

Composants

Countdown Ring (top)

Question en très gros

VoteTiles (boutons larges, avec pictogrammes ✕ ○ △ □)

États VoteTile

Default (pictogramme + couleur + texte)

Hover (web)

Selected (fond plein couleur tile, pictogramme blanc)

Locked (opacité réduite, pictogramme visible)

Correct / Incorrect (vert succès / rouge erreur, pictogramme toujours visible)

Identification des tuiles

Chaque tuile combine 3 identifiants : **pictogramme** (✕ ○ △ □) + **couleur** (bleu, orange, vert, rose) + **position** (grille 2×2). Voir section "Accessibilité des VoteTiles" pour les détails couleurs et daltonisme.

Règles UX

Max 4 réponses

Un seul tap possible

Vibration légère au tap

Auto-lock à 0s

ÉCRAN 04 — LOCK & WAIT
🎯 Objectif

Éviter la frustration post-vote.

Layout
[ Vote Locked Icon ]

[ "Vote locked!" ]

[ Waiting animation ]

Règles UX

Pas de modification possible

Feedback clair

Transition automatique

ÉCRAN 05 — FEEDBACK PERSONNEL
🎯 Objectif

Renforcer la gamification.

Layout
[ Result Icon (✓ / ✕) ]

[ "+120 XP" ]

[ "Streak: x3" (optionnel) ]

[ Position: 14 / 124 ]

Règles UX

Animation courte (≤1s)

Toujours montrer le score perso

Jamais humilier (pas de “nul”)

ÉCRAN 06 — LEADERBOARD (OPTIONNEL)
🎯 Objectif

Créer de l’émulation sans bloquer.

Layout
[ Leaderboard ]

1. Alex – 540 XP
2. Sam – 520 XP
3. Lina – 500 XP

[ Your position: 14 ]

Règles UX

Top 5 max

Auto-skip après 3s

Désactivable par Host

🖥️ ÉCRAN PUBLIC — PROJECTION
ÉCRAN A — QUESTION LIVE
Layout 16:9
[ QUESTION (GÉANT) ]

[ Countdown Ring ]

[ Vote bars (0%) ]

Règles

Texte lisible à 20m

Aucune info perso

Branding discret

ÉCRAN B — VOTES EN TEMPS RÉEL
[ Question ]

[ ✕ Bar A ███████ 42% ]  (Bleu #2563EB)
[ ○ Bar B █████ 31% ]    (Orange #F59E0B)
[ △ Bar C ███ 18% ]      (Vert #10B981)
[ □ Bar D █ 9% ]         (Rose #EC4899)

Règles

Barres animées

% qui montent progressivement

Chaque barre préfixée par son pictogramme (✕ ○ △ □) + couleur associée

ÉCRAN C — RÉSULTAT
[ Correct Answer Highlighted ]

[ Fun fact / explanation (optionnel) ]

🎛️ HOST — CONTROLDECK (DESKTOP / TABLET)
ÉCRAN H1 — DASHBOARD
[ Quiz name ]

[ Current Spot: 3 / 10 ]

[ Citizens connected: 124 ]

[ START / PAUSE / SKIP ]

ÉCRAN H2 — LIVE CONTROL
[ Drop Spot ]

[ Lock Pulse ]

[ Show / Hide Leaderboard ]

[ Switch Mode ]

Règles UX

Boutons larges

États clairs

Aucune animation lourde

ÉCRAN H3 — CROWDSTATS
[ Participation rate ]

[ Avg response time ]

[ Answer distribution ]

🖥️ ÉCRAN PUBLIC — CONTRÔLES HOST (après countdown)

Après la fin du countdown d'une question, l'écran de projection affiche des **contrôles host** en bas de l'écran :

| Bouton | Action | Obligatoire ? |
|--------|--------|---------------|
| **Afficher les résultats** | Révèle la bonne réponse (highlight vert sur la barre correcte) | Non — optionnel |
| **Question suivante** | Lance la question suivante | Oui |
| **Classement final** | Affiché à la dernière question — lance le podium | Oui (dernière Q) |

Règles :
- Les résultats ne sont **jamais affichés automatiquement** — le host décide
- Le host contrôle l'avancement : pas d'auto-advance entre questions
- Les boutons apparaissent avec une animation slide-up + fond semi-transparent
- Style glassmorphism discret, boutons larges pour usage tablette/souris

🏆 PODIUM — CLASSEMENT FINAL DRAMATIQUE

Le classement final utilise un **reveal progressif** pour créer du suspense :

| Étape | Délai | Contenu | Animation |
|-------|-------|---------|-----------|
| 1 | 0.6s | Titre "Classement Final" | Scale + fade in |
| 2 | 2s | 4ème et 5ème places | Slide up, style discret |
| 3 | 4s | 3ème place 🥉 Bronze | Slide depuis la droite, glow bronze |
| 4 | 6.5s | 2ème place 🥈 Argent | Slide depuis la gauche, glow argent |
| 5 | 9s | 1er place 🥇 Or | Scale from center + spotlight doré pulsant |
| 6 | 11s | Bouton "Rejouer" | Fade in |

Couleurs médailles :
- Or : `#FFD700`
- Argent : `#C0C0C0`
- Bronze : `#CD7F32`

Effets visuels :
- Le 1er a un **effet spotlight** (radial-gradient doré pulsant derrière la carte)
- Le fond ambient s'intensifie progressivement (glow violet → doré)
- Chaque entrée a une **bordure colorée** selon la médaille
- Les 4ème et 5ème sont affichés en style minimal (pas de médaille)

📡 MODE DEMO — SYNCHRONISATION BroadcastChannel

Le mode démo utilise **BroadcastChannel API** pour synchroniser les onglets :

| Page | Rôle | URL |
|------|------|-----|
| `/demo/screen` | **Host** — source de vérité, contrôle le quiz | Écran de projection |
| `/demo` | **Client** — détecte le host, envoie join/answer | Vue joueur |

Flux de communication :
1. Le joueur ping le host au chargement (détection en 600ms)
2. Si host détecté → **mode connecté** (bandeau "Connecté à l'écran")
3. Si pas de host → **mode solo** (comportement autonome avec bots)
4. Le host broadcast l'état (phase, question, leaderboard) à chaque changement
5. Le joueur envoie `join` et `answer` — le host répond avec `feedback` personnel

📐 RÈGLES GLOBALES UX

1 action principale par écran

Jamais plus de 6 éléments cliquables

Feedback visuel + textuel

Animations non bloquantes

Offline safe (graceful fallback)