import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  storage,
} from './firebase';
import type {
  ChatMessage,
  LikeInteraction,
  MatchThread,
  PhotoItem,
  ReportReason,
  SafetyReport,
  UserProfile,
} from '../types/duet';
import { buildLikeId, buildMatchId } from '../utils/matching';
import { compressImageFile } from '../utils/imageCompression';

export interface LocalDuetState {
  currentUser: UserProfile | null;
  likes: LikeInteraction[];
  matches: MatchThread[];
  messagesByMatch: Record<string, ChatMessage[]>;
  reports: SafetyReport[];
  seededForUid?: string;
}

const LOCAL_STORAGE_KEY = 'duet_member_state_v1';

export function loadLocalState(): LocalDuetState {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return {
        currentUser: null,
        likes: [],
        matches: [],
        messagesByMatch: {},
        reports: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<LocalDuetState>;
    return {
      currentUser: parsed.currentUser ?? null,
      likes: Array.isArray(parsed.likes) ? parsed.likes : [],
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      messagesByMatch: parsed.messagesByMatch ?? {},
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      seededForUid: parsed.seededForUid,
    };
  } catch {
    return {
      currentUser: null,
      likes: [],
      matches: [],
      messagesByMatch: {},
      reports: [],
    };
  }
}

export function saveLocalState(state: LocalDuetState): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues when large base64 images exist
  }
}

