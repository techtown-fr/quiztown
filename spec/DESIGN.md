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

Couleurs distinctes par réponse

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

Feedback couleur + texte


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

VoteTiles (boutons larges)

États VoteTile

Default

Hover (web)

Selected

Locked

Correct / Incorrect

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

[ Bar A ███████ 42% ]
[ Bar B █████ 31% ]
[ Bar C ███ 18% ]
[ Bar D █ 9% ]

Règles

Barres animées

% qui montent progressivement

Couleurs distinctes

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

📐 RÈGLES GLOBALES UX

1 action principale par écran

Jamais plus de 6 éléments cliquables

Feedback visuel + textuel

Animations non bloquantes

Offline safe (graceful fallback)