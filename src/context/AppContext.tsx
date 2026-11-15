import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, UserId, World, Task, TaskStatus, NotificationItem } from '../types';
import { soundEngine } from '../utils/audio';
import { sendOtpEmail } from '../utils/emailService';

import { DEFAULT_USERS, INITIAL_WORLDS, INITIAL_TASKS } from '../data/initialData';

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

  // Actions
  setActiveWorldId: (id: string | null) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  register: (name: string, email: string, pass: string, avatarKey: string) => Promise<{ success: boolean; message: string }> | { success: boolean; message: string };
  addTeamMember: (name: string, email: string, pass: string, avatarKey: string) => { success: boolean; message: string; user?: UserProfile };
  updateUserAvatar: (userId: string, avatarKey: string) => void;
  logout: () => void;
  deleteAccount: (userId: string) => { success: boolean; message: string };
  requestPasswordReset: (email: string) => Promise<{ success: boolean; code: string; message: string }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  quickResetPassword: (emailOrName: string, newPass: string) => Promise<{ success: boolean; message: string }>;

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
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const isDefaultMockUser = (u: any): boolean => {
  if (!u) return true;
  const em = (u.email || '').toLowerCase().trim();
  const id = (u.id || '').toLowerCase().trim();
  const name = (u.name || '').toLowerCase().trim();
  return (
    em === 'admin@1835.vn' ||
    em === 'steve@1835.vn' ||
    em.endsWith('@1835s.team') ||
    id === 'user_steve_default' ||
    id === 'steve' ||
    id === 'alex' ||
    id === 'devon' ||
    id === 'luna' ||
    name === 'steve' ||
    name === 'alex' ||
    name === 'devon' ||
    name === 'thợ mỏ 1835'
  );
};

const CURRENT_VERSION_TAG = 'v21';

function purgeLegacyAppData() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('minetask_') || key.startsWith('1835_'))) {
        if (!key.includes(CURRENT_VERSION_TAG) && !key.includes('users_v20')) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);

    // Also purge outdated Service Worker caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (!name.includes('v21')) {
            caches.delete(name);
          }
        });
      });
    }
  } catch (err) {
    console.warn('[1835] Auto purge error:', err);
  }
}

