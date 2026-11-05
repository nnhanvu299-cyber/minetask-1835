import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserId, World, Task, BlockRarity } from '../types';
import { soundEngine } from '../utils/audio';

// 4 Hardcoded Profiles
export const HARDCODED_USERS: UserProfile[] = [
  {
    id: 'steve',
    name: 'Steve',
    role: 'Lead Miner & Overseer',
    title: 'The Architect',
    level: 34,
    avatarKey: 'steve',
    favoriteBiome: 'Diamond Deepslate Cavern',
    tasksMined: 42,
    totalXp: 8650,
    primaryColor: '#4dedf4',
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Frontend Alchemist & UI',
    title: 'Voxel Crafter',
    level: 31,
    avatarKey: 'alex',
    favoriteBiome: 'Lush Moss Caves',
    tasksMined: 38,
    totalXp: 7420,
    primaryColor: '#17dd62',
  },
  {
    id: 'devon',
    name: 'Devon (Creeper Dev)',
    role: 'Backend Wizard & Logic',
    title: 'Redstone Sorcerer',
    level: 33,
    avatarKey: 'devon',
    favoriteBiome: 'The End Dimension',
    tasksMined: 40,
    totalXp: 8100,
    primaryColor: '#ff2200',
  },
  {
    id: 'luna',
    name: 'Luna (Nether Knight)',
    role: 'QA Slayer & Release Master',
    title: 'Night Watch',
    level: 30,
    avatarKey: 'luna',
    favoriteBiome: 'Nether Fortress',
    tasksMined: 35,
    totalXp: 6980,
    primaryColor: '#c084fc',
  },
];

// Initial Seed Worlds & Tasks
const INITIAL_WORLDS: World[] = [
  {
    id: 'world-diamond-core',
    name: 'Diamond Core: v2.0 Release',
    description: 'Final sprint for core engine overhaul, 8-bit styling, and PWA packaging.',
    biome: 'diamond_cavern',
    difficulty: 'Hardcore',
    createdAt: Date.now() - 86400000 * 3,
    targetDeadline: '2026-11-20',
  },
  {
    id: 'world-pwa-forge',
    name: 'PWA & Android APK Forge',
    description: 'Configure Capacitor build pipeline, service workers, and mobile voxel responsive views.',
    biome: 'overworld',
    difficulty: 'Normal',
    createdAt: Date.now() - 86400000 * 2,
    targetDeadline: '2026-11-25',
  },
  {
    id: 'world-nether-infra',
    name: 'Nether Fortress: Cloud Infrastructure',
    description: 'High-throughput Redstone pipelines, automated database backups, and health checks.',
    biome: 'nether',
    difficulty: 'Hardcore',
    createdAt: Date.now() - 86400000 * 5,
    targetDeadline: '2026-12-01',
  },
];

const INITIAL_TASKS: Task[] = [
  // World 1: Diamond Core
  {
    id: 'task-101',
    worldId: 'world-diamond-core',
    title: 'Design Voxel Inset/Outset 3D Buttons',
    description: 'Ensure 100% square borders, tactile click states, and pixel font integration.',
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
    title: 'Synthesize 8-Bit Web Audio Engine',
    description: 'Generate pickaxe hit crunch, XP orb pitch-up chime, and level up fanfare without external MP3s.',
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
    title: 'Implement Block Cracking & Particle Shatter',
    description: 'Trigger 5-stage fissure overlay and voxel fragment explosion upon mining check-off.',
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
    title: '100% Win State: Pixel Fireworks & Fanfare',
    description: 'Blur background, launch pixel confetti fireworks, and flash WORLD CLEARED banner when Team XP hits 100%.',
    blockType: 'netherite',
    xpValue: 320,
    assigneeId: 'luna',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'legendary',
  },

  // World 2: PWA Forge
  {
    id: 'task-201',
    worldId: 'world-pwa-forge',
    title: 'Setup Service Worker & Manifest Specs',
    description: 'Enable offline caching, homescreen install prompt, and dark obsidian theme color.',
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
    title: 'Capacitor Android Studio Bridge',
    description: 'Verify capacitor.config.ts, Gradle sync scripts, and APK export instructions.',
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
    title: 'Touch Response & Haptic Feedback Tuning',
    description: 'Verify responsive block mining interactions across Android and mobile browsers.',
    blockType: 'iron',
    xpValue: 80,
    assigneeId: 'alex',
    status: 'todo',
    createdAt: Date.now() - 86400000,
    priority: 'normal',
  },

  // World 3: Nether Infra
  {
    id: 'task-301',
    worldId: 'world-nether-infra',
    title: 'Automated LocalStorage Persistence Sync',
    description: 'Keep state seamless across screen switches, user shifts, and browser reloads.',
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
    title: 'Continuous Integration Test Harness',
    description: 'Stress test multi-user assignments, XP calculations, and edge cases.',
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
    title: 'Security Hardening & Token Cryptography',
    description: 'Ensure safe local state isolation and clean data model relationships.',
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

const STORAGE_KEY_USERS = 'minetask_users_v1';
const STORAGE_KEY_CURRENT_USER = 'minetask_current_user_v1';
const STORAGE_KEY_WORLDS = 'minetask_worlds_v1';
const STORAGE_KEY_TASKS = 'minetask_tasks_v1';
const STORAGE_KEY_SOUND = 'minetask_sound_v1';

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
