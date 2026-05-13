import {
  ref,
  set,
  update,
  remove,
  onValue,
  push,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  type DatabaseReference,
} from 'firebase/database';
import { getFirebaseDatabase } from './config';
import type { Raffle, RaffleParticipant, RafflePrize, RaffleStatus } from '../types/raffle';

export function getRaffleRef(raffleId: string): DatabaseReference {
  return ref(getFirebaseDatabase(), `raffles/${raffleId}`);
}

export async function createRaffle(hostId: string): Promise<string> {
  const db = getFirebaseDatabase();
  const rafflesRef = ref(db, 'raffles');
  const newRef = push(rafflesRef);
  const raffleId = newRef.key!;

  const raffle: Omit<Raffle, 'id'> = {
    hostId,
    status: 'lobby',
    participants: {},
    prizes: [],
    currentDrawIndex: -1,
    currentWinner: null,
    createdAt: Date.now(),
  };

  await set(newRef, raffle);
  return raffleId;
}

export async function joinRaffle(
  raffleId: string,
  participant: RaffleParticipant
): Promise<void> {
  const participantRef = ref(
    getFirebaseDatabase(),
    `raffles/${raffleId}/participants/${participant.id}`
  );
  await set(participantRef, participant);
}

export async function updateRaffleStatus(
  raffleId: string,
  status: RaffleStatus
): Promise<void> {
  const raffleRef = getRaffleRef(raffleId);
  await update(raffleRef, { status });
}

export async function setPrizes(
  raffleId: string,
  prizes: RafflePrize[]
): Promise<void> {
  const raffleRef = getRaffleRef(raffleId);
  await update(raffleRef, { prizes });
}

/**
 * Begin a draw by announcing the (already chosen) winner so every screen
 * can land its roulette deterministically on the same name. The reveal
 * step only flips the status afterwards.
 */
export async function startDrawing(
  raffleId: string,
  drawIndex: number,
  winnerId: string
): Promise<void> {
  const raffleRef = getRaffleRef(raffleId);
  await update(raffleRef, {
    status: 'drawing' as RaffleStatus,
    currentDrawIndex: drawIndex,
    currentWinner: winnerId,
  });
}

/**
 * Persist the winner on the matching prize and switch to reveal.
 * `currentDrawIndex` and `currentWinner` were already set by `startDrawing`.
 */
export async function revealWinner(
  raffleId: string,
  prizes: RafflePrize[]
): Promise<void> {
  const raffleRef = getRaffleRef(raffleId);
  await update(raffleRef, {
    status: 'reveal' as RaffleStatus,
    prizes,
  });
}

export async function deleteRaffle(raffleId: string): Promise<void> {
  await remove(getRaffleRef(raffleId));
}

export function onRaffleChange(
  raffleId: string,
  callback: (raffle: Raffle | null) => void
): () => void {
  const raffleRef = getRaffleRef(raffleId);
  const unsubscribe = onValue(raffleRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        id: raffleId,
        ...data,
        prizes: data.prizes ?? [],
        participants: data.participants ?? {},
      } as Raffle);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
}

/**
 * Live list of the host's most recent raffles, newest first.
 * Relies on the `.indexOn: ["hostId"]` rule and the `.read` query rule
 * scoped to `auth.uid === hostId` in `database.rules.json`.
 */
export function onHostRafflesChange(
  hostId: string,
  callback: (raffles: Raffle[]) => void,
  limit = 10,
): () => void {
  const q = query(
    ref(getFirebaseDatabase(), 'raffles'),
    orderByChild('hostId'),
    equalTo(hostId),
    limitToLast(limit),
  );
  const unsubscribe = onValue(q, (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<Raffle, 'id'>> | null;
    if (!value) {
      callback([]);
      return;
    }
    const raffles: Raffle[] = Object.entries(value).map(([id, data]) => ({
      id,
      ...data,
      prizes: data.prizes ?? [],
      participants: data.participants ?? {},
    }));
    raffles.sort((a, b) => b.createdAt - a.createdAt);
    callback(raffles);
  });
  return unsubscribe;
}
