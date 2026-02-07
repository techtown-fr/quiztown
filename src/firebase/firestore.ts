import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from './config';
import type { Quiz } from '../types/quiz';

const QUIZZES_COLLECTION = 'quizzes';

export async function createQuiz(quiz: Omit<Quiz, 'id'>): Promise<string> {
  const db = getFirebaseFirestore();
  const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), {
    ...quiz,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, QUIZZES_COLLECTION, quizId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Quiz;
}

export async function getQuizzesByAuthor(authorId: string): Promise<Quiz[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, QUIZZES_COLLECTION),
    where('metadata.authorId', '==', authorId),
    orderBy('metadata.createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Quiz);
}

export async function updateQuiz(quizId: string, data: Partial<DocumentData>): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, QUIZZES_COLLECTION, quizId);
  await updateDoc(docRef, data);
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, QUIZZES_COLLECTION, quizId);
  await deleteDoc(docRef);
}