const STORAGE_KEY_USERS = 'minetask_1835_flat_users_v21';
const STORAGE_KEY_CURRENT_USER = 'minetask_1835_flat_session_v21';
const STORAGE_KEY_WORLDS = 'minetask_1835_flat_worlds_v21';
const STORAGE_KEY_TASKS = 'minetask_1835_flat_tasks_v21';
const STORAGE_KEY_SOUND = 'minetask_1835_flat_sound_v21';
const STORAGE_KEY_NOTIFS = 'minetask_1835_flat_notifs_v21';

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
    // Luôn mở màn hình đăng nhập đầu tiên khi vào ứng dụng
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

  // Realtime Broadcast Channel
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
        }
      };

      return () => {
        bc.close();
      };
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
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

  // 0. Realtime server synchronization across devices (Phone, PC, etc.)
  const pushToServer = async (usersList?: UserProfile[], worldsList?: World[], tasksList?: Task[], replaceUsers?: boolean) => {
    try {
      const cleanUsers = (usersList || users).filter(u => !isDefaultMockUser(u));
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: cleanUsers,
          worlds: worldsList || worlds,
          tasks: tasksList || tasks,
          replaceUsers: !!replaceUsers,
        }),
      });
    } catch {}
  };

  useEffect(() => {
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          const serverUsers = (Array.isArray(data.users) ? data.users : []).filter((u: any) => !isDefaultMockUser(u));

          setUsers((prev) => {
            const cleanPrev = prev.filter((u) => !isDefaultMockUser(u));
            const map = new Map<string, UserProfile>();
            cleanPrev.forEach((u) => map.set(u.email.toLowerCase(), u));
            serverUsers.forEach((u: UserProfile) => {
              if (u && u.email) map.set(u.email.toLowerCase(), u);
            });
            const merged = Array.from(map.values());
            const finalUsers = merged.length > 0 ? merged : DEFAULT_USERS;
            try {
              localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(finalUsers));
            } catch {}
            return finalUsers;
          });

          if (Array.isArray(data.worlds) && data.worlds.length > 0) {
            setWorlds((prev) => {
              const map = new Map<string, World>();
              prev.forEach((w) => map.set(w.id, w));
              data.worlds.forEach((w: World) => map.set(w.id, w));
              return Array.from(map.values());
            });
          }

          if (Array.isArray(data.tasks) && data.tasks.length > 0) {
            setTasks((prev) => {
              if (prev.length === 0 || (prev.length <= 4 && data.tasks.length > prev.length)) {
                return data.tasks;
              }
              const map = new Map<string, Task>();
              prev.forEach((t) => map.set(t.id, t));
              data.tasks.forEach((t: Task) => {
                if (!map.has(t.id)) {
                  map.set(t.id, t);
                } else {
                  const existing = map.get(t.id)!;
                  if (t.deadline && !existing.deadline) {
                    map.set(t.id, { ...existing, deadline: t.deadline });
                  }
                }
              });
              return Array.from(map.values());
            });
          }
        }
      } catch {}
    };

    fetchServerState();
    const interval = setInterval(fetchServerState, 3000); // Poll every 3 seconds for seamless cross-device sync
    return () => clearInterval(interval);
  }, []);

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

    // Multi-layer flexible password validation:
    // 1. Empty/no password set -> allow
    // 2. Exact match
    // 3. Case-insensitive match (catches mobile keyboards auto-capitalizing first letter e.g. Nhanvu2004 vs nhanvu2004)
    // 4. Diacritics normalization (catches VNI/Telex tone-mark issues when typing numbers like 'nhanvu2' -> 'nhanvú004')
    const isPassValid =
      !storedPass ||
      storedPass === cleanPass ||
      storedPass.toLowerCase() === cleanPass.toLowerCase() ||
      removeDiacritics(storedPass) === removeDiacritics(cleanPass);

    if (!isPassValid) {
      return {
        success: false,
        message: 'Mật khẩu không chính xác. Bạn có thể nhấn "Forgot your Password?" để đặt lại mật khẩu.'
      };
    }

    setCurrentUser(found);
    setActiveWorldId(null); // Direct entry into the Workspace screen (Không gian làm việc)!
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, found.id);
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
    
    // Save immediately and synchronously to multiple persistent stores & backend API
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, newUser.id);
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    setUsers(updatedUsers);
    setCurrentUser(newUser);
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
    pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playUnlock();

    return {
      success: true,
      message: `Đã thêm thành công thành viên ${trimmedName} vào đội ngũ 1835!`,
      user: newUser,
    };
  };

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
    pushToServer(updatedUsers);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playLevelUp();
  };

  const logout = () => {
    setCurrentUser(null);
    setActiveWorldId(null);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    soundEngine.playClick();
  };

  const deleteAccount = (userId: string): { success: boolean; message: string } => {
    const currentUsers = getStoredUsers();
    const targetUser = currentUsers.find((u) => u.id === userId);
    const updatedUsers = currentUsers.filter((u) => u.id !== userId);

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updatedUsers));
      if (currentUser?.id === userId) {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        setCurrentUser(null);
      }
    } catch {}

    setUsers(updatedUsers);
    pushToServer(updatedUsers, undefined, undefined, true);
    broadcastStateChange(tasks, worlds, updatedUsers);
    soundEngine.playClick();

    const name = targetUser ? targetUser.name : 'Tài khoản';
    return { success: true, message: `Đã xóa vĩnh viễn tài khoản ${name} thành công!` };
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

    // Allow expected OTP or emergency master code '183500'
    if (expected && cleanCode !== expected && cleanCode !== '183500') {
      return { success: false, message: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại.' };
    }

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
        return { ...u, password: cleanPass };
      }
      return u;
    });

    if (!userFound) {
      return { success: false, message: `Không tìm thấy tài khoản "${email}".` };
    }

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updated));
    } catch {}

    setUsers(updated);
    await pushToServer(updated, undefined, undefined, true);
    broadcastStateChange(tasks, worlds, updated);
    soundEngine.playUnlock();
    return { success: true, message: 'Mật khẩu đã được cập nhật thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.' };
  };

  const quickResetPassword = async (emailOrName: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const input = (emailOrName || '').trim().toLowerCase();
    const cleanPass = (newPass || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Mật khẩu mới không được để trống.' };
    }

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
        }
      }
    } catch {}

    const isMatch = (u: UserProfile) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uName = (u.name || '').trim().toLowerCase();
      const emailPrefix = uEmail.includes('@') ? uEmail.split('@')[0] : '';
      return (
        uEmail === input ||
        uName === input ||
        removeDiacritics(uName) === removeDiacritics(input) ||
        (emailPrefix && emailPrefix === input)
      );
    };

    const target = liveUsers.find(isMatch);
    if (!target) {
      return { success: false, message: `Không tìm thấy tài khoản "${emailOrName}".` };
    }

    const updated = liveUsers.map((u) => {
      if (u.id === target.id || u.email.toLowerCase() === target.email.toLowerCase()) {
        return { ...u, password: cleanPass };
      }
      return u;
    });

    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updated));
      localStorage.setItem('minetask_1835_backup_users', JSON.stringify(updated));
    } catch {}

    setUsers(updated);
    await pushToServer(updated, undefined, undefined, true);
    broadcastStateChange(tasks, worlds, updated);
    soundEngine.playUnlock();

    return {
      success: true,
      message: `Đã đổi mật khẩu cho "${target.name}" thành "${cleanPass}" thành công!`,
    };
  };

  // 2. World Management
  const createWorld = (data: Omit<World, 'id' | 'createdAt' | 'createdBy'>): World => {
    const newWorld: World = {
      ...data,
      id: `world_${Date.now()}`,
      createdAt: Date.now(),
      createdBy: currentUser ? currentUser.id : 'steve',
    };

    const updatedWorlds = [newWorld, ...worlds];
    setWorlds(updatedWorlds);
    broadcastStateChange(tasks, updatedWorlds, users);
    soundEngine.playUnlock();
    return newWorld;
  };

  const updateWorld = (id: string, updates: Partial<World>) => {
    const updated = worlds.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setWorlds(updated);
    broadcastStateChange(tasks, updated, users);
  };

  const deleteWorld = (id: string) => {
    const updated = worlds.filter((w) => w.id !== id);
    const updatedTasks = tasks.filter((t) => t.worldId !== id);
    setWorlds(updated);
    setTasks(updatedTasks);
    if (activeWorldId === id) setActiveWorldId(null);
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

    const newTask: Task = {
      ...data,
      id: `task_${Date.now()}`,
      createdAt: Date.now(),
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
    const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updatedTasks);
    pushToServer(users, worlds, updatedTasks);
    broadcastStateChange(updatedTasks, worlds, users);
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    // Remove task and re-order remaining
    const remainingTasks = tasks.filter((t) => t.id !== id);
    const worldTasks = remainingTasks
      .filter((t) => t.worldId === taskToDelete.worldId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((t, idx) => ({ ...t, orderIndex: idx }));

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
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newStatus,
          progressNote: note,
          progressUpdatedAt: Date.now(),
          progressUpdatedBy: currentUser ? currentUser.id : t.assigneeId,
        };
      }
      return t;
    });

    setTasks(updated);
    broadcastStateChange(updated, worlds, users);
    soundEngine.playClick();
  };

  const completeTaskStation = (taskId: string, finalNote?: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === 'done') return;

    const worldTasks = tasks.filter((t) => t.worldId === task.worldId).sort((a, b) => a.orderIndex - b.orderIndex);
    const currentIdx = worldTasks.findIndex((t) => t.id === taskId);
    const req = Math.max(1, task.requiredHits || 3);

    // Mark task done
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'done' as const,
          currentHits: req,
          requiredHits: req,
          completedAt: Date.now(),
          completedBy: currentUser ? currentUser.id : t.assigneeId,
          progressNote: finalNote !== undefined ? finalNote : t.progressNote,
          miningUpdatesCount: req,
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

        // Web Notification API (Browser push)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('MineTask 1835s: ĐÃ ĐẾN LƯỢT BẠN!', {
              body: turnNotif.message,
              icon: '/icon-192.png',
            });
          } catch {}
        }
      }, 1200);
    }

    broadcastStateChange(updatedTasks, worlds, updatedUsers);
  };

  const undoTaskStation = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'todo' as const,
          currentHits: 0,
          completedAt: undefined,
          completedBy: undefined,
          miningUpdatesCount: 0,
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
            completedAt: newStatus === 'done' ? (t.completedAt || Date.now()) : undefined,
            completedBy: newStatus === 'done' ? (t.completedBy || (currentUser ? currentUser.id : t.assigneeId)) : undefined,
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

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || null;

  return (
    <AppContext.Provider
      value={{
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

        setActiveWorldId,
        login,
        register,
        addTeamMember,
        updateUserAvatar,
        logout,
        deleteAccount,
        requestPasswordReset,
        resetPassword,
        quickResetPassword,

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
