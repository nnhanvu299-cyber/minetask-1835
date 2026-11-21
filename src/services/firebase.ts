import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  Firestore,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { UserProfile, Task, World, ChatMessage } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

// Cấu hình Firebase Cloud Firestore chính thức của dự án minitask-1835
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAAGM3zd44HboBfjATvxFfRlmTT5TJ-Xfo",
  authDomain: "minitask-d1a26.firebaseapp.com",
  projectId: "minitask-d1a26",
  storageBucket: "minitask-d1a26.firebasestorage.app",
  messagingSenderId: "468397641530",
  appId: "1:468397641530:web:ae7bea6075cd63be640a03",
};

const STORAGE_KEY_FIREBASE_CONFIG = 'minetask_1835_firebase_config_v22';

// 1. Lấy cấu hình Firebase: Ưu tiên từ LocalStorage, sau đó tới Vite Env, mặc định dùng dự án minitask-1835
export function getFirebaseConfig(): FirebaseConfig | null {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[Firebase] Lỗi đọc cấu hình từ localStorage:', e);
    }
  }

  // Đọc từ biến môi trường Vite (nếu có trong .env)
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (envApiKey && envProjectId && envAppId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: envAppId,
    };
  }

  // Mặc định kết nối tự động tới Firebase Cloud minitask-1835
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(cfg: FirebaseConfig): boolean {
  if (!cfg || !cfg.projectId || !cfg.apiKey) return false;
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(cfg));
    // Reset instance để tái khởi tạo với config mới
    cachedApp = null;
    cachedDb = null;
    initFirebase();
    return true;
  } catch (e) {
    console.error('[Firebase] Lỗi lưu cấu hình:', e);
    return false;
  }
}

export function clearFirebaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
    cachedApp = null;
    cachedDb = null;
  } catch {}
}

let cachedApp: FirebaseApp | null = null;
let cachedDb: Firestore | null = null;

// 2. Khởi tạo Firebase App và Cloud Firestore một cách an toàn
export function initFirebase(): { app: FirebaseApp | null; db: Firestore | null; isReady: boolean } {
  if (cachedApp && cachedDb) {
    return { app: cachedApp, db: cachedDb, isReady: true };
  }

  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return { app: null, db: null, isReady: false };
  }

  try {
    let app: FirebaseApp;
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    let db: Firestore;
    try {
      db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      db = getFirestore(app);
    }

    cachedApp = app;
    cachedDb = db;
    return { app, db, isReady: true };
  } catch (err) {
    console.warn('[Firebase] Khởi tạo không thành công:', err);
    return { app: null, db: null, isReady: false };
  }
}

export function isFirebaseReady(): boolean {
  return initFirebase().isReady;
}

// 3. Quản lý Tài khoản Co-op (Users) trên Cloud Firestore

// Lắng nghe dữ liệu Users theo thời gian thực (Real-time listener)
export function subscribeToFirebaseUsers(
  onUsersUpdate: (users: UserProfile[]) => void,
  onError?: (err: any) => void
): Unsubscribe | null {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCol,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data && (data.email || data.id)) {
            list.push(data);
          }
        });
        onUsersUpdate(list);
      },
      (err) => {
        console.warn('[Firebase] Lỗi lắng nghe users Firestore:', err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] Không thể thiết lập listener users:', err);
    return null;
  }
}

// Lưu hoặc cập nhật một tài khoản vào Firestore
export async function saveUserToFirestore(user: UserProfile): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    // Dùng id của user làm document id để tránh trùng lặp
    const docId = user.id || `user_${Date.now()}`;
    const userRef = doc(db, 'users', docId);
    
    // Lưu thông tin người dùng lên Firestore (loại bỏ undefined)
    const cleanUser = JSON.parse(JSON.stringify(user));
    await setDoc(userRef, {
      ...cleanUser,
      updatedAt: Date.now(),
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi lưu user lên Firestore:', err);
    return false;
  }
}

// Cập nhật một số trường của tài khoản (như avatar, đổi mật khẩu)
export async function updateUserInFirestore(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Date.now(),
    });
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi cập nhật user trên Firestore:', err);
    return false;
  }
}

// Xóa tài khoản khỏi Firestore
export async function deleteUserFromFirestore(userId: string): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi xóa user khỏi Firestore:', err);
    return false;
  }
}

// Lấy danh sách toàn bộ Users một lần (One-time fetch)
export async function fetchUsersFromFirestore(): Promise<UserProfile[] | null> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data && (data.email || data.id)) {
        list.push(data);
      }
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] Lỗi tải users từ Firestore:', err);
    return null;
  }
}

