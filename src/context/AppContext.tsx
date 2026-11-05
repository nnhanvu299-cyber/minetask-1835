import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserId, World, Task, BlockRarity } from '../types';
import { soundEngine } from '../utils/audio';

// 4 Hardcoded Profiles với Logic CẢ 4 NGƯỜI (KỂ CẢ BOSS) ĐỀU LÀM NHIỆM VỤ
export const HARDCODED_USERS: UserProfile[] = [
  {
    id: 'steve',
    name: 'Steve (Boss)',
    role: 'Boss kiêm Thợ Mỏ Trưởng',
    title: 'Kiến Trúc Sư Trưởng & Trực Tiếp Thực Chiến',
    level: 1,
    avatarKey: 'steve',
    favoriteBiome: 'Đồng Cỏ Overworld',
    tasksMined: 0,
    totalXp: 0,
    primaryColor: '#F37022',
    isBoss: true, // Quyền Boss quản trị nhưng vẫn trực tiếp nhận việc và đào quặng
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Thợ Mỏ Thành Viên',
    title: 'Thợ Thủ Công Voxel & UI',
    level: 1,
    avatarKey: 'alex',
    favoriteBiome: 'Hang Động Rêu Xanh',
    tasksMined: 0,
    totalXp: 0,
    primaryColor: '#ED1B24',
    isBoss: false,
  },
  {
    id: 'devon',
    name: 'Devon (Creeper Dev)',
    role: 'Thợ Mỏ Thành Viên',
    title: 'Phù Thủy Backend & Redstone',
    level: 1,
    avatarKey: 'devon',
    favoriteBiome: 'Không Gian The End',
    tasksMined: 0,
    totalXp: 0,
    primaryColor: '#753B94',
    isBoss: false,
  },
  {
    id: 'luna',
    name: 'Luna (Nether Knight)',
    role: 'Thợ Mỏ Thành Viên',
    title: 'Thợ Săn Bug & QA Release',
    level: 1,
    avatarKey: 'luna',
    favoriteBiome: 'Pháo Đài Nether',
    tasksMined: 0,
    totalXp: 0,
    primaryColor: '#0072CE',
    isBoss: false,
  },
];

// Chỉ sinh sẵn đúng 1 Thế Giới Mặc Định (Vùng Đất Khởi Đầu) - Khởi điểm Level 0 (0% XP)
const INITIAL_WORLDS: World[] = [
  {
    id: 'world-genesis-1835',
    name: 'Vùng Đất Khởi Đầu (1835s Genesis)',
    description: 'Thế giới mặc định đầu tiên của đội ngũ 1835s. Cả 4 thành viên (kể cả Boss Steve) đều có nhiệm vụ riêng, bắt đầu từ Level 0 (0% XP).',
    biome: 'overworld',
    difficulty: 'Normal',
    createdAt: Date.now() - 3600000,
    targetDeadline: '2026-11-30',
    createdBy: 'steve',
  },
];

