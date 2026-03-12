import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './config';

const ALLOWED_DOMAIN = 'techtown.fr';

const googleProvider = new GoogleAuthProvider();
// Hint Google to show only @techtown.fr accounts
googleProvider.setCustomParameters({ hd: ALLOWED_DOMAIN });

export class UnauthorizedDomainError extends Error {
  constructor(email: string) {
    super(`Access restricted to @${ALLOWED_DOMAIN} accounts. "${email}" is not allowed.`);
    this.name = 'UnauthorizedDomainError';
  }
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const email = result.user.email ?? '';

  // The hd parameter is only a UI hint — enforce the domain server-side
  if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await firebaseSignOut(auth);
    throw new UnauthorizedDomainError(email);
  }

  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth.currentUser;
}