// Tải hàng loạt users lên Firestore (dùng khi đồng bộ khởi tạo hoặc import)
export async function syncBatchUsersToFirestore(users: UserProfile[]): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db || users.length === 0) return false;

  try {
    const batch = writeBatch(db);
    users.forEach((u) => {
      const docId = u.id || `user_${Date.now()}`;
      const ref = doc(db, 'users', docId);
      batch.set(ref, { ...u, updatedAt: Date.now() }, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi batch sync users:', err);
    return false;
  }
}

// 4. Đồng bộ Tasks và Worlds lên Firestore (Tùy chọn nâng cao)
export async function syncTasksAndWorldsToFirestore(worlds: World[], tasks: Task[]): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    const stateDoc = doc(db, 'app_state', 'workspace_data');
    const cleanPayload = JSON.parse(JSON.stringify({
      worlds,
      tasks,
      updatedAt: Date.now(),
    }));
    await setDoc(stateDoc, cleanPayload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi sync tasks/worlds:', err);
    return false;
  }
}

// Lắng nghe Tasks và Worlds theo thời gian thực từ Firestore
export function subscribeToFirebaseAppState(
  onUpdate: (data: { worlds: World[]; tasks: Task[] }) => void
): Unsubscribe | null {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const stateDoc = doc(db, 'app_state', 'workspace_data');
    return onSnapshot(stateDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.worlds) && Array.isArray(data.tasks)) {
          onUpdate({
            worlds: data.worlds,
            tasks: data.tasks,
          });
        }
      }
    });
  } catch {
    return null;
  }
}

// 5. Quản lý Tin nhắn Trò chuyện Đội (Team Chat) trên Cloud Firestore
export async function sendChatMessageToFirestore(msg: ChatMessage | Omit<ChatMessage, 'id'>): Promise<string | null> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const chatCol = collection(db, 'chat_messages');
    const msgId = (msg as ChatMessage).id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const msgDoc = doc(chatCol, msgId);
    const payload: ChatMessage = {
      ...msg,
      id: msgId,
    };
    // Loại bỏ mọi trường undefined để setDoc không bao giờ bị lỗi
    const cleanPayload = JSON.parse(JSON.stringify(payload));
    await setDoc(msgDoc, cleanPayload, { merge: true });
    return msgId;
  } catch (err) {
    console.error('[Firebase] Lỗi gửi tin nhắn chat:', err);
    return null;
  }
}

export async function fetchChatMessagesFromFirestore(): Promise<ChatMessage[]> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return [];

  try {
    const chatCol = collection(db, 'chat_messages');
    const snapshot = await getDocs(chatCol);
    const msgs: ChatMessage[] = [];
    snapshot.forEach((d) => {
      const item = d.data() as ChatMessage;
      if (item && item.id && item.senderId && (item.text || item.imageUrl)) {
        msgs.push(item);
      }
    });
    msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return msgs.slice(-150);
  } catch (err) {
    console.warn('[Firebase] Lỗi nạp tin nhắn chat:', err);
    return [];
  }
}

export function subscribeToChatMessages(
  onMessages: (messages: ChatMessage[]) => void
): Unsubscribe | null {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const chatCol = collection(db, 'chat_messages');
    return onSnapshot(
      chatCol,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((d) => {
          const item = d.data() as ChatMessage;
          if (item && item.id && item.senderId && (item.text || item.imageUrl)) {
            msgs.push(item);
          }
        });
        msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        onMessages(msgs.slice(-150));
      },
      (err) => {
        console.warn('[Firebase] Lỗi lắng nghe chat:', err);
      }
    );
  } catch (err) {
    console.warn('[Firebase] Không thể thiết lập listener chat:', err);
    return null;
  }
}

export async function reactToChatMessageInFirestore(
  messageId: string,
  emoji: string,
  userId: string
): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    const msgRef = doc(db, 'chat_messages', messageId);
    const snap = await getDoc(msgRef);
    if (!snap.exists()) return false;
    const data = snap.data() as ChatMessage;
    const reactions = { ...(data.reactions || {}) };
    const currentUsers = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];

    if (currentUsers.includes(userId)) {
      // Toggle off
      reactions[emoji] = currentUsers.filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add reaction
      reactions[emoji] = [...currentUsers, userId];
    }

    await updateDoc(msgRef, { reactions });
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi thả reaction tin nhắn:', err);
    return false;
  }
}

