import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserId, World, Task, BlockRarity } from '../types';
import { soundEngine } from '../utils/audio';

// 4 Hardcoded Profiles (Tiếng Việt)
export const HARDCODED_USERS: UserProfile[] = [
  {
    id: 'steve',
    name: 'Steve',
    role: 'Trưởng Đội Khai Thác & Giám Sát',
    title: 'Kiến Trúc Sư Trưởng',
    level: 34,
    avatarKey: 'steve',
    favoriteBiome: 'Hang Sâu Kim Cương',
    tasksMined: 42,
    totalXp: 8650,
    primaryColor: '#4dedf4',
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Nhà Giả Kim Giao Diện & Thiết Kế UI',
    title: 'Thợ Thủ Công Voxel',
    level: 31,
    avatarKey: 'alex',
    favoriteBiome: 'Hang Động Rêu Xanh',
    tasksMined: 38,
    totalXp: 7420,
    primaryColor: '#17dd62',
  },
  {
    id: 'devon',
    name: 'Devon (Creeper Dev)',
    role: 'Phù Thủy Backend & Kỹ Sư Redstone',
    title: 'Pháp Sư Logic',
    level: 33,
    avatarKey: 'devon',
    favoriteBiome: 'Không Gian The End',
    tasksMined: 40,
    totalXp: 8100,
    primaryColor: '#ff2200',
  },
  {
    id: 'luna',
    name: 'Luna (Nether Knight)',
    role: 'Thợ Săn Bug & Bậc Thầy Kiểm Thử',
    title: 'Hiệp Sĩ Gác Đêm',
    level: 30,
    avatarKey: 'luna',
    favoriteBiome: 'Pháo Đài Nether',
    tasksMined: 35,
    totalXp: 6980,
    primaryColor: '#c084fc',
  },
];

// Initial Seed Worlds & Tasks (Tiếng Việt)
const INITIAL_WORLDS: World[] = [
  {
    id: 'world-diamond-core',
    name: 'Lõi Kim Cương: Bản Phát Hành v2.0',
    description: 'Sprint nước rút đại tu động cơ cốt lõi, chuẩn hóa giao diện Voxel 8-bit và đóng gói PWA.',
    biome: 'diamond_cavern',
    difficulty: 'Hardcore',
    createdAt: Date.now() - 86400000 * 3,
    targetDeadline: '2026-11-20',
  },
  {
    id: 'world-pwa-forge',
    name: 'Lò Rèn PWA & Ứng Dụng Android APK',
    description: 'Thiết lập đường ống Capacitor build APK, bộ đệm Service Worker offline và kiểm thử cảm ứng điện thoại.',
    biome: 'overworld',
    difficulty: 'Normal',
    createdAt: Date.now() - 86400000 * 2,
    targetDeadline: '2026-11-25',
  },
  {
    id: 'world-nether-infra',
    name: 'Pháo Đài Nether: Hạ Tầng Tự Động Hóa',
    description: 'Xây dựng đường dây Redstone băng thông cao, cơ chế sao lưu tự động và kiểm tra sức khỏe hệ thống.',
    biome: 'nether',
    difficulty: 'Hardcore',
    createdAt: Date.now() - 86400000 * 5,
    targetDeadline: '2026-12-01',
  },
];

