export type UserId = 'steve' | 'alex' | 'devon' | 'luna';

export interface UserProfile {
  id: UserId;
  name: string;
  role: string;
  title: string;
  level: number;
  avatarKey: UserId;
  favoriteBiome: string;
  tasksMined: number;
  totalXp: number;
  primaryColor: string;
  isBoss: boolean; // Boss phân quyền
}

export type BiomeType = 'overworld' | 'diamond_cavern' | 'nether' | 'the_end' | 'lush_caves';

export type BlockRarity = 'coal' | 'iron' | 'gold' | 'redstone' | 'diamond' | 'emerald' | 'netherite';

export interface BlockConfig {
  type: BlockRarity;
  name: string;
  xp: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  label: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface MiningLogEntry {
  updateNumber: number; // 1, 2, hoặc 3
  note: string;
  timestamp: number;
  authorId: UserId;
  authorName: string;
}

export interface Task {
  id: string;
  worldId: string;
  title: string;
  description: string;
  blockType: BlockRarity;
  xpValue: number;
  assigneeId: UserId;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  completedBy?: UserId;
  priority: 'low' | 'normal' | 'high' | 'legendary';
  // Cơ chế 3 lần đào: 0/3 -> 1/3 -> 2/3 -> 3/3 (Đào xong)
  miningUpdatesCount: number; // 0, 1, 2, 3
  miningLogs: MiningLogEntry[];
  progressNote?: string;
  progressUpdatedAt?: number;
  progressUpdatedBy?: UserId;
}

export interface World {
  id: string;
  name: string;
  description: string;
  biome: BiomeType;
  difficulty: 'Peaceful' | 'Normal' | 'Hardcore';
  createdAt: number;
  targetDeadline?: string;
  icon?: string;
  createdBy: UserId;
}

export interface AppState {
  users: UserProfile[];
  currentUser: UserProfile;
  worlds: World[];
  tasks: Task[];
  activeWorldId: string | null;
  soundEnabled: boolean;
}
