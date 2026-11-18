import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  onSnapshot,
  Firestore,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { UserProfile, Task, World } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY_FIREBASE_CONFIG = 'minetask_1835_firebase_config_v22';

// 1. Lấy cấu hình Firebase: Ưu tiên từ LocalStorage (được người dùng cấu hình qua giao diện), sau đó tới Vite Env
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

  return null;
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
    const db = getFirestore(app);

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
    
    // Lưu thông tin người dùng lên Firestore (bao gồm timestamp)
    await setDoc(userRef, {
      ...user,
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
    await setDoc(stateDoc, {
      worlds,
      tasks,
      updatedAt: Date.now(),
    }, { merge: true });
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