const INITIAL_TASKS: Task[] = [
  // World 1: Lõi Kim Cương
  {
    id: 'task-101',
    worldId: 'world-diamond-core',
    title: 'Thiết Kế Nút Bấm Voxel 3D Inset/Outset',
    description: 'Đảm bảo viền vuông 100%, hiệu ứng lún khối khi nhấn và tích hợp font chữ pixel Press Start 2P.',
    blockType: 'diamond',
    xpValue: 220,
    assigneeId: 'alex',
    status: 'done',
    createdAt: Date.now() - 86400000 * 2,
    completedAt: Date.now() - 86400000,
    completedBy: 'alex',
    priority: 'high',
  },
  {
    id: 'task-102',
    worldId: 'world-diamond-core',
    title: 'Tổng Hợp Động Cơ Âm Thanh 8-Bit Web Audio',
    description: 'Tạo tiếng cuốc đập đá, tiếng ngọc XP thanh thoát và nhạc khải hoàn chiến thắng không cần file MP3.',
    blockType: 'redstone',
    xpValue: 160,
    assigneeId: 'devon',
    status: 'done',
    createdAt: Date.now() - 86400000 * 2,
    completedAt: Date.now() - 3600000 * 12,
    completedBy: 'devon',
    priority: 'high',
  },
  {
    id: 'task-103',
    worldId: 'world-diamond-core',
    title: 'Hiệu Ứng Nứt Khối 5 Giai Đoạn & Nổ Hạt Voxel',
    description: 'Kích hoạt lớp phủ vết rạn đá 5 giai đoạn và nổ tung mảnh vỡ khi thành viên bấm hoàn thành đào.',
    blockType: 'emerald',
    xpValue: 260,
    assigneeId: 'steve',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'legendary',
  },
  {
    id: 'task-104',
    worldId: 'world-diamond-core',
    title: 'Màn Hình Chiến Thắng 100%: Pháo Hoa & Lên Cấp',
    description: 'Làm mờ nền, bắn pháo hoa pixel confetti và hiển thị dòng chữ nhấp nháy WORLD CLEARED khi XP chạm 100%.',
    blockType: 'netherite',
    xpValue: 320,
    assigneeId: 'luna',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'legendary',
  },

  // World 2: Lò Rèn PWA & APK
  {
    id: 'task-201',
    worldId: 'world-pwa-forge',
    title: 'Cấu Hình Service Worker & Manifest Chuẩn PWA',
    description: 'Hỗ trợ bộ nhớ đệm offline, hộp thoại cài đặt ra màn hình chính và màu chủ đề Obsidian.',
    blockType: 'gold',
    xpValue: 140,
    assigneeId: 'devon',
    status: 'done',
    createdAt: Date.now() - 86400000 * 2,
    completedAt: Date.now() - 86400000,
    completedBy: 'devon',
    priority: 'normal',
  },
  {
    id: 'task-202',
    worldId: 'world-pwa-forge',
    title: 'Kết Nối Cầu Nối Capacitor Android Studio',
    description: 'Kiểm tra file capacitor.config.ts, kịch bản đồng bộ Gradle và tài liệu xuất file APK.',
    blockType: 'diamond',
    xpValue: 220,
    assigneeId: 'steve',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'high',
  },
  {
    id: 'task-203',
    worldId: 'world-pwa-forge',
    title: 'Tối Ưu Cảm Ứng & Phản Hồi Điện Thoại',
    description: 'Kiểm tra độ nhạy khi bấm đào quặng trên màn hình cảm ứng Android và trình duyệt di động.',
    blockType: 'iron',
    xpValue: 80,
    assigneeId: 'alex',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'normal',
  },

  // World 3: Pháo Đài Nether
  {
    id: 'task-301',
    worldId: 'world-nether-infra',
    title: 'Tự Động Đồng Bộ Dữ Liệu LocalStorage',
    description: 'Duy trì trạng thái liền mạch khi chuyển đổi giữa các màn hình, đổi người dùng và tải lại trang.',
    blockType: 'redstone',
    xpValue: 160,
    assigneeId: 'devon',
    status: 'done',
    createdAt: Date.now() - 86400000 * 3,
    completedAt: Date.now() - 86400000 * 2,
    completedBy: 'devon',
    priority: 'high',
  },
  {
    id: 'task-302',
    worldId: 'world-nether-infra',
    title: 'Hệ Thống Kiểm Thử Tích Hợp Đa Người Dùng',
    description: 'Kiểm tra phân công nhiệm vụ 4 thành viên, tính toán tỷ lệ thanh XP và các tình huống biên.',
    blockType: 'iron',
    xpValue: 80,
    assigneeId: 'luna',
    status: 'todo',
    createdAt: Date.now() - 86400000 * 2,
    priority: 'normal',
  },
  {
    id: 'task-303',
    worldId: 'world-nether-infra',
    title: 'Bảo Vệ Tính Toàn Vẹn Của Mô Hình Dữ Liệu',
    description: 'Đảm bảo cấu trúc Users -> Worlds -> Tasks luôn đồng bộ và an toàn.',
    blockType: 'diamond',
    xpValue: 220,
    assigneeId: 'steve',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'high',
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
  
  // Actions
  switchUser: (userId: UserId) => void;
  setActiveWorldId: (id: string | null) => void;
  createWorld: (data: Omit<World, 'id' | 'createdAt'>) => World;
  updateWorld: (id: string, updates: Partial<World>) => void;
  deleteWorld: (id: string) => void;
  createTask: (data: Omit<Task, 'id' | 'createdAt' | 'status'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  mineTask: (id: string) => void;
  undoTask: (id: string) => void;
  toggleSound: () => void;
  resetToDemoData: () => void;
  
  // XP Calculations
  getWorldProgress: (worldId: string) => {
    totalTasks: number;
    completedTasks: number;
    totalXp: number;
    earnedXp: number;
    percentage: number;
    isCleared: boolean;
  };
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const STORAGE_KEY_USERS = 'minetask_users_vn_v1';
const STORAGE_KEY_CURRENT_USER = 'minetask_current_user_vn_v1';
const STORAGE_KEY_WORLDS = 'minetask_worlds_vn_v1';
const STORAGE_KEY_TASKS = 'minetask_tasks_vn_v1';
const STORAGE_KEY_SOUND = 'minetask_sound_vn_v1';

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

  const createWorld = (data: Omit<World, 'id' | 'createdAt'>): World => {
    const newWorld: World = {
      ...data,
      id: `world-${Date.now()}`,
      createdAt: Date.now(),
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

  const mineTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === 'done') return;

    // Update Task
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

    // Update User Stats
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const newXp = u.totalXp + task.xpValue;
          const newLevel = Math.floor(newXp / 250);
          return {
            ...u,
            totalXp: newXp,
            tasksMined: u.tasksMined + 1,
            level: Math.max(u.level, newLevel),
          };
        }
        return u;
      })
    );

    // Keep currentUser in sync
    setCurrentUser((prev) => ({
      ...prev,
      totalXp: prev.totalXp + task.xpValue,
      tasksMined: prev.tasksMined + 1,
      level: Math.max(prev.level, Math.floor((prev.totalXp + task.xpValue) / 250)),
    }));
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

  const getWorldProgress = (worldId: string) => {
    const worldTasks = tasks.filter((t) => t.worldId === worldId);
    const totalTasks = worldTasks.length;
    const completedTasks = worldTasks.filter((t) => t.status === 'done').length;
    const totalXp = worldTasks.reduce((sum, t) => sum + t.xpValue, 0);
    const earnedXp = worldTasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + t.xpValue, 0);
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const isCleared = totalTasks > 0 && completedTasks === totalTasks;

    return {
      totalTasks,
      completedTasks,
      totalXp,
      earnedXp,
      percentage,
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
        switchUser,
        setActiveWorldId,
        createWorld,
        updateWorld,
        deleteWorld,
        createTask,
        updateTask,
        deleteTask,
        mineTask,
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
