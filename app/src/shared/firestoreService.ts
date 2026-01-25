import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { FindRecord, Session } from './types';
import { logger } from './LogService';

const USERS_COLLECTION = 'users';
const FINDS_SUBCOLLECTION = 'finds';
const SESSIONS_SUBCOLLECTION = 'sessions';

// Helper to get current user ID
const getCurrentUserId = (): string | null => {
  return auth().currentUser?.uid || null;
};

// --- FindRecord Operations ---

const findRecordCollection = (userId: string) =>
  firestore().collection(USERS_COLLECTION).doc(userId).collection(FINDS_SUBCOLLECTION);

export const addFind = async (find: FindRecord): Promise<FindRecord> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot add find - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const findRef = findRecordCollection(userId).doc(find.id);
    await findRef.set({
      ...find,
      timestamp: firestore.Timestamp.fromDate(new Date(find.timestamp)), // Convert string to Firestore Timestamp
      // Ensure aiData is handled correctly for Firestore (no custom objects, plain JSON)
      aiData: find.aiData ? JSON.parse(JSON.stringify(find.aiData)) : null,
      synced: true, // Mark as synced now that it's in Firestore
    });
    logger.add('firestore', `Find added: ${find.id}`);
    return { ...find, synced: true };
  } catch (error) {
    logger.error('FirestoreService: Failed to add find', { findId: find.id, error });
    throw error;
  }
};

export const updateFind = async (findId: string, updates: Partial<FindRecord>): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot update find - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const findRef = findRecordCollection(userId).doc(findId);
    await findRef.update({
      ...updates,
      ...(updates.timestamp && { timestamp: firestore.Timestamp.fromDate(new Date(updates.timestamp)) }),
      ...(updates.aiData && { aiData: JSON.parse(JSON.stringify(updates.aiData)) }),
    });
    logger.add('firestore', `Find updated: ${findId}`);
  } catch (error) {
    logger.error('FirestoreService: Failed to update find', { findId, updates, error });
    throw error;
  }
};

export const deleteFind = async (findId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot delete find - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    await findRecordCollection(userId).doc(findId).delete();
    logger.add('firestore', `Find deleted: ${findId}`);
  } catch (error) {
    logger.error('FirestoreService: Failed to delete find', { findId, error });
    throw error;
  }
};

// Listener for real-time updates (for GalleryGrid)
export const subscribeToFinds = (
  callback: (finds: FindRecord[]) => void,
  onError: (error: Error) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    onError(new Error('No authenticated user for Firestore subscription.'));
    return () => {}; // Return a no-op unsubscribe function
  }

  const unsubscribe = findRecordCollection(userId)
    .orderBy('timestamp', 'desc') // Order by timestamp to match existing logic
    .onSnapshot(
      (querySnapshot) => {
        const finds: FindRecord[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          finds.push({
            ...(data as Omit<FindRecord, 'timestamp' | 'aiData'>),
            id: doc.id,
            timestamp: (data.timestamp as firestore.Timestamp).toDate().toISOString(), // Convert Timestamp to string
            aiData: data.aiData ? data.aiData : null, // Assuming aiData is already plain JSON
          });
        });
        callback(finds);
      },
      (error) => {
        logger.error('FirestoreService: Error subscribing to finds', error);
        onError(error);
      }
    );
  logger.add('firestore', `Subscribed to finds for user: ${userId}`);
  return unsubscribe;
};

// --- Session Operations ---

const sessionCollection = (userId: string) =>
  firestore().collection(USERS_COLLECTION).doc(userId).collection(SESSIONS_SUBCOLLECTION);

export const addSession = async (session: Session): Promise<Session> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot add session - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const sessionRef = sessionCollection(userId).doc(session.id);
    await sessionRef.set({
      ...session,
      startTime: firestore.Timestamp.fromMillis(session.startTime), // Convert number to Firestore Timestamp
      ...(session.endTime && { endTime: firestore.Timestamp.fromMillis(session.endTime) }),
    });
    logger.add('firestore', `Session added: ${session.id}`);
    return session;
  } catch (error) {
    logger.error('FirestoreService: Failed to add session', { sessionId: session.id, error });
    throw error;
  }
};

export const updateSession = async (sessionId: string, updates: Partial<Session>): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot update session - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const sessionRef = sessionCollection(userId).doc(sessionId);
    await sessionRef.update({
      ...updates,
      ...(updates.startTime && { startTime: firestore.Timestamp.fromMillis(updates.startTime) }),
      ...(updates.endTime && { endTime: firestore.Timestamp.fromMillis(updates.endTime) }),
    });
    logger.add('firestore', `Session updated: ${sessionId}`);
  } catch (error) {
    logger.error('FirestoreService: Failed to update session', { sessionId, updates, error });
    throw error;
  }
};

export const addFindToSession = async (sessionId: string, findId: string): Promise<void> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot add find to session - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const sessionRef = sessionCollection(userId).doc(sessionId);
    await sessionRef.update({
      finds: firestore.FieldValue.arrayUnion(findId),
    });
    logger.add('firestore', `Added find ${findId} to session ${sessionId}`);
  } catch (error) {
    logger.error('FirestoreService: Failed to add find to session', { sessionId, findId, error });
    throw error;
  }
};

export const subscribeToSessions = (
  callback: (sessions: Session[]) => void,
  onError: (error: Error) => void
) => {
  const userId = getCurrentUserId();
  if (!userId) {
    onError(new Error('No authenticated user for Firestore subscription.'));
    return () => {}; // Return a no-op unsubscribe function
  }

  const unsubscribe = sessionCollection(userId)
    .orderBy('startTime', 'desc')
    .onSnapshot(
      (querySnapshot) => {
        const sessions: Session[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          sessions.push({
            ...(data as Omit<Session, 'startTime' | 'endTime'>),
            id: doc.id,
            startTime: (data.startTime as firestore.Timestamp).toMillis(),
            endTime: data.endTime ? (data.endTime as firestore.Timestamp).toMillis() : undefined,
          });
        });
        callback(sessions);
      },
      (error) => {
        logger.error('FirestoreService: Error subscribing to sessions', error);
        onError(error);
      }
    );
  logger.add('firestore', `Subscribed to sessions for user: ${userId}`);
  return unsubscribe;
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  const userId = getCurrentUserId();
  if (!userId) {
    logger.error('FirestoreService: Cannot get session - no user ID');
    throw new Error('No authenticated user for Firestore operation.');
  }
  try {
    const doc = await sessionCollection(userId).doc(sessionId).get();
    if (doc.exists) {
      const data = doc.data();
      return {
        ...(data as Omit<Session, 'startTime' | 'endTime'>),
        id: doc.id,
        startTime: (data?.startTime as firestore.Timestamp).toMillis(),
        endTime: data?.endTime ? (data.endTime as firestore.Timestamp).toMillis() : undefined,
      };
    }
    return null;
  } catch (error) {
    logger.error('FirestoreService: Failed to get session', { sessionId, error });
    throw error;
  }
};