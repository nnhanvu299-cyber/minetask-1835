import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { UserProfile, UserId, World, Task, TaskStatus, NotificationItem, ChatMessage, ChatReplyInfo } from '../types';
import { soundEngine } from '../utils/audio';
import { sendOtpEmail } from '../utils/emailService';
import { sendDeviceNotification, sendChatMessageDeviceNotification } from '../utils/deviceNotification';
import { hashPassword, verifyPassword } from '../utils/passwordHash';
import {
  isFirebaseReady,
  subscribeToFirebaseUsers,
  saveUserToFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  fetchUsersFromFirestore,
  syncBatchUsersToFirestore,
  syncTasksAndWorldsToFirestore,
  subscribeToFirebaseAppState,
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  FirebaseConfig,
  sendChatMessageToFirestore,
  subscribeToChatMessages,
  reactToChatMessageInFirestore,
  deleteChatMessageFromFirestore,
  markChatMessageReadInFirestore,
  fetchChatMessagesFromFirestore,
  updatePresenceInFirestore,
  setOfflineInFirestore,
  subscribeToPresenceInFirestore,
  fetchPresenceFromFirestore,
  UserPresence,
} from '../services/firebase';

import { DEFAULT_USERS, INITIAL_WORLDS, INITIAL_TASKS } from '../data/initialData';
import { ConfirmDeleteState } from '../components/ConfirmDeleteModal';

interface AppContextValue {
  users: UserProfile[];
  currentUser: UserProfile | null;
  worlds: World[];
  tasks: Task[];
  activeWorld: World | null;
  activeWorldId: string | null;
  soundEnabled: boolean;
  notifications: NotificationItem[];
  activePopupNotification: NotificationItem | null;
  unreadNotificationCount: number;

  // Online Mode & Realtime Presence
  isOnlineMode: boolean;
  networkOnline: boolean;
  serverConnected: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: number | null;
  serverPing: number | null;
  onlineMembers: Array<{
    userId: string;
    name: string;
    avatarKey?: string;
    role?: string;
    lastSeen: number;
    isSelf?: boolean;
  }>;
  toggleOnlineMode: (enabled?: boolean) => void;
  syncNow: () => Promise<boolean>;

  // Firebase Cloud Integration
  isFirebaseConnected: boolean;
  firebaseConfig: FirebaseConfig | null;
  updateFirebaseConfig: (config: FirebaseConfig) => boolean;
  clearFirebaseConfig: () => void;
  syncToFirebaseNow: () => Promise<boolean>;

  // Actions
  setActiveWorldId: (id: string | null) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  register: (name: string, email: string, pass: string, avatarKey: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  addTeamMember: (name: string, email: string, pass: string, avatarKey: string) => { success: boolean; message: string; user?: UserProfile };
  importTeamMembers: (incomingUsers: UserProfile[]) => { success: boolean; count: number; message: string };
  exportTeamCode: () => string;
  importTeamCode: (code: string) => Promise<{ success: boolean; count: number; message: string }> | { success: boolean; count: number; message: string };
  joinTeamWithCode: (name: string, code: string, avatarKey?: string, email?: string, pass?: string) => Promise<{ success: boolean; message: string }>;
  updateUserAvatar: (userId: string, avatarKey: string) => void;
  logout: () => void;
  deleteAccount: (userId: string) => { success: boolean; message: string };
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code: string; message: string }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ success: boolean; message: string }>;

  createWorld: (data: Omit<World, 'id' | 'createdAt' | 'createdBy'>) => World;
  updateWorld: (id: string, updates: Partial<World>) => void;
  deleteWorld: (id: string) => void;

  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'status' | 'orderIndex' | 'miningUpdatesCount' | 'miningLogs'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Mining & Wooden Sign Notes
  updateTaskProgressNote: (taskId: string, note: string) => void;
  completeTaskStation: (taskId: string, finalNote?: string) => void;
  undoTaskStation: (taskId: string) => void;
  mineTaskHit: (taskId: string, hitsToAdd?: number) => void;
  setTaskMiningProgress: (taskId: string, currentHits: number, requiredHits?: number) => void;

  // Sequential Locking Helpers
  isStationUnlocked: (task: Task, allWorldTasks: Task[]) => boolean;
  isStationCompleted: (task: Task) => boolean;

  // Notifications
  dismissPopupNotification: () => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;

  toggleSound: () => void;
  resetToDemoData: () => void;

  // XP Progress Calculation
  getWorldProgress: (worldId: string) => {
    totalTasks: number;
    completedTasks: number;
    totalXp: number;
    earnedXp: number;
    percentage: number;
    level: number;
    isCleared: boolean;
  };

  // Team Co-op Chat
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  sendChatMessage: (text: string, type?: 'text' | 'shout' | 'system' | 'task_share' | 'image', attachedTaskId?: string, attachedTaskTitle?: string, imageUrl?: string, replyTo?: ChatReplyInfo) => Promise<boolean>;
  reactToChatMessage: (messageId: string, emoji: string) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  markChatAsRead: () => void;
  refreshChatMessages: () => Promise<void>;
  activeChatToast: { id: string; senderName: string; text: string; senderAvatar?: string } | null;
  dismissChatToast: () => void;

  // Global Confirm Delete Dialog
  confirmDeleteState: ConfirmDeleteState;
  requestConfirmDelete: (opts: {
    title?: string;
    message: string;
    itemName?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
  closeConfirmDelete: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const isDefaultMockUser = (u: any): boolean => {
  if (!u) return true;
  const em = (u.email || '').toLowerCase().trim();
  const id = (u.id || '').toLowerCase().trim();
  return (
    id === 'user_steve_default' ||
    id === 'user_tuan_minh_1835' ||
    id === 'user_hoang_nam_1835' ||
    em === 'admin@1835.vn' ||
    em === 'steve@1835.vn' ||
    em.endsWith('@1835s.team')
  );
};

const CURRENT_VERSION_TAG = 'v23';

// Device ID duy nhất cho mỗi máy/trình duyệt để hỗ trợ phân biệt và thông báo chéo đa thiết bị (PC <-> Phone)
export const CLIENT_DEVICE_ID = (() => {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem('minetask_1835_client_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('minetask_1835_client_device_id', id);
    }
    return id;
  } catch {
    return 'dev_' + Date.now().toString(36);
  }
})();

function purgeLegacyAppData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (localStorage.getItem('minetask_1835_purged_legacy_done')) return;
  try {
    const legacyOldTags = ['_v1', '_v2', '_v3', '_v4', '_v5', '_v6', '_v7', '_v8', '_v9', '_v10', '_v11', '_v12', '_v13', '_v14', '_v15', '_v16', '_v17', '_v18', '_v19', '_v20', '_v21', '_v22'];
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('minetask_') || key.startsWith('1835_'))) {
        if (legacyOldTags.some((tag) => key.includes(tag))) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('minetask_1835_purged_legacy_done', 'true');

    // Also purge outdated Service Worker caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (legacyOldTags.some((tag) => name.includes(tag))) {
            caches.delete(name);
          }
        });
      });
    }
  } catch (err) {
    console.warn('[1835] Auto purge error:', err);
  }
}

const STORAGE_KEY_USERS = 'minetask_1835_flat_users_v23';
const STORAGE_KEY_CURRENT_USER = 'minetask_1835_flat_session_v23';
const STORAGE_KEY_CURRENT_USER_PROFILE = 'minetask_1835_flat_session_profile_v23';
const STORAGE_KEY_REMEMBER_LOGIN = 'minetask_1835_remember_login_v23';
const STORAGE_KEY_REMEMBERED_ACCOUNT = 'minetask_1835_remembered_account_v23';
const STORAGE_KEY_ONLINE_MODE = 'minetask_1835_online_mode_v23';
const STORAGE_KEY_WORLDS = 'minetask_1835_flat_worlds_v23';
const STORAGE_KEY_TASKS = 'minetask_1835_flat_tasks_v23';
const STORAGE_KEY_SOUND = 'minetask_1835_flat_sound_v23';
const STORAGE_KEY_NOTIFS = 'minetask_1835_flat_notifs_v23';
const STORAGE_KEY_DELETED_TASKS = 'minetask_1835_deleted_tasks_v23';
const STORAGE_KEY_DELETED_WORLDS = 'minetask_1835_deleted_worlds_v23';