export function clearLocalState(): void {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

function toMillis(val: unknown): number {
  if (typeof val === 'number') return val;
  if (val instanceof Timestamp) return val.toMillis();
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return Date.now();
}

export function isCloudSyncActive(uid?: string): boolean {
  return Boolean(
    db &&
      auth?.currentUser &&
      auth.currentUser.emailVerified &&
      (!uid || auth.currentUser.uid === uid)
  );
}

/**
 * Saves both the PII-free public profile (/profiles/{uid}) and owner-only PII (/userPrivate/{uid})
 * adhering strictly to the firebase-blueprint.json schema and Firestore security rules.
 */
export async function saveProfileToCloud(profile: UserProfile): Promise<void> {
  if (!db || !isCloudSyncActive(profile.uid)) return;

  const isDiscoverable =
    !profile.safetySettings.pauseProfile &&
    !profile.safetySettings.proactiveIncognitoMode;

  const publicRef = doc(db, 'profiles', profile.uid);
  const privateRef = doc(db, 'userPrivate', profile.uid);

  const sanitizedPhotos = profile.photos.slice(0, 6).map((p, idx) => ({
    id: p.id.slice(0, 128),
    url: p.url,
    storagePath: p.storagePath,
    order: idx,
    ...(p.promptLabel ? { promptLabel: p.promptLabel.slice(0, 100) } : {}),
    ...(p.caption ? { caption: p.caption.slice(0, 180) } : {}),
    ...(p.isMonogram ? { isMonogram: true, monogramTone: p.monogramTone || 'sage' } : {}),
  }));

  const sanitizedPrompts = profile.prompts.slice(0, 3).map((pr) => ({
    id: pr.id.slice(0, 128),
    question: pr.question.slice(0, 180),
    answer: pr.answer.slice(0, 260),
  }));

  const publicPayload = {
    uid: profile.uid,
    emailVerifiedViaOtp: Boolean(profile.emailVerifiedViaOtp),
    displayName: profile.displayName.trim().slice(0, 60),
    age: Math.max(18, Math.min(105, Math.round(profile.age))),
    city: profile.city.trim().slice(0, 80),
    ...(profile.hometown ? { hometown: profile.hometown.trim().slice(0, 80) } : {}),
    ...(profile.workOrCraft ? { workOrCraft: profile.workOrCraft.trim().slice(0, 120) } : {}),
    genders: profile.genders.slice(0, 6),
    showGender: Boolean(profile.showGender),
    pronouns: profile.pronouns.slice(0, 4),
    orientations: profile.orientations.slice(0, 6),
    showOrientation: Boolean(profile.showOrientation),
    relationshipStyles: profile.relationshipStyles.slice(0, 5),
    childfreePledgeSigned: true,
    feministQueerPledgeSigned: true,
    childfreeStanceBadge: profile.childfreeStanceBadge,
    showSterilizedBadge: Boolean(profile.showSterilizedBadge),
    valuesAndLifestyle: profile.valuesAndLifestyle.slice(0, 8),
    photos: sanitizedPhotos,
    prompts: sanitizedPrompts,
    discoveryPreferences: profile.discoveryPreferences,
    safetySettings: profile.safetySettings,
    isDiscoverable,
    updatedAt: serverTimestamp(),
  };

  try {
    const existingPublic = await getDoc(publicRef);
    if (existingPublic.exists()) {
      await updateDoc(publicRef, publicPayload);
    } else {
      await setDoc(publicRef, {
        ...publicPayload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `profiles/${profile.uid}`);
  }

  try {
    const existingPrivate = await getDoc(privateRef);
    if (existingPrivate.exists()) {
      await updateDoc(privateRef, {
        email: profile.email.trim().slice(0, 180),
        blockedUids: profile.blockedUids.slice(0, 500),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(privateRef, {
        uid: profile.uid,
        email: profile.email.trim().slice(0, 180),
        blockedUids: profile.blockedUids.slice(0, 500),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `userPrivate/${profile.uid}`);
  }
}

export async function fetchUserProfileFromCloud(uid: string): Promise<UserProfile | null> {
  if (!db || !isCloudSyncActive(uid)) return null;

  try {
    const publicSnap = await getDoc(doc(db, 'profiles', uid));
    if (!publicSnap.exists()) return null;
    const pub = publicSnap.data();

    let email = auth?.currentUser?.email || '';
    let blockedUids: string[] = [];

    try {
      const privSnap = await getDoc(doc(db, 'userPrivate', uid));
      if (privSnap.exists()) {
        const priv = privSnap.data();
        email = priv.email || email;
        blockedUids = Array.isArray(priv.blockedUids) ? priv.blockedUids : [];
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `userPrivate/${uid}`);
    }

    return {
      uid: pub.uid,
      email,
      emailVerifiedViaOtp: Boolean(pub.emailVerifiedViaOtp),
      displayName: pub.displayName,
      age: pub.age,
      city: pub.city,
      hometown: pub.hometown,
      workOrCraft: pub.workOrCraft,
      genders: pub.genders || [],
      showGender: pub.showGender ?? true,
      pronouns: pub.pronouns || [],
      orientations: pub.orientations || [],
      showOrientation: pub.showOrientation ?? true,
      relationshipStyles: pub.relationshipStyles || [],
      childfreePledgeSigned: Boolean(pub.childfreePledgeSigned),
      feministQueerPledgeSigned: Boolean(pub.feministQueerPledgeSigned),
      childfreeStanceBadge: pub.childfreeStanceBadge || '100% Firmly Childfree',
      showSterilizedBadge: Boolean(pub.showSterilizedBadge),
      valuesAndLifestyle: pub.valuesAndLifestyle || [],
      photos: pub.photos || [],
      prompts: pub.prompts || [],
      discoveryPreferences: pub.discoveryPreferences || {
        interestedInGenders: ['Everyone'],
        ageMin: 22,
        ageMax: 45,
        cities: [],
        prioritizeQueerCommunity: false,
      },
      safetySettings: pub.safetySettings || {
        proactiveIncognitoMode: false,
        allowNotesBeforeMatch: true,
        pauseProfile: false,
      },
      blockedUids,
      createdAt: toMillis(pub.createdAt),
      updatedAt: toMillis(pub.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `profiles/${uid}`);
  }
}

export async function fetchDiscoverableCloudProfiles(currentUid: string): Promise<UserProfile[]> {
  if (!db || !isCloudSyncActive(currentUid)) return [];

  try {
    const q = query(collection(db, 'profiles'), where('isDiscoverable', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const pub = d.data();
        return {
          uid: pub.uid,
          email: '',
          emailVerifiedViaOtp: Boolean(pub.emailVerifiedViaOtp),
          displayName: pub.displayName,
          age: pub.age,
          city: pub.city,
          hometown: pub.hometown,
          workOrCraft: pub.workOrCraft,
          genders: pub.genders || [],
          showGender: pub.showGender ?? true,
          pronouns: pub.pronouns || [],
          orientations: pub.orientations || [],
          showOrientation: pub.showOrientation ?? true,
          relationshipStyles: pub.relationshipStyles || [],
          childfreePledgeSigned: Boolean(pub.childfreePledgeSigned),
          feministQueerPledgeSigned: Boolean(pub.feministQueerPledgeSigned),
          childfreeStanceBadge: pub.childfreeStanceBadge || '100% Firmly Childfree',
          showSterilizedBadge: Boolean(pub.showSterilizedBadge),
          valuesAndLifestyle: pub.valuesAndLifestyle || [],
          photos: pub.photos || [],
          prompts: pub.prompts || [],
          discoveryPreferences: pub.discoveryPreferences,
          safetySettings: pub.safetySettings,
          blockedUids: [],
          createdAt: toMillis(pub.createdAt),
          updatedAt: toMillis(pub.updatedAt),
        } as UserProfile;
      })
      .filter((p) => p.uid !== currentUid);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'profiles');
  }
}

export async function persistLikeToCloud(like: LikeInteraction): Promise<void> {
  if (!db || !isCloudSyncActive(like.fromUid) || like.toUid.startsWith('seed_')) return;

  const likeId = buildLikeId(like.fromUid, like.toUid);
  const path = `likes/${likeId}`;
  try {
    await setDoc(doc(db, 'likes', likeId), {
      id: likeId,
      fromUid: like.fromUid,
      toUid: like.toUid,
      type: like.type,
      ...(like.targetElementType ? { targetElementType: like.targetElementType } : {}),
      ...(like.targetElementId ? { targetElementId: like.targetElementId.slice(0, 128) } : {}),
      ...(like.targetElementPreview ? { targetElementPreview: like.targetElementPreview.slice(0, 500) } : {}),
      ...(like.note ? { note: like.note.slice(0, 300) } : {}),
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function undoPassInCloud(fromUid: string, toUid: string): Promise<void> {
  if (!db || !isCloudSyncActive(fromUid) || toUid.startsWith('seed_')) return;
  const likeId = buildLikeId(fromUid, toUid);
  try {
    await deleteDoc(doc(db, 'likes', likeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `likes/${likeId}`);
  }
}

export async function updateIncomingLikeStatusInCloud(
  likeId: string,
  status: 'matched' | 'dismissed'
): Promise<void> {
  if (!db || !isCloudSyncActive() || likeId.startsWith('seed_')) return;
  try {
    await updateDoc(doc(db, 'likes', likeId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `likes/${likeId}`);
  }
}

export async function createMatchThreadInCloud(thread: MatchThread): Promise<void> {
  if (
    !db ||
    !isCloudSyncActive() ||
    thread.participants.some((p) => p.startsWith('seed_'))
  ) {
    return;
  }

  const sortedParticipants = [...thread.participants].sort() as [string, string];
  const matchId = buildMatchId(sortedParticipants[0], sortedParticipants[1]);

  try {
    await setDoc(doc(db, 'matches', matchId), {
      id: matchId,
      participants: sortedParticipants,
      ...(thread.originContext ? { originContext: thread.originContext } : {}),
      ...(thread.lastMessageText ? { lastMessageText: thread.lastMessageText.slice(0, 1000) } : {}),
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `matches/${matchId}`);
  }
}

export async function sendChatMessageInCloud(
  match: MatchThread,
  senderUid: string,
  text: string
): Promise<void> {
  if (
    !db ||
    !isCloudSyncActive(senderUid) ||
    match.participants.some((p) => p.startsWith('seed_'))
  ) {
    return;
  }

  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgPath = `matches/${match.id}/messages/${messageId}`;

  try {
    await setDoc(doc(db, 'matches', match.id, 'messages', messageId), {
      matchId: match.id,
      participants: match.participants,
      senderUid,
      text: trimmed,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'matches', match.id), {
      lastMessageText: trimmed,
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }
}

export function subscribeToCloudMatchMessages(
  matchId: string,
  currentUid: string,
  onMessages: (messages: ChatMessage[]) => void
): Unsubscribe | null {
  if (!db || !isCloudSyncActive(currentUid) || matchId.includes('seed_')) return null;

  const path = `matches/${matchId}/messages`;
  const q = query(
    collection(db, 'matches', matchId, 'messages'),
    where('participants', 'array-contains', currentUid),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          matchId: data.matchId,
          senderUid: data.senderUid,
          text: data.text,
          createdAt: toMillis(data.createdAt),
        };
      });
      onMessages(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function deleteMatchInCloud(matchId: string): Promise<void> {
  if (!db || !isCloudSyncActive() || matchId.includes('seed_')) return;
  try {
    await deleteDoc(doc(db, 'matches', matchId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `matches/${matchId}`);
  }
}

export async function submitReportToCloud(
  reporterUid: string,
  reportedUid: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  if (!db || !isCloudSyncActive(reporterUid)) return;

  const reportId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(db, 'reports', reportId), {
      reporterUid,
      reportedUid,
      reason,
      ...(details ? { details: details.trim().slice(0, 1000) } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
  }
}

/**
 * Compresses an uploaded photo via Canvas API (max 1080px, JPEG 0.82)
 * and uploads it to Firebase Storage (users/{uid}/photos/{photoId}.jpg) with live progress.
 * Gracefully falls back to compressed local JPEG data URL if Storage upload is unavailable in preview mode.
 */
export async function uploadProfilePhoto(
  uid: string,
  file: File,
  order: number,
  onProgress: (percent: number) => void
): Promise<PhotoItem> {
  onProgress(12);
  const compressed = await compressImageFile(file, 1080, 0.82);
  onProgress(35);

  const photoId = `ph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `users/${uid}/photos/${photoId}.jpg`;

  if (storage && isCloudSyncActive(uid)) {
    try {
      const storageRef = ref(storage, storagePath);
      const url = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, compressed.blob, {
          contentType: 'image/jpeg',
        });
        task.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round(
              35 + (snapshot.bytesTransferred / Math.max(1, snapshot.totalBytes)) * 60
            );
            onProgress(Math.min(96, pct));
          },
          (err) => reject(err),
          async () => {
            const downloadUrl = await getDownloadURL(task.snapshot.ref);
            onProgress(100);
            resolve(downloadUrl);
          }
        );
      });

      return {
        id: photoId,
        url,
        storagePath,
        order,
      };
    } catch {
      // Fallback gracefully to compressed data URL if bucket rules/CORS block local dev
    }
  }

  onProgress(100);
  return {
    id: photoId,
    url: compressed.dataUrl,
    storagePath: `local/${storagePath}`,
    order,
  };
}

export async function deleteProfilePhotoAsset(photo: PhotoItem): Promise<void> {
  if (
    !storage ||
    !isCloudSyncActive() ||
    photo.isMonogram ||
    photo.storagePath.startsWith('local/') ||
    photo.storagePath.startsWith('seed/')
  ) {
    return;
  }

  try {
    await deleteObject(ref(storage, photo.storagePath));
  } catch {
    // Asset already removed or inaccessible
  }
}
