
Voici la spécification technique redéfinie pour votre application interne chez TechTown :

🏗️ Architecture Globale : "The Realtime Static Stack"
L'objectif est de garder une interface ultra-rapide (Astro) tout en déléguant la complexité du temps réel et de la donnée à Firebase.

Principe Don't Repeat Yourself à respecter.
CSS Variables et string internationaliser avec Astro (Tu peux regarder le projet git/techtown-website)
Utilise du TypeScript avec aucun "Any" en respectant les bonnes pratiques Craft.

Composant,Technologie,Rôle
Frontend,Astro,"Serve le squelette statique (Landing, Dashboard). Utilise des ""Islands"" (React/Svelte) pour les composants interactifs du quiz."
Authentification,Firebase Auth,Gestion des accès avec SSO Google (obligatoire pour les emails @techtown.fr côté admin).
Gestion Quiz,Cloud Firestore,"Base de données documentaire pour stocker les questions, les médias et les historiques de quiz."
Moteur Live,Firebase Realtime DB,"Synchronisation instantanée du statut de la partie (Question en cours, liste des joueurs, scores live)."
Hébergement,Firebase Hosting,Pour une intégration fluide avec les fonctions et la base de données.

💾 1. Structuration de la donnée
Cloud Firestore (Le "Cerveau" Statique)
On y stocke tout ce qui n'a pas besoin d'une mise à jour à la milliseconde près.

Collection quizzes : Titre, description, auteur, et un tableau questions {texte, image_url, options[], correct_answer_index}.

Collection results : Archivage des sessions terminées pour analyse (scores finaux, statistiques par question).

Firebase Realtime Database (Le "Cœur" Live)
On utilise cette DB pour sa latence extrêmement faible, idéale pour un buzzer.

Node sessions/{sessionID} :

status : "lobby" | "question" | "feedback" | "leaderboard" | "finished".

currentQuestion : { id, label, media?, options[], timeLimit, startedAt } (question active, sans `isCorrect`).

currentQuestionIndex : index numérique de la question en cours.

totalQuestions : nombre total de questions dans le quiz.

correctOptionId : (optionnel) ID de la bonne réponse, écrit par le host uniquement lors du reveal.

quizId : référence vers le document Firestore du quiz.

hostId : UID Firebase Auth du host.

players/{playerID} : { nickname, badge, score, streak, connected }.

responses/{questionID}/{playerID} : { optionId, timestamp } (horodatage pour calculer les points selon la vitesse).

🛠️ 2. Workflow Technique
Préparation (Astro + Firestore) : Le Host crée son quiz via `QuizEditor.tsx`, les données sont persistées dans Firestore via `HostCreatePage.tsx`.

Édition (Dashboard → HostEditPage) : Depuis le dashboard, le Host clique "Modifier" sur un quiz existant. Il est redirigé vers `/host/edit?id=xxx`. Le composant `HostEditPage.tsx` charge le quiz depuis Firestore via `getQuiz(id)`, pré-remplit le `QuizEditor` avec les données existantes (`initialTitle`, `initialDescription`, `initialQuestions`), et utilise `updateQuiz()` pour sauvegarder les modifications. Le bouton affiche "Mettre à jour" au lieu de "Sauvegarder". Après la mise à jour, le Host est redirigé vers le Dashboard avec un toast de confirmation.

Lancement (HostDashboard → Realtime DB) : Depuis le dashboard, le Host clique "Lancer" : une session est créée dans la Realtime DB (status: `lobby`, quizId, hostId). Le Host est redirigé vers `/host/live/?session=xxx`.

Lobby (HostLiveControl) : Le composant `HostLiveControl.tsx` affiche un QR code (lib `qrcode`) et un lien de join (`/play/demo?session=xxx`). Les joueurs connectés apparaissent en temps réel.

Démarrer (HostLivePage) : Le Host clique "Démarrer" → `HostLivePage.tsx` fetch le quiz depuis Firestore, sanitize la première question (`sanitizeQuestion()` supprime `isCorrect`), et la push dans la RTDB (status: `question`).

Interaction (PlayerSession) : Le joueur scanne le QR ou ouvre le lien. `PlayerSession.tsx` orchestre le flow : `JoinForm` → `WaitingRoom` → `PlayerBuzzer` → `FeedbackScreen` → `Leaderboard`. Le composant écoute `onSessionChange()` pour les transitions host-driven.

Résultats : Le Host clique "Afficher les résultats" → `revealAnswer()` écrit `correctOptionId` dans la session + status: `feedback`. Le joueur calcule son feedback client-side.

Question suivante : Le Host clique "Suivant" → `clearCorrectOption()` + `setCurrentQuestion()` avec la question suivante.