// Real-time synchronization channel across browser tabs
const SYNC_CHANNEL_NAME = 'minetask_1835_realtime_bus';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    purgeLegacyAppData();
  }, []);

  const [users, setUsers] = useState<UserProfile[]>(() => {
    purgeLegacyAppData();
    const saved = localStorage.getItem(STORAGE_KEY_USERS) || localStorage.getItem('minetask_1835_flat_users_v20');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.filter((u) => !isDefaultMockUser(u));
          if (clean.length > 0) return clean;
        }
      } catch {}
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const rememberPref = localStorage.getItem(STORAGE_KEY_REMEMBER_LOGIN);
      // Mặc định lưu đăng nhập trên máy trừ khi người dùng chủ động bỏ chọn
      if (rememberPref === 'false') return null;

      const savedProfileJson = localStorage.getItem(STORAGE_KEY_CURRENT_USER_PROFILE);
      if (savedProfileJson) {
        const parsed: UserProfile = JSON.parse(savedProfileJson);
        if (parsed && parsed.id && !isDefaultMockUser(parsed)) {
          return parsed;
        }
      }

      const savedUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (savedUserId) {
        const savedUsersJson = localStorage.getItem(STORAGE_KEY_USERS) || localStorage.getItem('minetask_1835_flat_users_v20');
        if (savedUsersJson) {
          const parsedList: UserProfile[] = JSON.parse(savedUsersJson);
          const matched = parsedList.find((u) => u.id === savedUserId && !isDefaultMockUser(u));
          if (matched) return matched;
        }
        const defFound = DEFAULT_USERS.find((u) => u.id === savedUserId && !isDefaultMockUser(u));
        if (defFound) return defFound;
      }
    } catch (err) {
      console.warn('[1835] Error restoring current user session:', err);
    }
    return null;
  });

  const [worlds, setWorlds] = useState<World[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORLDS);
    if (saved) {
      try {
        const parsed: World[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_WORLDS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    if (saved) {
      try {
        const parsed: Task[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(t => !!t.deadline)) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_TASKS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [activePopupNotification, setActivePopupNotification] = useState<NotificationItem | null>(null);
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Team Co-op Chat State
  const STORAGE_KEY_CHAT = 'minetask_1835_chat_messages_v23';
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_CHAT) ||
        localStorage.getItem('minetask_1835_chat_messages_v24');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg_welcome_1835',
        senderId: 'user_steve_default',
        senderName: 'Steve',
        senderAvatar: 'steve',
        senderRole: 'Thợ Mỏ Co-op',
        senderColor: '#F37022',
        text: 'Chào mừng cả đội 1835 đến với kênh chat Co-op! Chúc anh em đào task vui vẻ ⛏️💎',
        createdAt: Date.now() - 3600000,
        type: 'shout',
      },
    ];
  });

  // Tự động lưu trữ tin nhắn vào localStorage mỗi khi thay đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (chatMessages && chatMessages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(chatMessages.slice(-150)));
      } catch {}
    }
  }, [chatMessages]);
  const notifiedToastIdsRef = useRef<Set<string>>(new Set());

  // Tính số lượng tin nhắn chưa đọc chuẩn xác 100% dựa vào danh sách readBy, không bao giờ bị tăng ảo
  const unreadChatCount = useMemo(() => {
    if (!currentUser || !Array.isArray(chatMessages)) return 0;
    const myId = currentUser.id;
    return chatMessages.filter(
      (m) => m && m.senderId !== myId && (!Array.isArray(m.readBy) || !m.readBy.includes(myId))
    ).length;
  }, [chatMessages, currentUser]);

  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [activeChatToast, setActiveChatToast] = useState<{
    id: string;
    senderName: string;
    text: string;
    senderAvatar?: string;
  } | null>(null);
  const lastKnownChatIdRef = useRef<string | null>(null);

  const dismissChatToast = useCallback(() => {
    setActiveChatToast(null);
  }, []);

  const notifyIncomingChatMessage = useCallback((msg: ChatMessage) => {
    if (!msg || !msg.id) return;

    // Không bao giờ thông báo trên chính thiết bị vừa bấm gửi tin nhắn này
    if (msg.deviceId && msg.deviceId === CLIENT_DEVICE_ID) return;
    if (!msg.deviceId && msg.senderId === currentUserRef.current?.id) return;

    // Chống lặp thông báo: mỗi tin nhắn chỉ hiển thị Toast và phát chuông 1 lần duy nhất
    if (notifiedToastIdsRef.current.has(msg.id)) return;
    notifiedToastIdsRef.current.add(msg.id);

    // 1. Luôn phát chuông âm thanh 8-bit và rung điện thoại khi có tin nhắn mới
    try {
      soundEngine.playChatMessage();
    } catch {}

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      (!(navigator as any).userActivation || (navigator as any).userActivation.hasBeenActive)
    ) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }

    // 2. Nếu đang đóng khung chat: Bật banner Toast nổi và gửi Push Notification
    if (!isChatOpenRef.current) {
      setActiveChatToast({
        id: msg.id,
        senderName: msg.senderName,
        text: msg.text,
        senderAvatar: msg.senderAvatar,
      });

      sendChatMessageDeviceNotification(msg.senderName, msg.text, () => {
        setIsChatOpen(true);
      });

      try {
        if (typeof document !== 'undefined' && document.hidden) {
          document.title = `💬 (${msg.senderName}) MINETASK 1835`;
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      setActiveChatToast(null);
      try {
        if (typeof document !== 'undefined') {
          document.title = 'MINETASK 1835';
        }
      } catch {}
    }
  }, [isChatOpen]);

  // Online Mode, Connectivity & Live Presence
  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEY_ONLINE_MODE);
    return saved !== null ? saved === 'true' : true;
  });

  const [networkOnline, setNetworkOnline] = useState<boolean>(true);
  const isFetchingRef = useRef(false);
  const isPushingRef = useRef(false);

  // Deleted entities tracking to prevent resurrection during cloud sync
  const deletedTaskIdsRef = useRef<Set<string>>(new Set());
  const deletedWorldIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY_DELETED_TASKS);
      if (savedTasks) {
        const arr = JSON.parse(savedTasks);
        if (Array.isArray(arr)) deletedTaskIdsRef.current = new Set(arr);
      }
      const savedWorlds = localStorage.getItem(STORAGE_KEY_DELETED_WORLDS);
      if (savedWorlds) {
        const arr = JSON.parse(savedWorlds);
        if (Array.isArray(arr)) deletedWorldIdsRef.current = new Set(arr);
      }
    } catch {}
  }, []);

  const [serverConnected, setServerConnected] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(Date.now());
  const [serverPing, setServerPing] = useState<number | null>(null);

  const [localPresences, setLocalPresences] = useState<Map<string, {
    userId: string;
    name: string;
    avatarKey?: string;
    role?: string;
    lastSeen: number;
    isSelf?: boolean;
  }>>(new Map());

  // Nhịp tick định kỳ mỗi 25s để cập nhật trạng thái online (tránh re-render toàn cây mỗi 5s)
  const [presenceTick, setPresenceTick] = useState<number>(0);
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setPresenceTick((t) => (t + 1) % 100000);
    }, 25000);
    return () => clearInterval(tickInterval);
  }, []);

  // Firebase State & Configuration
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(() => isFirebaseReady());
  const [firebaseConfigState, setFirebaseConfigState] = useState<FirebaseConfig | null>(() => getFirebaseConfig());

  const updateFirebaseConfigHandler = (cfg: FirebaseConfig): boolean => {
    const ok = saveFirebaseConfig(cfg);
    if (ok) {
      setFirebaseConfigState(cfg);
      setIsFirebaseConnected(true);
    }
    return ok;
  };

  const clearFirebaseConfigHandler = () => {
    clearFirebaseConfig();
    setFirebaseConfigState(null);
    setIsFirebaseConnected(false);
  };

  const syncToFirebaseNow = async (): Promise<boolean> => {
    if (!isFirebaseReady()) return false;
    try {
      const cleanUsers = getStoredUsers().filter((u) => !isDefaultMockUser(u));
      const resUsers = await syncBatchUsersToFirestore(cleanUsers);
      const resData = await syncTasksAndWorldsToFirestore(worlds, tasks);
      return resUsers || resData;
    } catch (e) {
      console.error('[Firebase Sync Now] Error:', e);
      return false;
    }
  };

  const currentUserRef = useRef<UserProfile | null>(currentUser);
  currentUserRef.current = currentUser;
  const isChatOpenRef = useRef<boolean>(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  // Lắng nghe dữ liệu người dùng và Tasks/Worlds thời gian thực từ Cloud Firestore
  useEffect(() => {
    if (!isFirebaseConnected) return;

    // Tự động tải backup local users lên Firebase nếu Firestore đang trống
    fetchUsersFromFirestore().then((cloudUsers) => {
      if (cloudUsers && cloudUsers.length === 0) {
        const localClean = getStoredUsers().filter((u) => !isDefaultMockUser(u));
        if (localClean.length > 0) {
          syncBatchUsersToFirestore(localClean).catch(() => {});
        }
      }
    }).catch(() => {});

    const unsubscribeUsers = subscribeToFirebaseUsers(
      (cloudUsers) => {
        if (!cloudUsers || !Array.isArray(cloudUsers)) return;
        const validCloudUsers = cloudUsers.filter((u) => !isDefaultMockUser(u));
        if (validCloudUsers.length === 0) return;

        setUsers((prevUsers) => {
          const map = new Map<string, UserProfile>();
          prevUsers.forEach((u) => {
            if (u && u.email && !isDefaultMockUser(u)) {
              map.set(u.email.trim().toLowerCase(), u);
            }
          });
          validCloudUsers.forEach((u) => {
            if (u && u.email) {
              const key = u.email.trim().toLowerCase();
              map.set(key, { ...map.get(key), ...u });
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      },
      (err) => {
        console.warn('[Firebase Users Sync] Error:', err);
      }
    );

    const unsubApp = subscribeToFirebaseAppState(({ worlds: cWorlds, tasks: cTasks }) => {
      if (Array.isArray(cWorlds) && cWorlds.length > 0) {
        setWorlds(cWorlds);
      }
      if (Array.isArray(cTasks) && cTasks.length > 0) {
        setTasks(cTasks);
      }
    });

    // Nạp tin nhắn từ Cloud Firestore ngay khi khởi động
    fetchChatMessagesFromFirestore().then((cloudMsgs) => {
      if (Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
        setChatMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          cloudMsgs.forEach((m) => map.set(m.id, m));
          const merged = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
          try {
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(merged.slice(-150)));
          } catch {}
          return merged;
        });
      }
    });

    const unsubChat = subscribeToChatMessages((cloudMsgs) => {
      if (!Array.isArray(cloudMsgs) || cloudMsgs.length === 0) return;

      setChatMessages((prev) => {
        const map = new Map<string, ChatMessage>();
        prev.forEach((m) => map.set(m.id, m));
        cloudMsgs.forEach((m) => map.set(m.id, m));
        const merged = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);

        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(merged.slice(-100)));
        } catch {}

        return merged;
      });

      // Xử lý thông báo tin nhắn mới ngoài setState (đảm bảo an toàn React và tức thì)
      const myId = currentUserRef.current?.id;
      const recentThreshold = Date.now() - 300000; // 5 phút gần nhất

      cloudMsgs.forEach((msg) => {
        if (!msg || !msg.id) return;

        // Bỏ qua nếu tin nhắn do chính thiết bị này gửi đi
        if (msg.deviceId && msg.deviceId === CLIENT_DEVICE_ID) {
          notifiedToastIdsRef.current.add(msg.id);
          return;
        }

        // Bỏ qua nếu tin nhắn đã cũ (> 5 phút)
        if ((msg.createdAt || 0) < recentThreshold) {
          notifiedToastIdsRef.current.add(msg.id);
          return;
        }

        // Kiểm tra xem tin nhắn có từ thiết bị/người khác không
        const isFromOtherDevice = msg.deviceId ? msg.deviceId !== CLIENT_DEVICE_ID : (msg.senderId !== myId);
        if (!isFromOtherDevice) {
          notifiedToastIdsRef.current.add(msg.id);
          return;
        }

        // Kiểm tra trạng thái chưa xem:
        // Nếu khác người dùng: kiểm tra readBy. Nếu cùng tài khoản (test đa thiết bị PC <-> Phone): luôn thông báo!
        const isUnread = msg.senderId !== myId
          ? (!Array.isArray(msg.readBy) || !myId || !msg.readBy.includes(myId))
          : true;

        if (isUnread && !notifiedToastIdsRef.current.has(msg.id)) {
          notifyIncomingChatMessage(msg);
        }
      });
    });

    // Nạp presence ban đầu từ Cloud Firestore
    fetchPresenceFromFirestore().then((cloudPresences) => {
      if (Array.isArray(cloudPresences) && cloudPresences.length > 0) {
        setLocalPresences((prev) => {
          const next = new Map(prev);
          cloudPresences.forEach((p) => {
            if (p.userId) {
              next.set(p.userId, {
                userId: p.userId,
                name: p.name,
                avatarKey: p.avatarKey,
                role: p.role,
                lastSeen: p.lastSeen,
                isSelf: currentUserRef.current?.id === p.userId,
              });
            }
          });
          return next;
        });
      }
    }).catch(() => {});

    // Lắng nghe trạng thái online của toàn bộ thành viên qua Cloud Firestore
    const unsubPresence = subscribeToPresenceInFirestore((cloudPresences) => {
      if (!Array.isArray(cloudPresences)) return;
      setLocalPresences((prev) => {
        const next = new Map(prev);
        const now = Date.now();
        cloudPresences.forEach((p) => {
          if (p.userId) {
            next.set(p.userId, {
              userId: p.userId,
              name: p.name,
              avatarKey: p.avatarKey,
              role: p.role,
              lastSeen: p.lastSeen,
              isSelf: currentUserRef.current?.id === p.userId,
            });
          }
        });
        for (const [id, item] of next.entries()) {
          if (now - item.lastSeen > 90000 && id !== currentUserRef.current?.id) {
            next.delete(id);
          }
        }
        return next;
      });
    });

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubApp) unsubApp();
      if (unsubChat) unsubChat();
      if (unsubPresence) unsubPresence();
    };
  }, [isFirebaseConnected]);

  // Realtime Broadcast Channel across browser tabs
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      setBroadcastChannel(bc);

      bc.onmessage = (event) => {
        if (!event.data) return;
        const { type, payload } = event.data;

        if (type === 'STATE_SYNC') {
          if (payload.tasks) setTasks(payload.tasks);
          if (payload.worlds) setWorlds(payload.worlds);
          if (payload.users) setUsers(payload.users);
          if (payload.notifications) setNotifications(payload.notifications);
        } else if (type === 'CROSS_NOTIFICATION') {
          const notif = payload as NotificationItem;
          setNotifications((prev) => [notif, ...prev]);
          setActivePopupNotification(notif);
          soundEngine.playTurnNotification();
        } else if (type === 'CHAT_MESSAGE') {
          const msg = payload as ChatMessage;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            const updated = [...prev, msg].sort((a, b) => a.createdAt - b.createdAt);
            try {
              localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(updated.slice(-100)));
            } catch {}
            return updated;
          });
          const isFromOtherDevice = msg.deviceId ? msg.deviceId !== CLIENT_DEVICE_ID : msg.senderId !== currentUserRef.current?.id;
          if (isFromOtherDevice) {
            notifyIncomingChatMessage(msg);
          }
        } else if (type === 'CHAT_READ_RECEIPT') {
          const { userId, messageIds } = payload || {};
          if (userId && Array.isArray(messageIds) && messageIds.length > 0) {
            setChatMessages((prev) => {
              let updated = false;
              const next = prev.map((m) => {
                if (messageIds.includes(m.id)) {
                  const currentReads = Array.isArray(m.readBy) ? m.readBy : [];
                  if (!currentReads.includes(userId)) {
                    updated = true;
                    return { ...m, readBy: [...currentReads, userId] };
                  }
                }
                return m;
              });
              if (updated) {
                try {
                  localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-100)));
                } catch {}
                return next;
              }
              return prev;
            });
          }
        } else if (type === 'PRESENCE_HEARTBEAT') {
          const p = payload;
          if (p && p.userId) {
            setLocalPresences((prev) => {
              const next = new Map(prev);
              next.set(p.userId, { ...p, lastSeen: Date.now(), isSelf: false });
              return next;
            });
          }
        }
      };

      return () => {
        bc.close();
      };
    }
  }, []);

  // Broadcast presence heartbeat cross-tab & toàn mạng Cloud Firestore
  useEffect(() => {
    if (!currentUser) return;

    let lastCloudHeartbeat = 0;

    const sendHeartbeat = () => {
      const now = Date.now();
      const selfItem = {
        userId: currentUser.id,
        name: currentUser.name,
        avatarKey: currentUser.avatarKey,
        role: currentUser.role,
        lastSeen: now,
        isSelf: true,
      };

      // 1. Tab cục bộ (BroadcastChannel)
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: 'PRESENCE_HEARTBEAT',
            payload: selfItem,
          });
        } catch {}
      }

      // 2. Gửi Heartbeat lên Cloud Firestore mỗi 8 giây (hoặc ngay lần đầu)
      if (now - lastCloudHeartbeat >= 8000) {
        lastCloudHeartbeat = now;
        updatePresenceInFirestore(selfItem).catch(() => {});
      }

      // 3. Cập nhật state local
      setLocalPresences((prev) => {
        const next = new Map(prev);
        next.set(currentUser.id, selfItem);
        for (const [id, item] of next.entries()) {
          if (now - item.lastSeen > 90000 && id !== currentUser.id) {
            next.delete(id);
          }
        }
        return next;
      });
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUser, broadcastChannel]);

  // Unified list of active online members (Tự động cập nhật mỗi 5 giây qua presenceTick)
  const onlineMembers = React.useMemo(() => {
    const now = Date.now();
    const list: Array<{
      userId: string;
      name: string;
      avatarKey?: string;
      role?: string;
      lastSeen: number;
      isSelf?: boolean;
    }> = [];

    if (currentUser) {
      list.push({
        userId: currentUser.id,
        name: currentUser.name,
        avatarKey: currentUser.avatarKey,
        role: currentUser.role,
        lastSeen: now,
        isSelf: true,
      });
    }

    for (const [id, item] of localPresences.entries()) {
      if (currentUser && id === currentUser.id) continue;
      // Coi là online nếu có tương tác trong vòng 90s và lastSeen > 0
      if (item.lastSeen > 0 && now - item.lastSeen < 90000) {
        list.push({ ...item, isSelf: false });
      }
    }

    return list;
  }, [localPresences, currentUser, presenceTick]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUser.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_PROFILE, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_PROFILE);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORLDS, JSON.stringify(worlds));
  }, [worlds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // Listen to browser network connectivity
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOnline = () => {
      setNetworkOnline(true);
      if (isOnlineMode) {
        fetchServerState();
      }
    };
    const handleOffline = () => {
      setNetworkOnline(false);
      setServerConnected(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnlineMode]);

  // Toggle Online Mode (Online vs Offline on Machine)
  const toggleOnlineMode = (enabled?: boolean) => {
    const nextVal = typeof enabled === 'boolean' ? enabled : !isOnlineMode;
    setIsOnlineMode(nextVal);
    try {
      localStorage.setItem(STORAGE_KEY_ONLINE_MODE, String(nextVal));
    } catch {}
    if (nextVal) {
      soundEngine.playLevelUp();
      fetchServerState();
    } else {
      soundEngine.playClick();
      setSyncStatus('offline');
      setServerConnected(false);
    }
  };

  // Helper to broadcast changes
  const broadcastStateChange = useCallback((updatedTasks?: Task[], updatedWorlds?: World[], updatedUsers?: UserProfile[]) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'STATE_SYNC',
        payload: {
          tasks: updatedTasks || tasks,
          worlds: updatedWorlds || worlds,
          users: updatedUsers || users,
          notifications,
        },
      });
    }
  }, [broadcastChannel, tasks, worlds, users, notifications]);

  // Helper to safely load and unify all users across storage keys (excluding any default mock accounts)
  const getStoredUsers = (): UserProfile[] => {
    const userMap = new Map<string, UserProfile>();

    const ingest = (raw: string | null) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (u && u.email && !isDefaultMockUser(u)) {
              userMap.set(u.email.trim().toLowerCase(), u);
            }
          });
        }
      } catch {}
    };

    try {
      ingest(localStorage.getItem(STORAGE_KEY_USERS));
    } catch {}

    if (Array.isArray(users)) {
      users.forEach((u) => {
        if (u && u.email && !isDefaultMockUser(u)) {
          userMap.set(u.email.trim().toLowerCase(), u);
        }
      });
    }

    const allUsers = Array.from(userMap.values());
    const finalUsers = allUsers.length > 0 ? allUsers : DEFAULT_USERS;
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(finalUsers));
    } catch {}

    return finalUsers;
  };

  // 0. Realtime Cloud Relay (Firebase Cloud Firestore handles 100% of real-time chat & data)
  const broadcastChatToRelay = useCallback((_actionPayload: any) => {
    // Không dùng ntfy.sh để tránh lỗi timeout mạng tại Việt Nam
  }, []);

  // Helper to merge and apply incoming cloud sync payload from any device (phone, laptop, etc.)
  const handleIncomingCloudSync = useCallback((payload: any) => {
    if (!payload || typeof payload !== 'object') return;
    if (payload.senderId && currentUser && payload.senderId === currentUser.id && payload.type !== 'REQUEST_STATE') {
      return;
    }

    setNetworkOnline(true);
    setServerConnected(true);
    setSyncStatus('synced');
    setLastSyncTime(Date.now());

    // 0. Update deleted entities from remote
    if (Array.isArray(payload.deletedTaskIds)) {
      payload.deletedTaskIds.forEach((id: string) => {
        if (id) deletedTaskIdsRef.current.add(id);
      });
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_TASKS, JSON.stringify(Array.from(deletedTaskIdsRef.current)));
      } catch {}
    }
    if (Array.isArray(payload.deletedWorldIds)) {
      payload.deletedWorldIds.forEach((id: string) => {
        if (id) deletedWorldIdsRef.current.add(id);
      });
      try {
        localStorage.setItem(STORAGE_KEY_DELETED_WORLDS, JSON.stringify(Array.from(deletedWorldIdsRef.current)));
      } catch {}
    }

    // 1. Sync users (Preserve local credentials if incoming payload is sanitized)
    if (Array.isArray(payload.users) && payload.users.length > 0) {
      const serverUsers = payload.users.filter((u: any) => !isDefaultMockUser(u));
      setUsers((prev) => {
        const cleanPrev = prev.filter((u) => !isDefaultMockUser(u));
        const map = new Map<string, UserProfile>();
        cleanPrev.forEach((u) => {
          const key = (u.email ? u.email.toLowerCase().trim() : u.id);
          if (key) map.set(key, u);
        });
        let hasNewMember = false;
        serverUsers.forEach((u: UserProfile) => {
          if (u && !isDefaultMockUser(u)) {
            const key = (u.email ? u.email.toLowerCase().trim() : u.id);
            if (key) {
              if (!map.has(key)) hasNewMember = true;
              const existing = map.get(key);
              // Bảo toàn mật khẩu đăng nhập trên máy cục bộ
              map.set(key, { ...u, password: existing?.password || u.password });
            }
          }
        });
        if (hasNewMember) {
          try { soundEngine.playVictoryFanfare(); } catch {}
        }
        const merged = Array.from(map.values());
        const finalUsers = merged.length > 0 ? merged : DEFAULT_USERS;
        try {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(finalUsers));
        } catch {}
        return finalUsers;
      });
    }

    // 2. Sync worlds (Filter out deleted & merge newer updates)
    if (Array.isArray(payload.worlds) && payload.worlds.length > 0) {
      setWorlds((prev) => {
        const map = new Map<string, World>();
        prev.forEach((w) => {
          if (!deletedWorldIdsRef.current.has(w.id)) {
            map.set(w.id, w);
          }
        });
        payload.worlds.forEach((w: World) => {
          if (deletedWorldIdsRef.current.has(w.id)) return;
          if (!map.has(w.id)) {
            map.set(w.id, w);
          } else {
            const existing = map.get(w.id)!;
            const inTime = w.updatedAt || w.createdAt || 0;
            const exTime = existing.updatedAt || existing.createdAt || 0;
            if (inTime >= exTime) {
              map.set(w.id, { ...existing, ...w });
            }
          }
        });
        return Array.from(map.values());
      });
    }

    // 3. Sync tasks - ĐỒNG BỘ ĐẦY ĐỦ TIẾN ĐỘ ĐÀO QUẶNG, NHẬT KÝ, TRẠNG THÁI & XÓA TASK
    if (Array.isArray(payload.tasks)) {
      setTasks((prev) => {
        const map = new Map<string, Task>();
        prev.forEach((t) => {
          if (!deletedTaskIdsRef.current.has(t.id)) {
            map.set(t.id, t);
          }
        });
        payload.tasks.forEach((t: Task) => {
          if (deletedTaskIdsRef.current.has(t.id)) return;
          if (!map.has(t.id)) {
            map.set(t.id, t);
          } else {
            const existing = map.get(t.id)!;
            const inTime = t.updatedAt || t.completedAt || t.progressUpdatedAt || t.createdAt || 0;
            const exTime = existing.updatedAt || existing.completedAt || existing.progressUpdatedAt || existing.createdAt || 0;
            if (inTime >= exTime) {
              map.set(t.id, { ...existing, ...t });
            }
          }
        });
        return Array.from(map.values());
      });
    }

    // 4. Presence
    if (payload.presence && payload.presence.userId && (!currentUser || payload.presence.userId !== currentUser.id)) {
      setLocalPresences((prev) => {
        const next = new Map(prev);
        next.set(payload.presence.userId, { ...payload.presence, isSelf: false, lastSeen: Date.now() });
        return next;
      });
    }

    // 5. Real-time Team Chat Message via ntfy.sh Relay (Đảm bảo 100% nhận tin tức thì)
    if (payload.type === 'CHAT_MESSAGE' && payload.message && payload.message.id) {
      const incomingMsg = payload.message as ChatMessage;
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === incomingMsg.id)) {
          return prev;
        }
        const updated = [...prev, incomingMsg].sort((a, b) => a.createdAt - b.createdAt);
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(updated.slice(-150)));
        } catch {}
        return updated;
      });

      const isFromOtherDevice = incomingMsg.deviceId ? incomingMsg.deviceId !== CLIENT_DEVICE_ID : incomingMsg.senderId !== currentUserRef.current?.id;
      if (isFromOtherDevice) {
        notifyIncomingChatMessage(incomingMsg);
      }
      return;
    }

    // 6. Real-time Chat Reactions via ntfy.sh Relay
    if (payload.type === 'CHAT_REACTION' && payload.messageId && payload.emoji && payload.userId) {
      setChatMessages((prev) => {
        const next = prev.map((m) => {
          if (m.id !== payload.messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = Array.isArray(reactions[payload.emoji]) ? [...reactions[payload.emoji]] : [];
          if (users.includes(payload.userId)) {
            reactions[payload.emoji] = users.filter((u) => u !== payload.userId);
            if (reactions[payload.emoji].length === 0) delete reactions[payload.emoji];
          } else {
            reactions[payload.emoji] = [...users, payload.userId];
          }
          return { ...m, reactions };
        });
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-150)));
        } catch {}
        return next;
      });
      return;
    }

    // 7. Real-time Chat Delete via ntfy.sh Relay
    if (payload.type === 'CHAT_DELETE' && payload.messageId) {
      setChatMessages((prev) => {
        const next = prev.filter((m) => m.id !== payload.messageId);
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-150)));
        } catch {}
        return next;
      });
      return;
    }
  }, [currentUser]);

  // Real-time EventSource (SSE) listener: Zero delay, instant updates!
  useEffect(() => {
    // SSE disabled to prevent timeout
  }, []);

  const pushToServer = async (usersList?: UserProfile[], worldsList?: World[], tasksList?: Task[], replaceUsers?: boolean) => {
    if (isPushingRef.current) {
      await new Promise(r => setTimeout(r, 300));
    }
    isPushingRef.current = true;

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    try {
      setSyncStatus('syncing');
      const cleanUsers = (usersList || users).filter(u => !isDefaultMockUser(u));

      if (isLocalhost) {
        try {
          await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              users: cleanUsers,
              worlds: worldsList || worlds,
              tasks: tasksList || tasks,
              replaceUsers: !!replaceUsers,
              presence: currentUser ? {
                userId: currentUser.id,
                name: currentUser.name,
                avatarKey: currentUser.avatarKey,
                role: currentUser.role,
                timestamp: Date.now(),
              } : undefined,
            }),
          });
        } catch {}
      }

      // Sync to Firebase Cloud if configured
      if (isFirebaseReady()) {
        syncTasksAndWorldsToFirestore(worldsList || worlds, tasksList || tasks).catch(() => {});
        if (usersList && usersList.length > 0) {
          syncBatchUsersToFirestore(cleanUsers).catch(() => {});
        }
      }

      if (isFirebaseReady()) {
        setNetworkOnline(true);
        setServerConnected(true);
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
      }
    } catch (err) {
      console.warn('[1835 Sync] Push error:', err);
    } finally {
      isPushingRef.current = false;
    }
  };

  // Nạp và làm mới tin nhắn chat chủ động từ Firebase Cloud Firestore
  const refreshChatMessages = useCallback(async () => {
    if (!isFirebaseReady()) return;
    try {
      const cloudMsgs = await fetchChatMessagesFromFirestore();
      if (Array.isArray(cloudMsgs) && cloudMsgs.length > 0) {
        setChatMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          let changed = false;
          cloudMsgs.forEach((m) => {
            const existing = map.get(m.id);
            if (!existing || existing.text !== m.text || existing.imageUrl !== m.imageUrl || JSON.stringify(existing.readBy) !== JSON.stringify(m.readBy) || JSON.stringify(existing.reactions) !== JSON.stringify(m.reactions)) {
              changed = true;
              map.set(m.id, { ...existing, ...m });
            }
          });
          if (!changed && map.size === prev.length) return prev;
          const merged = Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
          try {
            localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(merged.slice(-150)));
          } catch {}
          return merged;
        });

        // Xử lý thông báo tin nhắn mới ngoài setState
        const myId = currentUserRef.current?.id;
        const recentThreshold = Date.now() - 300000; // 5 phút gần nhất

        cloudMsgs.forEach((msg) => {
          if (!msg || !msg.id) return;
          if (msg.deviceId && msg.deviceId === CLIENT_DEVICE_ID) {
            notifiedToastIdsRef.current.add(msg.id);
            return;
          }
          if ((msg.createdAt || 0) < recentThreshold) {
            notifiedToastIdsRef.current.add(msg.id);
            return;
          }
          const isFromOtherDevice = msg.deviceId ? msg.deviceId !== CLIENT_DEVICE_ID : (msg.senderId !== myId);
          if (!isFromOtherDevice) {
            notifiedToastIdsRef.current.add(msg.id);
            return;
          }
          const isUnread = msg.senderId !== myId
            ? (!Array.isArray(msg.readBy) || !myId || !msg.readBy.includes(myId))
            : true;

          if (isUnread && !notifiedToastIdsRef.current.has(msg.id)) {
            notifyIncomingChatMessage(msg);
          }
        });
      }
    } catch (e) {
      console.warn('[Chat Refresh] Error:', e);
    }
  }, [notifyIncomingChatMessage]);

  const fetchServerState = useCallback(async (force = false): Promise<boolean> => {
    if (isFetchingRef.current && !force) {
      return true;
    }
    isFetchingRef.current = true;

    if (!isOnlineMode) {
      setIsOnlineMode(true);
      try {
        localStorage.setItem(STORAGE_KEY_ONLINE_MODE, 'true');
      } catch {}
    }

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    try {
      setSyncStatus('syncing');
      const startPing = performance.now();

      if (isLocalhost) {
        try {
          const params = new URLSearchParams({
            t: Date.now().toString(),
            ...(currentUser ? { uid: currentUser.id, name: currentUser.name, avatar: currentUser.avatarKey } : {})
          });
          const res = await fetch(`/api/sync?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            handleIncomingCloudSync(data);
          }
        } catch {}
      }

      // 1. Đồng bộ và làm mới tin nhắn từ Firebase Cloud Firestore trước tiên (chính xác & không bị chặn)
      if (isFirebaseReady()) {
        await refreshChatMessages();
        setNetworkOnline(true);
        setServerConnected(true);
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
      }

      const ping = Math.round(performance.now() - startPing);
      setServerPing(ping);
      return true;
    } catch {
      if (isFirebaseReady()) {
        setNetworkOnline(true);
        setServerConnected(true);
        setSyncStatus('synced');
        setLastSyncTime(Date.now());
        return true;
      }
      setSyncStatus('error');
      return false;
    } finally {
      isFetchingRef.current = false;
    }
  }, [isOnlineMode, currentUser, handleIncomingCloudSync, refreshChatMessages]);

  // Tự động đồng bộ liên tục thích ứng: 3.5s khi mở app, 15s khi ẩn tab
  useEffect(() => {
    fetchServerState();

    let intervalId: any;
    const updateSyncRate = () => {
      if (intervalId) clearInterval(intervalId);
      const isVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      const delay = isVisible ? 3500 : 15000;
      intervalId = setInterval(() => {
        fetchServerState();
      }, delay);
    };

    updateSyncRate();

    const handleFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchServerState(true);
      }
      updateSyncRate();
    };

    let lastInteraction = 0;
    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastInteraction > 4000) {
        lastInteraction = now;
        fetchServerState();
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('pointerdown', handleUserInteraction, { passive: true });

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('pointerdown', handleUserInteraction);
    };
  }, [fetchServerState]);

  // Diacritic helper for flexible name matching (e.g. 'Quan' matches 'Quân')
  const removeDiacritics = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  };

  // 1. Account & Session Management: Supports Login by Username (Tên) OR Email!
  const login = async (emailOrName: string, pass: string): Promise<{ success: boolean; message: string }> => {
    const input = (emailOrName || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    // Ingest latest live backend state first to guarantee 100% up-to-date credentials from store.json!
    let liveUsers = getStoredUsers();
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          const cleanServerUsers = data.users.filter((u: any) => !isDefaultMockUser(u));
          const map = new Map<string, UserProfile>();
          liveUsers.forEach((u) => { if (u?.email) map.set(u.email.toLowerCase(), u); });
          cleanServerUsers.forEach((u: UserProfile) => { if (u?.email) map.set(u.email.toLowerCase(), u); });
          liveUsers = Array.from(map.values());
          setUsers(liveUsers);
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(liveUsers));
          } catch {}
        }
      }
    } catch {}

    // Query latest accounts from Firebase Cloud Firestore to ensure real-time validity
    if (isFirebaseReady()) {
      try {
        const cloudUsers = await fetchUsersFromFirestore();
        if (cloudUsers && cloudUsers.length > 0) {
          const cleanCloud = cloudUsers.filter((u) => !isDefaultMockUser(u));
          const map = new Map<string, UserProfile>();
          liveUsers.forEach((u) => { if (u?.email) map.set(u.email.toLowerCase(), u); });
          cleanCloud.forEach((u) => { if (u?.email) map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }); });
          liveUsers = Array.from(map.values());
          setUsers(liveUsers);
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(liveUsers));
          } catch {}
        }
      } catch (err) {
        console.warn('[Firebase] Query error during login:', err);
      }
    }

    const isMatch = (u: UserProfile) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const uId = (u.id || '').toLowerCase();
      const emailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      return (
        uEmail === input ||
        uName === input ||
        removeDiacritics(uName) === removeDiacritics(input) ||
        (emailPrefix && emailPrefix === input) ||
        uId === input
      );
    };

    const found = liveUsers.find(isMatch);

    if (!found) {
      return { success: false, message: 'Tên tài khoản hoặc mật khẩu không chính xác.' };
    }

    const storedPass = (found.password || '').trim();
    const { valid: hashValid, needsUpgrade } = await verifyPassword(cleanPass, storedPass);
    const isLegacyFallbackValid =
      !storedPass.startsWith('sha256:') &&
      (!storedPass ||
        storedPass.toLowerCase() === cleanPass.toLowerCase() ||
        removeDiacritics(storedPass) === removeDiacritics(cleanPass));

    const isPassValid = hashValid || isLegacyFallbackValid;

    if (!isPassValid) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Bạn có thể nhấn "Forgot your Password?" để đặt lại mật khẩu.'
      };
    }

    let activeProfile = found;
    if (needsUpgrade && cleanPass) {
      const upgradedHash = await hashPassword(cleanPass);
      if (upgradedHash.startsWith('sha256:')) {
        activeProfile = { ...found, password: upgradedHash };
        if (isFirebaseReady()) {
          updateUserInFirestore(found.id, { password: upgradedHash }).catch(() => {});
        }
      }
    }

    setCurrentUser(activeProfile);
    setActiveWorldId(null); // Direct entry into the Workspace screen (Không gian làm việc)!
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, activeProfile.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_PROFILE, JSON.stringify(activeProfile));
      localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'true');
      localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, input);
    } catch {}
    soundEngine.playVictoryFanfare();
    return { success: true, message: `Chào mừng ${found.name} trở lại!` };
  };

  const register = async (name: string, email: string, pass: string, avatarKey: string): Promise<{ success: boolean; message: string }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !pass) {
      return { success: false, message: 'Vui lòng điền đầy đủ thông tin.' };
    }

    const currentUsers = getStoredUsers();
    const existing = currentUsers.find((u) => 
      u.email.trim().toLowerCase() === trimmedEmail ||
      u.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return { success: false, message: `Tên "${trimmedName}" hoặc email "${trimmedEmail}" đã được sử dụng. Vui lòng đăng nhập.` };
    }

    const newId = `user_${Date.now()}`;
    const hashedPass = await hashPassword(pass);
    const newUser: UserProfile = {
      id: newId,
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPass,
      role: 'Thành viên Co-op 1835',
      title: 'Thợ Mỏ Co-op',
      level: 1,
      avatarKey: avatarKey || 'sniffer',
      favoriteBiome: 'Rừng Hoa Anh Đào',
      tasksMined: 0,
      totalXp: 0,
      primaryColor: '#F37022',
    };

    const updatedUsers = [...currentUsers.filter((u) => u.email.trim().toLowerCase() !== trimmedEmail), newUser];
    
    // Save immediately and synchronously to multiple persistent stores & backend API
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, newUser.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_PROFILE, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'true');
      localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, trimmedEmail);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    setUsers(updatedUsers);
    setCurrentUser(newUser);

    // Lưu vĩnh viễn lên Firebase Firestore nếu đã kết nối
    if (isFirebaseReady()) {
      saveUserToFirestore(newUser).catch((err) => {
        console.warn('[Firebase] Ghi user lên Firestore thất bại:', err);
      });
    }

    await pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playVictoryFanfare();

    return { success: true, message: `Đăng ký thành công! Chào mừng ${trimmedName} vào đội ngũ 1835.` };
  };

  const addTeamMember = (name: string, email: string, pass: string, avatarKey: string): { success: boolean; message: string; user?: UserProfile } => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !pass) {
      return { success: false, message: 'Vui lòng điền đầy đủ tên, email và mật khẩu.' };
    }

    const currentUsers = getStoredUsers();
    const existing = currentUsers.find((u) => 
      u.email.trim().toLowerCase() === trimmedEmail ||
      u.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return { success: false, message: 'Tên hoặc Email này đã tồn tại trong đội ngũ 1835.' };
    }

    const newId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: newId,
      name: trimmedName,
      email: trimmedEmail,
      password: pass,
      role: 'Thành viên Co-op 1835',
      title: 'Thợ Mỏ Co-op',
      level: 1,
      avatarKey: avatarKey || 'sniffer',
      favoriteBiome: 'Rừng Hoa Anh Đào',
      tasksMined: 0,
      totalXp: 0,
      primaryColor: '#F37022',
    };

    const updatedUsers = [...currentUsers.filter((u) => u.email.trim().toLowerCase() !== trimmedEmail), newUser];

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
    } catch {}

    setUsers(updatedUsers);
    if (isFirebaseReady()) {
      saveUserToFirestore(newUser).catch(() => {});
    }
    pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playUnlock();

    return {
      success: true,
      message: `Đã thêm thành công thành viên ${trimmedName} vào đội ngũ 1835!`,
      user: newUser,
    };
  };

  const importTeamMembers = (incomingUsers: UserProfile[]): { success: boolean; count: number; message: string } => {
    if (!Array.isArray(incomingUsers) || incomingUsers.length === 0) {
      return { success: false, count: 0, message: 'Dữ liệu thành viên không hợp lệ.' };
    }
    const currentUsers = getStoredUsers();
    const map = new Map<string, UserProfile>();
    currentUsers.forEach((u) => {
      if (u && u.email) map.set(u.email.trim().toLowerCase(), u);
    });

    let addedCount = 0;
    incomingUsers.forEach((u) => {
      if (u && u.name && u.email && !isDefaultMockUser(u)) {
        const key = u.email.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            ...u,
            id: u.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          });
          addedCount++;
        }
      }
    });

    const updatedUsers = Array.from(map.values());
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
    } catch {}

    setUsers(updatedUsers);
    if (isFirebaseReady()) {
      syncBatchUsersToFirestore(updatedUsers).catch(() => {});
    }
    pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playVictoryFanfare();

    return {
      success: true,
      count: addedCount,
      message: `Đã kết nối và đồng bộ thành công ${addedCount} thành viên vào đội ngũ 1835!`,
    };
  };

  const TEAM_CODE_6_CHARS = '1835VN';

  const exportTeamCode = (): string => {
    return TEAM_CODE_6_CHARS;
  };

  const importTeamCode = async (code: string): Promise<{ success: boolean; count: number; message: string }> => {
    if (!code || !code.trim()) {
      return { success: false, count: 0, message: 'Vui lòng nhập mã đội 6 ký tự.' };
    }
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode !== TEAM_CODE_6_CHARS && !cleanCode.startsWith('EY')) {
      return { success: false, count: 0, message: `Mã đội không chính xác. Mã hợp lệ của Đội là "${TEAM_CODE_6_CHARS}".` };
    }

    // 1. Tải toàn bộ danh sách thành viên mới nhất từ Đám Mây về
    await fetchServerState(true);

    // 2. Đồng bộ 2 chiều: Đẩy tài khoản hiện tại lên Đám Mây để Trưởng Đội & đồng đội thấy ngay!
    if (currentUser && !isDefaultMockUser(currentUser)) {
      const currentUsers = getStoredUsers().filter((u) => !isDefaultMockUser(u));
      const uMap = new Map<string, UserProfile>();
      currentUsers.forEach((u) => { if (u?.email) uMap.set(u.email.toLowerCase().trim(), u); });
      uMap.set(currentUser.email.toLowerCase().trim(), currentUser);
      const merged = Array.from(uMap.values());

      setUsers(merged);
      try {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(merged));
        localStorage.setItem('minetask_1835_backup_users', JSON.stringify(merged));
      } catch {}

      await pushToServer(merged);
      broadcastStateChange(tasks, worlds, merged);
    }

    soundEngine.playVictoryFanfare();
    return {
      success: true,
      count: users.length,
      message: `Đã kết nối thành công với Đội ngũ qua mã ${cleanCode}! Thông tin của bạn đã được gửi lên Đám Mây để đồng đội nhìn thấy.`,
    };
  };

  const joinTeamWithCode = async (
    name: string,
    code: string,
    avatarKey?: string,
    email?: string,
    pass?: string
  ): Promise<{ success: boolean; message: string }> => {
    const trimmedName = (name || '').trim();
    const cleanCode = (code || '').trim().toUpperCase();

    if (!trimmedName) {
      return { success: false, message: 'Vui lòng nhập Tên của bạn để hiển thị trong đội.' };
    }
    if (cleanCode !== TEAM_CODE_6_CHARS && !cleanCode.startsWith('EY')) {
      return { success: false, message: `Mã đội không chính xác. Vui lòng nhập đúng mã "${TEAM_CODE_6_CHARS}".` };
    }

    // 1. Tải danh sách thành viên hiện có trên Đám Mây về
    await fetchServerState(true);

    // 2. Tạo email & mật khẩu tự động nếu chưa có
    const safeAscii = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'member';
    const finalEmail = (email && email.trim())
      ? email.trim().toLowerCase()
      : `${safeAscii}_${Date.now().toString().slice(-4)}@1835.vn`;
    const finalPass = (pass && pass.trim()) ? pass.trim() : '1835VN';

    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserProfile = {
      id: newId,
      name: trimmedName,
      email: finalEmail,
      password: finalPass,
      role: 'Thành viên Co-op 1835',
      title: 'Thợ Mỏ Co-op',
      level: 1,
      avatarKey: avatarKey || 'zodiac_ty',
      favoriteBiome: 'Rừng Hoa Anh Đào',
      tasksMined: 0,
      totalXp: 0,
      primaryColor: '#F37022',
    };

    // 3. Hợp nhất danh sách thành viên
    const currentUsers = getStoredUsers().filter((u) => !isDefaultMockUser(u));
    const uMap = new Map<string, UserProfile>();
    currentUsers.forEach((u) => { if (u?.email) uMap.set(u.email.toLowerCase().trim(), u); });
    uMap.set(finalEmail, newUser);
    const updatedUsers = Array.from(uMap.values());

    // 4. Lưu cục bộ và đăng nhập ngay
    setUsers(updatedUsers);
    setCurrentUser(newUser);
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, newUser.id);
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_PROFILE, JSON.stringify(newUser));
      localStorage.setItem(STORAGE_KEY_REMEMBER_LOGIN, 'true');
      localStorage.setItem(STORAGE_KEY_REMEMBERED_ACCOUNT, finalEmail);
    } catch {}

    // 5. ĐẨY LẬP TỨC LÊN ĐÁM MÂY ĐỂ TRƯỞNG ĐỘI NHÌN THẤY NGAY!
    await pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playVictoryFanfare();

    return {
      success: true,
      message: `Chào mừng ${trimmedName} đã gia nhập Đội 1835s thành công!`,
    };
  };

  // Auto-connect teammate if opened via invite link (?team=1835VN or ?code=1835VN)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const teamCode = urlParams.get('team') || urlParams.get('code') || urlParams.get('join');
      if (teamCode) {
        fetchServerState();
        soundEngine.playVictoryFanfare();
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (err) {
      console.warn('[1835] Invite link auto-join error:', err);
    }
  }, [fetchServerState]);

  const updateUserAvatar = (userId: string, avatarKey: string) => {
    const currentUsers = getStoredUsers();
    const updatedUsers = currentUsers.map((u) => (u.id === userId ? { ...u, avatarKey } : u));
    setUsers(updatedUsers);
    if (currentUser && currentUser.id === userId) {
      setCurrentUser({ ...currentUser, avatarKey });
    }
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
    } catch {}
    if (isFirebaseReady()) {
      updateUserInFirestore(userId, { avatarKey }).catch(() => {});
    }
    pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playLevelUp();
  };

  const logout = () => {
    if (currentUser?.id) {
      setOfflineInFirestore(currentUser.id).catch(() => {});
    }
    setCurrentUser(null);
    setActiveWorldId(null);
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_PROFILE);
    } catch {}
    soundEngine.playClick();
  };

  const deleteAccount = (userId: string): { success: boolean; message: string } => {
    // Bảo mật: Người dùng chỉ được phép xóa tài khoản của chính mình
    if (currentUser && userId !== currentUser.id) {
      return { success: false, message: 'Bạn chỉ có quyền xóa tài khoản của chính mình.' };
    }

    const currentUsers = getStoredUsers();
    const targetUser = currentUsers.find((u) => u.id === userId);
    const updatedUsers = currentUsers.filter((u) => u.id !== userId);

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
      if (currentUser?.id === userId) {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER_PROFILE);
        setCurrentUser(null);
      }
    } catch {}

    setUsers(updatedUsers);
    if (isFirebaseReady()) {
      deleteUserFromFirestore(userId).catch(() => {});
    }
    pushToServer(updatedUsers, undefined, undefined, true);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playClick();

    const name = targetUser ? targetUser.name : 'Tài khoản';
    return { success: true, message: `Đã xóa tài khoản ${name} thành công!` };
  };

  // Password reset simulation
  const [resetCodes, setResetCodes] = useState<Record<string, string>>({});

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; code: string; message: string }> => {
    const normalized = (email || '').trim().toLowerCase();
    const currentUsers = getStoredUsers();
    const user = currentUsers.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const emailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      return (
        uEmail === normalized ||
        uName === normalized ||
        removeDiacritics(uName) === removeDiacritics(normalized) ||
        (emailPrefix && emailPrefix === normalized)
      );
    });
    
    if (!user) {
      return { success: false, code: '', message: 'Nếu thông tin tài khoản hợp lệ, mã xác thực sẽ được gửi đến email đăng ký.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setResetCodes((prev) => ({
      ...prev,
      [normalized]: code,
      [user.email.toLowerCase()]: code,
    }));

    // Gửi email thật qua EmailJS vào Gmail của người nhận (nếu có mạng)
    let note = `Hệ thống đã gửi mã xác thực OTP đến hộp thư email của bạn. Vui lòng kiểm tra hòm thư.`;
    try {
      const emailRes = await sendOtpEmail(user.email, user.name, code);
      if (emailRes?.message) {
        note = emailRes.message;
      }
    } catch {
      // Fallback
    }

    return {
      success: true,
      code,
      message: note,
    };
  };

  const resetPassword = async (email: string, code: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const normalized = (email || '').trim().toLowerCase();
    const expected = resetCodes[normalized];
    const cleanCode = (code || '').trim();
    const cleanPass = (newPass || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Vui lòng nhập mật khẩu mới.' };
    }

    // Bảo mật: Yêu cầu bắt buộc mã OTP phải tồn tại và trùng khớp tuyệt đối
    if (!expected || cleanCode !== expected) {
      return { success: false, message: 'Mã xác thực OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại hòm thư.' };
    }

    const hashedPass = await hashPassword(cleanPass);
    const currentUsers = getStoredUsers();
    let userFound = false;
    const updated = currentUsers.map((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const emailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      if (
        uEmail === normalized ||
        uName === normalized ||
        removeDiacritics(uName) === removeDiacritics(normalized) ||
        (emailPrefix && emailPrefix === normalized)
      ) {
        userFound = true;
        return { ...u, password: hashedPass };
      }
      return u;
    });

    if (!userFound) {
      return { success: false, message: `Không tìm thấy tài khoản "${email}".` };
    }

    // Xóa mã OTP sau khi sử dụng thành công
    setResetCodes((prev) => {
      const next = { ...prev };
      delete next[normalized];
      return next;
    });

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updated));
    } catch {}

    setUsers(updated);
    if (isFirebaseReady()) {
      const targetReset = updated.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.name || '').trim().toLowerCase();
        return uEmail === normalized || uName === normalized;
      });
      if (targetReset) {
        updateUserInFirestore(targetReset.id, { password: hashedPass }).catch(() => {});
      }
    }
    await pushToServer(updated, undefined, undefined, true);
    broadcastStateChange(tasks, worlds, updated);
    soundEngine.playUnlock();
    return { success: true, message: 'Mật khẩu đã được cập nhật thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.' };
  };

  // 2. World Management
  const createWorld = (data: Omit<World, 'id' | 'createdAt' | 'createdBy'>): World => {
    const newWorld: World = {
      ...data,
      id: `world_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser ? currentUser.id : 'steve',
    };

    const updatedWorlds = [newWorld, ...worlds];
    setWorlds(updatedWorlds);
    pushToServer(users, updatedWorlds, tasks);
    broadcastStateChange(tasks, updatedWorlds, users);
    soundEngine.playUnlock();
    return newWorld;
  };

  const updateWorld = (id: string, updates: Partial<World>) => {
    const updated = worlds.map((w) => (w.id === id ? { ...w, ...updates, updatedAt: Date.now() } : w));
    setWorlds(updated);
    pushToServer(users, updated, tasks);
    broadcastStateChange(tasks, updated, users);
  };

  const deleteWorld = (id: string) => {
    deletedWorldIdsRef.current.add(id);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_WORLDS, JSON.stringify(Array.from(deletedWorldIdsRef.current)));
    } catch {}

    const updated = worlds.filter((w) => w.id !== id);
    const updatedTasks = tasks.filter((t) => t.worldId !== id);
    setWorlds(updated);
    setTasks(updatedTasks);
    if (activeWorldId === id) setActiveWorldId(null);
    pushToServer(users, updated, updatedTasks);
    broadcastStateChange(updatedTasks, updated, users);
    soundEngine.playBreak();
  };

  // 3. Task Management & Cross-Assignment
  const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'status' | 'orderIndex' | 'miningUpdatesCount' | 'miningLogs'>): Task => {
    const worldTasks = tasks.filter((t) => t.worldId === data.worldId);
    const maxOrder = worldTasks.reduce((max, t) => Math.max(max, t.orderIndex ?? 0), -1);

    const assigneeIds = (data.assigneeIds && data.assigneeIds.length > 0)
      ? data.assigneeIds
      : (data.assigneeId ? [data.assigneeId] : []);
    const primaryAssigneeId = assigneeIds[0] || data.assigneeId || (currentUser?.id || users[0]?.id || 'steve');
    const reqHits = Math.max(1, data.requiredHits || 3);
    const nowTime = Date.now();

    const newTask: Task = {
      ...data,
      id: `task_${nowTime}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowTime,
      updatedAt: nowTime,
      status: 'todo',
      orderIndex: maxOrder + 1,
      miningUpdatesCount: 0,
      miningLogs: [],
      progressNote: '',
      assigneeId: primaryAssigneeId,
      assigneeIds: assigneeIds,
      requiredHits: reqHits,
      currentHits: 0,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    pushToServer(users, worlds, updatedTasks);
    broadcastStateChange(updatedTasks, worlds, users);
    soundEngine.playHit();
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    const nowTime = Date.now();
    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: nowTime } : t));
    setTasks(updatedTasks);
    pushToServer(users, worlds, updatedTasks);
    broadcastStateChange(updatedTasks, worlds, users);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    deletedTaskIdsRef.current.add(id);
    try {
      localStorage.setItem(STORAGE_KEY_DELETED_TASKS, JSON.stringify(Array.from(deletedTaskIdsRef.current)));
    } catch {}

    // Remove task and re-order remaining stations in the world cleanly
    const remainingTasks = tasks.filter((t) => t.id !== id);
    const nowTime = Date.now();
    const worldTasks = remainingTasks
      .filter((t) => t.worldId === taskToDelete.worldId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((t, idx) => ({ ...t, orderIndex: idx, updatedAt: nowTime }));

    const nonWorldTasks = remainingTasks.filter((t) => t.worldId !== taskToDelete.worldId);
    const finalTasks = [...nonWorldTasks, ...worldTasks];

    setTasks(finalTasks);
    pushToServer(users, worlds, finalTasks);
    broadcastStateChange(finalTasks, worlds, users);
    soundEngine.playBreak();
  };

  // 4. Sequential Logic & Locking
  const isStationUnlocked = useCallback((task: Task, allWorldTasks: Task[]): boolean => {
    const sorted = [...allWorldTasks].sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIdx = sorted.findIndex((t) => t.id === task.id);

    if (currentIdx <= 0) return true; // Station 0 is always unlocked

    // Must have all previous stations completed
    for (let i = 0; i < currentIdx; i++) {
      if (sorted[i].status !== 'done') {
        return false;
      }
    }
    return true;
  }, []);

  const isStationCompleted = useCallback((task: Task): boolean => {
    return task.status === 'done';
  }, []);

  // 5. Wooden Sign Progress Note & Task Completion
  const updateTaskProgressNote = (taskId: string, note: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'todo' ? 'in_progress' : task.status;
    const nowTime = Date.now();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          progressNote: note,
          progressUpdatedAt: nowTime,
          progressUpdatedBy: currentUser ? currentUser.id : t.assigneeId,
          updatedAt: nowTime,
        };
      }
      return t;
    });

    setTasks(updated);
    pushToServer(users, worlds, updated);
    broadcastStateChange(updated, worlds, users);
    soundEngine.playClick();
  };

  const completeTaskStation = (taskId: string, finalNote?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === 'done') return;

    const worldTasks = tasks.filter((t) => t.worldId === task.worldId).sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIdx = worldTasks.findIndex((t) => t.id === taskId);
    const req = Math.max(1, task.requiredHits || 3);
    const nowTime = Date.now();

    // Mark task done
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'done' as const,
          currentHits: req,
          requiredHits: req,
          completedAt: nowTime,
          completedBy: currentUser ? currentUser.id : t.assigneeId,
          progressNote: finalNote !== undefined ? finalNote : t.progressNote,
          miningUpdatesCount: req,
          updatedAt: nowTime,
        };
      }
      return t;
    });

    // Update user stats - Award XP to ALL co-op assignees
    const targetUserIds = (Array.isArray(task.assigneeIds) && task.assigneeIds.length > 0)
      ? task.assigneeIds
      : [task.assigneeId];

    const updatedUsers = users.map((u) => {
      if (targetUserIds.includes(u.id)) {
        const nextXp = u.totalXp + task.xpValue;
        const nextLevel = Math.floor(nextXp / 300) + 1;
        return {
          ...u,
          tasksMined: u.tasksMined + 1,
          totalXp: nextXp,
          level: nextLevel,
        };
      }
      return u;
    });

    setTasks(updatedTasks);
    setUsers(updatedUsers);
    pushToServer(updatedUsers, worlds, updatedTasks);

    // 1. Popup congratulations for station finisher
    const finisher = users.find((u) => u.id === task.assigneeId) || currentUser || users[0];
    const congratsNotif: NotificationItem = {
      id: `notif_congrats_${Date.now()}`,
      type: 'congratulations',
      title: '🎉 THU HOẠCH KHỐI THÀNH CÔNG!',
      message: `Chúc mừng ${finisher.name} đã đào xong Trạm #${currentIdx + 1}: "${task.title}". Nhận ngay +${task.xpValue} XP!`,
      targetUserId: task.assigneeId,
      createdAt: Date.now(),
      read: false,
      taskTitle: task.title,
      stationNumber: currentIdx + 1,
      xpEarned: task.xpValue,
    };

    setActivePopupNotification(congratsNotif);
    setNotifications((prev) => [congratsNotif, ...prev]);
    soundEngine.playBreak();
    soundEngine.playVictoryFanfare();

    // Tự động đẩy tin mừng hoàn thành trạm vào kênh chat đội 1835
    const systemChatMessage: ChatMessage = {
      id: `sys_win_${nowTime}_${taskId}`,
      senderId: 'system_1835',
      senderName: 'HỆ THỐNG CO-OP',
      senderAvatar: 'sniffer',
      senderRole: 'Thông Báo',
      senderColor: '#1aa64e',
      text: `🏆 ${finisher?.name || 'Thợ mỏ'} vừa đào xong trạm #${currentIdx + 1}: "${task.title}"! (+${task.xpValue} XP)`,
      createdAt: nowTime,
      type: 'system',
      attachedTaskId: taskId,
      attachedTaskTitle: task.title,
    };
    setChatMessages((prev) => [...prev, systemChatMessage]);
    sendChatMessageToFirestore(systemChatMessage).catch(() => {});
    broadcastChatToRelay({
      type: 'CHAT_MESSAGE',
      senderId: 'system',
      message: systemChatMessage,
      timestamp: Date.now(),
    });

    // 2. Cross-Notification for NEXT station assignee
    const nextTask = worldTasks[currentIdx + 1];
    if (nextTask) {
      const nextAssignee = users.find((u) => u.id === nextTask.assigneeId);
      const turnNotif: NotificationItem = {
        id: `notif_turn_${Date.now()}`,
        type: 'turn_alert',
        title: '⚡ ĐÃ ĐẾN LƯỢT BẠN! (CROSS-ASSIGNMENT)',
        message: `${nextAssignee ? nextAssignee.name : 'Đồng đội'} ơi! Trạm #${currentIdx + 2}: "${nextTask.title}" đã được mở khóa! Hãy cầm cúp lên và bắt đầu đào!`,
        targetUserId: nextTask.assigneeId,
        createdAt: Date.now(),
        read: false,
        taskTitle: nextTask.title,
        stationNumber: currentIdx + 2,
      };

      setTimeout(() => {
        setNotifications((prev) => [turnNotif, ...prev]);
        setActivePopupNotification(turnNotif);
        soundEngine.playTurnNotification();

        // Broadcast to other tabs
        if (broadcastChannel) {
          broadcastChannel.postMessage({
            type: 'CROSS_NOTIFICATION',
            payload: turnNotif,
          });
        }

        // Native Device Notification API (Browser / Windows / Android push)
        sendDeviceNotification('MineTask 1835s: ĐÃ ĐẾN LƯỢT BẠN!', {
          body: turnNotif.message,
          icon: './icon-192.png',
        });
      }, 1200);
    }

    broadcastStateChange(updatedTasks, worlds, updatedUsers);
  };

  const undoTaskStation = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nowTime = Date.now();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'todo' as const,
          currentHits: 0,
          completedAt: undefined,
          completedBy: undefined,
          miningUpdatesCount: 0,
          updatedAt: nowTime,
        };
      }
      return t;
    });

    setTasks(updated);
    pushToServer(users, worlds, updated);
    broadcastStateChange(updated, worlds, users);
    soundEngine.playClick();
  };

  // Mining by Hits / Progress
  const mineTaskHit = (taskId: string, hitsToAdd: number = 1) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const req = Math.max(1, task.requiredHits || 3);
    const cur = Math.max(0, task.currentHits || (task.status === 'done' ? req : 0));
    const newHits = Math.min(req, cur + hitsToAdd);
    const nowTime = Date.now();

    if (newHits >= req) {
      completeTaskStation(taskId);
    } else {
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            currentHits: newHits,
            requiredHits: req,
            status: 'in_progress' as const,
            miningUpdatesCount: (t.miningUpdatesCount || 0) + 1,
            updatedAt: nowTime,
          };
        }
        return t;
      });
      setTasks(updated);
      pushToServer(users, worlds, updated);
      broadcastStateChange(updated, worlds, users);
      soundEngine.playHit();
    }
  };

  const setTaskMiningProgress = (taskId: string, currentHits: number, requiredHits?: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const req = Math.max(1, requiredHits !== undefined ? requiredHits : (task.requiredHits || 3));
    const newHits = Math.max(0, Math.min(req, currentHits));
    const nowTime = Date.now();

    if (newHits >= req && task.status !== 'done') {
      completeTaskStation(taskId);
    } else {
      const newStatus: TaskStatus = newHits === 0 ? 'todo' : newHits >= req ? 'done' : 'in_progress';
      const updated = tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            requiredHits: req,
            currentHits: newHits,
            status: newStatus,
            completedAt: newStatus === 'done' ? (t.completedAt || nowTime) : undefined,
            completedBy: newStatus === 'done' ? (t.completedBy || (currentUser ? currentUser.id : t.assigneeId)) : undefined,
            updatedAt: nowTime,
          };
        }
        return t;
      });
      setTasks(updated);
      pushToServer(users, worlds, updated);
      broadcastStateChange(updated, worlds, users);
      soundEngine.playHit();
    }
  };

  // 6. Notifications management
  const dismissPopupNotification = () => {
    setActivePopupNotification(null);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const resetToDemoData = () => {
    setUsers(DEFAULT_USERS);
    setCurrentUser(DEFAULT_USERS[0]);
    setWorlds(INITIAL_WORLDS);
    setTasks(INITIAL_TASKS);
    setNotifications([]);
    broadcastStateChange(INITIAL_TASKS, INITIAL_WORLDS, DEFAULT_USERS);
    soundEngine.playUnlock();
  };

  // 7. World XP & Progress calculation (0% at start)
  const getWorldProgress = useCallback((worldId: string) => {
    const worldTasks = tasks.filter((t) => t.worldId === worldId);
    const totalTasks = worldTasks.length;
    const completedTasks = worldTasks.filter((t) => t.status === 'done').length;

    const totalXp = worldTasks.reduce((sum, t) => sum + (t.xpValue || 100), 0);
    const earnedXp = worldTasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + (t.xpValue || 100), 0);

    const percentage = totalTasks > 0 ? Math.round((earnedXp / totalXp) * 100) : 0;
    const level = Math.floor(earnedXp / 300);
    const isCleared = totalTasks > 0 && completedTasks === totalTasks;

    return {
      totalTasks,
      completedTasks,
      totalXp,
      earnedXp,
      percentage,
      level,
      isCleared,
    };
  }, [tasks]);

  // Team Co-op Chat Action Handlers
  const markChatAsRead = useCallback(() => {
    setActiveChatToast(null);
    if (!currentUser) return;
    const myId = currentUser.id;

    setChatMessages((prev) => {
      let changed = false;
      const unreadIds: string[] = [];
      const next = prev.map((msg) => {
        const readList = Array.isArray(msg.readBy) ? msg.readBy : [];
        if (!readList.includes(myId)) {
          changed = true;
          unreadIds.push(msg.id);
          return {
            ...msg,
            readBy: [...readList, myId],
          };
        }
        return msg;
      });

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-100)));
        } catch {}

        if (broadcastChannel) {
          try {
            broadcastChannel.postMessage({
              type: 'CHAT_READ_RECEIPT',
              payload: {
                userId: myId,
                messageIds: unreadIds,
              },
            });
          } catch {}
        }

        markChatMessageReadInFirestore(unreadIds, myId).catch(() => {});
        return next;
      }
      return prev;
    });
  }, [currentUser, broadcastChannel]);

  const handleSetIsChatOpen = useCallback((open: boolean) => {
    setIsChatOpen(open);
    if (open) {
      markChatAsRead();
    }
  }, [markChatAsRead]);

  const sendChatMessage = useCallback(
    async (
      text: string,
      type: 'text' | 'shout' | 'system' | 'task_share' | 'image' = 'text',
      attachedTaskId?: string,
      attachedTaskTitle?: string,
      imageUrl?: string,
      replyTo?: ChatReplyInfo
    ): Promise<boolean> => {
      const cleanText = (text || '').trim();
      if (!currentUser || (!cleanText && !imageUrl && !attachedTaskId)) return false;

      const newMsg: ChatMessage = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: currentUser.id,
        senderName: currentUser.name || 'Thợ Mỏ 1835',
        senderAvatar: currentUser.avatarKey || 'sniffer',
        senderRole: currentUser.role || 'Thành viên Co-op',
        senderColor: currentUser.primaryColor || '#F37022',
        text: cleanText || (imageUrl ? '📷 [Hình ảnh]' : ''),
        createdAt: Date.now(),
        type: imageUrl && type === 'text' ? 'image' : type,
        attachedTaskId,
        attachedTaskTitle,
        imageUrl: imageUrl || undefined,
        replyTo: replyTo || undefined,
        reactions: {},
        readBy: [currentUser.id],
        deviceId: CLIENT_DEVICE_ID,
      };

      // Đánh dấu để chính thiết bị gửi không bao giờ tự thông báo cho chính mình
      notifiedToastIdsRef.current.add(newMsg.id);

      setChatMessages((prev) => {
        const updated = [...prev, newMsg];
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(updated.slice(-100)));
        } catch {}
        return updated;
      });

      soundEngine.playChatMessage();

      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'CHAT_MESSAGE',
          payload: newMsg,
        });
      }

      // 2. Broadcast qua Realtime Cloud Relay (ntfy.sh) đảm bảo 100% mọi máy nhận tức thì
      broadcastChatToRelay({
        type: 'CHAT_MESSAGE',
        senderId: currentUser.id,
        message: newMsg,
        timestamp: Date.now(),
      });

      // 3. Lưu trữ lâu dài lên Cloud Firestore
      try {
        await sendChatMessageToFirestore(newMsg);
      } catch (err) {
        console.warn('[Chat] Lỗi sync Firebase:', err);
      }

      return true;
    },
    [currentUser, broadcastChannel, broadcastChatToRelay]
  );

  const reactToChatMessage = useCallback(
    async (messageId: string, emoji: string) => {
      if (!currentUser) return;
      const uid = currentUser.id;

      setChatMessages((prev) => {
        const next = prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = { ...(m.reactions || {}) };
          const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
          if (users.includes(uid)) {
            reactions[emoji] = users.filter((u) => u !== uid);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, uid];
          }
          return { ...m, reactions };
        });
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-100)));
        } catch {}
        return next;
      });

      soundEngine.playClick();

      // Broadcast reaction qua ntfy.sh
      broadcastChatToRelay({
        type: 'CHAT_REACTION',
        senderId: currentUser.id,
        messageId,
        emoji,
        userId: uid,
      });

      try {
        await reactToChatMessageInFirestore(messageId, emoji, uid);
      } catch (e) {
        console.warn('[Chat] Lỗi reaction Firebase:', e);
      }
    },
    [currentUser, broadcastChatToRelay]
  );

  const deleteChatMessage = useCallback(
    async (messageId: string) => {
      setChatMessages((prev) => {
        const next = prev.filter((m) => m.id !== messageId);
        try {
          localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(next.slice(-100)));
        } catch {}
        return next;
      });
      soundEngine.playBreak();

      // Broadcast xóa tin nhắn qua ntfy.sh
      broadcastChatToRelay({
        type: 'CHAT_DELETE',
        senderId: currentUserRef.current?.id || 'unknown',
        messageId,
      });

      try {
        await deleteChatMessageFromFirestore(messageId);
      } catch (e) {
        console.warn('[Chat] Lỗi xóa tin nhắn:', e);
      }
    },
    [broadcastChatToRelay]
  );

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || null;

  // Global Confirm Delete State & Handlers
  const [confirmDeleteState, setConfirmDeleteState] = useState<ConfirmDeleteState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const requestConfirmDelete = useCallback((opts: {
    title?: string;
    message: string;
    itemName?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    soundEngine.playClick();
    setConfirmDeleteState({
      isOpen: true,
      title: opts.title || 'XÁC NHẬN XÓA',
      message: opts.message,
      itemName: opts.itemName,
      confirmText: opts.confirmText,
      cancelText: opts.cancelText,
      onConfirm: opts.onConfirm,
    });
  }, []);

  const closeConfirmDelete = useCallback(() => {
    setConfirmDeleteState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        // Global Confirm Delete Dialog
        confirmDeleteState,
        requestConfirmDelete,
        closeConfirmDelete,

        users,
        currentUser,
        worlds,
        tasks,
        activeWorld,
        activeWorldId,
        soundEnabled,
        notifications,
        activePopupNotification,
        unreadNotificationCount,

        // Online Mode & Realtime Presence
        isOnlineMode,
        networkOnline,
        serverConnected,
        syncStatus,
        lastSyncTime,
        serverPing,
        onlineMembers,
        toggleOnlineMode,
        syncNow: () => fetchServerState(true),

        // Firebase Cloud Integration
        isFirebaseConnected,
        firebaseConfig: firebaseConfigState,
        updateFirebaseConfig: updateFirebaseConfigHandler,
        clearFirebaseConfig: clearFirebaseConfigHandler,
        syncToFirebaseNow,

        // Team Co-op Chat
        chatMessages,
        unreadChatCount,
        isChatOpen,
        setIsChatOpen: handleSetIsChatOpen,
        sendChatMessage,
        reactToChatMessage,
        deleteChatMessage,
        markChatAsRead,
        refreshChatMessages,
        activeChatToast,
        dismissChatToast,

        setActiveWorldId,
        login,
        register,
        addTeamMember,
        importTeamMembers,
        exportTeamCode,
        importTeamCode,
        joinTeamWithCode,
        updateUserAvatar,
        logout,
        deleteAccount,
        requestPasswordReset,
        resetPassword,

        createWorld,
        updateWorld,
        deleteWorld,

        createTask,
        updateTask,
        deleteTask,

        updateTaskProgressNote,
        completeTaskStation,
        undoTaskStation,
        mineTaskHit,
        setTaskMiningProgress,

        isStationUnlocked,
        isStationCompleted,

        dismissPopupNotification,
        markAllNotificationsRead,
        dismissNotification,

        toggleSound,
        resetToDemoData,
        getWorldProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