// Khối Quặng Nhiệm Vụ Khởi Điểm: PHÂN ĐỀU CHO CẢ 4 THÀNH VIÊN (STEVE BOSS + ALEX + DEVON + LUNA)
const INITIAL_TASKS: Task[] = [
  {
    id: 'task-gen-00',
    worldId: 'world-genesis-1835',
    title: 'Quy hoạch kiến trúc hệ thống & Giám sát tiến độ 1835s',
    description: 'Boss Steve trực tiếp kiểm tra kiến trúc Voxel, đồng bộ quy trình làm việc và phê duyệt bản phát hành cùng cả team.',
    blockType: 'netherite',
    xpValue: 320,
    assigneeId: 'steve', // Boss Steve cũng trực tiếp làm nhiệm vụ này!
    status: 'todo',
    createdAt: Date.now() - 3700000,
    priority: 'legendary',
    progressNote: '',
  },
  {
    id: 'task-gen-01',
    worldId: 'world-genesis-1835',
    title: 'Thiết kế nhận diện thương hiệu 1835s (Nền ngà & Nâu mực)',
    description: 'Alex áp dụng bảng màu nền ngà (#FDF7E7), chữ nâu mực (#2D1A11) và dải màu gradient 1835s cho toàn bộ giao diện.',
    blockType: 'gold',
    xpValue: 140,
    assigneeId: 'alex',
    status: 'todo',
    createdAt: Date.now() - 3600000,
    priority: 'high',
    progressNote: '',
  },
  {
    id: 'task-gen-02',
    worldId: 'world-genesis-1835',
    title: 'Cài đặt font VT323 tiêu đề & Montserrat cho nội dung',
    description: 'Devon cấu hình font chữ chuẩn retro, khắc phục triệt để lỗi phông tiếng Việt có dấu sắc nét trên mọi màn hình.',
    blockType: 'diamond',
    xpValue: 220,
    assigneeId: 'devon',
    status: 'todo',
    createdAt: Date.now() - 3500000,
    priority: 'high',
    progressNote: '',
  },
  {
    id: 'task-gen-03',
    worldId: 'world-genesis-1835',
    title: 'Tích hợp bảng gỗ ghi chú tiến độ & đường ống APK Android',
    description: 'Luna kiểm thử tính năng ghi chú tiến độ bảng gỗ, xuất file cài đặt Android APK qua Capacitor và thử nghiệm PWA.',
    blockType: 'emerald',
    xpValue: 260,
    assigneeId: 'luna',
    status: 'todo',
    createdAt: Date.now() - 3400000,
    priority: 'legendary',
    progressNote: '',
  },
];

interface AppContextValue {
  users: UserProfile[];
  currentUser: UserProfile;
  worlds: World[];
  tasks: Task[];
  activeWorld: World | null;
  activeWorldId: string | null;
  soundEnabled: boolean;
  
  // Phân quyền
  isBoss: boolean;

  // Actions
  switchUser: (userId: UserId) => void;
  setActiveWorldId: (id: string | null) => void;
  createWorld: (data: Omit<World, 'id' | 'createdAt' | 'createdBy'>) => World;
  updateWorld: (id: string, updates: Partial<World>) => void;
  deleteWorld: (id: string) => void;
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'status'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Tiến độ & Đào khối
  startMiningTask: (id: string, initialNote?: string) => void;
  updateTaskProgressNote: (id: string, note: string) => void;
  completeMiningTask: (id: string) => void;
  undoTask: (id: string) => void;
  toggleSound: () => void;
  resetToDemoData: () => void;
  
