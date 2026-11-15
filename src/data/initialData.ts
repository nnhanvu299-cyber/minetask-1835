import { UserProfile, World, Task } from '../types';

export const DEFAULT_USERS: UserProfile[] = [
  {
    "id": "user_1794064046160",
    "name": "Nhàn",
    "email": "nhanvu299@gmail.com",
    "password": "nhanvu2004",
    "role": "Thành viên Co-op 1835s",
    "title": "Thợ Mỏ Co-op",
    "level": 1,
    "avatarKey": "zodiac_ty",
    "favoriteBiome": "Đồng Cỏ Overworld",
    "tasksMined": 0,
    "totalXp": 0,
    "primaryColor": "#F37022"
  },
  {
    "id": "user_tuan_minh_1835",
    "name": "Tuấn Minh",
    "email": "tuanminh.1835s@gmail.com",
    "password": "1835password",
    "role": "Thành viên Co-op 1835s",
    "title": "Kiến Trúc Sư",
    "level": 1,
    "avatarKey": "zodiac_suu",
    "favoriteBiome": "Rừng Hoa Anh Đào",
    "tasksMined": 0,
    "totalXp": 0,
    "primaryColor": "#0072CE"
  },
  {
    "id": "user_hoang_nam_1835",
    "name": "Hoàng Nam",
    "email": "hoangnam.1835s@gmail.com",
    "password": "1835password",
    "role": "Thành viên Co-op 1835s",
    "title": "Kỹ Sư Redstone",
    "level": 1,
    "avatarKey": "zodiac_dan",
    "favoriteBiome": "Nether",
    "tasksMined": 0,
    "totalXp": 0,
    "primaryColor": "#ED1B24"
  }
];

export const INITIAL_WORLDS: World[] = [];

export const INITIAL_TASKS: Task[] = [];
