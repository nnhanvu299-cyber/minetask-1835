export type UserId = string;

export interface UserProfile {
  id: UserId;
  name: string;
  email: string;
  password?: string;
  role: string;
  title: string;
  level: number;
  avatarKey: string;
  favoriteBiome: string;
  tasksMined: number;
  totalXp: number;
  primaryColor: string;
}

export type BiomeType = 'overworld' | 'diamond_cavern' | 'nether' | 'the_end' | 'lush_caves';

export type BlockRarity = 'coal' | 'iron' | 'gold' | 'redstone' | 'diamond' | 'emerald' | 'netherite' | 'lapis';

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
  updateNumber: number;
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
  assigneeId: UserId; // Người phụ trách chính (tương thích ngược)
  assigneeIds?: UserId[]; // Danh sách nhiều người cùng làm
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  completedBy?: UserId;
  priority: 'low' | 'normal' | 'high' | 'legendary';
  orderIndex: number; // Thứ tự trạm trên timeline ziczac (0, 1, 2, 3...)
  miningUpdatesCount: number;
  miningLogs: MiningLogEntry[];
  progressNote?: string;
  progressUpdatedAt?: number;
  progressUpdatedBy?: UserId;
  startDate?: string; // Định dạng YYYY-MM-DD (Ngày bắt đầu)
  deadline?: string; // Định dạng YYYY-MM-DD (Hạn chót)
  durationDays?: number; // Số lượng ngày thực hiện
  requiredHits?: number; // Tổng số lần cần đào để hoàn thành (mặc định 3 hoặc tự chọn)
  currentHits?: number; // Số lần đã đào hiện tại
  updatedAt?: number; // Timestamp chỉnh sửa gần nhất để đồng bộ cloud chính xác
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
  updatedAt?: number;
}

export interface NotificationItem {
  id: string;
  type: 'congratulations' | 'turn_alert' | 'world_cleared' | 'system';
  title: string;
  message: string;
  targetUserId: UserId;
  senderName?: string;
  createdAt: number;
  read: boolean;
  taskTitle?: string;
  stationNumber?: number;
  xpEarned?: number;
}

export interface AppState {
  users: UserProfile[];
  currentUser: UserProfile;
  worlds: World[];
  tasks: Task[];
  activeWorldId: string | null;
  soundEnabled: boolean;
  notifications: NotificationItem[];
}