export async function markChatMessageReadInFirestore(
  messageIds: string[],
  userId: string
): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db || !messageIds || messageIds.length === 0) return false;

  try {
    const promises = messageIds.map(async (msgId) => {
      try {
        const msgRef = doc(db, 'chat_messages', msgId);
        const snap = await getDoc(msgRef);
        if (!snap.exists()) return;
        const data = snap.data() as ChatMessage;
        const current = Array.isArray(data.readBy) ? data.readBy : [];
        if (!current.includes(userId)) {
          await updateDoc(msgRef, {
            readBy: [...current, userId],
          });
        }
      } catch {}
    });
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi cập nhật trạng thái đã xem:', err);
    return false;
  }
}

export async function deleteChatMessageFromFirestore(messageId: string): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    await deleteDoc(doc(db, 'chat_messages', messageId));
    return true;
  } catch (err) {
    console.error('[Firebase] Lỗi xóa tin nhắn chat:', err);
    return false;
  }
}

export function subscribeToAppVersion(
  callback: (data: { version: number; note?: string; buildTime?: string }) => void
): Unsubscribe | null {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const versionDoc = doc(db, 'app_meta', 'latest_version');
    return onSnapshot(
      versionDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.version) {
            callback({
              version: Number(data.version),
              note: data.note,
              buildTime: data.buildTime,
            });
          }
        }
      },
      (err) => {
        console.warn('[Firebase] Lỗi lắng nghe phiên bản ứng dụng:', err);
      }
    );
  } catch (err) {
    return null;
  }
}

export async function broadcastAppVersionToFirestore(version: number, note?: string): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return false;

  try {
    await setDoc(
      doc(db, 'app_meta', 'latest_version'),
      {
        version,
        note: note || 'Bản cập nhật mới 1835',
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi gửi thông báo phiên bản mới lên Cloud:', err);
    return false;
  }
}

// ==========================================
// 6. Theo dõi trạng thái Online thời gian thực (Presence) trên Firestore
// ==========================================

export interface UserPresence {
  userId: string;
  name: string;
  avatarKey?: string;
  role?: string;
  lastSeen: number;
}

// Cập nhật nhịp tim (Heartbeat) của user lên Firestore
export async function updatePresenceInFirestore(presence: {
  userId: string;
  name: string;
  avatarKey?: string;
  role?: string;
  lastSeen?: number;
}): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db || !presence.userId) return false;

  try {
    const presenceRef = doc(db, 'presence', presence.userId);
    const cleanPayload = JSON.parse(JSON.stringify({
      userId: presence.userId,
      name: presence.name || '',
      avatarKey: presence.avatarKey || '',
      role: presence.role || '',
      lastSeen: presence.lastSeen || Date.now(),
      updatedAt: Date.now(),
    }));
    await setDoc(presenceRef, cleanPayload, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firebase] Lỗi cập nhật presence:', err);
    return false;
  }
}

// Đặt trạng thái offline khi đóng ứng dụng hoặc đăng xuất
export async function setOfflineInFirestore(userId: string): Promise<boolean> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db || !userId) return false;

  try {
    const presenceRef = doc(db, 'presence', userId);
    await setDoc(presenceRef, { lastSeen: 0, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// Lắng nghe danh sách thành viên online theo thời gian thực (Real-time listener)
export function subscribeToPresenceInFirestore(
  onPresenceUpdate: (presences: UserPresence[]) => void,
  onError?: (err: any) => void
): Unsubscribe | null {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const presenceCol = collection(db, 'presence');
    return onSnapshot(
      presenceCol,
      (snapshot) => {
        const list: UserPresence[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.userId && typeof data.lastSeen === 'number') {
            list.push({
              userId: data.userId,
              name: data.name || '',
              avatarKey: data.avatarKey || '',
              role: data.role || '',
              lastSeen: data.lastSeen,
            });
          }
        });
        onPresenceUpdate(list);
      },
      (err) => {
        console.warn('[Firebase Presence] Lỗi lắng nghe presence Firestore:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('[Firebase Presence] Không thể thiết lập listener:', err);
    return null;
  }
}

// Lấy danh sách presence một lần (One-time fetch khi khởi động)
export async function fetchPresenceFromFirestore(): Promise<UserPresence[] | null> {
  const { db, isReady } = initFirebase();
  if (!isReady || !db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'presence'));
    const list: UserPresence[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.userId && typeof data.lastSeen === 'number') {
        list.push({
          userId: data.userId,
          name: data.name || '',
          avatarKey: data.avatarKey || '',
          role: data.role || '',
          lastSeen: data.lastSeen,
        });
      }
    });
    return list;
  } catch (err) {
    console.warn('[Firebase Presence] Lỗi tải presence:', err);
    return null;
  }
}

