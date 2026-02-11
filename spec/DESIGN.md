📱 PARTICIPANT — FLOW UX
Écran 1 — Join (accessible via `/play/[id]`, lien ou QR code partagé par le host — pas de join depuis la landing page car il faut un ID de session)

Objectif : entrer en 5 secondes

QR code ou lien partagé par le host (contient l'ID de session)

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

Écran 5 — Leaderboard (systématique entre chaque question)

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

🎛️ HOST — QUIZ EDIT (comme Kahoot)

Depuis le Dashboard, le host peut **modifier un quiz existant** en cliquant le bouton "Modifier". L'éditeur s'ouvre pré-rempli avec les données existantes :
- Titre, description, questions, options, bonne réponse, time limit, médias (GIF)
- Le bouton de sauvegarde affiche "Mettre à jour" (au lieu de "Sauvegarder")
- Le host peut ajouter/supprimer des questions, modifier les textes, changer la bonne réponse
- Après mise à jour, redirect vers le Dashboard avec toast de confirmation

**Flow** : Dashboard → clic "Modifier" → `/host/edit?id=xxx` → QuizEditor pré-rempli → "Mettre à jour" → redirect Dashboard

**UX** :
- L'éditeur est le même composant (`QuizEditor`) que pour la création, mais en mode édition
- Loading spinner pendant le chargement depuis Firestore
- Message d'erreur si le quiz n'est pas trouvé
- Bouton "Retour au Dashboard" en cas d'erreur

🎛️ HOST — CONTROLDECK
Fonctions

Lancer / Afficher résultats / Classement / Suivant / Terminer

Voir taux de réponses + timer countdown

Flow linéaire obligatoire : question → résultats → classement → suivant

UX :

Desktop ou tablette

Zéro surcharge visuelle

Boutons larges, état clair

Un seul bouton d'action par phase (pas de choix superflu)

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

> Couleurs, pictogrammes et accessibilité daltonisme des VoteTiles : voir `spec/GENERAL.md` section "Daltonisme & identification des réponses".

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

ÉCRAN 06 — LEADERBOARD (systématique après chaque question)
🎯 Objectif

Créer de l’émulation entre chaque question.

Layout
[ Leaderboard ]

1. Alex – 540 XP
2. Sam – 520 XP
3. Lina – 500 XP

[ Your position: 14 ]

Règles UX

Top 5 max

Affiché systématiquement après chaque question (flow : question → feedback → leaderboard → suivant)

Le host avance manuellement (pas d’auto-skip)

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

Le ControlDeck impose un **flow linéaire par question** : le host ne peut pas sauter d'étapes. Chaque phase n'affiche qu'un seul bouton d'action.

**Phase Lobby** (implémenté dans `HostLiveControl.tsx` > `LobbyJoinSection`) :
[ QR Code (généré via lib `qrcode`) ]
[ "Scannez pour rejoindre" ]
[ Lien de join (texte + bouton Copier) ]
[ Nombre de joueurs connectés ]
[ Bouton "Démarrer" ]

**Phase Question** :
[ Question en cours (index / total) ]
[ **Texte de la question** (H2, lisible) ]
[ **GIF / Image** (si media présent, max-height 200px, coins arrondis) ]
[ **Réponses possibles** (liste avec pictogrammes ✕ ○ △ □ + couleur tile + texte) ]
[ **Timer countdown** (secondes restantes, passe vert → orange → rouge) ]
[ Nombre de réponses reçues ]
[ Bouton "Afficher les résultats" (pulse quand timer=0 ou tous ont répondu) ]

**Phase Feedback** :
[ **Texte de la question** (rappel, plus discret) ]
[ **GIF / Image** (si media présent) ]
[ **Réponses possibles** (avec indicateur bonne réponse ✓) ]
[ Bouton "Classement" ]

**Phase Leaderboard** (après chaque question, pas seulement la dernière) :
[ Classement affiché côté joueur ]
[ Bouton "Question suivante" (s'il reste des questions) ]
[ Bouton "Terminer le quiz" (dernière question) ]

**Phase Finished** :
[ "Session terminée" (aucun bouton) ]

Règles UX

Flow obligatoire : `question → feedback → leaderboard → suivant/terminer`

Boutons larges -- un seul bouton d'action visible par phase

Le ControlDeck affiche le contenu de la question (texte + GIF + réponses) pour que le host puisse suivre sans regarder l'écran de projection

Le GIF/image est affiché entre le texte de la question et les réponses (max-height 200px, object-fit contain)

Les réponses sont affichées avec leurs pictogrammes (✕ ○ △ □) et couleurs tile pour repérage immédiat

Le timer est affiché au host pendant la phase question

Le bouton "Afficher les résultats" pulse quand le temps est écoulé ou tous les joueurs ont répondu

**Auto-advance** : si tous les joueurs ont répondu, le système enchaîne automatiquement : reveal résultats → (2s) → classement. Pas de clic supplémentaire.

Le host contrôle l'avancement entre questions : pas d'auto-advance vers la question suivante

Pas de bouton "Terminer" toujours présent -- seulement à la dernière question après le classement

ÉCRAN H3 — CROWDSTATS
[ Participation rate ]

[ Avg response time ]

[ Answer distribution ]

🖥️ ÉCRAN PUBLIC — CONTRÔLES HOST (après countdown)

Après la fin du countdown d'une question, l'écran de projection affiche des **contrôles host** en bas de l'écran :

| Phase | Bouton | Action |
|-------|--------|--------|
| `question` | **Afficher les résultats** | Révèle la bonne réponse (highlight vert sur la barre correcte) |
| `feedback` | **Classement** | Affiche le leaderboard aux joueurs |
| `leaderboard` (+ questions restantes) | **Question suivante** | Lance la question suivante |
| `leaderboard` (dernière question) | **Terminer le quiz** | Fin de session, classement final |

Règles :
- Le flow est **linéaire et obligatoire** : question → feedback → leaderboard → suivant/terminer
- Les résultats ne sont **jamais affichés automatiquement** — le host décide
- Le classement est affiché **après chaque question** (pas seulement à la dernière)
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

> Mode démo (BroadcastChannel, ping/pong, bots) : voir `AGENTS.md` section "Demo Mode".

📐 RÈGLES GLOBALES UX

1 action principale par écran

Jamais plus de 6 éléments cliquables

Feedback visuel + textuel

Animations non bloquantes

Offline safe (graceful fallback)