  // XP Calculations (Khởi điểm 0% / Level 0)
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

const STORAGE_KEY_USERS = 'minetask_1835_users_v3';
const STORAGE_KEY_CURRENT_USER = 'minetask_1835_current_user_v3';
const STORAGE_KEY_WORLDS = 'minetask_1835_worlds_v3';
const STORAGE_KEY_TASKS = 'minetask_1835_tasks_v3';
const STORAGE_KEY_SOUND = 'minetask_1835_sound_v3';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return HARDCODED_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    return users[0] || HARDCODED_USERS[0];
  });

  const [worlds, setWorlds] = useState<World[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORLDS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_WORLDS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_TASKS;
  });

  const [activeWorldId, setActiveWorldId] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SOUND);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORLDS, JSON.stringify(worlds));
  }, [worlds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SOUND, JSON.stringify(soundEnabled));
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  const activeWorld = worlds.find((w) => w.id === activeWorldId) || null;
  const isBoss = currentUser.isBoss;

  const switchUser = (userId: UserId) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
      soundEngine.playClick();
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEngine.enabled = next;
      if (next) soundEngine.playClick();
      return next;
    });
  };

  const createWorld = (data: Omit<World, 'id' | 'createdAt' | 'createdBy'>): World => {
    const newWorld: World = {
      ...data,
      id: `world-${Date.now()}`,
      createdAt: Date.now(),
      createdBy: currentUser.id,
    };
    setWorlds((prev) => [newWorld, ...prev]);
    soundEngine.playClick();
    return newWorld;
  };

  const updateWorld = (id: string, updates: Partial<World>) => {
    setWorlds((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  const deleteWorld = (id: string) => {
    setWorlds((prev) => prev.filter((w) => w.id !== id));
    setTasks((prev) => prev.filter((t) => t.worldId !== id));
    if (activeWorldId === id) {
      setActiveWorldId(null);
    }
    soundEngine.playBreak();
  };

  const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'status'>): Task => {
    const newTask: Task = {
      ...data,
      id: `task-${Date.now()}`,
      status: 'todo',
      createdAt: Date.now(),
      progressNote: '',
    };
    setTasks((prev) => [...prev, newTask]);
    soundEngine.playClick();
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    soundEngine.playHit();
  };

  // 1. Chuyển sang trạng thái đang đào / đang nứt & mở bảng ghi chú tiến độ
  const startMiningTask = (id: string, initialNote?: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'in_progress',
              progressNote: initialNote !== undefined ? initialNote : t.progressNote,
              progressUpdatedAt: Date.now(),
              progressUpdatedBy: currentUser.id,
            }
          : t
      )
    );
    soundEngine.playHit();
  };

  // 2. Cập nhật ghi chú tiến độ trang sách / bảng gỗ
  const updateTaskProgressNote = (id: string, note: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              progressNote: note,
              progressUpdatedAt: Date.now(),
              progressUpdatedBy: currentUser.id,
            }
          : t
      )
    );
    soundEngine.playClick();
  };

  // 3. Hoàn thành đào khối (chuyển sang 'done', cộng XP)
  const completeMiningTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === 'done') return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'done',
              completedAt: Date.now(),
              completedBy: currentUser.id,
            }
          : t
      )
    );

    // Cập nhật XP cho thành viên đào
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const newXp = u.totalXp + task.xpValue;
          const newLevel = Math.max(u.level, Math.floor(newXp / 250));
          return {
            ...u,
            totalXp: newXp,
            tasksMined: u.tasksMined + 1,
            level: newLevel,
          };
        }
        return u;
      })
    );

    setCurrentUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + task.xpValue,
      tasksMined: prev.tasksMined + 1,
      level: Math.max(prev.level, Math.floor((prev.totalXp + task.xpValue) / 250)),
    }));

    soundEngine.playBreak();
    setTimeout(() => {
      soundEngine.playXpOrb();
    }, 250);
  };

  const undoTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status !== 'done') return;

    const completedUserId = task.completedBy || currentUser.id;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'todo',
              completedAt: undefined,
              completedBy: undefined,
            }
          : t
      )
    );

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === completedUserId) {
          const newXp = Math.max(0, u.totalXp - task.xpValue);
          return {
            ...u,
            totalXp: newXp,
            tasksMined: Math.max(0, u.tasksMined - 1),
          };
        }
        return u;
      })
    );

    if (currentUser.id === completedUserId) {
      setCurrentUser((prev) => ({
        ...prev,
        totalXp: Math.max(0, prev.totalXp - task.xpValue),
        tasksMined: Math.max(0, prev.tasksMined - 1),
      }));
    }

    soundEngine.playHit();
  };

  const resetToDemoData = () => {
    setUsers(HARDCODED_USERS);
    setCurrentUser(HARDCODED_USERS[0]);
    setWorlds(INITIAL_WORLDS);
    setTasks(INITIAL_TASKS);
    setActiveWorldId(null);
    soundEngine.playVictoryFanfare();
  };

  // Tính toán Tiến Độ Thế Giới: Khởi điểm Level 0 (0% XP)
  const getWorldProgress = (worldId: string) => {
    const worldTasks = tasks.filter((t) => t.worldId === worldId);
    const totalTasks = worldTasks.length;
    const completedTasks = worldTasks.filter((t) => t.status === 'done').length;
    const totalXp = worldTasks.reduce((sum, t) => sum + t.xpValue, 0);
    const earnedXp = worldTasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + t.xpValue, 0);

    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    // Cấp độ tính từ 0 khi mới tạo
    const level = Math.floor(earnedXp / 150);
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
  };

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
        isBoss,
        switchUser,
        setActiveWorldId,
        createWorld,
        updateWorld,
        deleteWorld,
        createTask,
        updateTask,
        deleteTask,
        startMiningTask,
        updateTaskProgressNote,
        completeMiningTask,
        undoTask,
        toggleSound,
        resetToDemoData,
        getWorldProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
