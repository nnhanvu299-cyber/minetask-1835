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

export type TaskStatus = 'todo' | 'done';

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
}

export interface AppState {
  users: UserProfile[];
  currentUser: UserProfile;
  worlds: World[];
  tasks: Task[];
  activeWorldId: string | null;
  soundEnabled: boolean;
}