Fin : Le Host clique "Terminer" → status: `finished`. Le joueur voit l'écran final.

Calcul des scores : À chaque réponse, le client écrit dans la Realtime DB via `submitResponse()`. Le scoring est calculé côté client (vitesse + exactitude).

✅ Pourquoi ce choix est le bon pour TechTown ?
Performance (Astro) : Le temps de chargement initial pour un étudiant ou un participant en conférence est quasi instantané, même sur une connexion mobile instable.

Scalabilité (Firebase) : Firebase gère nativement des milliers de connexions simultanées sans que vous ayez à provisionner des serveurs.


Sécurité Interne : En utilisant Firebase Auth avec le domaine @techtown.fr, vous assurez que seuls vos collaborateurs peuvent créer des quiz.

Coût : Pour un usage interne et quelques conférences, vous resterez probablement dans le Spark Plan (Gratuit) de Firebase.

Voici le schéma recommandé pour un document dans la collection quizzes.

📂 Collection : quizzes
Chaque document représente un quiz complet créé par un membre de TechTown.

```
{
  "id": "quiz_abc_123",
  "metadata": {
    "title": "Culture Tech & Craftsmanship",
    "description": "Le quiz hebdomadaire pour tester nos connaissances JS/TS",
    "authorId": "user_789", // UID Firebase Auth
    "createdAt": "2026-02-07T18:00:00Z",
    "tags": ["frontend", "internal", "fun"]
  },
  "settings": {
    "isPublic": false,
    "shuffleQuestions": true,
    "pointsPerQuestion": 1000,
    "theme": "dark-mode" // Pour adapter l'UI Astro
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice", // ou "boolean", "code-snippet"
      "label": "Quelle est la sortie de console.log(typeof NaN) ?",
      "media": {
        "type": "image",
        "url": "https://firebasestorage.googleapis.com/.../code.png"
      },
      "codeSnippet": "console.log(typeof NaN);", // Optionnel, pour rendu Prism.js / Shiki
      "options": [
        { "id": "opt1", "text": "number", "isCorrect": true },
        { "id": "opt2", "text": "NaN", "isCorrect": false },
        { "id": "opt3", "text": "undefined", "isCorrect": false },
        { "id": "opt4", "text": "object", "isCorrect": false }
      ],
      "timeLimit": 20 // secondes
    }
  ]
}
```

Parfait, passons à l'architecture de données. Pour un projet comme TechTogether, la structure de Firestore doit être à la fois flexible (pour ajouter des types de questions) et optimisée (pour limiter les appels API).

Voici le schéma recommandé pour un document dans la collection quizzes.

📂 Collection : quizzes
Chaque document représente un quiz complet créé par un membre de TechTown.

JSON
{
  "id": "quiz_abc_123",
  "metadata": {
    "title": "Culture Tech & Craftsmanship",
    "description": "Le quiz hebdomadaire pour tester nos connaissances JS/TS",
    "authorId": "user_789", // UID Firebase Auth
    "createdAt": "2026-02-07T18:00:00Z",
    "tags": ["frontend", "internal", "fun"]
  },
  "settings": {
    "isPublic": false,
    "shuffleQuestions": true,
    "pointsPerQuestion": 1000,
    "theme": "dark-mode" // Pour adapter l'UI Astro
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice", // ou "boolean", "code-snippet"
      "label": "Quelle est la sortie de console.log(typeof NaN) ?",
      "media": {
        "type": "image",
        "url": "https://firebasestorage.googleapis.com/.../code.png"
      },
      "codeSnippet": "console.log(typeof NaN);", // Optionnel, pour rendu Prism.js / Shiki
      "options": [
        { "id": "opt1", "text": "number", "isCorrect": true },
        { "id": "opt2", "text": "NaN", "isCorrect": false },
        { "id": "opt3", "text": "undefined", "isCorrect": false },
        { "id": "opt4", "text": "object", "isCorrect": false }
      ],
      "timeLimit": 20 // secondes
    }
  ]
}
💡 Points clés de cette structure
L'Array de questions : Dans Firestore, il est plus simple de stocker les questions dans un tableau (array) au sein du document Quiz tant que vous n'en avez pas des centaines. Cela permet de récupérer tout le quiz en une seule requête lors du chargement de la session par le Host.

Le champ codeSnippet : Étant donné que TechTown est une boîte tech, prévoyez un champ spécifique pour le code. Dans Astro, vous pourrez utiliser un composant de coloration syntaxique (comme Shiki ou Prism) pour afficher le code proprement sur l'écran géant.

Le champ metadata : Utile pour filtrer les quiz sur le dashboard (ex: "Mes quiz", "Quiz les plus joués").

