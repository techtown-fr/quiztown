import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getDatabase, type Database } from 'firebase/database';

const getFirebaseConfig = () => {
  if (import.meta.env.PUBLIC_FIREBASE_CONFIG) {
    try {
      return JSON.parse(import.meta.env.PUBLIC_FIREBASE_CONFIG);
    } catch (e) {
      console.error('Error parsing PUBLIC_FIREBASE_CONFIG', e);
    }
  }

  return {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: import.meta.env.PUBLIC_FIREBASE_DATABASE_URL,
  };
};

const firebaseConfig = getFirebaseConfig();

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let database: Database;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp());
  }
  return firestore;
}

export function getFirebaseDatabase(): Database {
  if (!database) {
    database = getDatabase(getFirebaseApp());
  }
  return database;
}