🔄 La passerelle vers la Realtime Database
C'est ici que l'on fait le lien entre le "statique" (Firestore) et le "live" (Realtime DB).

Lorsqu'un Host lance un quiz :

Il récupère le document ci-dessus depuis Firestore.

Il crée une nouvelle session dans la Realtime Database (plus rapide pour le live).

Il n'y injecte que la question actuelle pour éviter que des petits malins n'aillent lire toutes les réponses dans le cache de la DB.

Astuce de Pro : Pour éviter que les joueurs ne trichent en regardant le code source de la page, ne leur envoyez jamais le champ isCorrect. Seul le Host doit le connaître. Le joueur envoie son optionId, et le serveur (ou une Cloud Function) valide si c'est bon.

🚀 Prochaine étape : Le composant "Buzzer"
L'interface du joueur doit être ultra-légère. Puisque vous utilisez Astro, on peut imaginer un composant Svelte ou React très minimaliste qui écoute uniquement le changement d'état dans Firebase.

C'est la partie la plus critique : elle doit être instantanée et intuitive. Pour une application TechTown, on veut un "ressenti" d'application native sur mobile.

On va utiliser React (intégré en tant qu'Island dans Astro) pour sa gestion efficace des états, couplé au SDK Firebase Realtime Database.

📱 Le Composant PlayerBuzzer.tsx
Voici une version optimisée qui écoute la question en cours et gère l'envoi de la réponse.

TypeScript
import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase/config'; // Ta config Firebase

interface Props {
  sessionId: string;
  playerId: string;
}

export default function PlayerBuzzer({ sessionId, playerId }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [gameStatus, setGameStatus] = useState('lobby');

  useEffect(() => {
    // 1. Écouter l'état de la session (question active, statut)
    const sessionRef = ref(db, `sessions/${sessionId}`);
    
    return onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameStatus(data.status);
        setCurrentQuestion(data.currentQuestion);
        // Reset du bouton quand on passe à une nouvelle question
        if (data.status === 'question') setHasAnswered(false);
      }
    });
  }, [sessionId]);

  const submitAnswer = async (optionId: string) => {
    if (hasAnswered || gameStatus !== 'question') return;

    setHasAnswered(true);

    // 2. Enregistrer la réponse avec un horodatage précis (pour le score)
    const responseRef = ref(db, `sessions/${sessionId}/responses/${currentQuestion.id}/${playerId}`);
    await set(responseRef, {
      optionId,
      timestamp: Date.now(),
      device: navigator.userAgent // Optionnel : pour le fun/debug
    });

    // Optionnel : Petit retour haptique sur mobile
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  if (gameStatus === 'lobby') return <div className="p-8 text-center">Attente du début par l'host... 🚀</div>;
  if (gameStatus === 'leaderboard') return <div className="p-8 text-center text-yellow-500">Regardez l'écran géant ! 🏆</div>;

  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen max-h-[500px]">
      {['A', 'B', 'C', 'D'].map((label, index) => (
        <button
          key={label}
          disabled={hasAnswered}
          onClick={() => submitAnswer(`opt${index + 1}`)}
          className={`rounded-2xl text-3xl font-bold transition-all active:scale-95 ${
            hasAnswered ? 'opacity-50 grayscale' : 'opacity-100'
          } ${getButtonColor(index)}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function getButtonColor(index: number) {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
  return colors[index];
}
🎨 Comment l'intégrer dans ta page Astro ?
Dans ton fichier src/pages/play/[id].astro, il te suffit d'appeler le composant avec la directive client:load pour qu'Astro l'active côté navigateur.

Extrait de code
---
import Layout from '../../layouts/Layout.astro';
import PlayerBuzzer from '../../components/PlayerBuzzer';
const { id } = Astro.params;
---

<Layout title="TechTogether - Live">
  <main>
    <h1>Session: {id}</h1>
    <PlayerBuzzer sessionId={id} playerId="user_123" client:load />
  </main>
</Layout>
🚀 3 Astuces pour l'expérience TechTown
Haptic Feedback : Comme tu peux le voir dans le code (navigator.vibrate), faire vibrer le téléphone quand on appuie sur une réponse change tout au niveau du feeling "pro".

Anti-Lag : En utilisant la Realtime Database plutôt que Firestore pour le buzzer, tu gagnes environ 200ms à 500ms de latence. En conférence, c'est la différence entre un jeu fluide et un jeu frustrant.

Le mode "Ghost" : Si un joueur perd sa connexion Wi-Fi, Firebase gère la reconnexion automatique. Grâce au useEffect, dès qu'il revient, il se synchronise instantanément sur la question en cours.